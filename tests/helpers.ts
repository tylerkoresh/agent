import { openDatabase } from "@/db/client";
import { createRepository } from "@/server/repository";
import type { SkillInput } from "@/lib/skill-schema";

export function testRepo(showSamples = true) {
  const db = openDatabase(":memory:");
  return createRepository(db, { showSamples });
}

export function entry(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Competitor Research",
    slug: "competitor-research",
    shortDescription: "Compare competitors on positioning and pricing.",
    fullDescription: "Longer text.",
    category: "research",
    tags: ["competitors"],
    creatorName: "Test Creator",
    sourceUrl: "https://example.com/x",
    licenseSpdx: "MIT",
    agents: [{ agent: "claude-code", evidence: "declared" }],
    status: "published",
    ...over,
  };
}
export type { SkillInput };
