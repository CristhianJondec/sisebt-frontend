import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mismo alias que tsconfig.json ("@/*" -> "./src/*").
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Los specs de Playwright viven en e2e/ y los corre `pnpm test:e2e`.
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
    // Fijado aqui para que los tests no dependan de .env.local.
    env: { NEXT_PUBLIC_API_URL: "http://localhost:4000/api/v1" },
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/ui/**", // componentes generados por shadcn/ui
        "src/test/**",
        "src/app/layout.tsx",
        "src/**/*.{test,spec}.{ts,tsx}",
      ],
      thresholds: { lines: 60 },
    },
  },
});
