import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import { renderWithProviders } from "@/test/render-with-providers";

describe("ForgotPasswordPage", () => {
  it("indica que el restablecimiento lo hace el administrador, sin correo", () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(/administrador restablecerá tu acceso/i);
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument();
  });

  it("ofrece volver al login", () => {
    renderWithProviders(<ForgotPasswordPage />);

    expect(screen.getByRole("link", { name: /volver a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
