import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { parse } from "yaml";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

const FTS_DDL = `CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  skill_id UNINDEXED, name, short_description, category, tags, full_description,
  tokenize = 'unicode61 remove_diacritics 2'
)`;

export type CategorySeed = { slug: string; name: string; description?: string };

export function readCategoriesFile(file = path.join(process.cwd(), "content", "categories.yaml")): CategorySeed[] {
  return parse(fs.readFileSync(file, "utf8")) as CategorySeed[];
}

export function syncCategories(db: Db, cats: CategorySeed[]) {
  db.transaction((tx) => {
    cats.forEach((c, i) => {
      tx.insert(schema.categories)
        .values({ slug: c.slug, name: c.name, description: c.description ?? "", sortOrder: i })
        .onConflictDoUpdate({
          target: schema.categories.slug,
          set: { name: c.name, description: c.description ?? "", sortOrder: i },
        })
        .run();
    });
  });
}

export function openDatabase(file: string, opts: { categories?: CategorySeed[] } = {}): Db {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle(sqlite, { schema }) as Db;
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  sqlite.exec(FTS_DDL);
  syncCategories(db, opts.categories ?? readCategoriesFile());
  return db;
}

const g = globalThis as unknown as { __asffDb?: Db };

export function getDb(): Db {
  if (!g.__asffDb) {
    g.__asffDb = openDatabase(process.env.DATABASE_PATH ?? "./data/skills.db");
  }
  return g.__asffDb;
}
