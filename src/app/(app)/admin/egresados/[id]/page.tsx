"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfileView } from "@/components/graduates/profile-view";
import { ProfessionalSection } from "@/components/graduates/professional-section";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { apiErrorMessage, fetchGraduate } from "@/lib/graduates";

function DetalleEgresado({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["graduates", "detail", id],
    queryFn: () => fetchGraduate(id),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;

  return (
    <>
      <ProfileView profile={data} />
      <ProfessionalSection profile={data} cvSource={{ admin: data.id }} />
      <ExperienceSection experiences={data.experiences} />
    </>
  );
}

export default function DetalleEgresadoPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <RequireRole roles={["ADMIN"]}>
      <PageHeader
        back={{ href: "/admin/egresados", label: "Egresados" }}
        title="Ficha del egresado"
        description="Información personal, académica y trayectoria laboral."
      />
      <DetalleEgresado id={id} />
    </RequireRole>
  );
}
