import { describe, expect, it } from "vitest";
import { candidateSchema } from "@/lib/candidate-schema";
import { candidateToSkillEntry } from "@/server/candidates";

const base = (over: Record<string, unknown> = {}) => ({
  id: "example-skill", name: "Example Skill", summary: "Does one specific job for founders, in our words.",
  category: "marketing", tags: ["x"], status: "discovered", sourceType: "github_skill_folder",
  sourceUrl: "https://github.com/o/r/tree/abc/skills/x", repoUrl: "https://github.com/o/r", pinnedRef: "abc", inspectedAt: "2026-10-03",
  creator: { name: "o", url: "https://github.com/o", basis: "repo owner" },
  license: { spdx: "MIT", evidence: "LICENSE file", assessment: "ok_to_link" },
  supportedAgents: [{ agent: "claude-code", evidence: "declared", source: "README line 5" }],
  quality: { verdict: "adequate", basis: "body_read" }, specConformance: "pass",
  gates: { useful: "yes", specificJob: "yes", clearDescription: "yes", identifiableSource: "yes", identifiableCreator: "yes", licenseKnown: "yes", agentsDeterminable: "yes", testable: "yes", beatsGenericModel: "yes", comfortableRecommending: "yes" },
  sources: [{ url: "https://github.com/o/r", note: "repo" }],
  ...over,
});
const ok = (o?: Record<string, unknown>) => candidateSchema.safeParse(base(o)).success;
const tested = { testing: { status: "tested", date: "2026-10-04", notes: "Ran on Claude Code against a sample brief." } };

describe("candidate workflow rules", () => {
  it("accepts a plain discovered candidate", () => expect(ok()).toBe(true));
  it("requires a reason to reject", () => {
    expect(ok({ status: "rejected" })).toBe(false);
    expect(ok({ status: "rejected", rejectionReason: "Generic one-line prompt." })).toBe(true);
  });
  it("cannot reach testing on metadata alone", () => {
    expect(ok({ status: "testing", quality: { verdict: "adequate", basis: "metadata_only" } })).toBe(false);
    expect(ok({ status: "testing" })).toBe(true);
  });
  it("cannot reach testing with a weak verdict or a not_ok license", () => {
    expect(ok({ status: "testing", quality: { verdict: "weak", basis: "body_read" } })).toBe(false);
    expect(ok({ status: "testing", license: { spdx: "MIT", assessment: "not_ok" } })).toBe(false);
  });
  it("license_review contradicts ok_to_link", () => {
    expect(ok({ status: "license_review" })).toBe(false);
    expect(ok({ status: "license_review", license: { spdx: "conflicting", assessment: "needs_review" } })).toBe(true);
  });
  it("approval requires a real test, known license, spec pass and explicit sign-off", () => {
    expect(ok({ status: "approved" })).toBe(false); // untested
    expect(ok({ status: "approved", ...tested })).toBe(true);
    expect(ok({ status: "approved", ...tested, license: { spdx: "unknown", assessment: "ok_to_link" } })).toBe(false);
    expect(ok({ status: "approved", ...tested, specConformance: "fail" })).toBe(false);
    expect(ok({ status: "approved", ...tested, gates: { ...base().gates, comfortableRecommending: "unknown" } })).toBe(false);
    expect(ok({ status: "approved", ...tested, supportedAgents: [] })).toBe(false);
  });
  it("'tested' agent evidence needs an actual test record", () => {
    expect(ok({ supportedAgents: [{ agent: "codex", evidence: "tested", source: "our run" }] })).toBe(false);
  });
  it("a recorded test needs a date and notes; a pinned ref needs an inspection date", () => {
    expect(ok({ testing: { status: "tested" } })).toBe(false);
    expect(ok({ inspectedAt: undefined })).toBe(false);
  });
  it("requires at least one cited source", () => expect(ok({ sources: [] })).toBe(false));
});

describe("promotion", () => {
  const cats = new Set(["marketing"]);
  const parse = (o?: Record<string, unknown>) => candidateSchema.parse(base(o));
  it("refuses anything that is not approved", () => {
    for (const status of ["discovered", "researching", "testing", "rejected"])
      expect(() => candidateToSkillEntry(parse({ status, rejectionReason: "x" }), cats)).toThrow(/only approved/);
  });
  it("produces a draft, link-only entry; Verified only when tested on an agent", () => {
    const e = candidateToSkillEntry(parse({ status: "approved", ...tested, supportedAgents: [{ agent: "claude-code", evidence: "tested", source: "our run" }] }), cats);
    expect(e).toMatchObject({ status: "draft", distribution: "link_only", verification: "verified", slug: "example-skill" });
    const c = candidateToSkillEntry(parse({ status: "approved", ...tested }), cats);
    expect(c.verification).toBe("community"); // tested, but only declared compatibility on the listed agent
    expect(c.lastTestedAt).toBe("");
  });
  it("rejects unknown categories", () => {
    expect(() => candidateToSkillEntry(parse({ status: "approved", ...tested, category: "nope" }), cats)).toThrow(/category/);
  });
});
