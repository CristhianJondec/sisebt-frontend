import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { API_BASE, healthDown } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

const badge = () => screen.getByTestId("backend-status");

describe("Home", () => {
  it("muestra el estado de carga antes de que responda la API", () => {
    renderWithProviders(<Home />);

    expect(badge()).toHaveTextContent("Backend Status: Comprobando...");
    expect(screen.getByRole("status")).toHaveTextContent("Contactando con la API");
  });

  it("muestra Online cuando /health responde 200", async () => {
    renderWithProviders(<Home />);

    await waitFor(() => expect(badge()).toHaveTextContent("Backend Status: Online"));

    // El detalle del indicador llega desde la respuesta mockeada.
    expect(screen.getByRole("cell", { name: "database" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "up" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra Offline cuando /health responde 503", async () => {
    server.use(
      http.get(`${API_BASE}/health`, () => HttpResponse.json(healthDown, { status: 503 })),
    );

    renderWithProviders(<Home />);

    await waitFor(() => expect(badge()).toHaveTextContent("Backend Status: Offline"));
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo obtener el estado");
  });

  it("muestra Offline ante un error de red", async () => {
    server.use(http.get(`${API_BASE}/health`, () => HttpResponse.error()));

    renderWithProviders(<Home />);

    await waitFor(() => expect(badge()).toHaveTextContent("Backend Status: Offline"));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
