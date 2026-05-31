import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    env: loadEnv("", process.cwd(), ""),
  },
});
