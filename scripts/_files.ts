import fs from "node:fs";
import path from "node:path";
import { parseCatalogText } from "../src/server/catalog";

export function readDir(dir: string): { file: string; entries: unknown[] }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(ya?ml|json)$/i.test(f))
    .sort()
    .map((f) => ({ file: f, entries: parseCatalogText(fs.readFileSync(path.join(dir, f), "utf8")) }));
}
