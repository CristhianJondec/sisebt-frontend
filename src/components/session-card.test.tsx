import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { SessionCard } from "@/components/session-card";
import { type SessionUser, useAuthStore } from "@/lib/auth-store";
import { API_BASE, SESION, USUARIO } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

function iniciarSesionComo(role: SessionUser["role"]) {
  useAuthStore.getState().setSession({ ...SESION, user: { ...USUARIO, role } });
}

describe("SessionCard", () => {
  it("sin sesion ofrece iniciar sesion", () => {
    renderWithProviders(<SessionCard />);

    expect(screen.getByRole("link", { name: /iniciar sesion/i })).toHaveAttribute("href", "/login");
  });

  it("un ADMIN ve la tabla de usuarios", async () => {
    iniciarSesionComo("ADMIN");

    renderWithProviders(<SessionCard />);

    expect(await screen.findByRole("cell", { name: USUARIO.email })).toBeInTheDocument();
    expect(screen.getByText(/solo para\s+administradores/i)).toBeInTheDocument();
  });

  it.each(["GRADUATE", "COMPANY"] as const)(
    "un %s no ve la seccion de usuarios ni consulta GET /users",
    async (role) => {
      const consultaUsuarios = vi.fn();
      server.use(
        http.get(`${API_BASE}/users`, () => {
          consultaUsuarios();
          return HttpResponse.json([], { status: 403 });
        }),
      );
      iniciarSesionComo(role);

      renderWithProviders(<SessionCard />);

      expect(await screen.findByText(`(${role})`, { exact: false })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByText(/GET \/users/)).not.toBeInTheDocument();
      expect(consultaUsuarios).not.toHaveBeenCalled();
    },
  );
});
