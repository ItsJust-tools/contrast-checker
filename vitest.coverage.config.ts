import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    name: "contrast-checker",
    environment: "jsdom",
    include: ["__tests__/unit/**/*.spec.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js"],
      exclude: ["src/app/**/*", "__tests__/**/*", "node_modules/**/*"],
      thresholds: {
        lines: 10,
        functions: 5,
        branches: 5,
        statements: 10,
      },
    },
  },
});
