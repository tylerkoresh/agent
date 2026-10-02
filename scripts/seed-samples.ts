// Dev-only: loads clearly labelled sample fixtures from content/samples.
import { importEntries } from "../src/server/catalog";
import { openRepo } from "./_repo";
import { readDir } from "./_files";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to load sample data with NODE_ENV=production.");
  process.exit(1);
}
const entries = readDir("content/samples").flatMap((f) => f.entries);
const r = importEntries(openRepo(), entries);
if (!r.ok) {
  console.error(JSON.stringify(r.issues, null, 2));
  process.exit(1);
}
console.log(`Sample data loaded: ${r.created} new, ${r.updated} updated. All are flagged isSample.`);
