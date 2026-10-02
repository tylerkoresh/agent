import fs from "node:fs";
import { execSync } from "node:child_process";

// Fresh database with the sample fixtures for every run.
export default function setup() {
  for (const f of ["data/e2e.db", "data/e2e.db-wal", "data/e2e.db-shm"]) fs.rmSync(f, { force: true });
  execSync("npx tsx scripts/seed-samples.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_PATH: "./data/e2e.db", NODE_ENV: "development" },
  });
}
