// Usage: npx tsx scripts/curation/build-candidates.ts
// Merges objective facts (research/inventory + cloned READMEs) with human judgments
// (research/curation/decisions.txt) into content/candidates/*.yaml.
// Facts (commit SHA, license files, README agent mentions with line numbers, sizes, evals) are never typed by hand.
import fs from "node:fs";
import path from "node:path";
import { stringify } from "yaml";
import { candidateSchema } from "../../src/lib/candidate-schema";
import { formatIssues } from "../../src/lib/skill-schema";

type Inv = { repo: string; headCommit: string; headCommitDate: string; repoLicense: { file: string; detected: string } | null; skills: any[]; error?: string };
type RepoCfg = Record<string, string>;
type Entry = { repo: string; p: string; name: string; cat: string; verdict: string; status: string; flags: string; tags: string[]; use: string; extra: Record<string, string>; reject: boolean };

const PERMISSIVE = /^(MIT|Apache-2\.0|BSD-[23]-Clause|ISC|CC0-1\.0|Unlicense)$/i;
const AGENTS: [string, RegExp][] = [["claude-code", /claude code/i], ["codex", /\bcodex\b/i], ["cursor", /\bcursor\b/i], ["gemini-cli", /gemini cli/i], ["github-copilot", /copilot/i]];
const CONTEXT = /(work(s)? (with|in)|compatib|support|install|designed for|built for|works)/i;
const today = "2026-10-03";

// ---- parse decisions
const repos = new Map<string, RepoCfg>();
const entries: Entry[] = [];
let cur = "";
for (const raw of fs.readFileSync("research/curation/decisions.txt", "utf8").split("\n")) {
  const line = raw.trimEnd();
  if (!line.trim()) continue;
  if (line.startsWith("## ")) { cur = line.slice(3).trim(); repos.set(cur, {}); continue; }
  if (line.startsWith("#")) continue;
  if (line.startsWith("@ ")) { const [k, ...v] = line.slice(2).split("="); repos.get(cur)![k.trim()] = v.join("=").trim(); continue; }
  if (line.trimStart().startsWith("+ ")) { const [k, ...v] = line.trim().slice(2).split("="); entries[entries.length - 1].extra[k.trim()] = v.join("=").trim(); continue; }
  const reject = line.startsWith("x ");
  const cols = line.slice(2).split("|").map((s) => s.trim());
  if (reject) { const [p, name, cat, ...reason] = cols; entries.push({ repo: cur, p, name, cat, verdict: "weak", status: "rejected", flags: "", tags: [], use: "", extra: { reason: reason.join("|") }, reject }); }
  else { const [p, name, cat, verdict, status, flags, tags, ...use] = cols; entries.push({ repo: cur, p, name, cat, verdict, status, flags, tags: tags ? tags.split(",").map((t) => t.trim()) : [], use: use.join("|"), extra: {}, reject }); }
}

const invCache = new Map<string, Inv>();
const inv = (repo: string): Inv => {
  if (!invCache.has(repo)) invCache.set(repo, JSON.parse(fs.readFileSync(`research/inventory/${repo.replace("/", "__")}.json`, "utf8")));
  return invCache.get(repo)!;
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);
fs.mkdirSync("content/candidates", { recursive: true });
for (const f of fs.readdirSync("content/candidates")) fs.rmSync(path.join("content/candidates", f));

let problems = 0, written = 0;
for (const e of entries) {
  const cfg = repos.get(e.repo)!;
  const [owner, repoName] = e.repo.split("/");
  const slugBase = `${owner}-${repoName}`.toLowerCase();
  const id = slug(`${slugBase}-${e.p.split("/").pop() === "." ? "root" : e.p.split("/").pop()}`);
  const fail = (m: string) => { console.error(`✗ ${e.repo} :: ${e.p} — ${m}`); problems++; };

  // ---- website / unscannable sources
  if (cfg.kind === "website" || cfg.kind === "unreachable") {
    const c = {
      id, name: e.name, summary: e.use, category: e.cat, tags: e.tags, status: e.status, shortlist: false,
      sourceType: cfg.kind === "website" ? "website" : "github_skill_folder", sourceUrl: cfg.url, repoUrl: cfg.repoUrl ?? "", repoSubpath: "", pinnedRef: "",
      creator: { name: cfg.creator ?? "", url: cfg.creatorUrl ?? "", basis: cfg.creatorBasis ?? "" },
      license: { spdx: "unknown", evidence: cfg.licenseEvidence ?? "", assessment: "unknown", notes: cfg.licenseNotes ?? "" },
      supportedAgents: [], founderRelevance: cfg.fit ?? "", primaryUse: e.use,
      quality: { verdict: "unknown", basis: "metadata_only", signals: {}, assessment: cfg.qualityNote ?? "Not inspected." },
      specConformance: "unchecked",
      gates: { useful: "unknown", specificJob: "unknown", clearDescription: "unknown", identifiableSource: "yes", identifiableCreator: cfg.creator ? "yes" : "unknown", licenseKnown: "no", agentsDeterminable: "unknown", testable: "unknown", beatsGenericModel: "unknown", comfortableRecommending: "unknown" },
      testing: { status: "not_tested", notes: "" }, dependencies: [], overlapsWith: [], notes: cfg.notes ?? "", rejectionReason: "",
      sources: (cfg.sources ?? cfg.url).split(";;").map((s) => { const [u, n] = s.split("~"); return { url: u.trim(), note: (n ?? "").trim() }; }),
    };
    const r = candidateSchema.safeParse(c);
    if (!r.success) fail(formatIssues(r.error).join("; ")); else { fs.writeFileSync(`content/candidates/${id}.yaml`, stringify(r.data, { lineWidth: 110 })); written++; }
    continue;
  }

  // ---- GitHub-sourced
  const I = inv(e.repo);
  const exact = (I.skills ?? []).filter((s) => s.path === e.p);
  const hit = exact.length === 1 ? exact : (I.skills ?? []).filter((s) => s.path.endsWith(`/${e.p}`));
  const m = hit.length === 1 ? hit : (I.skills ?? []).filter((s) => path.basename(s.path).startsWith(e.p) || s.path.split("/").pop() === e.p);
  if (m.length !== 1) { fail(`path matched ${m.length} skills`); continue; }
  const s = m[0];
  const sha = I.headCommit;
  const dir = `.cache/repos/${e.repo.replace("/", "__")}`;
  const sd = path.join(dir, s.path === "." ? "" : s.path);
  const has = (n: string) => fs.existsSync(path.join(sd, n));

  // license
  let spdx = "unknown", assess = "unknown", evidence = "", lnotes = cfg.licenseNotes ?? "";
  if (cfg.spdx) { spdx = cfg.spdx; assess = cfg.assessment ?? "needs_review"; evidence = cfg.licenseEvidence ?? ""; }
  else if (s.skillLicenseFile && PERMISSIVE.test(s.skillLicenseFile.detected)) { spdx = s.skillLicenseFile.detected; assess = "ok_to_link"; evidence = `${s.skillLicenseFile.file} in the Skill folder (detected ${spdx})`; }
  else if (s.skillLicenseFile) { spdx = s.skillLicenseFile.detected; assess = "needs_review"; evidence = `${s.skillLicenseFile.file} in the Skill folder (${spdx})`; lnotes ||= "The Skill folder has its own license that is not a standard permissive license. Read it before listing."; }
  else if (I.repoLicense && PERMISSIVE.test(I.repoLicense.detected)) { spdx = I.repoLicense.detected; assess = "ok_to_link"; evidence = `${I.repoLicense.file} at repository root (detected ${spdx}) @ ${sha.slice(0, 7)}`; }
  else { spdx = "none-found"; assess = "needs_review"; evidence = I.repoLicense ? `${I.repoLicense.file}: ${I.repoLicense.detected}` : "No LICENSE file found in the repository or Skill folder"; lnotes ||= "No license grant found. Default copyright applies: linking is fine; copying or redistributing is not."; }

  // agents (README mentions with line numbers; never inferred)
  const readmeFile = ["README.md", "readme.md", "README.MD"].map((n) => path.join(dir, n)).find((f) => fs.existsSync(f));
  const agents: any[] = [];
  if (readmeFile) {
    const lines = fs.readFileSync(readmeFile, "utf8").split("\n");
    const excl = (cfg.agentsExclude ?? "").split(",").map((x) => x.trim());
    for (const [a, re] of AGENTS) {
      if (excl.includes(a)) continue;
      const n = lines.findIndex((l) => re.test(l) && CONTEXT.test(l) && !/skillkit|\betc\b/i.test(l)); // third-party installer / vague lists are not the repo's own claim
      if (n >= 0) agents.push({ agent: a, evidence: "declared", source: `${e.repo} README.md line ${n + 1} @ ${sha.slice(0, 7)} mentions it in a compatibility/install context`, note: s.frontmatterCompatibility ? `Skill frontmatter compatibility: ${s.frontmatterCompatibility.slice(0, 120)}` : "" });
    }
  }

  const sc = s.specChecks, specOk = Object.values(sc).every(Boolean);
  const evals = has("evals") || has("eval");
  const deps = [...(cfg.deps ? cfg.deps.split(";;") : []), ...(e.extra.deps ? e.extra.deps.split(";;") : [])].map((x) => x.trim()).filter(Boolean);
  const verdict = e.verdict, basis = e.flags.includes("B") ? "body_read" : "outline_read";
  const licenseKnown = assess === "ok_to_link" ? "yes" : assess === "needs_review" && spdx !== "none-found" && spdx !== "unknown" ? "unknown" : "no";
  let reason = e.extra.reason ?? "";
  let rej = e.status === "rejected";
  const tag = (t: string) => reason.includes(`[${t}]`);
  let status = e.status;
  const rawBody = fs.existsSync(path.join(sd, "SKILL.md")) ? fs.readFileSync(path.join(sd, "SKILL.md"), "utf8").replace(/^---[\s\S]*?\n---\n?/, "") : "";
  const cnt = (re: RegExp) => (rawBody.match(re) ?? []).length;
  const structure = [
    cnt(/before starting|before you begin|context questions|ask (the user|for)/gi) ? "intake step" : "",
    cnt(/\.agents\/|product-marketing|sales-context|\.claude\//gi) ? "shared-context file" : "",
    cnt(/^\|.*\|$/gm) > 4 ? "tables" : "",
    cnt(/^- \[ \]/gm) ? "checklists" : "",
    cnt(/```/g) >= 2 ? "templates/code blocks" : "",
    cnt(/tell (the )?ai|paste this|prompt:/gi) ? `prompt-paste blocks x${cnt(/tell (the )?ai|paste this|prompt:/gi)}` : "",
    cnt(/\bexample/gi) ? "examples" : "",
  ].filter(Boolean);
  const promptPaste = cnt(/tell (the )?ai|paste this|prompt:/gi);
  const sig = { words: s.words, references: s.references, scripts: s.scripts, evals, structure };
  // Explicit, documented cull rules (gate 9: is it better than just asking a capable model?)
  const unsupported = !s.references && !s.scripts && !evals;
  let cullNote = "";
  if (!rej && status === "researching" && unsupported && s.words < 700) cullNote = "Auto-culled: under 700 words with no references, scripts or evals; added value over a general model unproven.";
  else if (!rej && status === "researching" && unsupported && promptPaste >= 3) cullNote = `Auto-culled: built around ${promptPaste} copy-paste prompt blocks with no references, scripts or evals; this is a prompt template.`;
  const culled = !!cullNote;
  if (culled) { status = "rejected"; rej = true; reason = `[generic] ${cullNote}`; }
  const c = {
    id, name: e.name,
    summary: rej ? (e.extra.what ?? (e.use || `Listed in ${e.repo}; rejected, see reason.`)) : e.use,
    category: e.cat, tags: e.tags, status, shortlist: e.flags.includes("S"),
    sourceType: s.path === "." || cfg.kind === "suite" ? "github_plugin_suite" : "github_skill_folder",
    sourceUrl: s.path === "." ? `https://github.com/${e.repo}/tree/${sha}` : `https://github.com/${e.repo}/tree/${sha}/${s.path}`,
    repoUrl: `https://github.com/${e.repo}`, repoSubpath: s.path === "." ? "" : s.path, pinnedRef: sha, inspectedAt: today,
    creator: { name: owner, url: `https://github.com/${owner}`, basis: "GitHub repository owner. Authorship of individual Skills inside the repository was not verified." },
    license: { spdx, evidence, assessment: assess, notes: lnotes },
    supportedAgents: agents,
    founderRelevance: e.extra.why ? `${e.extra.why}` : cfg.fit ?? "",
    primaryUse: e.use || "",
    quality: {
      verdict: culled ? "weak" : verdict, basis, signals: sig,
      assessment: [
        `${s.words} words; ${s.references} reference file(s); ${s.scripts} script(s); evals: ${evals ? "yes" : "no"}.`,
        basis === "body_read" ? "The opening of the SKILL.md body (about 40 lines) was read, not the whole file." : "Structure and headings were reviewed; the full body was not read line by line.",
        structure.length ? `Structural features found: ${structure.join(", ")}.` : "No intake, template, checklist or table structure detected.",
        e.extra.q ?? "", cfg.qnote ?? "",
      ].filter(Boolean).join(" "),
    },
    specConformance: specOk ? "pass" : "fail",
    gates: {
      useful: rej && (tag("offtopic") || tag("generic")) ? "no" : "yes",
      specificJob: rej && tag("generic") ? "no" : "yes",
      clearDescription: sc.descriptionPresent ? "yes" : "no",
      identifiableSource: "yes", identifiableCreator: "yes",
      licenseKnown: rej && tag("license") ? "no" : licenseKnown,
      agentsDeterminable: agents.length ? "yes" : "unknown",
      testable: deps.length ? "unknown" : "yes",
      beatsGenericModel: rej ? (tag("generic") || tag("filler") ? "no" : "unknown") : verdict === "strong" ? "yes" : "unknown",
      comfortableRecommending: rej ? "no" : "unknown",
    },
    testing: { status: "not_tested", notes: "" },
    dependencies: deps,
    overlapsWith: (e.extra.overlaps ?? "").split(",").map((x) => x.trim()).filter(Boolean),
    notes: [e.extra.note, cfg.notes, !specOk ? `Spec checks failed: ${Object.entries(sc).filter(([, v]) => !v).map(([k]) => k).join(", ")}.` : ""].filter(Boolean).join(" "),
    rejectionReason: rej ? reason.replace(/\[[a-z]+\]\s*/g, "") : "",
    sources: [
      { url: `https://github.com/${e.repo}/tree/${sha}${s.path === "." ? "" : "/" + s.path}`, note: "Skill folder at the inspected commit" },
      ...(readmeFile ? [{ url: `https://github.com/${e.repo}/blob/${sha}/README.md`, note: "Repository README at the inspected commit" }] : []),
      ...(cfg.disc ? cfg.disc.split(";;").map((d) => { const [u, n] = d.split("~"); return { url: u.trim(), note: (n ?? "found via search").trim() }; }) : []),
    ],
  };
  const r = candidateSchema.safeParse(c);
  if (!r.success) { fail(formatIssues(r.error).join("; ")); continue; }
  fs.writeFileSync(`content/candidates/${id}.yaml`, stringify(r.data, { lineWidth: 110 }));
  written++;
}
console.log(`Wrote ${written} candidate files; ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
