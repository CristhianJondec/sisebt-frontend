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

function configVacia(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

function errorConEstado(status: number): AxiosError {
  const error = new AxiosError("fallo", String(status));
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
  useAuthStore.setState({ token: null });
});

describe("attachAuthToken", () => {
  it("adjunta el header Authorization cuando hay token", () => {
    useAuthStore.getState().setToken("token-de-prueba");

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
    useAuthStore.getState().setToken("token-de-prueba");
    const error = errorConEstado(401);

    await expect(handleUnauthorized(error)).rejects.toBe(error);

    expect(useAuthStore.getState().token).toBeNull();
    expect(redirectToLogin).toHaveBeenCalledTimes(1);
  });

  it("no toca la sesion ante otros errores", async () => {
    useAuthStore.getState().setToken("token-de-prueba");
    const error = errorConEstado(500);

    await expect(handleUnauthorized(error)).rejects.toBe(error);

    expect(useAuthStore.getState().token).toBe("token-de-prueba");
    expect(redirectToLogin).not.toHaveBeenCalled();
  });
});
