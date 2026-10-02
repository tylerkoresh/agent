import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("operator");
  await page.getByLabel("Password").fill("e2e-passphrase-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe.configure({ mode: "serial" });

test("admin requires login and rejects bad credentials", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  expect((await request.get("/admin/export")).status()).toBe(401);
  await page.getByLabel("Username").fill("operator");
  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("incorrect");
});

test("operator can add, validate, publish, edit and unpublish a Skill", async ({ page, request }) => {
  await login(page);

  // Invalid: publishing without source/license/agent evidence is blocked and nothing is saved.
  await page.goto("/admin/skills/new");
  await page.getByLabel(/^Name/).fill("Pricing Page");
  await page.getByLabel("Category (exactly one)").selectOption("finance");
  await page.getByLabel(/^Short description/).fill("Draft a pricing page from your plans and costs.");
  await page.getByLabel("Status", { exact: true }).last().selectOption("published");
  await page.getByRole("button", { name: "Create Skill" }).click();
  await expect(page.locator("main").getByRole("alert").first()).toContainText("Nothing was saved");
  await expect(page.getByText("Required before publishing").first()).toBeVisible();
  expect((await request.get("/skills/pricing-page")).status()).toBe(404);
  await expect(page.getByLabel(/^Name/)).toHaveValue("Pricing Page"); // input preserved

  // Fix it and publish.
  await page.getByLabel("Full description").fill("Turns plans and costs into a clear pricing page.\n\nSecond paragraph.");
  await page.getByLabel("Creator", { exact: true }).fill("Jane Example");
  await page.getByLabel("Original source URL").fill("https://example.com/pricing-page");
  await page.getByLabel("License", { exact: true }).fill("MIT");
  await page.getByLabel("Tags").fill("pricing, saas");
  await page.getByLabel("Claude Code", { exact: true }).check();
  await page.getByRole("button", { name: "Create Skill" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  // Public site picks it up without any code change.
  await page.goto("/skills?q=pricing+page");
  await expect(page.getByRole("link", { name: "Pricing Page", exact: true })).toBeVisible();
  await page.goto("/skills/pricing-page");
  await expect(page.getByText("Jane Example")).toBeVisible();
  await expect(page.getByText("Declared by source")).toBeVisible();
  const md = await (await request.get("/skills/pricing-page/install.md")).text();
  expect(md).toContain("License: MIT");

  // Edit: rename; search index updates.
  await page.goto("/admin");
  await page.getByRole("link", { name: "Pricing Page" }).first().click();
  await page.getByLabel(/^Name/).fill("Pricing Page Builder");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.goto("/skills?q=builder");
  await expect(page.getByRole("link", { name: "Pricing Page Builder" })).toBeVisible();

  // Verified requires a tested agent and test date.
  await page.goto("/admin");
  await page.getByRole("link", { name: "Pricing Page Builder" }).first().click();
  await page.getByLabel("Status", { exact: true }).first().selectOption("verified");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Verified Skills need").first()).toBeVisible();

  // Unpublish: gone from public site.
  await page.goto("/admin");
  await page.getByRole("row", { name: /Pricing Page Builder/ }).getByRole("button", { name: "Unpublish" }).click();
  await expect(page.getByRole("status")).toContainText("unpublished");
  expect((await request.get("/skills/pricing-page")).status()).toBe(404);
  await page.goto("/skills?q=builder");
  await expect(page.getByText("No Skills match")).toBeVisible();
});

test("publishing an incomplete draft from the list is refused", async ({ page }) => {
  await login(page);
  await page.goto("/admin/skills/new");
  await page.getByLabel(/^Name/).fill("Half Done");
  await page.getByLabel("Category (exactly one)").selectOption("growth");
  await page.getByLabel(/^Short description/).fill("A draft with no source, license or agents.");
  await page.getByRole("button", { name: "Create Skill" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("row", { name: /Half Done/ }).getByRole("button", { name: "Publish" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Cannot publish yet");
  await expect(page.locator("main").getByRole("alert")).toContainText("source URL");
  await expect(page.locator("main").getByRole("alert")).toContainText("license");
});

test("import validates all-or-nothing, and export round-trips", async ({ page }) => {
  await login(page);
  await page.goto("/admin/import");

  fs.writeFileSync("/tmp/bad.yaml", "- name: Bad one\n  slug: bad-one\n  shortDescription: Short but valid description.\n  category: nope\n");
  await page.getByLabel(/^File/).setInputFiles("/tmp/bad.yaml");
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText("Nothing was imported")).toBeVisible();
  await expect(page.getByText(/unknown category/)).toBeVisible();

  fs.writeFileSync("/tmp/good.yaml", "- name: Imported One\n  slug: imported-one\n  shortDescription: A genuinely imported entry for testing.\n  category: growth\n  status: draft\n");
  await page.getByLabel(/^File/).setInputFiles("/tmp/good.yaml");
  await page.getByRole("button", { name: "Import" }).click(); // dry run is the default
  await expect(page.getByText("Check passed")).toBeVisible();
  await page.getByLabel(/Check only/).uncheck();
  await page.getByLabel(/^File/).setInputFiles("/tmp/good.yaml");
  await page.getByRole("button", { name: "Import" }).click();
  await expect(page.getByText(/Imported\. Created 1/)).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Export YAML" }).click()]);
  const text = fs.readFileSync((await dl.path())!, "utf8");
  expect(text).toContain("slug: imported-one");
  expect(text).toContain("slug: sample-competitor-research");
});
