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

  window.location.assign(LOGIN_PATH);
}
