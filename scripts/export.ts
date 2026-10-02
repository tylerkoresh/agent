// Usage: npm run catalog:export [-- out.yaml|out.json]
import fs from "node:fs";
import { exportJson, exportYaml } from "../src/server/catalog";
import { openRepo } from "./_repo";

const out = process.argv[2] ?? "catalog-export.yaml";
const skills = openRepo().exportAll();
fs.writeFileSync(out, out.endsWith(".json") ? exportJson(skills) : exportYaml(skills));
console.log(`Exported ${skills.length} Skills to ${out}`);
