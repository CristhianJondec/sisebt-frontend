"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ShieldCheck } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  DEGREE_LABELS,
  type Degree,
  type GraduateProfile,
  MY_PROFILE_QUERY_KEY,
  type ProfileInput,
  apiErrorMessage,
  saveMyProfile,
  toDateInput,
} from "@/lib/graduates";

interface ProfileFormProps {
  /** Perfil existente (edición) o null (primer registro). */
  profile: GraduateProfile | null;
  onDone?: () => void;
}

function inicial(profile: GraduateProfile | null): ProfileInput {
  return {
    // Si ya existe perfil, el consentimiento ya se aceptó antes.
    dataConsent: profile?.dataConsent ?? false,
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    dni: profile?.dni ?? "",
    phone: profile?.phone ?? "",
    birthDate: toDateInput(profile?.birthDate),
    city: profile?.city ?? "",
    studentCode: profile?.studentCode ?? "",
    program: profile?.program ?? "",
    admissionYear: profile?.admissionYear ?? new Date().getFullYear() - 5,
    graduationDate: toDateInput(profile?.graduationDate),
    degree: profile?.degree ?? "BACHELOR",
  };
}

/** Los opcionales vacíos no se envían: el backend validaría "" como formato inválido. */
function limpiar(datos: ProfileInput): ProfileInput {
  return {
    ...datos,
    phone: datos.phone || undefined,
    birthDate: datos.birthDate || undefined,
    city: datos.city || undefined,
  };
}

function Campo({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function ProfileForm({ profile, onDone }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [datos, setDatos] = useState<ProfileInput>(() => inicial(profile));

  const set = <K extends keyof ProfileInput>(campo: K, valor: ProfileInput[K]) =>
    setDatos((previo) => ({ ...previo, [campo]: valor }));

  const mutacion = useMutation({
    mutationFn: saveMyProfile,
    onSuccess: (guardado) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, guardado);
      toast.success("Perfil guardado correctamente");
      onDone?.();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!datos.dataConsent) {
      toast.error("Debes aceptar el tratamiento de datos personales");
      return;
    }
    mutacion.mutate(limpiar(datos));
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      {!profile && (
        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck aria-hidden className="size-4 text-primary" />
              Consentimiento de tratamiento de datos
            </CardTitle>
            <CardDescription>
              Conforme a la Ley N° 29733, Ley de Protección de Datos Personales, autorizas a la
              universidad a tratar tus datos personales, académicos y laborales con fines de
              seguimiento de egresados, encuestas, bolsa de trabajo y reportes institucionales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label className="flex items-center gap-3 font-normal">
              <Checkbox
                checked={datos.dataConsent}
                onCheckedChange={(marcado) => set("dataConsent", marcado)}
              />
              Acepto el tratamiento de mis datos personales
            </Label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Información de contacto e identificación.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Campo id="firstName" label="Nombres *">
            <Input id="firstName" required maxLength={100} value={datos.firstName}
              onChange={(e) => set("firstName", e.target.value)} />
          </Campo>
          <Campo id="lastName" label="Apellidos *">
            <Input id="lastName" required maxLength={100} value={datos.lastName}
              onChange={(e) => set("lastName", e.target.value)} />
          </Campo>
          <Campo id="dni" label="DNI *">
            <Input id="dni" required inputMode="numeric" pattern="\d{8}" maxLength={8}
              title="8 dígitos" value={datos.dni}
              onChange={(e) => set("dni", e.target.value.replace(/\D/g, ""))} />
          </Campo>
          <Campo id="phone" label="Teléfono">
            <Input id="phone" inputMode="tel" pattern="\+?\d{6,15}" title="Entre 6 y 15 dígitos"
              value={datos.phone} onChange={(e) => set("phone", e.target.value)} />
          </Campo>
          <Campo id="birthDate" label="Fecha de nacimiento">
            <Input id="birthDate" type="date" value={datos.birthDate}
              onChange={(e) => set("birthDate", e.target.value)} />
          </Campo>
          <Campo id="city" label="Ciudad">
            <Input id="city" maxLength={100} value={datos.city}
              onChange={(e) => set("city", e.target.value)} />
          </Campo>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Datos académicos</CardTitle>
          <CardDescription>Tu formación en la escuela profesional.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Campo id="studentCode" label="Código de estudiante *">
            <Input id="studentCode" required pattern="[A-Za-z0-9\-]{4,20}"
              title="4 a 20 caracteres alfanuméricos" value={datos.studentCode}
              onChange={(e) => set("studentCode", e.target.value)} />
          </Campo>
          <Campo id="program" label="Programa / Escuela *">
            <Input id="program" required maxLength={150} value={datos.program}
              onChange={(e) => set("program", e.target.value)} />
          </Campo>
          <Campo id="admissionYear" label="Año de ingreso *">
            <Input id="admissionYear" type="number" required min={1950} max={2100}
              value={datos.admissionYear}
              onChange={(e) => set("admissionYear", Number(e.target.value))} />
          </Campo>
          <Campo id="graduationDate" label="Fecha de egreso *">
            <Input id="graduationDate" type="date" required value={datos.graduationDate}
              onChange={(e) => set("graduationDate", e.target.value)} />
          </Campo>
          <Campo id="degree" label="Grado *">
            <NativeSelect id="degree" className="w-full" value={datos.degree}
              onChange={(e) => set("degree", e.target.value as Degree)}>
              {Object.entries(DEGREE_LABELS).map(([valor, etiqueta]) => (
                <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
              ))}
            </NativeSelect>
          </Campo>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {profile && onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={mutacion.isPending || !datos.dataConsent}>
          <Save aria-hidden />
          {mutacion.isPending ? "Guardando..." : "Guardar perfil"}
        </Button>
      </div>
    </form>
  );
}
