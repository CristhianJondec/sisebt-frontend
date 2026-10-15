/**
 * Espejo de sisebt-backend/src/users/password.rules.ts. El backend es quien
 * decide; validar aqui solo evita un viaje a la API para errores obvios.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Devuelve el mensaje de error o null si la contrasena es aceptable. */
export function validarPassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contrasena debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `La contrasena no puede superar ${PASSWORD_MAX_LENGTH} caracteres`;
  }
  return null;
}
