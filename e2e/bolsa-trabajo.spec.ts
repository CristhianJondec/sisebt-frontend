import { expect, test } from "@playwright/test";
import { CUENTAS, EGRESADO_DEMO, cerrarSesion, iniciarSesion, toast } from "./helpers";

const OFERTA = "Desarrollador QA Automatizador";

// Cada paso usa lo que dejó el anterior: oferta -> postulación -> cambio de estado.
test.describe.serial("bolsa de trabajo", () => {
  test("la empresa aprobada publica una oferta", async ({ page }) => {
    await iniciarSesion(page, CUENTAS.empresa);
    await page.goto("/empresa/ofertas");

    await page.getByRole("button", { name: "Nueva oferta" }).click();
    await page.getByLabel("Título del puesto *").fill(OFERTA);
    await page.getByLabel("Modalidad").selectOption("REMOTE");
    await page.getByLabel("Descripción del puesto *").fill("Pruebas automatizadas de aplicaciones web.");
    await page.getByRole("button", { name: "Publicar oferta" }).click();

    await expect(toast(page, `Oferta publicada: ${OFERTA}`)).toBeVisible();
    await expect(page.getByRole("cell", { name: OFERTA })).toBeVisible();
  });

  test("el egresado encuentra la oferta, la ve en detalle y postula", async ({ page }) => {
    await iniciarSesion(page, CUENTAS.egresado);
    await page.goto("/ofertas");

    await page.getByLabel("Buscar ofertas").fill("QA");
    await expect(page.getByText("1 oferta encontrada")).toBeVisible();
    const tarjeta = page.locator('[data-slot="card"]').filter({ hasText: OFERTA });

    await tarjeta.getByRole("button", { name: "Ver detalle" }).click();
    const detalle = page.getByRole("dialog");
    await expect(detalle.getByText("Pruebas automatizadas de aplicaciones web.")).toBeVisible();
    await detalle.getByRole("button", { name: "Postular" }).click();

    await expect(toast(page, `Postulaste a ${OFERTA}`)).toBeVisible();
    await expect(tarjeta.getByRole("button", { name: "Postulado" })).toBeDisabled();

    await page.goto("/postulaciones");
    const postulacion = page.locator('[data-slot="card"]').filter({ hasText: OFERTA });
    await expect(postulacion.getByText("Andina Software S.A.C.")).toBeVisible();
    await expect(postulacion.locator('[data-slot="badge"]')).toHaveText("Recibida");
  });

  test("la empresa acepta al postulante y el egresado recibe la notificación", async ({ page }) => {
    await iniciarSesion(page, CUENTAS.empresa);
    await page.goto("/empresa/postulantes");

    await page.getByLabel(`Estado de ${EGRESADO_DEMO}`).selectOption("ACCEPTED");
    await expect(toast(page, `${EGRESADO_DEMO}: Aceptada`)).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, CUENTAS.egresado);
    await page.goto("/notificaciones");
    await expect(page.getByText("Postulacion aceptada")).toBeVisible();

    await page.goto("/postulaciones");
    const postulacion = page.locator('[data-slot="card"]').filter({ hasText: OFERTA });
    await expect(postulacion.locator('[data-slot="badge"]')).toHaveText("Aceptada");
  });

  test("una empresa pendiente no publica hasta que el admin la aprueba", async ({ page }) => {
    await iniciarSesion(page, CUENTAS.empresaPendiente);
    await page.goto("/empresa/ofertas");
    await expect(page.getByText("Tu empresa está pendiente de aprobación")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nueva oferta" })).toBeDisabled();

    await cerrarSesion(page);
    await iniciarSesion(page, CUENTAS.admin);
    await page.goto("/admin/empresas");
    await page.getByLabel("Buscar empresa").fill("El Sol");
    await page.getByRole("row", { name: /Constructora El Sol/ }).getByRole("button", { name: "Aprobar" }).click();
    await expect(toast(page, "Constructora El Sol fue aprobada")).toBeVisible();

    await cerrarSesion(page);
    await iniciarSesion(page, CUENTAS.empresaPendiente);
    await page.goto("/empresa/ofertas");
    await expect(page.getByRole("button", { name: "Nueva oferta" })).toBeEnabled();
    await expect(page.getByText("Tu empresa está pendiente de aprobación")).toBeHidden();
  });

  test("el egresado no puede entrar a pantallas de empresa", async ({ page }) => {
    await iniciarSesion(page, CUENTAS.egresado);
    await page.goto("/empresa/postulantes");

    await expect(page.getByText("Acceso restringido")).toBeVisible();
  });
});
