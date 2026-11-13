import { http, HttpResponse } from "msw";
import type { Session, SessionUser } from "@/lib/auth-store";
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

export const USUARIO: SessionUser = {
  id: "ec1f0d3c-0000-4000-8000-000000000001",
  email: "egresado@sisebt.edu.mx",
  role: "GRADUATE",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/** JWT sintetico: el frontend solo lo almacena y lo reenvia, no lo verifica. */
export const SESION: Session = {
  accessToken: "cabecera.carga.firma",
  user: USUARIO,
};

export const handlers = [
  http.get(`${API_BASE}/health`, () => HttpResponse.json(healthUp)),
  http.post(`${API_BASE}/auth/login`, () => HttpResponse.json(SESION)),
  http.get(`${API_BASE}/users`, () => HttpResponse.json([USUARIO])),
];
