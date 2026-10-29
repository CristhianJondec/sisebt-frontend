import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import { API_BASE } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

async function solicitar(email: string) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText(/correo electrónico/i), email);
  await usuario.click(screen.getByRole("button", { name: /enviar enlace/i }));
}

describe("ForgotPasswordPage", () => {
  it("envia el email y muestra el mensaje generico", async () => {
    let recibido: unknown;
    server.use(
      http.post(`${API_BASE}/auth/forgot-password`, async ({ request }) => {
        recibido = await request.json();
        return HttpResponse.json({ message: "ok" }, { status: 202 });
      }),
    );

    renderWithProviders(<ForgotPasswordPage />);
    await solicitar("egresado@sisebt.edu.mx");

    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/si egresado@sisebt.edu.mx está registrado/i);
    expect(recibido).toEqual({ email: "egresado@sisebt.edu.mx" });
    // El formulario desaparece: no se puede reenviar en bucle desde aqui.
    expect(screen.queryByRole("button", { name: /enviar enlace/i })).not.toBeInTheDocument();
  });

  it("muestra un error de validacion si la API responde 400", async () => {
    server.use(
      http.post(`${API_BASE}/auth/forgot-password`, () =>
        HttpResponse.json({ message: ["email debe ser una direccion valida"] }, { status: 400 }),
      ),
    );

    renderWithProviders(<ForgotPasswordPage />);
    await solicitar("no-es-email");

    expect(await screen.findByRole("alert")).toHaveTextContent(/correo electrónico válido/i);
    expect(screen.queryByText(/revisa tu correo/i)).not.toBeInTheDocument();
  });

  it("ofrece volver al login", () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
