"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { type Role, tieneRol } from "@/lib/roles";
import { useSession } from "@/lib/use-session";

interface RequireRoleProps {
  roles: readonly Role[];
  children: ReactNode;
}

/**
 * Guard de página: sin sesión manda al login; con otro rol muestra un aviso.
 * Es solo UX: la autorización real la aplica el backend (401/403).
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const router = useRouter();
  const { hidratada, token, user } = useSession();

  useEffect(() => {
    if (hidratada && !token) router.replace("/login");
  }, [hidratada, token, router]);

  if (!hidratada || !token) return null;

  if (!tieneRol(user, roles)) {
    return (
      <p className="text-sm text-destructive" role="alert">
        No tienes permiso para ver esta página.
      </p>
    );
  }

  return children;
}
