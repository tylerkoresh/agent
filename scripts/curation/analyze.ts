// Usage: npx tsx scripts/curation/analyze.ts
// Summarises every inventory in research/inventory and finds identical SKILL.md bodies across repos
// (a strong signal that one repo copies another, so the original source must be traced).
import fs from "node:fs";
import path from "node:path";

type Skill = { path: string; name: string; description: string; words: number; bodyHash: string; fillerSignals: string[]; specChecks: Record<string, boolean>; references: number; scripts: number };
type Inv = { repo: string; headCommitDate?: string; repoLicense?: { detected: string } | null; skills?: Skill[]; error?: string };

const dir = "research/inventory";
const invs: Inv[] = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const ok = invs.filter((i) => i.skills);

console.log("repo | skills | license | spec-valid% | median words | filler% | head");
for (const i of ok.sort((a, b) => b.skills!.length - a.skills!.length)) {
  const s = i.skills!;
  const valid = s.filter((x) => Object.values(x.specChecks).every(Boolean)).length;
  const w = s.map((x) => x.words).sort((a, b) => a - b);
  const filler = s.filter((x) => x.fillerSignals.length).length;
  console.log(`${i.repo} | ${s.length} | ${i.repoLicense?.detected ?? "none"} | ${Math.round((valid / s.length) * 100)}% | ${w[Math.floor(w.length / 2)]} | ${Math.round((filler / s.length) * 100)}% | ${i.headCommitDate?.slice(0, 10)}`);
}

const byHash = new Map<string, { repo: string; path: string; name: string }[]>();
for (const i of ok) for (const s of i.skills!) {
  if (s.words < 150) continue;
  byHash.set(s.bodyHash, [...(byHash.get(s.bodyHash) ?? []), { repo: i.repo, path: s.path, name: s.name }]);
}
const pairs = new Map<string, number>();
for (const g of byHash.values()) {
  const repos = [...new Set(g.map((x) => x.repo))].sort();
  for (let a = 0; a < repos.length; a++) for (let b = a + 1; b < repos.length; b++) pairs.set(`${repos[a]}  <->  ${repos[b]}`, (pairs.get(`${repos[a]}  <->  ${repos[b]}`) ?? 0) + 1);
}
console.log("\nrepos sharing identical SKILL.md bodies (>=150 words), count:");
for (const [k, v] of [...pairs].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`${v}\t${k}`);
