import { create } from "zustand";
import { type StateStorage, createJSONStorage, persist } from "zustand/middleware";

export interface SessionUser {
  id: string;
  email: string;
  role: "ADMIN" | "GRADUATE" | "COMPANY";
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  setSession: (session: Session) => void;
  clearSession: () => void;
}

/** En SSR no hay localStorage; devolvemos un almacen vacio en vez de reventar. */
const almacenamientoSSR: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: ({ accessToken, user }) => set({ token: accessToken, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: "sisebt-auth",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? almacenamientoSSR : window.localStorage,
      ),
    },
  ),
);
