import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node environment for backend API tests
    environment: "node",
    // Show verbose output for each test
    reporter: "verbose",
    // Global test timeout (60s to allow in-memory MongoDB startup on first run)
    testTimeout: 60000,
    hookTimeout: 60000,
    // Sequential to avoid database state conflicts between test files
    singleThread: true,
    singleFork: true,
    // Global setup/teardown for shared MongoDB instance
    globalSetup: "./src/tests/globalSetup.js",
  },
});
