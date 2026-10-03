// Usage: npx tsx scripts/curation/list.ts owner/repo [regex-filter]
import fs from "node:fs";
const [repo, filter] = process.argv.slice(2);
const inv = JSON.parse(fs.readFileSync(`research/inventory/${repo.replace("/", "__")}.json`, "utf8"));
const re = filter ? new RegExp(filter, "i") : null;
for (const s of inv.skills) {
  if (re && !re.test(`${s.name} ${s.description} ${s.path}`)) continue;
  const flags = [s.specChecks.nameValid && s.specChecks.descriptionPresent ? "" : "!spec", s.scripts ? `s${s.scripts}` : "", s.references ? `r${s.references}` : "", s.fillerSignals.length ? "FILLER" : ""].filter(Boolean).join(",");
  console.log(`${s.path.replace(/^skills\//, "").slice(0, 34)} | ${s.words}w ${flags} | ${s.description.slice(0, 105)}`);
}
