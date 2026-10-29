"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((estado) => estado.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);

  const mutacion = useMutation({
    mutationFn: login,
    onSuccess: (sesion) => {
      setSession(sesion);
      toast.success(`Sesión iniciada como ${sesion.user.email}`);
      // El egresado va directo a su perfil: si aun no lo tiene, debe completarlo.
      router.push(sesion.user.role === "GRADUATE" ? "/perfil" : "/");
    },
    onError: (error) => {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      // 403: credenciales correctas pero el admin desactivó la cuenta.
      const mensaje =
        status === 401
          ? "Credenciales inválidas"
          : status === 403
            ? "Tu cuenta está desactivada. Comunícate con la oficina de egresados."
            : "No se pudo contactar la API";
      toast.error(mensaje);
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate({ email, password });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa con tu correo institucional para acceder a SISEBT.
        </p>
      </div>

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
            placeholder="egresado@unitru.edu.pe"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={verPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-10 pr-10"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar" : "Mostrar"}
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            >
              {verPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
            </button>
          </div>
        </div>

        {mutacion.isError && (
          <Alert variant="destructive">
            <AlertDescription>No se pudo iniciar sesión. Revisa tus credenciales.</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={mutacion.isPending}>
          {mutacion.isPending ? "Entrando..." : "Entrar"}
          {!mutacion.isPending && <ArrowRight aria-hidden data-icon="inline-end" />}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
