import { defineConfig } from "playwright/test";

const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  forbidOnly: !!process.env.CI,
  timeout: 90_000,
  use: { baseURL, viewport: { width: 390, height: 844 } },
  webServer: {
    command: "pnpm exec next start --hostname localhost --port 3000",
    url: `${baseURL}/entrar`,
    reuseExistingServer: false,
  },
});
