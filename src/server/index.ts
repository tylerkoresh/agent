import "server-only";
import { getDb } from "@/db/client";
import { createRepository, type SkillRepository } from "./repository";

const g = globalThis as unknown as { __asffRepo?: SkillRepository };

export function getRepository(): SkillRepository {
  if (!g.__asffRepo) {
    const showSamples = process.env.NODE_ENV !== "production" || process.env.SHOW_SAMPLES === "true";
    g.__asffRepo = createRepository(getDb(), { showSamples });
  }
  return g.__asffRepo;
}
