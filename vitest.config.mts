import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Never load application dotenv files into this database-free test runner.
  envDir: false,
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    maxWorkers: 1,
    pool: "threads",
    fileParallelism: false,
    env: {
      DATABASE_URL: "postgresql://synthetic:synthetic@127.0.0.1:1/no_database",
      JWT_SECRET: "synthetic-test-secret-only",
    },
  },
});
