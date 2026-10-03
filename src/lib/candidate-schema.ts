import { z } from "zod";
import { AGENT_IDS } from "@/config/agents";

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const url = z.union([z.literal(""), z.url({ protocol: /^https?$/ })]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-10-03");
const tri = z.enum(["yes", "no", "unknown"]);

export const CANDIDATE_STATUSES = ["discovered", "researching", "license_review", "testing", "approved", "rejected"] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

/** Spdx values that mean "we do not actually know". */
export const UNKNOWN_LICENSES = new Set(["", "unknown", "none-found", "conflicting"]);

export const candidateSchema = z
  .object({
    id: z.string().regex(slugRe).max(120),
    name: z.string().trim().min(2).max(100),
    /** Our own words. Never pasted source text. */
    summary: z.string().trim().min(10).max(400),
    category: z.string().trim().min(1),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(32)).max(10).default([]),
    status: z.enum(CANDIDATE_STATUSES),
    shortlist: z.boolean().default(false),

    sourceType: z.enum(["github_skill_folder", "github_plugin_suite", "website", "other"]),
    sourceUrl: url,
    repoUrl: url.default(""),
    repoSubpath: z.string().default(""),
    /** Commit SHA that was actually inspected. Empty if nothing was inspected. */
    pinnedRef: z.string().default(""),
    inspectedAt: date.optional(),

    creator: z.object({ name: z.string().default(""), url: url.default(""), basis: z.string().default("") }),
    license: z.object({
      spdx: z.string().default("unknown"),
      evidence: z.string().default(""),
      assessment: z.enum(["ok_to_link", "needs_review", "not_ok", "unknown"]),
      notes: z.string().default(""),
    }),
    supportedAgents: z
      .array(
        z.object({
          agent: z.enum(AGENT_IDS),
          evidence: z.enum(["declared", "tested"]),
          source: z.string().min(3),
          note: z.string().default(""),
        }),
      )
      .default([]),

    founderRelevance: z.string().default(""),
    primaryUse: z.string().default(""),
    quality: z.object({
      verdict: z.enum(["strong", "adequate", "weak", "unknown"]),
      basis: z.enum(["metadata_only", "outline_read", "body_read"]),
      signals: z
        .object({ words: z.number().optional(), references: z.number().optional(), scripts: z.number().optional(), evals: z.boolean().optional(), structure: z.array(z.string()).optional() })
        .default({}),
      assessment: z.string().default(""),
    }),
    specConformance: z.enum(["pass", "fail", "unchecked"]).default("unchecked"),
    gates: z.object({
      useful: tri, specificJob: tri, clearDescription: tri, identifiableSource: tri, identifiableCreator: tri,
      licenseKnown: tri, agentsDeterminable: tri, testable: tri, beatsGenericModel: tri, comfortableRecommending: tri,
    }),
    testing: z
      .object({ status: z.enum(["not_tested", "tested", "failed"]).default("not_tested"), date: date.optional(), notes: z.string().default("") })
      .default({ status: "not_tested", notes: "" }),

    dependencies: z.array(z.string()).default([]),
    overlapsWith: z.array(z.string()).default([]),
    notes: z.string().default(""),
    rejectionReason: z.string().default(""),
    sources: z.array(z.object({ url: z.url({ protocol: /^https?$/ }), note: z.string().default("") })).min(1, "Cite at least one source"),
  })
  .superRefine((c, ctx) => {
    const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    const licenseKnown = !UNKNOWN_LICENSES.has(c.license.spdx.toLowerCase());

    if (c.status === "rejected" && !c.rejectionReason.trim()) fail("rejectionReason", "A rejected candidate needs a reason");
    if (c.testing.status !== "not_tested" && (!c.testing.date || !c.testing.notes.trim()))
      fail("testing", "A test result needs a date and notes");
    if (c.supportedAgents.some((a) => a.evidence === "tested") && c.testing.status !== "tested")
      fail("supportedAgents", "Evidence 'tested' requires testing.status = tested");
    if (c.pinnedRef && !c.inspectedAt) fail("inspectedAt", "Record when the pinned ref was inspected");

    if (c.status === "testing" || c.status === "approved") {
      if (c.quality.verdict !== "strong" && c.quality.verdict !== "adequate") fail("quality", "Needs a strong or adequate quality verdict");
      if (c.quality.basis === "metadata_only") fail("quality", "The Skill must have been read, not just listed");
      if (c.license.assessment === "not_ok") fail("license", "License assessment is not_ok");
      if (!c.sourceUrl) fail("sourceUrl", "Source URL required");
      if (!c.creator.name) fail("creator", "Creator required");
    }
    if (c.status === "approved") {
      if (!licenseKnown) fail("license", "Approved Skills need a known license");
      if (c.license.assessment !== "ok_to_link") fail("license", "Approved Skills need license assessment ok_to_link");
      if (c.supportedAgents.length === 0) fail("supportedAgents", "Approved Skills need at least one agent with evidence");
      if (c.specConformance !== "pass") fail("specConformance", "Approved Skills must pass the spec check");
      if (c.testing.status !== "tested") fail("testing", "Approved Skills must have been tested");
      if (c.gates.comfortableRecommending !== "yes") fail("gates", "Approved Skills need an explicit yes to 'comfortable recommending'");
    }
    if (c.status === "license_review" && c.license.assessment === "ok_to_link")
      fail("license", "license_review contradicts assessment ok_to_link");
  });

export type Candidate = z.output<typeof candidateSchema>;
