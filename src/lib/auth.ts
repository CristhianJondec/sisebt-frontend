import { apiClient } from "@/lib/api-client";
import type { Session, SessionUser } from "@/lib/auth-store";

export interface Credenciales {
  email: string;
  password: string;
}

export const USERS_QUERY_KEY = ["users"] as const;

export async function login(credenciales: Credenciales): Promise<Session> {
  const { data } = await apiClient.post<Session>("/auth/login", credenciales);
  return data;
}

/** Ruta protegida: el interceptor adjunta el bearer token automaticamente. */
export async function fetchUsers(): Promise<SessionUser[]> {
  const { data } = await apiClient.get<SessionUser[]>("/users");
  return data;
}
