"use client";

import { useSyncExternalStore } from "react";
import { type SessionUser, useAuthStore } from "@/lib/auth-store";

interface Sesion {
  /** false durante el render del servidor y la hidratacion. */
  hidratada: boolean;
  token: string | null;
  user: SessionUser | null;
}

/** Nunca emite: solo nos interesan los dos snapshots. */
const sinSuscripcion = () => () => {};

/**
 * El store persiste en localStorage, que no existe en SSR: el HTML del servidor
 * siempre sale sin sesion. Si leyeramos el store directamente, el primer render
 * del cliente ya traeria el token y React avisaria de un hydration mismatch.
 *
 * useSyncExternalStore resuelve justo esto: React usa el snapshot de servidor
 * (`false`) durante SSR y la hidratacion, y cambia al del cliente (`true`) al
 * terminar. Evita el patron de setState dentro de useEffect, que provoca
 * renders en cascada.
 */
function useHidratada(): boolean {
  return useSyncExternalStore(
    sinSuscripcion,
    () => true,
    () => false,
  );
}

export function useSession(): Sesion {
  const hidratada = useHidratada();
  const token = useAuthStore((estado) => estado.token);
  const user = useAuthStore((estado) => estado.user);

  return {
    hidratada,
    token: hidratada ? token : null,
    user: hidratada ? user : null,
  };
}
