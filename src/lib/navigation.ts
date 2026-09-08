export const LOGIN_PATH = "/login";

/**
 * Vive en su propio modulo para que el interceptor de axios sea testeable:
 * los tests mockean este modulo en vez de manipular `window.location`, que en
 * jsdom no es reasignable.
 *
 * NOTA: la ruta /login todavia no existe en este scaffold; se creara junto con
 * el modulo de autenticacion.
 */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;

  // Navegacion dura a proposito. El interceptor corre fuera del arbol de React,
  // donde no hay `useRouter()`, y ante una sesion invalidada queremos tirar
  // toda la memoria del cliente (cache de TanStack Query incluida) en vez de
  // hacer una transicion suave que la conservaria.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(LOGIN_PATH);
}
