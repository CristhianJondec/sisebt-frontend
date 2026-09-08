import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/lib/auth-store";
import { redirectToLogin } from "@/lib/navigation";

/**
 * Se resuelve en TIEMPO DE BUILD por el prefijo NEXT_PUBLIC_: la imagen Docker
 * debe construirse con el valor definitivo (ver ARG/ENV en el Dockerfile).
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** Interceptor de request: adjunta el bearer token si hay sesion. */
export function attachAuthToken(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    // Importante al cerrar sesion: la instancia de axios se reutiliza y podria
    // arrastrar un header de una peticion anterior.
    config.headers.delete("Authorization");
  }

  return config;
}

/**
 * Rutas cuyo 401 es una respuesta esperada del negocio, no una sesion expirada.
 * Un login con credenciales incorrectas devuelve 401: si lo tratasemos como
 * sesion caducada, recargariamos /login y el usuario perderia el formulario.
 */
const RUTAS_EXENTAS_DE_REDIRECCION = ['/auth/login'];

/** Interceptor de response: ante un 401 limpia la sesion y manda al login. */
export function handleUnauthorized(error: AxiosError): Promise<never> {
  const url = error.config?.url ?? '';
  const esIntentoDeLogin = RUTAS_EXENTAS_DE_REDIRECCION.some((ruta) => url.includes(ruta));

  if (error.response?.status === 401 && !esIntentoDeLogin) {
    useAuthStore.getState().clearSession();
    redirectToLogin();
  }

  return Promise.reject(error);
}

export function createApiClient(baseURL: string = API_URL): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { "Content-Type": "application/json" },
  });

  client.interceptors.request.use(attachAuthToken);
  client.interceptors.response.use((response) => response, handleUnauthorized);

  return client;
}

export const apiClient = createApiClient();
