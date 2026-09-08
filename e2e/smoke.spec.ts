import { expect, test } from "@playwright/test";

test("la home renderiza el badge de estado del backend", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SISEBT" })).toBeVisible();

  // El smoke test no exige que la API este arriba: valida que el badge se
  // renderiza y resuelve a uno de sus tres estados.
  const badge = page.getByTestId("backend-status");
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText(/^Backend Status: (Online|Offline|Comprobando\.\.\.)$/);
});
