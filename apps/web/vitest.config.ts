import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.ts", "src/test/**/*.test.tsx"],
    globals: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
