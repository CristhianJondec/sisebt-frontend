"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CvImport, aplicarBorrador } from "@/components/ai/cv-import";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfileForm } from "@/components/graduates/profile-form";
import { ProfileView } from "@/components/graduates/profile-view";
import { ProfessionalSection } from "@/components/graduates/professional-section";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import type { CvDraft } from "@/lib/ai";
import {
  type GraduateProfile,
  MY_PROFILE_QUERY_KEY,
  apiErrorMessage,
  fetchMyProfile,
  savePhoto,
  saveProfessional,
} from "@/lib/graduates";
import { aProfessionalInput, borrarLegado, leerLegado } from "@/lib/profile-extras";

const sinDatosProfesionales = (p: GraduateProfile) =>
  !p.headline && !p.summary && !p.linkedin && !p.github && !p.website && !p.orcid &&
  !p.languages && !p.availability && p.skills.length === 0 && p.certifications.length === 0 && p.dois.length === 0;

/**
 * Versiones anteriores guardaban foto y perfil profesional en el navegador.
 * Se suben una sola vez a la base (sin pisar lo que ya haya) y se borran.
 */
async function migrarDatosLocales(perfil: GraduateProfile): Promise<boolean> {
  const legado = leerLegado(perfil.id);
  if (!legado) return false;
  let migrado = false;
  if (legado.extras && sinDatosProfesionales(perfil)) {
    await saveProfessional(aProfessionalInput(legado.extras));
    migrado = true;
  }
  if (legado.photo && !perfil.photo) {
    await savePhoto(legado.photo);
    migrado = true;
  }
  borrarLegado();
  return migrado;
}

function MiPerfil() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  // Borrador del CV usado en el primer registro: sus experiencias y datos
  // profesionales necesitan un perfil guardado, así que se aplican después.
  const [borrador, setBorrador] = useState<CvDraft | null>(null);
  const aplicando = useRef(false);
  const migrando = useRef(false);
  const { data: perfil, isPending, isError, error } = useQuery({
    queryKey: MY_PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
  });

  useEffect(() => {
    if (!perfil || !borrador || aplicando.current) return;
    aplicando.current = true;
    aplicarBorrador(borrador, perfil, { datos: false, extras: true, experiencias: true })
      .then((hecho) => hecho.length > 0 && toast.success(`Desde tu CV se agregó: ${hecho.join(", ")}`))
      .catch((e: unknown) => toast.error(apiErrorMessage(e)))
      .finally(() => {
        setBorrador(null);
        aplicando.current = false;
        void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      });
  }, [perfil, borrador, queryClient]);

  useEffect(() => {
    if (!perfil || migrando.current) return;
    migrando.current = true;
    migrarDatosLocales(perfil)
      .then((migrado) => {
        if (!migrado) return;
        toast.success("Tu foto y perfil profesional se guardaron en tu cuenta");
        void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      })
      .catch(() => undefined);
  }, [perfil, queryClient]);

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
        <CvImport profile={null} onPrefill={setBorrador} />
        <ProfileForm key={borrador ? JSON.stringify(borrador.profile) : "manual"} profile={null} draft={borrador?.profile} />
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
      <CvImport profile={perfil} />
      <ProfileView profile={perfil} editable />
      <ProfessionalSection profile={perfil} cvSource="me" editable />
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
