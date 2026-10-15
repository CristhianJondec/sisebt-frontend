import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { API_BASE } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

// next/navigation no funciona fuera del runtime de Next; mockeamos el router.
const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

async function rellenarYEnviar(password: string, confirmacion = password) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/nueva contrasena/i), password);
  await usuario.type(screen.getByLabelText(/confirmar contrasena/i), confirmacion);
  await usuario.click(screen.getByRole("button", { name: /guardar contrasena/i }));
}

beforeEach(() => push.mockClear());

describe("ResetPasswordForm", () => {
  it("sin token muestra el aviso de enlace no valido", () => {
    renderWithProviders(<ResetPasswordForm token={null} />);

    expect(screen.getByRole("alert")).toHaveTextContent(/enlace no valido/i);
    expect(screen.getByRole("link", { name: /solicita uno nuevo/i })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("envia token y contrasena y redirige al login", async () => {
    let recibido: unknown;
    server.use(
      http.post(`${API_BASE}/auth/reset-password`, async ({ request }) => {
        recibido = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<ResetPasswordForm token="token-del-correo" />);
    await rellenarYEnviar("contrasena-nueva");

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(recibido).toEqual({ token: "token-del-correo", password: "contrasena-nueva" });
  });

  it("aplica la longitud minima sin llamar a la API", async () => {
    const llamada = vi.fn();
    server.use(
      http.post(`${API_BASE}/auth/reset-password`, () => {
        llamada();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<ResetPasswordForm token="token" />);
    await rellenarYEnviar("corta");

    expect(await screen.findByRole("alert")).toHaveTextContent(/al menos 8 caracteres/i);
    expect(llamada).not.toHaveBeenCalled();
  });

  it("exige que la confirmacion coincida", async () => {
    renderWithProviders(<ResetPasswordForm token="token" />);
    await rellenarYEnviar("contrasena-nueva", "contrasena-otra");

    expect(await screen.findByRole("alert")).toHaveTextContent(/no coinciden/i);
    expect(push).not.toHaveBeenCalled();
  });

  it("si el backend rechaza el token (400) ofrece pedir otro enlace", async () => {
    server.use(
      http.post(`${API_BASE}/auth/reset-password`, () =>
        HttpResponse.json({ message: "El enlace no es valido" }, { status: 400 }),
      ),
    );

    renderWithProviders(<ResetPasswordForm token="token-usado" />);
    await rellenarYEnviar("contrasena-nueva");

    expect(await screen.findByText(/enlace no valido/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /solicita uno nuevo/i })).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
