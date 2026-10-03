# Catalog curation workflow

Discover → evaluate → verify → curate → import. The published-Skill model (`content/skills/`) is unchanged and remains
the only thing the public site reads. Candidates live separately in `content/candidates/` and never appear on the site.

## Statuses

| Status | Meaning |
|---|---|
| `discovered` | Found. Metadata only, or not inspectable (private, gated, unreachable). |
| `researching` | Plausible. Structure and headings reviewed. Needs a fuller read. |
| `license_review` | Blocked on license or provenance: no license, conflicting licenses, or content derived from someone else's work. |
| `testing` | Passed desk review (readable, licensed, specific job, quality verdict strong or adequate). Waiting for a hands-on test. |
| `approved` | Tested, license known and ok_to_link, agent evidence recorded, and a person said yes to "comfortable recommending". |
| `rejected` | Reason recorded. Kept so nobody re-evaluates it. |

`candidateSchema` (`src/lib/candidate-schema.ts`) enforces these rules, so an unverified Skill cannot be marked approved.

## The ten gates

Each candidate records yes / no / unknown for: useful to founders, specific job, clear description, identifiable source,
identifiable creator, license known, agents determinable, testable, better than asking a capable general model,
comfortable recommending. Unknown is a valid answer and is the honest default.

## Commands

```bash
npm run research:scan -- owner/repo ...   # clone shallow, write research/inventory/*.json (objective facts, git-ignored)
npm run research:analyze                  # repo quality signals and cross-repo copy detection
npx tsx scripts/curation/list.ts owner/repo [regex]    # browse a scanned repo
npx tsx scripts/curation/digest.ts owner/repo path ... # structure of Skill bodies (intake, templates, prompt-paste, evals)
# edit research/curation/decisions.txt (judgments only), then:
npx tsx scripts/curation/build-candidates.ts           # merge facts + judgments into content/candidates/*.yaml
npm run candidates:validate
npm run candidates:report
npm run candidates:promote -- <id> --write             # approved candidates only; writes a DRAFT to content/skills/
```

## What is a fact and what is a judgment

Facts are produced by tools and never typed by hand: commit SHA inspected, license files and their detected type, README
lines naming supported agents (cited by line number), word counts, bundled files, spec checks, evals present.
Judgments live in `decisions.txt`: category, quality verdict, status, rejection reasons, what the Skill does in our words.
Summaries are written in our own words and never paste source text.

## Testing a candidate

1. Install it on one agent exactly as its source describes, in a clean project.
2. Give it two realistic founder tasks. Compare against the same request with no Skill.
3. Record in the candidate file: `testing.status: tested`, `testing.date`, `testing.notes` (agent, version, tasks, result).
4. If it worked, add a `supportedAgents` row with `evidence: tested`. Only then can a Skill become Verified on the site.
5. Set `gates.comfortableRecommending: yes` and `status: approved`, then promote.

## Rules

- Never infer a license from a badge, README prose, or the fact that a repo is public.
- Never infer compatibility. README claims are `declared`, never `tested`.
- Third-party Skills stay `link_only`. Promotion always produces a draft with `distribution: link_only`.
- Trace copies to the original. Aggregator repos are not sources.
- Plugin suites with shared dependencies are one candidate, not many.
- Prefer one strong Skill per job over several overlapping ones.
