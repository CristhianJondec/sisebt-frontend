import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "@/app/(auth)/login/page";
import { useAuthStore } from "@/lib/auth-store";
import { API_BASE, SESION } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

// next/navigation no funciona fuera del runtime de Next; mockeamos el router.
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

async function rellenarYEnviar(password = "contrasena-segura") {
  const usuario = userEvent.setup();

  await usuario.type(screen.getByLabelText(/correo electrónico/i), SESION.user.email);
  await usuario.type(screen.getByLabelText(/contraseña/i), password);
  await usuario.click(screen.getByRole("button", { name: /entrar/i }));
}

describe("LoginPage", () => {
  it("renderiza el formulario de acceso", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: /entrar/i })).toBeEnabled();
  });

  it("enlaza con la recuperacion de contrasena", () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole("link", { name: /olvidaste tu contraseña/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("guarda la sesion y redirige al egresado a su perfil cuando las credenciales son validas", async () => {
    push.mockClear();
    renderWithProviders(<LoginPage />);

    await rellenarYEnviar();

    await waitFor(() => expect(useAuthStore.getState().token).toBe(SESION.accessToken));
    expect(useAuthStore.getState().user?.email).toBe(SESION.user.email);
    expect(push).toHaveBeenCalledWith("/perfil");
  });

  it("muestra un error y no guarda sesion cuando la API responde 401", async () => {
    push.mockClear();
    server.use(
      http.post(`${API_BASE}/auth/login`, () =>
        HttpResponse.json({ message: "Credenciales invalidas" }, { status: 401 }),
      ),
    );

    renderWithProviders(<LoginPage />);

    await rellenarYEnviar("contrasena-equivocada");

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(useAuthStore.getState().token).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
