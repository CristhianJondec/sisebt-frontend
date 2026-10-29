import { expect, test } from "@playwright/test";
import { CUENTAS, iniciarSesion, toast } from "./helpers";

test("sin sesión, la home redirige al formulario de login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
});

test("con credenciales inválidas avisa y se queda en el login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(CUENTAS.admin);
  await page.getByLabel("Contraseña", { exact: true }).fill("contrasena-equivocada");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(toast(page, "Credenciales inválidas")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("el admin entra al dashboard y ve el estado del backend", async ({ page }) => {
  await iniciarSesion(page, CUENTAS.admin);

  await expect(page.getByTestId("backend-status")).toHaveText("API en línea");
});
