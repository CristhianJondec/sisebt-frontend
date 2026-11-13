"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/use-session";

export default function CambiarPasswordPage() {
  const router = useRouter();
  const { user } = useSession();
  const obligatorio = Boolean(user?.mustChangePassword);

  return (
    <>
      <PageHeader
        title="Cambiar contraseña"
        description="Actualiza la contraseña con la que inicias sesión en SISEBT."
      />

      <div className="flex w-full max-w-md flex-col gap-5">
        {obligatorio && (
          <Alert className="border-primary/20 bg-primary/5 px-4 py-3">
            <ShieldAlert aria-hidden className="text-primary" />
            <AlertTitle>Debes definir una nueva contraseña</AlertTitle>
            <AlertDescription>
              El administrador restableció tu acceso. Escribe la contraseña temporal que te
              entregó como contraseña actual y elige una nueva para continuar.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent>
            <ChangePasswordForm
              onSuccess={(u) => {
                // Tras el cambio obligatorio, a su inicio habitual.
                if (obligatorio) router.replace(u.role === "GRADUATE" ? "/perfil" : "/");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
