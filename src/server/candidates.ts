import fs from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";
import { candidateSchema, type Candidate } from "@/lib/candidate-schema";
import { formatIssues, skillInputSchema, type SkillInput } from "@/lib/skill-schema";

export function loadCandidates(dir = "content/candidates"): { candidates: Candidate[]; errors: { file: string; messages: string[] }[] } {
  const candidates: Candidate[] = [];
  const errors: { file: string; messages: string[] }[] = [];
  if (!fs.existsSync(dir)) return { candidates, errors };
  const ids = new Set<string>();
  for (const f of fs.readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    try {
      const parsed = candidateSchema.safeParse(parse(fs.readFileSync(path.join(dir, f), "utf8")));
      if (!parsed.success) { errors.push({ file: f, messages: formatIssues(parsed.error) }); continue; }
      if (f.replace(/\.ya?ml$/, "") !== parsed.data.id) { errors.push({ file: f, messages: ["id must match the file name"] }); continue; }
      if (ids.has(parsed.data.id)) { errors.push({ file: f, messages: ["duplicate id"] }); continue; }
      ids.add(parsed.data.id);
      candidates.push(parsed.data);
    } catch (e) {
      errors.push({ file: f, messages: [`could not parse: ${(e as Error).message}`] });
    }
  }
  return { candidates, errors };
}

/**
 * Maps an APPROVED candidate to a draft Skill entry. Never publishes: status is always "draft",
 * verification is "verified" only when the candidate was tested on an agent, otherwise "community".
 * Throws if the candidate is not approved or the result does not satisfy the published Skill schema.
 */
export function candidateToSkillEntry(c: Candidate, knownCategories: Set<string>): SkillInput {
  if (c.status !== "approved") throw new Error(`"${c.id}" is ${c.status}; only approved candidates can be promoted`);
  if (!knownCategories.has(c.category)) throw new Error(`Unknown category "${c.category}"`);
  const tested = c.testing.status === "tested" && c.supportedAgents.some((a) => a.evidence === "tested");
  const entry = {
    name: c.name,
    slug: c.id,
    shortDescription: c.summary.length > 200 ? `${c.summary.slice(0, 197)}...` : c.summary,
    fullDescription: [c.summary, c.primaryUse && `Primary use: ${c.primaryUse}`, c.dependencies.length ? `Requires: ${c.dependencies.join("; ")}` : ""].filter(Boolean).join("\n\n"),
    whoItsFor: c.founderRelevance,
    category: c.category,
    tags: c.tags,
    featured: false,
    creatorName: c.creator.name,
    creatorUrl: c.creator.url,
    sourceUrl: c.sourceUrl,
    repoUrl: c.repoUrl,
    repoSubpath: c.repoSubpath,
    pinnedRef: c.pinnedRef,
    licenseSpdx: c.license.spdx,
    licenseUrl: "",
    attribution: c.creator.name ? `Created by ${c.creator.name}. Original source: ${c.sourceUrl}` : "",
    distribution: "link_only" as const,
    redistributionNote: "",
    version: "",
    installInstructions: "",
    agents: c.supportedAgents.map((a) => ({ agent: a.agent, evidence: a.evidence, note: a.note, installInstructions: "" })),
    verification: tested ? ("verified" as const) : ("community" as const),
    lastTestedAt: tested ? c.testing.date ?? "" : "",
    reviewNotes: c.notes,
    status: "draft" as const,
    isSample: false,
    addedAt: "",
  };
  const parsed = skillInputSchema.safeParse(entry);
  if (!parsed.success) throw new Error(`Cannot promote "${c.id}": ${formatIssues(parsed.error).join("; ")}`);
  return parsed.data;
}

export const toYaml = (v: unknown) => stringify(v, { lineWidth: 110 });
