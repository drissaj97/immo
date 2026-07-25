import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    testTimeout: 15000,
    env: {
      AI_PROVIDER: "mock",
      EMBEDDING_PROVIDER: "mock",
      OPENAI_API_KEY: "",
      SEMSARAI_LIVE_SYNC: "false",
      VITEST: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
