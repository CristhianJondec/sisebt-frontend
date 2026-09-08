import { create } from "zustand";
import { type StateStorage, createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
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
      setToken: (token) => set({ token }),
      clearSession: () => set({ token: null }),
    }),
    {
      name: "sisebt-auth",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? almacenamientoSSR : window.localStorage,
      ),
    },
  ),
);
