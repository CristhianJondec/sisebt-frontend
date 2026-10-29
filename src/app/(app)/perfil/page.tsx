"use client";

import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfileForm } from "@/components/graduates/profile-form";
import { ProfileView } from "@/components/graduates/profile-view";
import { ProfessionalSection } from "@/components/graduates/professional-section";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { MY_PROFILE_QUERY_KEY, apiErrorMessage, fetchMyProfile } from "@/lib/graduates";

function MiPerfil() {
  const [editando, setEditando] = useState(false);
  const { data: perfil, isPending, isError, error } = useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;

  // Sin perfil: consentimiento + formulario obligatorio.
  if (!perfil) {
    return (
      <>
        <PageHeader
          title="Completa tu perfil"
          description="Acepta el consentimiento y registra tus datos para continuar."
        />
        <ProfileForm profile={null} />
      </>
    );
  }

  if (editando) {
    return (
      <>
        <PageHeader title="Editar perfil" description="Actualiza tus datos personales y académicos." />
        <ProfileForm profile={perfil} onDone={() => setEditando(false)} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Tus datos personales, académicos y tu trayectoria laboral."
        actions={
          <Button variant="outline" onClick={() => setEditando(true)}>
            <Pencil aria-hidden />
            Editar datos
          </Button>
        }
      />
      <ProfileView profile={perfil} editable />
      <ProfessionalSection profileId={perfil.id} editable />
      <ExperienceSection experiences={perfil.experiences} editable />
    </>
  );
}

export default function PerfilPage() {
  return (
    <RequireRole roles={["GRADUATE"]}>
      <MiPerfil />
    </RequireRole>
  );
}
