import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { SystemStatus } from "@/components/dashboard/system-status";
import { API_BASE, healthDown } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

const badge = () => screen.getByTestId("backend-status");

describe("SystemStatus", () => {
  it("muestra el estado de carga antes de que responda la API", () => {
    renderWithProviders(<SystemStatus />);
    expect(badge()).toHaveTextContent("Comprobando...");
  });

  it("muestra en línea cuando /health responde 200", async () => {
    renderWithProviders(<SystemStatus />);
    await waitFor(() => expect(badge()).toHaveTextContent("API en línea"));
  });

  it("muestra sin conexión cuando /health responde 503", async () => {
    server.use(
      http.get(`${API_BASE}/health`, () => HttpResponse.json(healthDown, { status: 503 })),
    );
    renderWithProviders(<SystemStatus />);
    await waitFor(() => expect(badge()).toHaveTextContent("API sin conexión"));
  });

  it("muestra sin conexión ante un error de red", async () => {
    server.use(http.get(`${API_BASE}/health`, () => HttpResponse.error()));
    renderWithProviders(<SystemStatus />);
    await waitFor(() => expect(badge()).toHaveTextContent("API sin conexión"));
    expect(screen.getByRole("button")).toHaveAttribute("title", expect.stringContaining("No se pudo obtener el estado"));
  });
});
