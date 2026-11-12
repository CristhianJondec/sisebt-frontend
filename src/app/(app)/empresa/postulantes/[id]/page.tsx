"use client";

import { useQuery } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfessionalSection } from "@/components/graduates/professional-section";
import { ProfileView } from "@/components/graduates/profile-view";
import { ApplicationsTable } from "@/components/jobs/applications-table";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiErrorMessage, fetchPublicGraduate } from "@/lib/graduates";
import { QK, fetchCompanyApplications } from "@/lib/jobs";

function PerfilPostulante({ id }: { id: string }) {
  const perfil = useQuery({ queryKey: ["graduates", "public", id], queryFn: () => fetchPublicGraduate(id) });
  const postulaciones = useQuery({ queryKey: [...QK.applications, "company"], queryFn: fetchCompanyApplications });

  if (perfil.isPending) return <LoadingState />;
  if (perfil.isError) return <ErrorState>{apiErrorMessage(perfil.error)}</ErrorState>;

  const p = perfil.data;
  const suyas = postulaciones.data?.filter((a) => a.graduate.id === id) ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <a href={`mailto:${p.email}`} className={buttonVariants()}>
          <Mail aria-hidden />
          Contactar por correo
        </a>
        {p.phone && (
          <a href={`tel:${p.phone.replace(/\s/g, "")}`} className={buttonVariants({ variant: "outline" })}>
            <Phone aria-hidden />
            {p.phone}
          </a>
        )}
      </div>

      <ProfileView profile={p} />
      <ProfessionalSection profile={p} cvSource={{ company: p.id }} />

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Postulaciones a tus ofertas</CardTitle>
          <CardDescription>Actualiza el estado; el egresado recibirá una notificación.</CardDescription>
        </CardHeader>
        <ApplicationsTable applications={suyas} showCompany={false} linkProfiles={false} />
      </Card>

      <ExperienceSection experiences={p.experiences} />
    </>
  );
}

export default function PerfilPostulantePage() {
  const { id } = useParams<{ id: string }>();

  return (
    <RequireRole roles={["COMPANY"]}>
      <PageHeader
        back={{ href: "/empresa/postulantes", label: "Postulantes" }}
        title="Perfil del postulante"
        description="Información académica y trayectoria laboral del egresado."
      />
      <PerfilPostulante id={id} />
    </RequireRole>
  );
}
