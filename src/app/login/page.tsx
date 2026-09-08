"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((estado) => estado.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutacion = useMutation({
    mutationFn: login,
    onSuccess: (sesion) => {
      setSession(sesion);
      toast.success(`Sesion iniciada como ${sesion.user.email}`);
      router.push("/");
    },
    onError: (error) => {
      const mensaje =
        error instanceof AxiosError && error.response?.status === 401
          ? "Credenciales invalidas"
          : "No se pudo contactar la API";
      toast.error(mensaje);
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate({ email, password });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-8">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesion</CardTitle>
          <CardDescription>Accede al panel de SISEBT</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electronico
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="egresado@sisebt.edu.mx"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contrasena
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
              />
            </div>

            {mutacion.isError && (
              <p className="text-sm text-destructive" role="alert">
                No se pudo iniciar sesion. Revisa tus credenciales.
              </p>
            )}

            <Button type="submit" disabled={mutacion.isPending}>
              <LogIn aria-hidden />
              {mutacion.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
