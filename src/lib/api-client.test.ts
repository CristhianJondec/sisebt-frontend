import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { attachAuthToken, handleUnauthorized } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { redirectToLogin } from "@/lib/navigation";

// Mockeamos el modulo de navegacion en vez de tocar window.location, que en
// jsdom no es reasignable.
vi.mock("@/lib/navigation", () => ({
  LOGIN_PATH: "/login",
  redirectToLogin: vi.fn(),
}));

const USUARIO = {
  id: 'ec1f0d3c-0000-4000-8000-000000000001',
  email: 'egresado@sisebt.edu.mx',
  role: 'GRADUATE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as const;

function autenticar(accessToken: string): void {
  useAuthStore.getState().setSession({ accessToken, user: { ...USUARIO } });
}

function configVacia(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

function errorConEstado(status: number, url = "/health"): AxiosError {
  const error = new AxiosError("fallo", String(status));
  error.config = { ...configVacia(), url };
  error.response = {
    status,
    statusText: "",
    data: null,
    headers: {},
    config: configVacia(),
  };
  return error;
}

beforeEach(() => {
  vi.mocked(redirectToLogin).mockClear();
  useAuthStore.setState({ token: null, user: null });
});

describe("attachAuthToken", () => {
  it("adjunta el header Authorization cuando hay token", () => {
    autenticar("token-de-prueba");

    const config = attachAuthToken(configVacia());

    expect(config.headers.get("Authorization")).toBe("Bearer token-de-prueba");
  });

  it("no adjunta el header cuando no hay token", () => {
    const config = attachAuthToken(configVacia());

    expect(config.headers.get("Authorization")).toBeUndefined();
  });

  it("elimina un header heredado tras cerrar sesion", () => {
    const config = configVacia();
    config.headers.set("Authorization", "Bearer token-viejo");

    expect(attachAuthToken(config).headers.get("Authorization")).toBeUndefined();
  });
});

describe("handleUnauthorized", () => {
  it("ante un 401 limpia la sesion y redirige al login", async () => {
    autenticar("token-de-prueba");
    const error = errorConEstado(401);

    await expect(handleUnauthorized(error)).rejects.toBe(error);

    expect(useAuthStore.getState().token).toBeNull();
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("no redirige cuando el 401 viene de un intento de login", async () => {
    // Credenciales incorrectas son un error del formulario, no una sesion
    // caducada: redirigir recargaria /login y borraria lo que el usuario escribio.
    const error = errorConEstado(401, "/auth/login");

    await expect(handleUnauthorized(error)).rejects.toBe(error);

    expect(redirectToLogin).not.toHaveBeenCalled();
  });

  it("no toca la sesion ante otros errores", async () => {
    autenticar("token-de-prueba");
    const error = errorConEstado(500);

    await expect(handleUnauthorized(error)).rejects.toBe(error);

    expect(useAuthStore.getState().token).toBe("token-de-prueba");
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});
