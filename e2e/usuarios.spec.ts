import { expect, test } from "@playwright/test";
import { CUENTAS, PASSWORD_DEMO, cerrarSesion, iniciarSesion, toast } from "./helpers";

// Cuentas semilla que no usan los otros specs: se pueden modificar sin efectos cruzados.
const DESACTIVABLE = "talento@agrolibertad.pe";
const PROMOVIBLE = "jobs@nubenorte.io";

test.describe.serial("Admin > Usuarios", () => {
  test.beforeEach(async ({ page }) => {
    // Las acciones piden confirmación con window.confirm.
    page.on("dialog", (dialogo) => void dialogo.accept());
    await iniciarSesion(page, CUENTAS.admin);
    await page.goto("/admin/usuarios");
    await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  });

  test("el admin no puede cambiar su propio rol ni desactivarse", async ({ page }) => {
    const fila = page.getByRole("row", { name: new RegExp(CUENTAS.admin) });

    await expect(fila.getByText("Tú", { exact: true })).toBeVisible();
    await expect(fila.getByLabel(`Rol de ${CUENTAS.admin}`)).toBeDisabled();
    await expect(fila.getByRole("button", { name: /Desactivar/ })).toHaveCount(0);
  });

  test("cambia el rol de otra cuenta", async ({ page }) => {
    await page.getByLabel(`Rol de ${PROMOVIBLE}`).selectOption("ADMIN");

    await expect(toast(page, `${PROMOVIBLE} ahora es Administrador`)).toBeVisible();
    await expect(page.getByLabel(`Rol de ${PROMOVIBLE}`)).toHaveValue("ADMIN");
  });

  test("desactiva una cuenta, que ya no puede entrar, y la reactiva", async ({ page }) => {
    const fila = page.getByRole("row", { name: new RegExp(DESACTIVABLE) });
    await fila.getByRole("button", { name: `Desactivar ${DESACTIVABLE}` }).click();
    await expect(toast(page, `${DESACTIVABLE} fue desactivada`)).toBeVisible();
    await expect(fila.getByText("Desactivada")).toBeVisible();

    await cerrarSesion(page);
    await page.getByLabel("Correo electrónico").fill(DESACTIVABLE);
    await page.getByLabel("Contraseña", { exact: true }).fill(PASSWORD_DEMO);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(toast(page, "Tu cuenta está desactivada")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await iniciarSesion(page, CUENTAS.admin);
    await page.goto("/admin/usuarios");
    await fila.getByRole("button", { name: `Reactivar ${DESACTIVABLE}` }).click();
    await expect(toast(page, `${DESACTIVABLE} fue reactivada`)).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, DESACTIVABLE);
  });
});
