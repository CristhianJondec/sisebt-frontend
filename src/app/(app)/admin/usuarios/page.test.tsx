import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UsuariosPage from "@/app/(app)/admin/usuarios/page";
import type { UserAccount } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";
import { API_BASE } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: vi.fn() } }));

const FECHA = "2026-01-01T00:00:00.000Z";
const ADMIN: UserAccount = {
  id: "a0000000-0000-4000-8000-000000000001",
  email: "admin@unitru.edu.pe",
  role: "ADMIN",
  active: true,
  createdAt: FECHA,
  updatedAt: FECHA,
};
const EGRESADO: UserAccount = {
  id: "e0000000-0000-4000-8000-000000000002",
  email: "egresado@unitru.edu.pe",
  role: "GRADUATE",
  active: true,
  createdAt: FECHA,
  updatedAt: FECHA,
};

function fila(email: string): HTMLElement {
  return screen.getByText(email).closest("tr") as HTMLElement;
}

describe("Admin > Usuarios", () => {
  let usuarios: UserAccount[];

  beforeEach(() => {
    usuarios = [ADMIN, { ...EGRESADO }];
    useAuthStore.setState({ token: "cabecera.carga.firma", user: ADMIN });
    server.use(http.get(`${API_BASE}/users`, () => HttpResponse.json(usuarios)));
  });

  it("bloquea la fila del propio admin", async () => {
    renderWithProviders(<UsuariosPage />);

    await screen.findByText(ADMIN.email);
    const propia = fila(ADMIN.email);

    expect(within(propia).getByText("Tú")).toBeInTheDocument();
    expect(within(propia).getByLabelText(`Rol de ${ADMIN.email}`)).toBeDisabled();
    expect(within(propia).queryByRole("button", { name: /desactivar/i })).not.toBeInTheDocument();

    expect(within(fila(EGRESADO.email)).getByLabelText(`Rol de ${EGRESADO.email}`)).toBeEnabled();
  });

  it("desactiva una cuenta tras confirmar", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let cuerpo: unknown;
    server.use(
      http.patch(`${API_BASE}/users/${EGRESADO.id}`, async ({ request }) => {
        cuerpo = await request.json();
        usuarios = [ADMIN, { ...EGRESADO, active: false }];
        return HttpResponse.json(usuarios[1]);
      }),
    );
    renderWithProviders(<UsuariosPage />);

    await userEvent.click(await screen.findByRole("button", { name: `Desactivar ${EGRESADO.email}` }));

    await waitFor(() => expect(cuerpo).toEqual({ active: false }));
    expect(toastSuccess).toHaveBeenCalledWith(`${EGRESADO.email} fue desactivada`);
    expect(await within(fila(EGRESADO.email)).findByText("Desactivada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Reactivar ${EGRESADO.email}` })).toBeInTheDocument();
  });

  it("no hace nada si se cancela la confirmación", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const patch = vi.fn();
    server.use(http.patch(`${API_BASE}/users/:id`, () => { patch(); return HttpResponse.json({}); }));
    renderWithProviders(<UsuariosPage />);

    await userEvent.click(await screen.findByRole("button", { name: `Desactivar ${EGRESADO.email}` }));

    expect(patch).not.toHaveBeenCalled();
  });
});
