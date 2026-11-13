import { ArrowLeft, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Sin recuperacion por correo: el administrador restablece la contraseña desde
 * Admin > Usuarios y entrega una temporal que se cambia al iniciar sesion.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          El restablecimiento se hace dentro de la plataforma, sin correo.
        </p>
      </div>

      <Alert className="border-primary/20 bg-primary/5 px-4 py-3">
        <ShieldQuestion aria-hidden className="text-primary" />
        <AlertTitle>Comunícate con la oficina de egresados</AlertTitle>
        <AlertDescription>
          Un administrador restablecerá tu acceso y te entregará una contraseña temporal. Al
          iniciar sesión con ella, el sistema te pedirá elegir una nueva.
        </AlertDescription>
      </Alert>

      <Link
        href="/login"
        className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Volver a iniciar sesión
      </Link>
    </div>
  );
}
