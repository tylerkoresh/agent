"use server";
import { redirect } from "next/navigation";
import { AGENTS } from "@/config/agents";
import {
  checkCredentials, clearFailedLogins, endSession, loginThrottled, recordFailedLogin, requireAdmin, startSession,
} from "@/lib/auth";
import { skillInputSchema } from "@/lib/skill-schema";
import { importEntries, parseCatalogText, type ImportReport } from "@/server/catalog";
import { SlugConflictError, UnknownCategoryError } from "@/server/repository";
import { getRepository } from "@/server";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (await loginThrottled()) return { error: "Too many attempts. Wait 15 minutes and try again." };
  const ok = checkCredentials(String(fd.get("username") ?? ""), String(fd.get("password") ?? ""));
  if (!ok) {
    await recordFailedLogin();
    return { error: "Username or password is incorrect." };
  }
  clearFailedLogins();
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

/** Flat shape the form renders and the schema validates. */
function formToRaw(fd: FormData): Record<string, unknown> {
  const agents = AGENTS.filter((a) => fd.get(`agent_${a.id}`) === "on").map((a) => ({
    agent: a.id,
    evidence: str(fd, `evidence_${a.id}`) || "declared",
    note: str(fd, `note_${a.id}`),
    installInstructions: str(fd, `instr_${a.id}`),
  }));
  const name = str(fd, "name");
  return {
    name,
    slug: str(fd, "slug").trim() || slugify(name),
    shortDescription: str(fd, "shortDescription"),
    fullDescription: str(fd, "fullDescription"),
    whoItsFor: str(fd, "whoItsFor"),
    category: str(fd, "category"),
    tags: str(fd, "tags").split(",").map((t) => t.trim()).filter(Boolean),
    featured: fd.get("featured") === "on",
    creatorName: str(fd, "creatorName"),
    creatorUrl: str(fd, "creatorUrl"),
    sourceUrl: str(fd, "sourceUrl"),
    repoUrl: str(fd, "repoUrl"),
    repoSubpath: str(fd, "repoSubpath"),
    pinnedRef: str(fd, "pinnedRef"),
    licenseSpdx: str(fd, "licenseSpdx"),
    licenseUrl: str(fd, "licenseUrl"),
    attribution: str(fd, "attribution"),
    distribution: str(fd, "distribution") || "link_only",
    redistributionNote: str(fd, "redistributionNote"),
    version: str(fd, "version"),
    installInstructions: str(fd, "installInstructions"),
    agents,
    verification: str(fd, "verification") || "community",
    lastTestedAt: str(fd, "lastTestedAt"),
    reviewNotes: str(fd, "reviewNotes"),
    status: str(fd, "status") || "draft",
    isSample: fd.get("isSample") === "true",
    addedAt: str(fd, "addedAt"),
  };
}

export type SaveState = {
  errors?: Record<string, string[]>;
  message?: string;
  values?: Record<string, unknown>;
  nonce?: number;
};

export async function saveSkill(id: string | null, _prev: SaveState, fd: FormData): Promise<SaveState> {
  await requireAdmin();
  const raw = formToRaw(fd);
  const parsed = skillInputSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) (errors[String(i.path[0] ?? "form")] ??= []).push(i.message);
    return { errors, message: "Fix the highlighted fields. Nothing was saved.", values: raw, nonce: Date.now() };
  }
  let savedId: string;
  try {
    savedId = getRepository().upsert(parsed.data, id ? { id } : {}).skill.id;
  } catch (e) {
    if (e instanceof SlugConflictError) return { errors: { slug: [e.message] }, message: "Nothing was saved.", values: raw, nonce: Date.now() };
    if (e instanceof UnknownCategoryError) return { errors: { category: [e.message] }, message: "Nothing was saved.", values: raw, nonce: Date.now() };
    throw e;
  }
  redirect(`/admin/skills/${savedId}?saved=1`);
}

export async function setStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  const back = str(fd, "back") || "/admin";
  const sep = back.includes("?") ? "&" : "?";
  if (status !== "published" && status !== "unpublished" && status !== "draft") redirect(back);
  try {
    getRepository().setStatus(id, status);
  } catch (e) {
    redirect(`${back}${sep}error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(`${back}${sep}done=${status}`);
}

export type ImportState = { report?: ImportReport; error?: string };

export async function importCatalog(_prev: ImportState, fd: FormData): Promise<ImportState> {
  await requireAdmin();
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a YAML or JSON file." };
  if (file.size > 2_000_000) return { error: "File is larger than 2 MB." };
  let entries: unknown[];
  try {
    entries = parseCatalogText(await file.text());
  } catch (e) {
    return { error: `Could not read the file: ${(e as Error).message}` };
  }
  const report = importEntries(getRepository(), entries, { dryRun: fd.get("dryRun") === "on" });
  return { report };
}
