// Usage: npx tsx scripts/curation/digest.ts owner/repo path [path ...]
// Prints objective structure facts about SKILL.md bodies so quality judgments can cite them.
import fs from "node:fs";
import path from "node:path";

const [repo, ...paths] = process.argv.slice(2);
const root = `.cache/repos/${repo.replace("/", "__")}`;
for (const p of paths) {
  const f = path.join(root, p, "SKILL.md");
  if (!fs.existsSync(f)) { console.log(`${p}: MISSING`); continue; }
  const raw = fs.readFileSync(f, "utf8");
  const body = raw.replace(/^---[\s\S]*?\n---\n?/, "");
  const c = (re: RegExp) => (body.match(re) ?? []).length;
  const dir = path.join(root, p);
  const has = (n: string) => fs.existsSync(path.join(dir, n));
  const feats = [
    c(/before starting|before you begin|context questions|ask (the user|for)/gi) ? "intake" : "",
    c(/\.agents\/|product-marketing|sales-context|\.claude\//gi) ? "shared-context" : "",
    c(/^\|.*\|$/gm) > 4 ? `tables:${Math.floor(c(/^\|.*\|$/gm) / 4)}` : "",
    c(/^- \[ \]/gm) ? `checklist:${c(/^- \[ \]/gm)}` : "",
    c(/```/g) / 2 >= 1 ? `code/templates:${Math.floor(c(/```/g) / 2)}` : "",
    c(/tell (the )?ai|paste this|prompt:/gi) ? `prompt-paste:${c(/tell (the )?ai|paste this|prompt:/gi)}` : "",
    c(/\bexample/gi) ? `examples:${c(/\bexample/gi)}` : "",
    c(/related skills/gi) ? "related-skills" : "",
    has("references") ? `refs:${fs.readdirSync(path.join(dir, "references")).length}` : "",
    has("evals") ? "evals" : "",
    has("scripts") ? `scripts:${fs.readdirSync(path.join(dir, "scripts")).length}` : "",
    c(/~~[a-z]/gi) ? `connector-placeholders:${c(/~~[a-z]/gi)}` : "",
  ].filter(Boolean).join(" ");
  const heads = [...body.matchAll(/^##\s+(.+)$/gm)].map((h) => h[1].trim().slice(0, 28)).slice(0, 7).join(" / ");
  console.log(`${p.split("/").slice(-1)[0].padEnd(26)} ${String(body.split(/\s+/).length).padStart(5)}w | ${feats}\n    ${heads}`);
}
