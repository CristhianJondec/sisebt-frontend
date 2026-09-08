import { http, HttpResponse } from "msw";
import type { HealthResponse } from "@/lib/health";

/** Debe coincidir con `test.env.NEXT_PUBLIC_API_URL` de vitest.config.ts. */
export const API_BASE = "http://localhost:4000/api/v1";

export const healthUp: HealthResponse = {
  status: "ok",
  info: { database: { status: "up" } },
  error: {},
  details: { database: { status: "up" } },
};

export const healthDown: HealthResponse = {
  status: "error",
  info: {},
  error: { database: { status: "down", message: "connection refused" } },
  details: { database: { status: "down", message: "connection refused" } },
};

export const handlers = [
  http.get(`${API_BASE}/health`, () => HttpResponse.json(healthUp)),
];
