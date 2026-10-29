import type { SessionUser } from "@/lib/auth-store";

export type Role = SessionUser["role"];

/**
 * Solo decide que se MUESTRA. La autorizacion real la hace el backend (403):
 * ocultar una seccion no protege nada si la API la sirviera igualmente.
 */
export function tieneRol(
  user: Pick<SessionUser, "role"> | null | undefined,
  roles: readonly Role[],
): boolean {
  return user != null && roles.includes(user.role);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  GRADUATE: "Egresado",
  COMPANY: "Empresa",
};

/** Iniciales para avatares: "ana.perez@x" -> "AP", "Ana Pérez" -> "AP". */
export function iniciales(texto: string): string {
  const partes = texto.split("@")[0]!.split(/[\s._-]+/).filter(Boolean);
  return (partes.length > 1 ? partes[0]![0]! + partes[1]![0]! : texto.slice(0, 2)).toUpperCase();
}
