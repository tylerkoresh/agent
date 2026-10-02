import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }],
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NODE_ENV: "production",
      DATABASE_PATH: "./data/e2e.db",
      SHOW_SAMPLES: "true",
      SITE_URL: `http://localhost:${PORT}`,
      ADMIN_USERNAME: "operator",
      ADMIN_PASSWORD: "e2e-passphrase-123",
      ADMIN_SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
    },
  },
});
