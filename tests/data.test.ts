import { describe, expect, it } from "vitest";
import { skillInputSchema } from "@/lib/skill-schema";
import { buildFtsQuery } from "@/server/search";
import { importEntries, exportYaml, parseCatalogText } from "@/server/catalog";
import { renderInstallGuide } from "@/lib/install-guide";
import { entry, testRepo } from "./helpers";

const parse = (e: Record<string, unknown>) => skillInputSchema.safeParse(e);
const add = (repo: ReturnType<typeof testRepo>, e: Record<string, unknown>) => {
  const r = parse(e);
  if (!r.success) throw new Error(JSON.stringify(r.error.issues));
  return repo.upsert(r.data).skill;
};

describe("validation rules", () => {
  it("accepts a complete published entry and defaults distribution to link_only", () => {
    const r = parse(entry());
    expect(r.success && r.data.distribution).toBe("link_only");
  });
  it("blocks publishing without source, license, creator or agent evidence", () => {
    const r = parse(entry({ sourceUrl: "", licenseSpdx: "", creatorName: "", agents: [] }));
    expect(r.success).toBe(false);
    const paths = !r.success ? r.error.issues.map((i) => i.path[0]) : [];
    expect(paths).toEqual(expect.arrayContaining(["sourceUrl", "licenseSpdx", "creatorName", "agents"]));
  });
  it("allows incomplete drafts", () => {
    expect(parse(entry({ status: "draft", sourceUrl: "", licenseSpdx: "", agents: [] })).success).toBe(true);
  });
  it("requires tested evidence and a test date for Verified", () => {
    expect(parse(entry({ verification: "verified" })).success).toBe(false);
    expect(
      parse(entry({ verification: "verified", lastTestedAt: "2026-09-01", agents: [{ agent: "codex", evidence: "tested" }] })).success,
    ).toBe(true);
  });
  it("requires a redistribution record for hostable", () => {
    expect(parse(entry({ distribution: "hostable" })).success).toBe(false);
    expect(parse(entry({ distribution: "hostable", redistributionNote: "Written permission from author, 2026-09-01" })).success).toBe(true);
  });
  it("rejects unknown agents, bad URLs, bad slugs, duplicate agents", () => {
    expect(parse(entry({ agents: [{ agent: "skynet", evidence: "tested" }] })).success).toBe(false);
    expect(parse(entry({ sourceUrl: "javascript:alert(1)" })).success).toBe(false);
    expect(parse(entry({ slug: "Bad Slug" })).success).toBe(false);
    expect(parse(entry({ agents: [{ agent: "codex", evidence: "declared" }, { agent: "codex", evidence: "tested" }] })).success).toBe(false);
  });
});

describe("search", () => {
  it("quotes input so FTS operators cannot be injected", () => {
    expect(buildFtsQuery('seo OR "x" NEAR(a b)')).toBe('"seo"* "or"* "x"* "near"* "a"* "b"*');
    expect(buildFtsQuery("   ")).toBeNull();
    expect(buildFtsQuery("!!!")).toBeNull();
  });
  it("searches name, description, category and tags with prefix matching", () => {
    const repo = testRepo();
    add(repo, entry());
    add(repo, entry({ name: "Landing Page Copy", slug: "landing-page-copy", category: "marketing", shortDescription: "Write conversion copy.", tags: ["copywriting"] }));
    const names = (q: string) => repo.listPublic({ q }).items.map((s) => s.slug);
    expect(names("competi")).toEqual(["competitor-research"]);
    expect(names("copywriting")).toEqual(["landing-page-copy"]);
    expect(names("marketing")).toEqual(["landing-page-copy"]);
    expect(names("conversion")).toEqual(["landing-page-copy"]);
    expect(names("zzzz")).toEqual([]);
    expect(names('"; DROP TABLE skills; --')).toEqual([]);
    expect(repo.counts().total).toBe(2);
  });
  it("ranks name matches above description matches", () => {
    const repo = testRepo();
    add(repo, entry({ name: "Alpha", slug: "alpha", shortDescription: "Helps with pricing decisions." }));
    add(repo, entry({ name: "Pricing Page", slug: "pricing-page", shortDescription: "Builds a page." }));
    expect(repo.listPublic({ q: "pricing" }).items[0].slug).toBe("pricing-page");
  });
  it("keeps the index in sync on edit", () => {
    const repo = testRepo();
    const s = add(repo, entry());
    const edited = parse(entry({ name: "Rival Teardown", shortDescription: "Tear down rival products in depth.", tags: ["rivals"] })).data!;
    repo.upsert(edited, { id: s.id });
    expect(repo.listPublic({ q: "competitor" }).total).toBe(0);
    expect(repo.listPublic({ q: "teardown" }).total).toBe(1);
  });
});

describe("repository", () => {
  it("only lists published Skills publicly and hides drafts and unpublished", () => {
    const repo = testRepo();
    add(repo, entry());
    add(repo, entry({ slug: "draft-one", name: "Draft one", status: "draft" }));
    const u = add(repo, entry({ slug: "unpub-one", name: "Unpub one" }));
    repo.setStatus(u.id, "unpublished");
    expect(repo.listPublic().items.map((s) => s.slug)).toEqual(["competitor-research"]);
    expect(repo.getPublicBySlug("draft-one")).toBeNull();
    expect(repo.getPublicBySlug("unpub-one")).toBeNull();
    expect(repo.listAdmin().total).toBe(3);
  });
  it("hides samples when showSamples is false", () => {
    const repo = testRepo(false);
    add(repo, entry({ isSample: true }));
    expect(repo.listPublic().total).toBe(0);
    expect(repo.publishedCountsByCategory()).toEqual({});
  });
  it("filters by category, tag, agent and verification", () => {
    const repo = testRepo();
    add(repo, entry());
    add(repo, entry({ slug: "bee", name: "Bee", category: "sales", tags: ["outbound"], agents: [{ agent: "codex", evidence: "declared" }] }));
    expect(repo.listPublic({ category: "sales" }).items.map((s) => s.slug)).toEqual(["bee"]);
    expect(repo.listPublic({ tag: "outbound" }).total).toBe(1);
    expect(repo.listPublic({ agent: "codex" }).total).toBe(1);
    expect(repo.listPublic({ verification: "verified" }).total).toBe(0);
  });
  it("rejects slug collisions and unknown categories", () => {
    const repo = testRepo();
    const a = add(repo, entry());
    const b = add(repo, entry({ slug: "other", name: "Other" }));
    expect(() => repo.upsert(parse(entry({ slug: "competitor-research", name: "Other" })).data!, { id: b.id })).toThrow(/slug/);
    expect(() => repo.upsert(parse(entry({ slug: "zz", category: "nope" })).data!)).toThrow(/category/);
    expect(a.id).not.toBe(b.id);
  });
  it("refuses to publish incomplete Skills", () => {
    const repo = testRepo();
    const d = add(repo, entry({ status: "draft", sourceUrl: "" }));
    expect(() => repo.setStatus(d.id, "published")).toThrow(/source URL/);
  });
  it("adding Skill #301 needs no code change", () => {
    const repo = testRepo();
    for (let i = 0; i < 301; i++) add(repo, entry({ slug: `skill-${i}`, name: `Skill number ${i}`, tags: [`t${i % 7}`] }));
    expect(repo.listPublic({ pageSize: 100 }).total).toBe(301);
    expect(repo.listPublic({ q: "number 300" }).items[0].slug).toBe("skill-300");
    expect(repo.listPublic({ page: 4, pageSize: 100 }).items).toHaveLength(1);
  });
});

describe("import / export", () => {
  it("is all-or-nothing and reports every problem", () => {
    const repo = testRepo();
    const r = importEntries(repo, [entry(), entry({ slug: "bad", licenseSpdx: "" }), entry({ slug: "bad2", category: "nope" })]);
    expect(r.ok).toBe(false);
    expect(r.issues.map((i) => i.entry)).toEqual(["bad", "bad2"]);
    expect(repo.counts().total).toBe(0);
  });
  it("detects duplicate slugs in one import and supports dry run", () => {
    const repo = testRepo();
    expect(importEntries(repo, [entry(), entry()]).ok).toBe(false);
    const dry = importEntries(repo, [entry()], { dryRun: true });
    expect(dry).toMatchObject({ ok: true, created: 1 });
    expect(repo.counts().total).toBe(0);
  });
  it("round-trips through YAML and updates by slug", () => {
    const a = testRepo();
    importEntries(a, [entry(), entry({ slug: "two", name: "Two skill" })]);
    const yaml = exportYaml(a.exportAll());
    const b = testRepo();
    expect(importEntries(b, parseCatalogText(yaml))).toMatchObject({ ok: true, created: 2 });
    expect(importEntries(b, parseCatalogText(yaml))).toMatchObject({ ok: true, created: 0, updated: 2 });
    expect(b.getBySlug("competitor-research")?.agents[0].agent).toBe("claude-code");
  });
});

describe("install guide", () => {
  it("states only stored facts and is link-only for third-party Skills", () => {
    const repo = testRepo();
    const s = add(repo, entry({ repoUrl: "https://github.com/a/b", repoSubpath: "skills/x", pinnedRef: "v1.0.0", licenseSpdx: "MIT" }));
    const md = renderInstallGuide(s, "https://skills.example");
    expect(md).toContain("# Install: Competitor Research");
    expect(md).toContain("link-only");
    expect(md).toContain("License: MIT");
    expect(md).toContain("https://github.com/a/b");
    expect(md).toContain("declared by the source; not tested by us");
    expect(md).toContain("untrusted");
    expect(md).not.toContain("<");
  });
  it("lists per-agent instructions only when provided", () => {
    const repo = testRepo();
    const s = add(repo, entry({ agents: [{ agent: "codex", evidence: "tested", installInstructions: "Use the codex flow." }] }));
    const md = renderInstallGuide(s, "http://x");
    expect(md).toContain("### Codex");
    expect(md).toContain("Use the codex flow.");
    expect(md).not.toContain("### Claude Code");
  });
});
