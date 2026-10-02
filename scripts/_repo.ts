import { openDatabase } from "../src/db/client";
import { createRepository } from "../src/server/repository";

export function openRepo() {
  const db = openDatabase(process.env.DATABASE_PATH ?? "./data/skills.db");
  return createRepository(db, { showSamples: true });
}
