"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-8">
      <Card>
        <CardHeader>
          <CardTitle>Recuperar contrasena</CardTitle>
          <CardDescription>
            Te enviaremos un enlace para definir una nueva contrasena.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mutacion.isSuccess ? (
            // Mismo mensaje exista o no la cuenta: el backend tampoco lo revela.
            <Alert>
              <MailCheck aria-hidden />
              <AlertTitle>Revisa tu correo</AlertTitle>
              <AlertDescription>
                Si <strong>{email.trim()}</strong> esta registrado, recibiras un enlace
                para restablecer tu contrasena. Caduca en unos minutos y solo puede
                usarse una vez.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  aria-invalid={emailInvalido || undefined}
                  placeholder="egresado@sisebt.edu.mx"
                />
              </div>

              {mutacion.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {emailInvalido
                      ? "Introduce un correo electronico valido."
                      : "No se pudo contactar la API. Intentalo de nuevo."}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={mutacion.isPending || !email.trim()}>
                <Send aria-hidden />
                {mutacion.isPending ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter>
          <Link href="/login" className={buttonVariants({ variant: "link" })}>
            <ArrowLeft aria-hidden />
            Volver a iniciar sesion
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
