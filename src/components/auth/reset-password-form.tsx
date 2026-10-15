"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH, validarPassword } from "@/lib/password-rules";

interface ResetPasswordFormProps {
  /** null si el enlace llego sin token. */
  token: string | null;
}

function EnlaceInvalido() {
  return (
    <Alert variant="destructive">
      <AlertTitle>Enlace no valido</AlertTitle>
      <AlertDescription>
        El enlace de recuperacion no es valido, ya se uso o ha expirado.{" "}
        <Link href="/forgot-password">Solicita uno nuevo</Link>.
      </AlertDescription>
    </Alert>
  );
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const mutacion = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success("Contrasena actualizada. Ya puedes iniciar sesion.");
      router.push("/login");
    },
  });

  if (!token) return <EnlaceInvalido />;

  // 400 del backend = token invalido/usado/expirado (la contrasena ya se
  // valido aqui con las mismas reglas antes de enviar).
  const tokenRechazado =
    mutacion.error instanceof AxiosError && mutacion.error.response?.status === 400;

  if (tokenRechazado) return <EnlaceInvalido />;

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const error =
      validarPassword(password) ??
      (password !== confirmacion ? "Las contrasenas no coinciden" : null);
    setErrorLocal(error);

    if (!error && token) mutacion.mutate({ token, password });
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nueva contrasena</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          aria-invalid={errorLocal ? true : undefined}
          aria-describedby="password-ayuda"
        />
        <p id="password-ayuda" className="text-xs text-muted-foreground">
          Minimo {PASSWORD_MIN_LENGTH} caracteres.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmacion">Confirmar contrasena</Label>
        <Input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          required
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          aria-invalid={errorLocal ? true : undefined}
        />
      </div>

      {(errorLocal || mutacion.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {errorLocal ?? "No se pudo contactar la API. Intentalo de nuevo."}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={mutacion.isPending}>
        <KeyRound aria-hidden />
        {mutacion.isPending ? "Guardando..." : "Guardar contrasena"}
      </Button>
    </form>
  );
}
