// Usage: npm run catalog:import [-- <dir-or-file>] [--dry-run]
import fs from "node:fs";
import { importEntries } from "../src/server/catalog";
import { parseCatalogText } from "../src/server/catalog";
import { openRepo } from "./_repo";
import { readDir } from "./_files";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const target = args.find((a) => !a.startsWith("--")) ?? "content/skills";

const entries = fs.existsSync(target) && fs.statSync(target).isFile()
  ? parseCatalogText(fs.readFileSync(target, "utf8"))
  : readDir(target).flatMap((f) => f.entries);

const report = importEntries(openRepo(), entries, { dryRun });
if (!report.ok) {
  console.error("Import failed. Nothing was written.");
  for (const i of report.issues) {
    console.error(`\n  ${i.entry}`);
    for (const m of i.messages) console.error(`    - ${m}`);
  }
  process.exit(1);
}
console.log(`${dryRun ? "Dry run OK" : "Imported"}: ${report.created} new, ${report.updated} updated (${entries.length} entries).`);
