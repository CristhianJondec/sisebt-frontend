"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { KeyRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/lib/auth";
import { type SessionUser, useAuthStore } from "@/lib/auth-store";
import { PASSWORD_MIN_LENGTH, validarPassword } from "@/lib/password-rules";

interface ChangePasswordFormProps {
  onSuccess?: (user: SessionUser) => void;
}

/** Cambio de contraseña dentro de la plataforma: pide la actual (o la temporal). */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const setUser = useAuthStore((estado) => estado.setUser);

  const [actual, setActual] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const mutacion = useMutation({
    mutationFn: changePassword,
    onSuccess: (user) => {
      setUser(user);
      setActual("");
      setPassword("");
      setConfirmacion("");
      toast.success("Contraseña actualizada");
      onSuccess?.(user);
    },
  });

  // 400 = actual incorrecta o igual a la nueva: el backend dice el motivo.
  const errorApi = !mutacion.isError
    ? null
    : mutacion.error instanceof AxiosError && mutacion.error.response?.status === 400
      ? "La contraseña actual no es correcta o la nueva es igual a la actual."
      : "No se pudo contactar la API. Inténtalo de nuevo.";

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const error =
      (actual ? null : "Escribe tu contraseña actual") ??
      validarPassword(password) ??
      (password !== confirmacion ? "Las contraseñas no coinciden" : null);
    setErrorLocal(error);

    if (!error) mutacion.mutate({ currentPassword: actual, password });
  }

  const mensaje = errorLocal ?? errorApi;

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="actual">Contraseña actual</Label>
        <Input
          id="actual"
          name="actual"
          type="password"
          autoComplete="current-password"
          className="h-10"
          required
          value={actual}
          onChange={(evento) => setActual(evento.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="h-10"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          aria-invalid={errorLocal ? true : undefined}
          aria-describedby="password-ayuda"
        />
        <p id="password-ayuda" className="text-xs text-muted-foreground">
          Mínimo {PASSWORD_MIN_LENGTH} caracteres.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmacion">Confirmar nueva contraseña</Label>
        <Input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          className="h-10"
          required
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          aria-invalid={errorLocal ? true : undefined}
        />
      </div>

      {mensaje && (
        <Alert variant="destructive">
          <AlertDescription>{mensaje}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={mutacion.isPending}>
        <KeyRound aria-hidden />
        {mutacion.isPending ? "Guardando..." : "Guardar contraseña"}
      </Button>
    </form>
  );
}
