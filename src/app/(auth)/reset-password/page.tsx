import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña · SISEBT",
  // La URL lleva el token: que no viaje en el Referer de ningun recurso externo.
  referrer: "no-referrer",
};

/**
 * Server Component: lee `?token=` de searchParams y se lo pasa al formulario
 * (cliente). Asi el formulario no necesita useSearchParams ni un Suspense.
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Define una nueva contraseña para tu cuenta de SISEBT.
        </p>
      </div>
      <ResetPasswordForm token={typeof token === "string" && token ? token : null} />
    </div>
  );
}
