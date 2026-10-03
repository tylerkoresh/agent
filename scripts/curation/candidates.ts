// Usage:
//   npx tsx scripts/curation/candidates.ts validate
//   npx tsx scripts/curation/candidates.ts report
//   npx tsx scripts/curation/candidates.ts promote <id> [--write]
import fs from "node:fs";
import { readCategoriesFile } from "../../src/db/client";
import { candidateToSkillEntry, loadCandidates, toYaml } from "../../src/server/candidates";

const [cmd, arg, flag] = process.argv.slice(2);
const cats = readCategoriesFile().map((c) => c.slug);
const { candidates, errors } = loadCandidates();
for (const c of candidates) if (!cats.includes(c.category)) errors.push({ file: c.id, messages: [`unknown category "${c.category}"`] });

const tally = <T,>(xs: T[], key: (x: T) => string) => xs.reduce<Record<string, number>>((m, x) => ((m[key(x)] = (m[key(x)] ?? 0) + 1), m), {});
const line = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(18)} ${v}`).join("\n");

if (cmd === "validate") {
  for (const e of errors) { console.error(`\n${e.file}`); e.messages.forEach((m) => console.error(`  - ${m}`)); }
  console.log(`${candidates.length} valid, ${errors.length} with problems.`);
  process.exit(errors.length ? 1 : 0);
} else if (cmd === "report") {
  const live = candidates.filter((c) => c.status !== "rejected");
  console.log(`Candidates: ${candidates.length} (${live.length} not rejected, ${candidates.length - live.length} rejected)\n\nBy status:\n${line(tally(candidates, (c) => c.status))}`);
  console.log(`\nNot rejected, by category:\n${line(tally(live, (c) => c.category))}`);
  console.log(`\nShortlist (priority for hands-on testing): ${candidates.filter((c) => c.shortlist).length}\n${line(tally(candidates.filter((c) => c.shortlist), (c) => c.category))}`);
  console.log(`\nNot rejected, by source repo:\n${line(tally(live, (c) => c.repoUrl.replace("https://github.com/", "") || c.sourceUrl))}`);
  console.log(`\nTested: ${candidates.filter((c) => c.testing.status === "tested").length}   Approved: ${candidates.filter((c) => c.status === "approved").length}`);
} else if (cmd === "promote") {
  const c = candidates.find((x) => x.id === arg);
  if (!c) { console.error(`No valid candidate "${arg}"`); process.exit(1); }
  try {
    const entry = candidateToSkillEntry(c, new Set(cats));
    const out = `content/skills/${entry.slug}.yaml`;
    if (flag === "--write") { fs.writeFileSync(out, toYaml(entry)); console.log(`Wrote draft ${out} (status: draft, not published).`); }
    else console.log(toYaml(entry));
  } catch (e) { console.error((e as Error).message); process.exit(1); }
} else { console.error("Usage: validate | report | promote <id> [--write]"); process.exit(1); }
