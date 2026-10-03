// Usage: npx tsx scripts/curation/scan-repo.ts owner/repo [more owner/repo ...]
// Shallow-clones each repo into .cache/repos and writes research/inventory/<owner>__<repo>.json:
// objective facts about every SKILL.md found. It records what the files say; it does not judge them.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { detectLicense } from "./license-detect";

const CACHE = ".cache/repos";
const OUT = "research/inventory";

const sh = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.toLowerCase() === "skill.md") out.push(p);
  }
  return out;
}

function findLicense(dir: string) {
  const f = fs.readdirSync(dir).find((n) => /^(licen[sc]e|copying)(\.(md|txt|rst))?$/i.test(n));
  if (!f) return null;
  const text = fs.readFileSync(path.join(dir, f), "utf8");
  return { file: f, detected: detectLicense(text.slice(0, 6000)) };
}

function parseSkill(file: string) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  let fm: Record<string, unknown> = {};
  let fmOk = false;
  let body = raw;
  if (m) {
    try { fm = (parse(m[1]) as Record<string, unknown>) ?? {}; fmOk = typeof fm === "object"; } catch { fmOk = false; }
    body = m[2];
  }
  const headings = [...body.matchAll(/^#{1,3}\s+(.+)$/gm)].map((h) => h[1].trim()).slice(0, 14);
  const words = body.split(/\s+/).filter(Boolean).length;
  return { fm, fmOk, body, headings, words, lines: body.split("\n").length };
}

function scan(slug: string) {
  const [owner, repo] = slug.split("/");
  const dir = path.join(CACHE, `${owner}__${repo}`);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.rmSync(dir, { recursive: true, force: true });
  try {
    execFileSync("git", ["clone", "--depth", "1", "-q", `https://github.com/${slug}.git`, dir], { stdio: ["ignore", "pipe", "pipe"], timeout: 120_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
  } catch (e) {
    const msg = String((e as { stderr?: Buffer }).stderr ?? e).split("\n")[0];
    fs.writeFileSync(path.join(OUT, `${owner}__${repo}.json`), JSON.stringify({ repo: slug, error: `clone failed: ${msg}`, scannedAt: new Date().toISOString() }, null, 2));
    console.log(`${slug}: CLONE FAILED (${msg})`);
    return;
  }
  const sha = sh(dir, "rev-parse", "HEAD");
  const headDate = sh(dir, "log", "-1", "--format=%cI");
  const repoLicense = findLicense(dir);
  const skills = walk(dir).map((f) => {
    const sd = path.dirname(f);
    const rel = path.relative(dir, sd) || ".";
    const p = parseSkill(f);
    const name = typeof p.fm.name === "string" ? p.fm.name : "";
    const desc = typeof p.fm.description === "string" ? p.fm.description.replace(/\s+/g, " ").trim() : "";
    const sub = (n: string) => fs.existsSync(path.join(sd, n));
    const count = (n: string) => (sub(n) ? fs.readdirSync(path.join(sd, n)).length : 0);
    const own = rel === "." ? null : findLicense(sd);
    const body = p.body.toLowerCase().replace(/\s+/g, " ");
    return {
      path: rel,
      dirName: path.basename(rel === "." ? repo : rel),
      name,
      description: desc,
      frontmatterLicense: typeof p.fm.license === "string" ? p.fm.license : "",
      frontmatterCompatibility: typeof p.fm.compatibility === "string" ? p.fm.compatibility : "",
      frontmatterKeys: Object.keys(p.fm),
      words: p.words,
      lines: p.lines,
      headings: p.headings,
      references: count("references"),
      scripts: count("scripts"),
      assets: count("assets") + count("templates"),
      skillLicenseFile: own,
      specChecks: {
        frontmatterParses: p.fmOk,
        nameValid: /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) && name.length <= 64,
        nameMatchesDir: name === path.basename(rel === "." ? repo : rel),
        descriptionPresent: desc.length > 0 && desc.length <= 1024,
      },
      fillerSignals: [
        /implement .{0,40} functionality/.test(body) ? "template phrase: 'Implement … functionality'" : "",
        /helps with .{0,40} tasks/.test(desc.toLowerCase()) ? "vague description: 'Helps with … tasks'" : "",
        p.words < 150 ? "very short body (<150 words)" : "",
      ].filter(Boolean),
      bodyHash: createHash("sha1").update(body.slice(0, 4000)).digest("hex").slice(0, 12),
    };
  });
  fs.writeFileSync(
    path.join(OUT, `${owner}__${repo}.json`),
    JSON.stringify({ repo: slug, url: `https://github.com/${slug}`, scannedAt: new Date().toISOString(), headCommit: sha, headCommitDate: headDate, repoLicense, skillCount: skills.length, skills }, null, 2),
  );
  console.log(`${slug}: ${skills.length} skills | license: ${repoLicense ? repoLicense.detected + " (" + repoLicense.file + ")" : "NO LICENSE FILE"} | head ${headDate.slice(0, 10)}`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const s of process.argv.slice(2)) scan(s);
