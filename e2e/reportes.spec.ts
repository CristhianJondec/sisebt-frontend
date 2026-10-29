import { expect, test } from "@playwright/test";
import { CUENTAS, iniciarSesion, toast } from "./helpers";

test.describe("reportes", () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, CUENTAS.admin);
    await page.goto("/admin/reportes");
    await expect(page.getByRole("heading", { name: "Reportes" })).toBeVisible();
  });

  test("muestra los indicadores y el resumen de la bolsa de trabajo", async ({ page }) => {
    for (const kpi of ["Egresados", "Empleabilidad", "Inserción promedio", "Satisfacción"]) {
      await expect(page.getByText(kpi, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText("Tasa de empleabilidad")).toBeVisible();
    await expect(page.getByText(/\d+ ofertas vigentes de \d+ publicadas/)).toBeVisible();
  });

  test("los filtros recalculan los indicadores", async ({ page }) => {
    await page.getByLabel("Egreso desde").fill("2090-01-01");

    await expect(page.getByText("Sin datos para estos filtros")).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel" })).toBeDisabled();

    await page.getByLabel("Egreso desde").fill("");
    await expect(page.getByText("Tasa de empleabilidad")).toBeVisible();
  });

  test("exporta el detalle de egresados a Excel", async ({ page }) => {
    const descarga = page.waitForEvent("download");
    await page.getByRole("button", { name: "Excel" }).click();

    expect((await descarga).suggestedFilename()).toMatch(/^egresados-sisebt-\d{4}-\d{2}-\d{2}\.xlsx$/);
    await expect(toast(page, "Excel descargado")).toBeVisible();
  });

  test("abre el resumen ejecutivo imprimible (PDF)", async ({ page }) => {
    await page.getByRole("link", { name: "PDF" }).click();

    await expect(page).toHaveURL(/\/resumen-ejecutivo/);
    await expect(page.getByRole("heading", { name: "Seguimiento de egresados y empleabilidad" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Indicadores clave" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Imprimir / Guardar PDF" })).toBeVisible();
  });
});

test("un egresado no accede a los reportes", async ({ page }) => {
  await iniciarSesion(page, CUENTAS.egresado);
  await page.goto("/admin/reportes");

  await expect(page.getByText("Acceso restringido")).toBeVisible();
});
