"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const mutacion = useMutation({ mutationFn: forgotPassword });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate(email.trim());
  }

  const emailInvalido =
    mutacion.error instanceof AxiosError && mutacion.error.response?.status === 400;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Recuperar contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para definir una nueva contraseña.
        </p>
      </div>

      {mutacion.isSuccess ? (
        // Mismo mensaje exista o no la cuenta: el backend tampoco lo revela.
        <Alert className="border-primary/20 bg-primary/5 px-4 py-3">
          <MailCheck aria-hidden className="text-primary" />
          <AlertTitle>Revisa tu correo</AlertTitle>
          <AlertDescription>
            Si <strong>{email.trim()}</strong> está registrado, recibirás un enlace para
            restablecer tu contraseña. Caduca en unos minutos y solo puede usarse una vez.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              aria-invalid={emailInvalido || undefined}
              placeholder="egresado@unitru.edu.pe"
            />
          </div>

          {mutacion.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {emailInvalido
                  ? "Introduce un correo electrónico válido."
                  : "No se pudo contactar la API. Inténtalo de nuevo."}
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={mutacion.isPending || !email.trim()}>
            <Send aria-hidden />
            {mutacion.isPending ? "Enviando..." : "Enviar enlace"}
          </Button>
        </form>
      )}

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
