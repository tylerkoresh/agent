import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

function trackConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("homepage shows positioning, search, categories and skills", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Agent Skills for founders");
  await expect(page.getByRole("search").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^Marketing/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Featured Skills" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Competitor Research (sample)" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("search returns real matches and an empty state", async ({ page }) => {
  await page.goto("/");
  await page.locator("#home-q").fill("competit");
  await page.locator("#home-q").press("Enter");
  await expect(page).toHaveURL(/\/skills\?q=competit/);
  await expect(page.getByRole("link", { name: "Competitor Research (sample)" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("1 Skill");

  await page.goto("/skills?q=zzzzqq");
  await expect(page.getByText("No Skills match")).toBeVisible();

  await page.goto("/skills?q=%22%3B+DROP+TABLE+skills%3B+--");
  await expect(page.getByText("No Skills match")).toBeVisible();
});

test("search matches tags and category names, filters work", async ({ page }) => {
  await page.goto("/skills?q=outbound"); // tag of a draft sample: must not leak
  await expect(page.getByText("No Skills match")).toBeVisible();
  await page.goto("/skills?q=copywriting");
  await expect(page.getByRole("link", { name: "Landing Page Copy (sample)" })).toBeVisible();
  await page.goto("/skills?verification=verified");
  await expect(page.getByRole("status")).toContainText("2 Skills");
  await page.goto("/skills?agent=gemini-cli&category=seo");
  await expect(page.getByRole("link", { name: "SEO Audit (sample)" })).toBeVisible();
});

test("category pages list published Skills only and show empty states", async ({ page }) => {
  await page.goto("/category/marketing");
  await expect(page.getByRole("link", { name: "Landing Page Copy (sample)" })).toBeVisible();
  await expect(page.getByText("Launch Email")).toHaveCount(0); // unpublished
  await page.goto("/category/operations");
  await expect(page.getByText("No Operations Skills yet")).toBeVisible();
  await page.goto("/");
  await page.locator("a[href=\"/category/seo\"]").click();
  await expect(page).toHaveURL(/\/category\/seo/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SEO");
});

test("skill page communicates creator, source, license, agents, verification and install", async ({ page }) => {
  const errors = trackConsole(page);
  await page.goto("/skills/sample-competitor-research");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Competitor Research");
  await expect(page.getByText("Verified").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Works with" })).toBeVisible();
  await expect(page.getByText("Tested by us")).toBeVisible();
  await expect(page.getByText("Declared by source")).toBeVisible();
  await expect(page.getByText("Created by")).toBeVisible();
  await expect(page.getByText("NOASSERTION")).toBeVisible();
  await expect(page.getByText(/does not host its files|do not host its files/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Get the Skill from its source" })).toHaveAttribute("href", /example\.com/);
  await expect(page.getByText(/install\.md/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("install.md is real Markdown for agents", async ({ request }) => {
  const res = await request.get("/skills/sample-competitor-research/install.md");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/markdown");
  const body = await res.text();
  expect(body.startsWith("# Install: Competitor Research")).toBe(true);
  expect(body).toContain("## Compatibility");
  expect(body).toContain("link-only");
  expect(body).not.toMatch(/<(html|div|script)/i);
});

test("invalid and unpublished routes return 404", async ({ request, page }) => {
  for (const url of ["/skills/nope", "/skills/sample-sales-outreach", "/skills/sample-launch-email", "/category/nope", "/skills/sample-sales-outreach/install.md", "/nothing-here"]) {
    expect((await request.get(url)).status(), url).toBe(404);
  }
  await page.goto("/skills/nope");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.goto("/skills?page=999&category=bogus&agent=bogus&verification=bogus");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // bad params degrade gracefully
});

test("no horizontal scroll on mobile", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const page = await ctx.newPage();
  for (const url of ["/", "/skills", "/skills/sample-competitor-research", "/category/seo"]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - 375);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});

test("no serious accessibility violations on key pages", async ({ page }) => {
  for (const url of ["/", "/skills", "/skills?q=zzzz", "/category/seo", "/skills/sample-competitor-research", "/admin/login"]) {
    await page.goto(url);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(bad.map((v) => `${v.id}: ${v.nodes[0]?.html}`), url).toEqual([]);
  }
});

test("internal links resolve", async ({ page, request }) => {
  const seen = new Set<string>();
  for (const start of ["/", "/skills", "/skills/sample-competitor-research"]) {
    await page.goto(start);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    hrefs.filter((h) => h.startsWith("/") && !h.startsWith("//")).forEach((h) => seen.add(h.split("#")[0] || "/"));
  }
  expect(seen.size).toBeGreaterThan(10);
  for (const h of seen) expect((await request.get(h)).status(), h).toBeLessThan(400);
});
