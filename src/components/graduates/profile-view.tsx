import { ProfileAvatar } from "@/components/graduates/profile-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmploymentBadge } from "@/components/status-badges";
import { DEGREE_LABELS, type GraduateProfile, formatDate } from "@/lib/graduates";

function Dato({ label, valor }: { label: string; valor: string | number | null | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{valor || "—"}</dd>
    </div>
  );
}

export function formatInsertion(meses: number | null): string {
  if (meses === null) return "Sin empleo registrado";
  if (meses === 0) return "Inmediata";
  return `${meses} ${meses === 1 ? "mes" : "meses"}`;
}

/** Vista de solo lectura del perfil (sin experiencias), común a egresado y admin. */
export function ProfileView({ profile, editable = false }: { profile: GraduateProfile; editable?: boolean }) {
  const iniciales = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-4">
            <ProfileAvatar profileId={profile.id} initials={iniciales} editable={editable} />
            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="truncate text-lg font-semibold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {profile.program} · Promoción {profile.graduationDate.slice(0, 4)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <EmploymentBadge status={profile.employmentStatus} />
                <Badge variant="outline">{DEGREE_LABELS[profile.degree]}</Badge>
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-6 border-t pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Inserción laboral</dt>
              <dd className="text-lg font-semibold tracking-tight">{formatInsertion(profile.insertionMonths)}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">Experiencias</dt>
              <dd className="text-lg font-semibold tracking-tight tabular-nums">{profile.experiences.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Datos personales</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
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
          <CardHeader className="border-b">
            <CardTitle>Datos académicos</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato label="Código de estudiante" valor={profile.studentCode} />
              <Dato label="Programa" valor={profile.program} />
              <Dato label="Año de ingreso" valor={profile.admissionYear} />
              <Dato label="Fecha de egreso" valor={formatDate(profile.graduationDate)} />
              <Dato label="Grado" valor={DEGREE_LABELS[profile.degree]} />
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
