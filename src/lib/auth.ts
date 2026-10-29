import { apiClient } from "@/lib/api-client";
import type { Session, SessionUser } from "@/lib/auth-store";

export interface Credenciales {
  email: string;
  password: string;
}

export interface NuevaPassword {
  token: string;
  password: string;
}

export interface NuevaCuenta extends Credenciales {
  role: "GRADUATE" | "COMPANY";
}

/** Cuenta tal como la lista Admin > Usuarios. */
export interface UserAccount extends SessionUser {
  active: boolean;
}

export interface CambiosUsuario {
  role?: SessionUser["role"];
  active?: boolean;
}

export const USERS_QUERY_KEY = ["users"] as const;

export async function login(credenciales: Credenciales): Promise<Session> {
  const { data } = await apiClient.post<Session>("/auth/login", credenciales);
  return data;
}

/** Registro publico (POST /users): solo egresados y empresas. */
export async function register(cuenta: NuevaCuenta): Promise<SessionUser> {
  const { data } = await apiClient.post<SessionUser>("/users", cuenta);
  return data;
}

/**
 * El backend responde 202 con el mismo mensaje exista o no la cuenta, asi que
 * aqui no hay nada que distinguir: solo errores de red o de validacion.
 */
export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

/** 204 si el token es valido; 400 si es invalido, ya se uso o expiro. */
export async function resetPassword(datos: NuevaPassword): Promise<void> {
  await apiClient.post("/auth/reset-password", datos);
}

/** Ruta protegida: el interceptor adjunta el bearer token automaticamente. */
export async function fetchUsers(): Promise<UserAccount[]> {
  const { data } = await apiClient.get<UserAccount[]>("/users");
  return data;
}

/**
 * Cambio de rol o (des)activacion. El backend responde 403 si el admin intenta
 * modificarse a si mismo; la UI ya bloquea esa fila, pero la regla vive alla.
 */
export async function updateUser(id: string, cambios: CambiosUsuario): Promise<UserAccount> {
  const { data } = await apiClient.patch<UserAccount>(`/users/${id}`, cambios);
  return data;
}
