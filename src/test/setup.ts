import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { useAuthStore } from "@/lib/auth-store";
import { server } from "./msw/server";

// `onUnhandledRequest: "error"` evita que un test pase por accidente pegandole
// a un backend real.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  server.resetHandlers();
  cleanup();

  // El store persiste en localStorage: sin esto, la sesion de un test se
  // filtraria al siguiente.
  useAuthStore.setState({ token: null, user: null });
  window.localStorage.clear();
});

afterAll(() => server.close());
