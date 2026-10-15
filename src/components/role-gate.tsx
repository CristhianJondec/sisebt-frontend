"use client";

import type { ReactNode } from "react";
import { type Role, tieneRol } from "@/lib/roles";
import { useSession } from "@/lib/use-session";

interface RoleGateProps {
  roles: readonly Role[];
  children: ReactNode;
  /** Lo que se muestra si el rol no corresponde. Por defecto, nada. */
  fallback?: ReactNode;
}

/** Renderiza `children` solo si la sesion actual tiene alguno de los roles. */
export function RoleGate({ roles, children, fallback = null }: RoleGateProps) {
  const { user } = useSession();

  return tieneRol(user, roles) ? children : fallback;
}
