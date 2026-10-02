import { parse, stringify } from "yaml";
import { formatIssues, skillInputSchema, type SkillInput } from "@/lib/skill-schema";
import type { Skill, SkillRepository } from "./repository";

export type EntryIssue = { entry: string; messages: string[] };

/** Accepts YAML or JSON containing one Skill object, a list of them, or { skills: [...] }. */
export function parseCatalogText(text: string): unknown[] {
  const data = parse(text);
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { skills?: unknown }).skills))
    return (data as { skills: unknown[] }).skills;
  if (data && typeof data === "object") return [data];
  throw new Error("File is empty or is not a Skill, a list of Skills, or { skills: [...] }");
}

const label = (raw: unknown, i: number) =>
  raw && typeof raw === "object" && "slug" in raw && typeof (raw as { slug: unknown }).slug === "string"
    ? (raw as { slug: string }).slug
    : `entry #${i + 1}`;

export function validateEntries(
  entries: unknown[],
  knownCategories: Set<string>,
): { valid: SkillInput[]; issues: EntryIssue[] } {
  const valid: SkillInput[] = [];
  const issues: EntryIssue[] = [];
  const slugs = new Set<string>();
  entries.forEach((raw, i) => {
    const parsed = skillInputSchema.safeParse(raw);
    if (!parsed.success) {
      issues.push({ entry: label(raw, i), messages: formatIssues(parsed.error) });
      return;
    }
    const msgs: string[] = [];
    if (!knownCategories.has(parsed.data.category)) msgs.push(`category: unknown category "${parsed.data.category}"`);
    if (slugs.has(parsed.data.slug)) msgs.push(`slug: "${parsed.data.slug}" appears more than once in this import`);
    slugs.add(parsed.data.slug);
    if (msgs.length) issues.push({ entry: parsed.data.slug, messages: msgs });
    else valid.push(parsed.data);
  });
  return { valid, issues };
}

export type ImportReport = {
  ok: boolean;
  created: number;
  updated: number;
  issues: EntryIssue[];
  dryRun: boolean;
};

/** All-or-nothing: if any entry is invalid, nothing is written. */
export function importEntries(
  repo: SkillRepository,
  entries: unknown[],
  opts: { dryRun?: boolean } = {},
): ImportReport {
  const cats = new Set(repo.listCategories().map((c) => c.slug));
  const { valid, issues } = validateEntries(entries, cats);
  const dryRun = !!opts.dryRun;
  if (issues.length) return { ok: false, created: 0, updated: 0, issues, dryRun };
  if (dryRun) {
    const existing = valid.filter((v) => repo.getBySlug(v.slug)).length;
    return { ok: true, created: valid.length - existing, updated: existing, issues: [], dryRun };
  }
  const { created, updated } = repo.upsertMany(valid);
  return { ok: true, created, updated, issues: [], dryRun };
}

/** The exported shape is exactly what the importer accepts, so exports round-trip. */
export function skillToEntry(s: Skill): SkillInput {
  return {
    name: s.name,
    slug: s.slug,
    shortDescription: s.shortDescription,
    fullDescription: s.fullDescription,
    whoItsFor: s.whoItsFor,
    category: s.categorySlug,
    tags: s.tags,
    featured: s.featured,
    creatorName: s.creatorName,
    creatorUrl: s.creatorUrl,
    sourceUrl: s.sourceUrl,
    repoUrl: s.repoUrl,
    repoSubpath: s.repoSubpath,
    pinnedRef: s.pinnedRef,
    licenseSpdx: s.licenseSpdx,
    licenseUrl: s.licenseUrl,
    attribution: s.attribution,
    distribution: s.distribution,
    redistributionNote: s.redistributionNote,
    version: s.version,
    installInstructions: s.installInstructions,
    agents: s.agents.map((a) => ({
      agent: a.agent as SkillInput["agents"][number]["agent"],
      evidence: a.evidence,
      note: a.note,
      installInstructions: a.installInstructions,
    })),
    verification: s.verification,
    lastTestedAt: s.lastTestedAt,
    reviewNotes: s.reviewNotes,
    status: s.status,
    isSample: s.isSample,
    addedAt: s.addedAt,
  };
}

export const exportYaml = (skills: Skill[]) => stringify(skills.map(skillToEntry), { lineWidth: 100 });
export const exportJson = (skills: Skill[]) => JSON.stringify({ skills: skills.map(skillToEntry) }, null, 2);
