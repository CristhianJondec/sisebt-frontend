import { defineConfig, devices } from "@playwright/test";

/**
 * Stack e2e AISLADO de la demo: API y web propias sobre sisebt_e2e_db, que se
 * vacia y vuelve a sembrar en cada corrida. Asi los tests pueden postular,
 * aprobar empresas, etc. sin tocar sisebt_db ni los numeros de la presentacion.
 *
 * El 3000 lo usa otro proyecto y la demo corre en 3001/4000: aqui 3100/4100.
 * Si PostgreSQL publica otro puerto (ver iniciar-demo.ps1), usar E2E_DATABASE_URL.
 */
const WEB_PORT = 3100;
const API_PORT = 4100;
const WEB_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}/api/v1`;
const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5433/sisebt_e2e_db?schema=public";

export default defineConfig({
  testDir: "./e2e",
  // Los specs comparten una base sembrada y la modifican: corren en serie.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // `open: "never"` evita que el reporte deje un servidor colgado en CI.
  reporter: [["html", { open: "never" }], ["list"]],
  // La primera visita a cada ruta compila en `next dev`.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // migrate deploy crea la base si no existe; reset-db.sql la vacia y la
      // semilla deja las cuentas demo. db:seed compila, asi que dist/main existe.
      command:
        "pnpm prisma migrate deploy && pnpm prisma db execute --stdin < ../sisebt-frontend/e2e/reset-db.sql && pnpm db:seed && pnpm start:prod",
      cwd: "../sisebt-backend",
      url: `${API_URL}/health`,
      env: {
        DATABASE_URL,
        PORT: String(API_PORT),
        NODE_ENV: "development",
        JWT_SECRET: "sisebt-e2e-secret",
        CORS_ORIGINS: WEB_URL,
      },
      reuseExistingServer: false,
      timeout: 240_000,
    },
    {
      // NEXT_DIST_DIR: Next 16 bloquea un segundo `next dev` sobre el mismo
      // directorio de salida, y la demo puede estar corriendo en paralelo.
      command: `pnpm exec next dev -p ${WEB_PORT}`,
      url: `${WEB_URL}/login`,
      env: { NEXT_PUBLIC_API_URL: API_URL, NEXT_DIST_DIR: ".next/e2e" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
