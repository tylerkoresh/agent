// Usage: npx tsx scripts/curation/report-md.ts  -> writes research/REPORT.md (numbers come from the data)
import fs from "node:fs";
import { loadCandidates } from "../../src/server/candidates";

const { candidates: all } = loadCandidates();
const inv = fs.readdirSync("research/inventory").map((f) => JSON.parse(fs.readFileSync(`research/inventory/${f}`, "utf8")));
const scanned = inv.filter((i) => i.skills);
const failed = inv.filter((i) => i.error);
const totalSkills = scanned.reduce((n, i) => n + i.skills.length, 0);
const live = all.filter((c) => c.status !== "rejected");
const by = (xs: typeof all, k: (c: (typeof all)[number]) => string) => xs.reduce<Record<string, number>>((m, c) => ((m[k(c)] = (m[k(c)] ?? 0) + 1), m), {});
const status = by(all, (c) => c.status);
const cats = by(live, (c) => c.category);
const slCats = by(all.filter((c) => c.shortlist), (c) => c.category);
const tbl = (rows: string[][], head: string[]) => [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
const repoOf = (c: (typeof all)[number]) => c.repoUrl.replace("https://github.com/", "") || c.sourceUrl;
const agentsOf = (c: (typeof all)[number]) => c.supportedAgents.map((a) => a.agent).join(", ") || "none declared";

const shortlist = all.filter((c) => c.shortlist).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
const rejReason = (c: (typeof all)[number]) => c.rejectionReason.replace(/\|/g, "/").slice(0, 170);
const pick = (match: RegExp) => all.filter((c) => c.status === "rejected" && match.test(c.rejectionReason) && !/Auto-culled/.test(c.rejectionReason));

const out: string[] = [];
out.push(`# Catalog research report

Generated ${new Date().toISOString().slice(0, 10)} from the data in \`content/candidates/\` and \`research/inventory/\`. Method and rules: \`docs/CURATION.md\`.
Nothing in this report has been tested on an agent. **0 candidates are tested. 0 are approved.** The public catalog is still empty.

## 1. What was researched

- Web searches to find where founder-relevant Skills live (GitHub repos, registries, awesome lists, vendor sites).
- ${scanned.length} GitHub repositories were cloned and scanned (${totalSkills.toLocaleString()} \`SKILL.md\` files). ${failed.length} failed to clone: ${failed.map((f) => f.repo).join(", ") || "none"}.
- For each, the scanner recorded the commit inspected, license files, spec conformance, size, bundled references/scripts/evals, and README lines naming supported agents.
- Skill bodies were only sampled: ${all.filter((c) => c.quality.basis === "body_read").length} candidates have the opening ~40 lines of their SKILL.md read by a person; for about 30 more, structure was reviewed with a digest tool (intake step, templates, checklists, prompt-paste blocks); the rest are judged from metadata, headings and bundled files. No Skill was read end to end. Every candidate states its depth in \`quality.basis\`.

## 2. Funnel

${tbl([
  ["Recorded (every Skill I made a decision on)", String(all.length)],
  ["Rejected, with reason", String(status.rejected ?? 0)],
  ["Not rejected", String(live.length)],
  ["Passed desk review, license-clear, awaiting hands-on test (\`testing\`)", String(status.testing ?? 0)],
  ["Blocked on license or provenance (\`license_review\`)", String(status.license_review ?? 0)],
  ["Plausible, outline-level evidence only (\`researching\`)", String(status.researching ?? 0)],
  ["Could not be inspected (\`discovered\`)", String(status.discovered ?? 0)],
  ["Priority shortlist for the first hands-on test round", String(shortlist.length)],
  ["Tested / approved", "0 / 0"],
], ["Stage", "Count"])}

Honest reading: the pool of **${live.length}** is above the 100–150 target, but only **${(status.testing ?? 0) + (status.license_review ?? 0)}** have been evaluated beyond metadata with a clear next step. The ${status.researching ?? 0} \`researching\` records are plausible and unproven; expect many to be dropped after a real read.

## 3. Not-rejected candidates by category

${tbl(Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, String(v), String(slCats[k] ?? 0)]), ["Category", "Candidates", "On shortlist"])}

Concentration risk: ${Object.entries(by(live, repoOf)).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `\`${k}\` (${v})`).join(", ")} supply most of the pool. Several categories rest on one source.

## 4. Strongest candidates (priority for hands-on testing)

All are license-clear (permissive license found in the repository or Skill folder) and have README-declared agent support. Evidence per row is in the candidate file.

${tbl(shortlist.map((c) => [`[${c.name}](../content/candidates/${c.id}.yaml)`, c.category, repoOf(c), c.license.spdx, agentsOf(c), `${c.quality.signals.words}w${c.quality.signals.evals ? ", evals" : ""}${c.dependencies.length ? ", needs extra tools" : ""}`]), ["Skill", "Category", "Source", "License", "Declared agents", "Signals"])}

Why these: the marketing, SEO, sales, customer and pricing Skills from \`coreyhaines31/marketingskills\` and the product Skills from \`product-on-purpose/pm-skills\` ship test prompts (evals), reference documents and an intake step; the sales Skills from \`TheCraigHewitt/sales-skills\` are 3,700–4,000 words each. These are the cases that plausibly beat "just ask a capable model".

## 5. License and provenance findings

- **\`borghei/Claude-Skills\`**: repo LICENSE says MIT, but 356 of 373 Skills say "MIT + Commons Clause", which is not an open-source license. Conflicting; no candidates recorded.
- **\`refoundai/lenny-skills\`**: MIT, but the content is distilled from Lenny's Podcast and Newsletter with verbatim quotes. MIT cannot grant rights over the underlying material. ${all.filter((c) => repoOf(c) === "refoundai/lenny-skills" && c.status === "license_review").length} candidates held in \`license_review\`.
- **\`guia-matthieu/clawfu-skills\`**: many Skills summarise commercial books ("master [author]'s framework"). Held in \`license_review\`; several rejected.
- **\`anthropics/skills\`**: 14 Skills carry Apache-2.0; the four document Skills (docx, pdf, pptx, xlsx) carry a proprietary license. Those are held in \`license_review\`.
- **\`BrianRWagner/ai-marketing-claude-code-skills\`**: README shows an MIT badge but there is no LICENSE file. A badge is not a grant.
- **No license file at all**: \`pedronauck/skills\`, \`sachacoldiq/ColdIQ-s-GTM-Skills\`, \`kkoppenhaver/cc-skills\`, \`CalebLewallen/agent-prod\`, \`louisblythe/Sales-Skills\`, \`ComposioHQ/awesome-claude-skills\`, \`sundial-org/awesome-openclaw-skills\`.
- **Copies**: \`whawkinsiv/claude-code-skills\` and \`solo-founder-superpowers\` are the same 62 Skills (renamed repo). The 8,212-Skill \`sickn33/antigravity-awesome-skills\` and \`ComposioHQ\` contain copies of other publishers' Skills. Aggregators were used for provenance checks only, never as sources.
- Not legal advice. License detection is by matching the text of LICENSE files and can be wrong.

## 6. Rejected: examples and why

${tbl([
  ...[/nodesc|No frontmatter description/, /placeholder|template/i, /vendor|paid/i, /commercial book|book/i, /duplicate|Same job/i, /voice|bot|Auto-generated|bot writes/i, /umbrella|operating system/i].flatMap((re) => pick(re).slice(0, 1)).map((c) => [c.name, repoOf(c), rejReason(c)]),
], ["Rejected", "Source", "Reason"])}

Rule-based culls (documented in \`build-candidates.ts\`): ${all.filter((c) => /Auto-culled/.test(c.rejectionReason)).length} Skills that were under 700 words or built around copy-paste prompt blocks with no references, scripts or evals. This rule is blunt; review the list before treating those as final.

## 7. Ecosystem gaps

Method: keyword searches over all ${totalSkills.toLocaleString()} scanned \`SKILL.md\` files plus manual checks of the hits. Keyword hits are noisy, so absence claims below were checked by reading the matching names.

- **Investor research / VC list building**: effectively absent. Across everything scanned, the only hits were one fundraising pack and a 229-word VC-outreach stub, both in a repo with no license.
- **Cap table, SAFEs, option pool, equity modeling**: effectively absent. Only tangential matches (team equity allocation inside a team-composition Skill; a 439-word comp-analysis Skill).
- **Pitch deck and investor update**: Skills exist but are blocked: the strongest are proprietary (pptx), license-conflicted (board-deck-builder in the Commons Clause repo), or book-derived. No license-clear, inspected pitch-deck Skill yet.
- **Hiring**: thin. One solid hiring packet (job post, interview guide, offer template; needs connected tools) and one contractor-hiring Skill. The rest of HR is short prompts or aggregator copies.
- **Operations**: weak. Official operations Skills are 150–460 words of trigger phrases and were rejected as generic.
- **Keyword research and content briefs**: only inside SEO suites that need Python or paid data (DataForSEO, SE Ranking). No standalone, license-clear, no-API keyword-research Skill.
- **Fundraising generally**: all candidates are \`license_review\`. Nothing in this category is ready to test.
- **Legal basics (ToS, privacy, contracts)**: exist, but are risky to present as dependable. Left as informational only.
- **Strong supply**: marketing, SEO audit, sales outreach and discovery, customer research, pricing, product specs, market sizing, experiment design.

These gaps are information, not instructions to fill them. If they matter for launch, they are the places where commissioning or writing a Skill may be justified.

## 8. What I could not verify

- **Nothing was run on any agent.** Every compatibility entry is \`declared\` from a README line (cited by line number). None is tested, so no Skill is Verified.
- Compatibility is per repository README, not per Skill. A README saying "works with Cursor" does not prove each Skill does.
- \`aihxp/prd-ready\`: a search result described it, but it could not be cloned (private, renamed or removed). Recorded as \`discovered\`.
- Founder Institute AI Skills (fi.co/aiskills): real and founder-targeted, but behind a registration wall with "All Rights Reserved". Recorded as \`discovered\`; content never seen.
- Repositories scanned but **not reviewed beyond inventory**: \`alirezarezvani/claude-skills\` (846 Skills, 458 are mirrored copies; includes c-level, marketing, product and finance sections), \`openai/skills\`, \`borghei/Claude-Skills\` (blocked by license), \`guia-matthieu/clawfu-skills\` (mostly rejected as generic). \`alirezarezvani\` is the most likely source of additional candidates and should be reviewed next.
- Popularity and maintenance signals (stars, issues) were not collected. The GitHub API is rate-limited here; only the head commit date was recorded.
- Whether a Skill is better than a general model is judged from structure and bundled material, not from comparison runs.
- Skills requiring connected tools (CRM, accounting, paid SEO data) cannot be tested without those accounts. They are flagged in \`dependencies\`.
`);
fs.writeFileSync("research/REPORT.md", out.join("\n"));
console.log("Wrote research/REPORT.md");
