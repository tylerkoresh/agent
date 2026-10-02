import { sqliteTable, text, integer, primaryKey, index } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const skills = sqliteTable(
  "skills",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    shortDescription: text("short_description").notNull(),
    fullDescription: text("full_description").notNull().default(""),
    whoItsFor: text("who_its_for").notNull().default(""),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),

    // Source and licensing
    creatorName: text("creator_name").notNull().default(""),
    creatorUrl: text("creator_url").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    repoUrl: text("repo_url").notNull().default(""),
    repoSubpath: text("repo_subpath").notNull().default(""),
    pinnedRef: text("pinned_ref").notNull().default(""),
    licenseSpdx: text("license_spdx").notNull().default(""),
    licenseUrl: text("license_url").notNull().default(""),
    attribution: text("attribution").notNull().default(""),

    // Distribution: link_only by default. hostable needs explicit confirmation.
    distribution: text("distribution", { enum: ["link_only", "hostable"] })
      .notNull()
      .default("link_only"),
    redistributionNote: text("redistribution_note").notNull().default(""),

    version: text("version").notNull().default(""),
    installInstructions: text("install_instructions").notNull().default(""),

    verification: text("verification", { enum: ["verified", "community", "experimental"] })
      .notNull()
      .default("community"),
    lastTestedAt: text("last_tested_at").notNull().default(""),
    reviewNotes: text("review_notes").notNull().default(""),

    status: text("status", { enum: ["draft", "published", "unpublished"] })
      .notNull()
      .default("draft"),
    isSample: integer("is_sample", { mode: "boolean" }).notNull().default(false),
    addedAt: text("added_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("skills_category_idx").on(t.categorySlug), index("skills_status_idx").on(t.status)],
);

// A row exists only when there is evidence. No row means compatibility is unknown.
export const skillAgents = sqliteTable(
  "skill_agents",
  {
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    agent: text("agent").notNull(),
    evidence: text("evidence", { enum: ["tested", "declared"] }).notNull(),
    note: text("note").notNull().default(""),
    installInstructions: text("install_instructions").notNull().default(""),
  },
  (t) => [primaryKey({ columns: [t.skillId, t.agent] })],
);
