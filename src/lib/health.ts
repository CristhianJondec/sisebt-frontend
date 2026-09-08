import { apiClient } from "@/lib/api-client";

export interface HealthIndicator {
  status: "up" | "down";
  message?: string;
}

/** Forma de la respuesta de @nestjs/terminus en GET /health. */
export interface HealthResponse {
  status: "ok" | "error" | "shutting_down";
  info?: Record<string, HealthIndicator>;
  error?: Record<string, HealthIndicator>;
  details?: Record<string, HealthIndicator>;
}

export const HEALTH_QUERY_KEY = ["health"] as const;

export async function fetchHealth(): Promise<HealthResponse> {
  // El backend responde 503 si la base no contesta; axios lo convierte en un
  // rechazo, que TanStack Query expone como estado de error.
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}
