"use client";

import { useMutation } from "@tanstack/react-query";
import { Building2, GraduationCap, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, register } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";
import { apiErrorMessage } from "@/lib/graduates";
import { registerCompany } from "@/lib/jobs";
import { PASSWORD_MIN_LENGTH, validarPassword } from "@/lib/password-rules";
import { cn } from "@/lib/utils";

type RolRegistro = "GRADUATE" | "COMPANY";

const OPCIONES: { rol: RolRegistro; titulo: string; detalle: string; icon: typeof GraduationCap }[] = [
  { rol: "GRADUATE", titulo: "Egresado", detalle: "Seguimiento y bolsa de trabajo", icon: GraduationCap },
  { rol: "COMPANY", titulo: "Empresa", detalle: "Publica ofertas laborales", icon: Building2 },
];

export default function RegistroPage() {
  const router = useRouter();
  const setSession = useAuthStore((estado) => estado.setSession);
  const [rol, setRol] = useState<RolRegistro>("GRADUATE");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [terminos, setTerminos] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const mutacion = useMutation({
    mutationFn: async () => {
      const correo = email.trim();
      if (rol === "COMPANY") {
        // Crea usuario + empresa (pendiente de aprobacion) en una sola llamada.
        await registerCompany({
          name: empresa.trim(),
          contactEmail: correo,
          phone: telefono.trim() || undefined,
          email: correo,
          password,
        });
      } else {
        await register({ email: correo, password, role: rol });
      }
      return login({ email: correo, password });
    },
    onSuccess: (sesion) => {
      setSession(sesion);
      toast.success("Cuenta creada correctamente");
      router.push(sesion.user.role === "GRADUATE" ? "/perfil" : "/");
    },
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const error = validarPassword(password);
    setErrorLocal(error);
    if (!error) mutacion.mutate();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">Elige tu tipo de cuenta para empezar.</p>
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Tipo de cuenta</legend>
          {OPCIONES.map(({ rol: valor, titulo, detalle, icon: Icon }) => (
            <label
              key={valor}
              className={cn(
                "flex cursor-pointer flex-col gap-2 rounded-xl border bg-card p-3.5 shadow-xs transition-colors hover:bg-muted/50",
                rol === valor && "border-primary bg-primary/5 ring-1 ring-primary hover:bg-primary/5",
              )}
            >
              <input type="radio" name="rol" value={valor} className="sr-only"
                checked={rol === valor} onChange={() => setRol(valor)} />
              <Icon aria-hidden className={cn("size-5", rol === valor ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{titulo}</span>
              <span className="text-xs text-muted-foreground">{detalle}</span>
            </label>
          ))}
        </fieldset>

        {rol === "COMPANY" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="empresa">Nombre de la empresa</Label>
              <Input id="empresa" required className="h-10" maxLength={150} placeholder="Empresa S.A.C."
                value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Teléfono (opcional)</Label>
              <Input id="telefono" inputMode="tel" className="h-10" placeholder="044 000 000"
                value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" autoComplete="email" required className="h-10"
            placeholder={rol === "GRADUATE" ? "egresado@unitru.edu.pe" : "rrhh@empresa.pe"}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" required className="h-10"
            minLength={PASSWORD_MIN_LENGTH} value={password}
            aria-invalid={errorLocal ? true : undefined}
            onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">Mínimo {PASSWORD_MIN_LENGTH} caracteres.</p>
        </div>

        <Label className="flex items-start gap-2.5 text-sm leading-snug font-normal text-muted-foreground">
          <Checkbox className="mt-0.5" checked={terminos} onCheckedChange={setTerminos} />
          Acepto el tratamiento de mis datos personales conforme a la Ley N° 29733.
        </Label>

        {(errorLocal || mutacion.isError) && (
          <Alert variant="destructive">
            <AlertDescription>{errorLocal ?? apiErrorMessage(mutacion.error)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" disabled={mutacion.isPending || !terminos || !email.trim() || (rol === "COMPANY" && !empresa.trim())}>
          <UserPlus aria-hidden />
          {mutacion.isPending ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
