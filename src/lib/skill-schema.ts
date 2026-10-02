import { z } from "zod";
import { AGENT_IDS, EVIDENCE } from "@/config/agents";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

const url = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const date = z
  .string()
  .trim()
  .refine((v) => v === "" || (dateRe.test(v) && !Number.isNaN(Date.parse(v))), "Use a date like 2026-10-02");

export const agentCompatSchema = z.object({
  agent: z.enum(AGENT_IDS),
  evidence: z.enum(EVIDENCE),
  note: z.string().trim().max(300).default(""),
  installInstructions: z.string().trim().max(4000).default(""),
});

const skillObject = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(slugRe, "Use lowercase letters, numbers and single hyphens"),
  shortDescription: z.string().trim().min(10, "Write at least a sentence").max(200),
  fullDescription: z.string().trim().max(8000).default(""),
  whoItsFor: z.string().trim().max(500).default(""),
  category: z.string().trim().min(1, "Choose a category"),
  tags: z
    .array(z.string().trim().toLowerCase().min(1).max(32))
    .max(10, "Use at most 10 tags")
    .default([])
    .transform((t) => [...new Set(t)]),
  featured: z.boolean().default(false),

  creatorName: z.string().trim().max(120).default(""),
  creatorUrl: url.default(""),
  sourceUrl: url.default(""),
  repoUrl: url.default(""),
  repoSubpath: z.string().trim().max(300).default(""),
  pinnedRef: z.string().trim().max(120).default(""),
  licenseSpdx: z.string().trim().max(120).default(""),
  licenseUrl: url.default(""),
  attribution: z.string().trim().max(1000).default(""),

  distribution: z.enum(["link_only", "hostable"]).default("link_only"),
  redistributionNote: z.string().trim().max(1000).default(""),

  version: z.string().trim().max(40).default(""),
  installInstructions: z.string().trim().max(8000).default(""),
  agents: z.array(agentCompatSchema).default([]),

  verification: z.enum(["verified", "community", "experimental"]).default("community"),
  lastTestedAt: date.default(""),
  reviewNotes: z.string().trim().max(4000).default(""),

  status: z.enum(["draft", "published", "unpublished"]).default("draft"),
  isSample: z.boolean().default(false),
  addedAt: date.default(""),
});

export const skillInputSchema = skillObject.superRefine((v, ctx) => {
  const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });

  const seen = new Set<string>();
  for (const a of v.agents) {
    if (seen.has(a.agent)) fail("agents", `Agent "${a.agent}" is listed twice`);
    seen.add(a.agent);
  }
  if (v.repoSubpath && !v.repoUrl) fail("repoUrl", "A repository path needs a repository URL");

  if (v.status === "published") {
    if (!v.fullDescription) fail("fullDescription", "Required before publishing");
    if (!v.creatorName) fail("creatorName", "Required before publishing");
    if (!v.sourceUrl) fail("sourceUrl", "Required before publishing");
    if (!v.licenseSpdx) fail("licenseSpdx", "Required before publishing (use NOASSERTION if the source states no license)");
    if (v.agents.length === 0) fail("agents", "List at least one agent with evidence before publishing");
  }
  if (v.verification === "verified") {
    if (!v.lastTestedAt) fail("lastTestedAt", "Verified Skills need a last-tested date");
    if (!v.agents.some((a) => a.evidence === "tested"))
      fail("agents", "Verified Skills need at least one agent marked as tested");
  }
  if (v.distribution === "hostable" && !v.redistributionNote)
    fail("redistributionNote", "Record who confirmed redistribution permission before marking a Skill hostable");
});

export type SkillInput = z.output<typeof skillInputSchema>;

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message));
}
