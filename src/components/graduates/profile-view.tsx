import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEGREE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  type GraduateProfile,
  formatDate,
} from "@/lib/graduates";

function Dato({ label, valor }: { label: string; valor: string | number | null | undefined }) {
  return (
    <div className="flex flex-col">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{valor || "-"}</dd>
    </div>
  );
}

export function formatInsertion(meses: number | null): string {
  if (meses === null) return "Sin empleo registrado";
  if (meses === 0) return "Inmediata";
  return `${meses} ${meses === 1 ? "mes" : "meses"}`;
}

/** Vista de solo lectura del perfil (sin experiencias), común a egresado y admin. */
export function ProfileView({ profile }: { profile: GraduateProfile }) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Situación laboral</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <dt className="text-sm text-muted-foreground">Estado actual</dt>
              <dd>
                <Badge variant={profile.employmentStatus === "UNEMPLOYED" ? "outline" : "default"}>
                  {EMPLOYMENT_STATUS_LABELS[profile.employmentStatus]}
                </Badge>
              </dd>
            </div>
            <Dato label="Tiempo de inserción laboral" valor={formatInsertion(profile.insertionMonths)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato label="Nombres" valor={profile.firstName} />
            <Dato label="Apellidos" valor={profile.lastName} />
            <Dato label="DNI" valor={profile.dni} />
            <Dato label="Correo" valor={profile.email} />
            <Dato label="Teléfono" valor={profile.phone} />
            <Dato label="Fecha de nacimiento" valor={formatDate(profile.birthDate)} />
            <Dato label="Ciudad" valor={profile.city} />
            <Dato label="Consentimiento de datos" valor={`Aceptado el ${formatDate(profile.dataConsentAt)}`} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos académicos</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Dato label="Código de estudiante" valor={profile.studentCode} />
            <Dato label="Programa" valor={profile.program} />
            <Dato label="Año de ingreso" valor={profile.admissionYear} />
            <Dato label="Fecha de egreso" valor={formatDate(profile.graduationDate)} />
            <Dato label="Grado" valor={DEGREE_LABELS[profile.degree]} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
