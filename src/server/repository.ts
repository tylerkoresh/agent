import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { categories, skillAgents, skills } from "@/db/schema";
import type { Db } from "@/db/client";
import type { SkillInput } from "@/lib/skill-schema";
import { buildFtsQuery } from "./search";

type SkillRow = typeof skills.$inferSelect;
export type SkillAgent = Omit<typeof skillAgents.$inferSelect, "skillId">;
export type Skill = SkillRow & { agents: SkillAgent[]; categoryName: string };
export type Category = typeof categories.$inferSelect;

export type ListFilters = {
  q?: string;
  category?: string;
  tag?: string;
  agent?: string;
  verification?: SkillRow["verification"];
  featuredOnly?: boolean;
  status?: SkillRow["status"]; // admin only; public always forces "published"
  page?: number;
  pageSize?: number;
};

export type ListResult = { items: Skill[]; total: number; page: number; pageSize: number };

export class SlugConflictError extends Error {
  constructor(slug: string) {
    super(`Another Skill already uses the slug "${slug}"`);
  }
}
export class UnknownCategoryError extends Error {
  constructor(slug: string) {
    super(`Unknown category "${slug}"`);
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export function createRepository(db: Db, opts: { showSamples: boolean }) {
  const raw = db.$client;

  const publicCond = (): SQL[] => {
    const c: SQL[] = [eq(skills.status, "published")];
    if (!opts.showSamples) c.push(eq(skills.isSample, false));
    return c;
  };

  function hydrate(rows: SkillRow[]): Skill[] {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const agentRows = db.select().from(skillAgents).where(inArray(skillAgents.skillId, ids)).all();
    const cats = new Map(db.select().from(categories).all().map((c) => [c.slug, c.name]));
    const byId = new Map<string, SkillAgent[]>();
    for (const { skillId, ...a } of agentRows) {
      byId.set(skillId, [...(byId.get(skillId) ?? []), a]);
    }
    return rows.map((r) => ({
      ...r,
      categoryName: cats.get(r.categorySlug) ?? r.categorySlug,
      agents: (byId.get(r.id) ?? []).sort((a, b) => a.agent.localeCompare(b.agent)),
    }));
  }

  function reindex(id: string) {
    const [row] = db.select().from(skills).where(eq(skills.id, id)).all();
    raw.prepare("DELETE FROM skills_fts WHERE skill_id = ?").run(id);
    if (!row) return;
    const [cat] = db.select().from(categories).where(eq(categories.slug, row.categorySlug)).all();
    raw
      .prepare(
        "INSERT INTO skills_fts (skill_id, name, short_description, category, tags, full_description) VALUES (?,?,?,?,?,?)",
      )
      .run(row.id, row.name, row.shortDescription, cat?.name ?? "", row.tags.join(" "), row.fullDescription);
  }

  function rebuildSearchIndex() {
    raw.prepare("DELETE FROM skills_fts").run();
    for (const { id } of db.select({ id: skills.id }).from(skills).all()) reindex(id);
  }

  function getById(id: string): Skill | null {
    const [row] = db.select().from(skills).where(eq(skills.id, id)).all();
    return row ? hydrate([row])[0] : null;
  }

  type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
  function apply(tx: Tx, input: SkillInput, id?: string): { id: string; created: boolean } {
    const cat = tx.select().from(categories).where(eq(categories.slug, input.category)).all()[0];
    if (!cat) throw new UnknownCategoryError(input.category);

    const bySlug = tx.select().from(skills).where(eq(skills.slug, input.slug)).all()[0];
    const target = id ? tx.select().from(skills).where(eq(skills.id, id)).all()[0] : bySlug;
    if (id && !target) throw new Error("Skill not found");
    if (bySlug && target && bySlug.id !== target.id) throw new SlugConflictError(input.slug);
    if (bySlug && !target) throw new SlugConflictError(input.slug);

    const { agents, category, ...rest } = input;
    const values = {
      ...rest,
      categorySlug: category,
      addedAt: input.addedAt || target?.addedAt || today(),
      updatedAt: new Date().toISOString(),
    };
    const rowId = target?.id ?? randomUUID();
    if (target) tx.update(skills).set(values).where(eq(skills.id, rowId)).run();
    else tx.insert(skills).values({ id: rowId, ...values }).run();
    tx.delete(skillAgents).where(eq(skillAgents.skillId, rowId)).run();
    if (agents.length) tx.insert(skillAgents).values(agents.map((a) => ({ ...a, skillId: rowId }))).run();
    return { id: rowId, created: !target };
  }

  const verificationOrder = sql`CASE ${skills.verification} WHEN 'verified' THEN 0 WHEN 'community' THEN 1 ELSE 2 END`;

  function list(f: ListFilters, scope: "public" | "admin"): ListResult {
    const pageSize = Math.min(Math.max(f.pageSize ?? 24, 1), 100);
    const page = Math.max(f.page ?? 1, 1);
    const conds: SQL[] = scope === "public" ? publicCond() : f.status ? [eq(skills.status, f.status)] : [];
    if (f.category) conds.push(eq(skills.categorySlug, f.category));
    if (f.verification) conds.push(eq(skills.verification, f.verification));
    if (f.featuredOnly) conds.push(eq(skills.featured, true));
    if (f.tag) conds.push(sql`EXISTS (SELECT 1 FROM json_each(${skills.tags}) WHERE value = ${f.tag})`);
    if (f.agent)
      conds.push(
        sql`EXISTS (SELECT 1 FROM skill_agents sa WHERE sa.skill_id = ${skills.id} AND sa.agent = ${f.agent})`,
      );

    const match = f.q ? buildFtsQuery(f.q) : null;
    if (f.q && !match) return { items: [], total: 0, page, pageSize };

    if (match) {
      const ranked = raw
        .prepare(
          "SELECT skill_id FROM skills_fts WHERE skills_fts MATCH ? ORDER BY bm25(skills_fts, 0, 10, 5, 3, 5, 1)",
        )
        .all(match) as { skill_id: string }[];
      if (ranked.length === 0) return { items: [], total: 0, page, pageSize };
      const order = new Map(ranked.map((r, i) => [r.skill_id, i]));
      const rows = db
        .select()
        .from(skills)
        .where(and(inArray(skills.id, [...order.keys()]), ...conds))
        .all()
        .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
      const slice = rows.slice((page - 1) * pageSize, page * pageSize);
      return { items: hydrate(slice), total: rows.length, page, pageSize };
    }

    const where = conds.length ? and(...conds) : undefined;
    const [{ n }] = db.select({ n: sql<number>`count(*)` }).from(skills).where(where).all();
    const rows = db
      .select()
      .from(skills)
      .where(where)
      .orderBy(
        scope === "admin" ? desc(skills.updatedAt) : verificationOrder,
        asc(skills.name),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .all();
    return { items: hydrate(rows), total: n, page, pageSize };
  }

  return {
    listCategories(): Category[] {
      return db.select().from(categories).orderBy(asc(categories.sortOrder)).all();
    },

    getCategory(slug: string): Category | null {
      return db.select().from(categories).where(eq(categories.slug, slug)).all()[0] ?? null;
    },

    publishedCountsByCategory(): Record<string, number> {
      const rows = db
        .select({ slug: skills.categorySlug, n: sql<number>`count(*)` })
        .from(skills)
        .where(and(...publicCond()))
        .groupBy(skills.categorySlug)
        .all();
      return Object.fromEntries(rows.map((r) => [r.slug, r.n]));
    },

    listPublic: (f: ListFilters = {}) => list(f, "public"),
    listAdmin: (f: ListFilters = {}) => list(f, "admin"),

    listFeatured(limit = 6): Skill[] {
      return hydrate(
        db
          .select()
          .from(skills)
          .where(and(...publicCond(), eq(skills.featured, true)))
          .orderBy(verificationOrder, asc(skills.name))
          .limit(limit)
          .all(),
      );
    },

    listLatest(limit = 8): Skill[] {
      return hydrate(
        db
          .select()
          .from(skills)
          .where(and(...publicCond()))
          .orderBy(desc(skills.addedAt), asc(skills.name))
          .limit(limit)
          .all(),
      );
    },

    /** Agents and tags actually in use among public Skills, for filters. */
    publicFacets(): { agents: string[]; tags: string[] } {
      const agents = raw
        .prepare(
          `SELECT DISTINCT sa.agent FROM skill_agents sa JOIN skills s ON s.id = sa.skill_id
           WHERE s.status = 'published' ${opts.showSamples ? "" : "AND s.is_sample = 0"} ORDER BY sa.agent`,
        )
        .all() as { agent: string }[];
      const tags = raw
        .prepare(
          `SELECT DISTINCT j.value AS tag FROM skills s, json_each(s.tags) j
           WHERE s.status = 'published' ${opts.showSamples ? "" : "AND s.is_sample = 0"} ORDER BY j.value`,
        )
        .all() as { tag: string }[];
      return { agents: agents.map((a) => a.agent), tags: tags.map((t) => t.tag) };
    },

    getPublicBySlug(slug: string): Skill | null {
      const [row] = db
        .select()
        .from(skills)
        .where(and(eq(skills.slug, slug), ...publicCond()))
        .all();
      return row ? hydrate([row])[0] : null;
    },

    getById,

    getBySlug(slug: string): Skill | null {
      const [row] = db.select().from(skills).where(eq(skills.slug, slug)).all();
      return row ? hydrate([row])[0] : null;
    },

    /** Create or update. With `id`, edits that row (slug may change). Without, upserts by slug. */
    upsert(input: SkillInput, o: { id?: string } = {}): { skill: Skill; created: boolean } {
      const res = db.transaction((tx) => apply(tx, input, o.id));
      reindex(res.id);
      return { skill: getById(res.id)!, created: res.created };
    },

    /** All-or-nothing batch upsert by slug. Throws (and writes nothing) if any entry fails. */
    upsertMany(inputs: SkillInput[]): { created: number; updated: number } {
      const results = db.transaction((tx) => inputs.map((i) => apply(tx, i)));
      for (const r of results) reindex(r.id);
      return {
        created: results.filter((r) => r.created).length,
        updated: results.filter((r) => !r.created).length,
      };
    },

    setStatus(id: string, status: SkillRow["status"]): Skill {
      const skill = getById(id);
      if (!skill) throw new Error("Skill not found");
      if (status === "published") {
        const problems: string[] = [];
        if (!skill.fullDescription) problems.push("full description");
        if (!skill.creatorName) problems.push("creator");
        if (!skill.sourceUrl) problems.push("source URL");
        if (!skill.licenseSpdx) problems.push("license");
        if (skill.agents.length === 0) problems.push("at least one agent with evidence");
        if (problems.length) throw new Error(`Cannot publish yet. Missing: ${problems.join(", ")}.`);
      }
      db.update(skills).set({ status, updatedAt: new Date().toISOString() }).where(eq(skills.id, id)).run();
      return getById(id)!;
    },

    exportAll(): Skill[] {
      return hydrate(db.select().from(skills).orderBy(asc(skills.slug)).all());
    },

    counts(): { total: number; published: number; draft: number; unpublished: number } {
      const rows = db
        .select({ status: skills.status, n: sql<number>`count(*)` })
        .from(skills)
        .groupBy(skills.status)
        .all();
      const by = Object.fromEntries(rows.map((r) => [r.status, r.n]));
      const published = by.published ?? 0;
      const draft = by.draft ?? 0;
      const unpublished = by.unpublished ?? 0;
      return { total: published + draft + unpublished, published, draft, unpublished };
    },

    rebuildSearchIndex,
  };
}

export type SkillRepository = ReturnType<typeof createRepository>;
