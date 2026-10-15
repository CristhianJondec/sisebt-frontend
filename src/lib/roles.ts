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
