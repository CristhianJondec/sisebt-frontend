import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Nueva contrasena · SISEBT",
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-8">
      <Card>
        <CardHeader>
          <CardTitle>Nueva contrasena</CardTitle>
          <CardDescription>
            Define una nueva contrasena para tu cuenta de SISEBT.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ResetPasswordForm token={typeof token === "string" && token ? token : null} />
        </CardContent>
      </Card>
    </main>
  );
}
