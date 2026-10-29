"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfileForm } from "@/components/graduates/profile-form";
import { ProfileView } from "@/components/graduates/profile-view";
import { RequireRole } from "@/components/require-role";
import { Button, buttonVariants } from "@/components/ui/button";
import { MY_PROFILE_QUERY_KEY, apiErrorMessage, fetchMyProfile } from "@/lib/graduates";

function MiPerfil() {
  const [editando, setEditando] = useState(false);
  const { data: perfil, isPending, isError, error } = useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
  });

  if (isPending) {
    return <Loader2 aria-label="Cargando" className="size-5 animate-spin text-muted-foreground" />;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {apiErrorMessage(error)}
      </p>
    );
  }

  // Sin perfil: consentimiento + formulario obligatorio.
  if (!perfil) {
    return (
      <>
        <p className="text-muted-foreground">
          Aún no has completado tu perfil. Acepta el consentimiento y registra tus datos para
          continuar.
        </p>
        <ProfileForm profile={null} />
      </>
    );
  }

  if (editando) {
    return <ProfileForm profile={perfil} onDone={() => setEditando(false)} />;
  }

  return (
    <>
      <Button variant="outline" className="self-start" onClick={() => setEditando(true)}>
        <Pencil aria-hidden />
        Editar datos
      </Button>
      <ProfileView profile={perfil} />
      <ExperienceSection experiences={perfil.experiences} editable />
    </>
  );
}

export default function PerfilPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Inicio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Mi perfil</h1>
      </header>
      <RequireRole roles={["GRADUATE"]}>
        <MiPerfil />
      </RequireRole>
    </main>
  );
}
