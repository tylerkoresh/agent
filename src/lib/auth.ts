import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "asff_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export function adminConfigured(): boolean {
  return !!(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD &&
    process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.length >= 32
  );
}

const sha = (s: string) => createHash("sha256").update(s).digest();
const sign = (payload: string) =>
  createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(payload).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha(a), sha(b));
}

export function checkCredentials(username: string, password: string): boolean {
  if (!adminConfigured()) return false;
  // Evaluate both so timing does not reveal which was wrong.
  const u = safeEqual(username, process.env.ADMIN_USERNAME!);
  const p = safeEqual(password, process.env.ADMIN_PASSWORD!);
  return u && p;
}

export function makeToken(now = Date.now()): string {
  const payload = `v1.${Math.floor(now / 1000) + MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminConfigured()) return false;
  const i = token.lastIndexOf(".");
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const mac = token.slice(i + 1);
  if (!safeEqual(mac, sign(payload))) return false;
  const exp = Number(payload.split(".")[1]);
  return Number.isFinite(exp) && exp * 1000 > now;
}

export async function startSession() {
  (await cookies()).set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return verifyToken((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// Minimal in-memory throttle for login attempts (single-process, single operator).
const attempts = new Map<string, { n: number; reset: number }>();
export async function loginThrottled(): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) return false;
  return rec.n >= 5;
}
export async function recordFailedLogin() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) attempts.set(ip, { n: 1, reset: now + 15 * 60 * 1000 });
  else rec.n++;
}
export function clearFailedLogins() {
  attempts.clear();
}
