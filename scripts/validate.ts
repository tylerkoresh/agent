// Usage: npm run catalog:validate [-- <dir>]  (no database writes)
import { readCategoriesFile } from "../src/db/client";
import { validateEntries } from "../src/server/catalog";
import { readDir } from "./_files";

const dir = process.argv[2] ?? "content/skills";
const entries = readDir(dir).flatMap((f) => f.entries);
const { valid, issues } = validateEntries(entries, new Set(readCategoriesFile().map((c) => c.slug)));
for (const i of issues) {
  console.error(`\n  ${i.entry}`);
  for (const m of i.messages) console.error(`    - ${m}`);
}
console.log(`${valid.length} valid, ${issues.length} with problems (${entries.length} total).`);
process.exit(issues.length ? 1 : 0);
