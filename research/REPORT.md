# Catalog research report

Generated 2026-10-03 from the data in `content/candidates/` and `research/inventory/`. Method and rules: `docs/CURATION.md`.
Nothing in this report has been tested on an agent. **0 candidates are tested. 0 are approved.** The public catalog is still empty.

## 1. What was researched

- Web searches to find where founder-relevant Skills live (GitHub repos, registries, awesome lists, vendor sites).
- 40 GitHub repositories were cloned and scanned (13,306 `SKILL.md` files). 1 failed to clone: aihxp/prd-ready.
- For each, the scanner recorded the commit inspected, license files, spec conformance, size, bundled references/scripts/evals, and README lines naming supported agents.
- Skill bodies were only sampled: 2 candidates have the opening ~40 lines of their SKILL.md read by a person; for about 30 more, structure was reviewed with a digest tool (intake step, templates, checklists, prompt-paste blocks); the rest are judged from metadata, headings and bundled files. No Skill was read end to end. Every candidate states its depth in `quality.basis`.

## 2. Funnel

| Stage | Count |
| --- | --- |
| Recorded (every Skill I made a decision on) | 251 |
| Rejected, with reason | 71 |
| Not rejected | 180 |
| Passed desk review, license-clear, awaiting hands-on test (`testing`) | 33 |
| Blocked on license or provenance (`license_review`) | 39 |
| Plausible, outline-level evidence only (`researching`) | 106 |
| Could not be inspected (`discovered`) | 2 |
| Priority shortlist for the first hands-on test round | 32 |
| Tested / approved | 0 / 0 |

Honest reading: the pool of **180** is above the 100–150 target, but only **72** have been evaluated beyond metadata with a clear next step. The 106 `researching` records are plausible and unproven; expect many to be dropped after a real read.

## 3. Not-rejected candidates by category

| Category | Candidates | On shortlist |
| --- | --- | --- |
| sales | 29 | 5 |
| marketing | 19 | 5 |
| customers | 18 | 3 |
| product | 17 | 2 |
| seo | 14 | 3 |
| finance | 13 | 3 |
| growth | 13 | 2 |
| research | 11 | 3 |
| analytics | 10 | 1 |
| content | 8 | 2 |
| design | 7 | 1 |
| development | 6 | 0 |
| fundraising | 6 | 0 |
| hiring | 5 | 2 |
| operations | 4 | 0 |

Concentration risk: `coreyhaines31/marketingskills` (34), `anthropics/knowledge-work-plugins` (24), `refoundai/lenny-skills` (21) supply most of the pool. Several categories rest on one source.

## 4. Strongest candidates (priority for hands-on testing)

All are license-clear (permissive license found in the repository or Skill folder) and have README-declared agent support. Evidence per row is in the candidate file.

| Skill | Category | Source | License | Declared agents | Signals |
| --- | --- | --- | --- | --- | --- |
| [Analytics Tracking Setup](../content/candidates/coreyhaines31-marketingskills-analytics.yaml) | analytics | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1120w, evals |
| [Content Strategy](../content/candidates/coreyhaines31-marketingskills-content-strategy.yaml) | content | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2649w, evals |
| [Copy Editing](../content/candidates/coreyhaines31-marketingskills-copy-editing.yaml) | content | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2657w, evals |
| [Churn Prevention](../content/candidates/coreyhaines31-marketingskills-churn-prevention.yaml) | customers | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2698w, evals |
| [Customer Research](../content/candidates/coreyhaines31-marketingskills-customer-research.yaml) | customers | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2163w, evals |
| [Interview Synthesis](../content/candidates/product-on-purpose-pm-skills-discover-interview-synthesis.yaml) | customers | product-on-purpose/pm-skills | Apache-2.0 | claude-code, codex, cursor, github-copilot | 671w, evals |
| [Intent (UX and design strategy system)](../content/candidates/ghaida-intent-intent.yaml) | design | ghaida/intent | CC0-1.0 | claude-code | 6203w |
| [Pricing Strategy](../content/candidates/coreyhaines31-marketingskills-pricing.yaml) | finance | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1868w, evals |
| [Startup Financial Model](../content/candidates/wshobson-agents-startup-financial-modeling.yaml) | finance | wshobson/agents | MIT | claude-code, codex, cursor, github-copilot | 1111w |
| [Startup Metrics Framework](../content/candidates/wshobson-agents-startup-metrics-framework.yaml) | finance | wshobson/agents | MIT | claude-code, codex, cursor, github-copilot | 1549w |
| [Experiment Design](../content/candidates/product-on-purpose-pm-skills-measure-experiment-design.yaml) | growth | product-on-purpose/pm-skills | Apache-2.0 | claude-code, codex, cursor, github-copilot | 543w, evals |
| [Signup Flow Optimization](../content/candidates/coreyhaines31-marketingskills-signup.yaml) | growth | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1508w, evals |
| [Hiring Developers and Contractors](../content/candidates/whawkinsiv-solo-founder-superpowers-hiring.yaml) | hiring | whawkinsiv/solo-founder-superpowers | MIT | claude-code, codex, cursor, gemini-cli, github-copilot | 2171w |
| [Hiring Packet Builder](../content/candidates/anthropics-knowledge-work-plugins-job-post-builder.yaml) | hiring | anthropics/knowledge-work-plugins | Apache-2.0 | claude-code | 1545w, needs extra tools |
| [Email Sequences](../content/candidates/coreyhaines31-marketingskills-emails.yaml) | marketing | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1392w, evals |
| [Marketing Copywriting](../content/candidates/coreyhaines31-marketingskills-copywriting.yaml) | marketing | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1517w, evals |
| [Marketing Plan](../content/candidates/coreyhaines31-marketingskills-marketing-plan.yaml) | marketing | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 3591w, evals |
| [Product Launch Plan](../content/candidates/coreyhaines31-marketingskills-launch.yaml) | marketing | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2214w, evals |
| [Product Marketing Context](../content/candidates/coreyhaines31-marketingskills-product-marketing.yaml) | marketing | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1323w, evals |
| [Lean Canvas](../content/candidates/product-on-purpose-pm-skills-foundation-lean-canvas.yaml) | product | product-on-purpose/pm-skills | Apache-2.0 | claude-code, codex, cursor, github-copilot | 1554w, evals |
| [PRD Writer](../content/candidates/product-on-purpose-pm-skills-deliver-prd.yaml) | product | product-on-purpose/pm-skills | Apache-2.0 | claude-code, codex, cursor, github-copilot | 1149w, evals |
| [Business Idea Validation](../content/candidates/whawkinsiv-solo-founder-superpowers-validate.yaml) | research | whawkinsiv/solo-founder-superpowers | MIT | claude-code, codex, cursor, gemini-cli, github-copilot | 1537w |
| [Competitor Profiling](../content/candidates/coreyhaines31-marketingskills-competitor-profiling.yaml) | research | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2367w, evals |
| [Market Sizing](../content/candidates/product-on-purpose-pm-skills-discover-market-sizing.yaml) | research | product-on-purpose/pm-skills | Apache-2.0 | claude-code, codex, cursor, github-copilot | 1868w, evals |
| [Cold Email and Follow-ups](../content/candidates/coreyhaines31-marketingskills-cold-email.yaml) | sales | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 1107w, evals |
| [Discovery Call Planner](../content/candidates/thecraighewitt-sales-skills-discovery-call.yaml) | sales | TheCraigHewitt/sales-skills | MIT | claude-code, codex, cursor | 3818w |
| [Objection Handling](../content/candidates/thecraighewitt-sales-skills-objection-handling.yaml) | sales | TheCraigHewitt/sales-skills | MIT | claude-code, codex, cursor | 3738w |
| [Outbound Sequence Designer](../content/candidates/thecraighewitt-sales-skills-outbound-sequence.yaml) | sales | TheCraigHewitt/sales-skills | MIT | claude-code, codex, cursor | 4008w |
| [Prospect Research](../content/candidates/coreyhaines31-marketingskills-prospecting.yaml) | sales | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2303w, evals |
| [AI Search Optimization](../content/candidates/coreyhaines31-marketingskills-ai-seo.yaml) | seo | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 4308w, evals |
| [Claude SEO (suite)](../content/candidates/agricidaniel-claude-seo-seo.yaml) | seo | AgriciDaniel/claude-seo | MIT | claude-code | 2517w, needs extra tools |
| [SEO Audit](../content/candidates/coreyhaines31-marketingskills-seo-audit.yaml) | seo | coreyhaines31/marketingskills | MIT | claude-code, codex, cursor | 2290w, evals |

Why these: the marketing, SEO, sales, customer and pricing Skills from `coreyhaines31/marketingskills` and the product Skills from `product-on-purpose/pm-skills` ship test prompts (evals), reference documents and an intake step; the sales Skills from `TheCraigHewitt/sales-skills` are 3,700–4,000 words each. These are the cases that plausibly beat "just ask a capable model".

## 5. License and provenance findings

- **`borghei/Claude-Skills`**: repo LICENSE says MIT, but 356 of 373 Skills say "MIT + Commons Clause", which is not an open-source license. Conflicting; no candidates recorded.
- **`refoundai/lenny-skills`**: MIT, but the content is distilled from Lenny's Podcast and Newsletter with verbatim quotes. MIT cannot grant rights over the underlying material. 21 candidates held in `license_review`.
- **`guia-matthieu/clawfu-skills`**: many Skills summarise commercial books ("master [author]'s framework"). Held in `license_review`; several rejected.
- **`anthropics/skills`**: 14 Skills carry Apache-2.0; the four document Skills (docx, pdf, pptx, xlsx) carry a proprietary license. Those are held in `license_review`.
- **`BrianRWagner/ai-marketing-claude-code-skills`**: README shows an MIT badge but there is no LICENSE file. A badge is not a grant.
- **No license file at all**: `pedronauck/skills`, `sachacoldiq/ColdIQ-s-GTM-Skills`, `kkoppenhaver/cc-skills`, `CalebLewallen/agent-prod`, `louisblythe/Sales-Skills`, `ComposioHQ/awesome-claude-skills`, `sundial-org/awesome-openclaw-skills`.
- **Copies**: `whawkinsiv/claude-code-skills` and `solo-founder-superpowers` are the same 62 Skills (renamed repo). The 8,212-Skill `sickn33/antigravity-awesome-skills` and `ComposioHQ` contain copies of other publishers' Skills. Aggregators were used for provenance checks only, never as sources.
- Not legal advice. License detection is by matching the text of LICENSE files and can be wrong.

## 6. Rejected: examples and why

| Rejected | Source | Reason |
| --- | --- | --- |
| Revenue Intelligence | ericosiu/ai-marketing-skills | No frontmatter description. |
| Skill Template | anthropics/skills | A placeholder with a four-word body. |
| Recruitment Automation | sundial-org/awesome-openclaw-skills | Promotes a paid vendor service and requires buying an API key; no license in the repository. |
| Funnels (Brunson) | guia-matthieu/clawfu-skills | Adapted from a commercial book's framework; provenance of the content unclear. |
| Email Sequence | anthropics/knowledge-work-plugins | Same job as marketingskills emails, which has references and evals. |
| Founder Marketing Skills | aradotso/marketing-skills | The repository README says a bot writes a Skill for each trending repo, and the README still contains an unfilled template placeholder. Skills are auto-generated, not cur |
| Startup Founder Bundle | justinedevs/collection | An umbrella bundle that routes to many thin sub-skills (median about 400 words); the "operating system" framing is exactly the concept we are avoiding. |

Rule-based culls (documented in `build-candidates.ts`): 15 Skills that were under 700 words or built around copy-paste prompt blocks with no references, scripts or evals. This rule is blunt; review the list before treating those as final.

## 7. Ecosystem gaps

Method: keyword searches over all 13,306 scanned `SKILL.md` files plus manual checks of the hits. Keyword hits are noisy, so absence claims below were checked by reading the matching names.

- **Investor research / VC list building**: effectively absent. Across everything scanned, the only hits were one fundraising pack and a 229-word VC-outreach stub, both in a repo with no license.
- **Cap table, SAFEs, option pool, equity modeling**: effectively absent. Only tangential matches (team equity allocation inside a team-composition Skill; a 439-word comp-analysis Skill).
- **Pitch deck and investor update**: Skills exist but are blocked: the strongest are proprietary (pptx), license-conflicted (board-deck-builder in the Commons Clause repo), or book-derived. No license-clear, inspected pitch-deck Skill yet.
- **Hiring**: thin. One solid hiring packet (job post, interview guide, offer template; needs connected tools) and one contractor-hiring Skill. The rest of HR is short prompts or aggregator copies.
- **Operations**: weak. Official operations Skills are 150–460 words of trigger phrases and were rejected as generic.
- **Keyword research and content briefs**: only inside SEO suites that need Python or paid data (DataForSEO, SE Ranking). No standalone, license-clear, no-API keyword-research Skill.
- **Fundraising generally**: all candidates are `license_review`. Nothing in this category is ready to test.
- **Legal basics (ToS, privacy, contracts)**: exist, but are risky to present as dependable. Left as informational only.
- **Strong supply**: marketing, SEO audit, sales outreach and discovery, customer research, pricing, product specs, market sizing, experiment design.

These gaps are information, not instructions to fill them. If they matter for launch, they are the places where commissioning or writing a Skill may be justified.

## 8. What I could not verify

- **Nothing was run on any agent.** Every compatibility entry is `declared` from a README line (cited by line number). None is tested, so no Skill is Verified.
- Compatibility is per repository README, not per Skill. A README saying "works with Cursor" does not prove each Skill does.
- `aihxp/prd-ready`: a search result described it, but it could not be cloned (private, renamed or removed). Recorded as `discovered`.
- Founder Institute AI Skills (fi.co/aiskills): real and founder-targeted, but behind a registration wall with "All Rights Reserved". Recorded as `discovered`; content never seen.
- Repositories scanned but **not reviewed beyond inventory**: `alirezarezvani/claude-skills` (846 Skills, 458 are mirrored copies; includes c-level, marketing, product and finance sections), `openai/skills`, `borghei/Claude-Skills` (blocked by license), `guia-matthieu/clawfu-skills` (mostly rejected as generic). `alirezarezvani` is the most likely source of additional candidates and should be reviewed next.
- Popularity and maintenance signals (stars, issues) were not collected. The GitHub API is rate-limited here; only the head commit date was recorded.
- Whether a Skill is better than a general model is judged from structure and bundled material, not from comparison runs.
- Skills requiring connected tools (CRM, accounting, paid SEO data) cannot be tested without those accounts. They are flagged in `dependencies`.
