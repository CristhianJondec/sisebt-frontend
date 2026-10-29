import { type Page, expect } from "@playwright/test";

/** Cuentas que crea `pnpm db:seed` en la base e2e (ver sisebt-backend/src/database/seed.ts). */
export const CUENTAS = {
  admin: "demo.admin@unitru.edu.pe",
  egresado: "demo.egresado@unitru.edu.pe",
  empresa: "empresa@andinasoft.pe",
  empresaPendiente: "contacto@elsol.com.pe",
} as const;

export const PASSWORD_DEMO = "Sisebt2026!";

/** Nombre del egresado demo tal como lo muestran las tablas. */
export const EGRESADO_DEMO = "Lucía Rodríguez Paredes";

/** Inicia sesión por el formulario y espera a salir de /login. */
export async function iniciarSesion(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD_DEMO);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

export async function cerrarSesion(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Toast de sonner con el texto indicado. */
export function toast(page: Page, texto: string | RegExp) {
  return page.locator("[data-sonner-toast]").filter({ hasText: texto });
}
