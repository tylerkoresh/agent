import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.ADMIN_USERNAME = "operator";
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
});

describe("admin auth", () => {
  it("accepts only the configured credentials", async () => {
    const { checkCredentials } = await import("@/lib/auth");
    expect(checkCredentials("operator", "correct horse battery staple")).toBe(true);
    expect(checkCredentials("operator", "wrong")).toBe(false);
    expect(checkCredentials("admin", "correct horse battery staple")).toBe(false);
    expect(checkCredentials("", "")).toBe(false);
  });
  it("signs, verifies, expires and rejects tampered session tokens", async () => {
    const { makeToken, verifyToken } = await import("@/lib/auth");
    const now = Date.now();
    const t = makeToken(now);
    expect(verifyToken(t, now)).toBe(true);
    expect(verifyToken(t, now + 9 * 3600 * 1000)).toBe(false); // expired after 8h
    const [v, exp, mac] = t.split(".");
    expect(verifyToken(`${v}.${Number(exp) + 99999}.${mac}`, now)).toBe(false);
    expect(verifyToken(`${v}.${exp}.${mac.slice(0, -2)}AA`, now)).toBe(false);
    expect(verifyToken(undefined, now)).toBe(false);
    expect(verifyToken("garbage", now)).toBe(false);
  });
  it("is disabled when the secret is too short or missing", async () => {
    const { adminConfigured, checkCredentials } = await import("@/lib/auth");
    const saved = process.env.ADMIN_SESSION_SECRET;
    process.env.ADMIN_SESSION_SECRET = "short";
    expect(adminConfigured()).toBe(false);
    expect(checkCredentials("operator", "correct horse battery staple")).toBe(false);
    process.env.ADMIN_SESSION_SECRET = saved;
  });
});
