"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, FileUp, Loader2, Sparkles, UserRound, Wrench } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  AI_STATUS_QUERY_KEY,
  CV_ACCEPT,
  CV_MAX_MB,
  type CvDraft,
  fetchAiStatus,
  hayExtras,
  mergeExtras,
  nuevasExperiencias,
  parseCv,
} from "@/lib/ai";
import {
  DEGREE_LABELS,
  type GraduateProfile,
  MY_PROFILE_QUERY_KEY,
  addExperience,
  apiErrorMessage,
  formatDate,
  saveMyProfile,
  saveProfessional,
  toDateInput,
  uploadCvPdf,
} from "@/lib/graduates";
import { aProfessionalInput, extrasDesdePerfil } from "@/lib/profile-extras";

const ETIQUETAS: Record<keyof CvDraft["profile"], string> = {
  firstName: "Nombres",
  lastName: "Apellidos",
  dni: "DNI",
  phone: "Teléfono",
  birthDate: "Nacimiento",
  city: "Ciudad",
  studentCode: "Código",
  program: "Programa",
  admissionYear: "Ingreso",
  graduationDate: "Egreso",
  degree: "Grado",
};

function valor(campo: keyof CvDraft["profile"], v: string | number): string {
  if (campo === "degree") return DEGREE_LABELS[v as keyof typeof DEGREE_LABELS];
  if (campo === "birthDate" || campo === "graduationDate") return formatDate(String(v));
  return String(v);
}

/** Campos opcionales que se completan en un perfil existente si están vacíos. */
const OPCIONALES = ["phone", "birthDate", "city"] as const;

function Seccion({ icon: Icon, titulo, children, control }: {
  icon: typeof Sparkles; titulo: string; children: ReactNode; control?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Icon aria-hidden className="size-4 text-primary" />
          {titulo}
        </h3>
        {control}
      </div>
      {children}
    </section>
  );
}

/**
 * Aplica las partes elegidas del borrador a un perfil YA guardado: completa
 * campos vacíos, suma datos profesionales y agrega experiencias nuevas.
 */
export async function aplicarBorrador(
  draft: CvDraft,
  perfil: GraduateProfile,
  opciones: { datos: boolean; extras: boolean; experiencias: boolean },
  /** Si es un PDF y el perfil aún no tiene CV, se guarda también como CV. */
  archivo?: File,
): Promise<string[]> {
  const hecho: string[] = [];

  if (opciones.datos) {
    const faltantes = Object.fromEntries(
      OPCIONALES.filter((c) => !perfil[c] && draft.profile[c]).map((c) => [c, draft.profile[c]]),
    );
    if (Object.keys(faltantes).length > 0) {
      await saveMyProfile({
        dataConsent: true,
        firstName: perfil.firstName,
        lastName: perfil.lastName,
        dni: perfil.dni,
        phone: perfil.phone ?? undefined,
        birthDate: toDateInput(perfil.birthDate) || undefined,
        city: perfil.city ?? undefined,
        studentCode: perfil.studentCode,
        program: perfil.program,
        admissionYear: perfil.admissionYear,
        graduationDate: toDateInput(perfil.graduationDate),
        degree: perfil.degree,
        ...faltantes,
      });
      hecho.push("datos de contacto");
    }
  }

  if (opciones.extras && hayExtras(draft.extras)) {
    await saveProfessional(aProfessionalInput(mergeExtras(extrasDesdePerfil(perfil), draft.extras)));
    hecho.push("datos profesionales");
  }

  if (opciones.experiencias) {
    const nuevas = nuevasExperiencias(draft.experiences, perfil.experiences);
    // En serie: el orden de alta queda igual al del CV.
    for (const e of nuevas) await addExperience(e);
    if (nuevas.length > 0) hecho.push(`${nuevas.length} experiencia${nuevas.length === 1 ? "" : "s"}`);
  }

  if (archivo?.type === "application/pdf" && !perfil.cvName) {
    await uploadCvPdf(archivo);
    hecho.push("tu CV en PDF");
  }

  return hecho;
}

interface CvImportProps {
  /** null = primer registro: el borrador rellena el formulario (onPrefill). */
  profile: GraduateProfile | null;
  onPrefill?: (draft: CvDraft) => void;
}

/** Tarjeta "Autocompletar con IA": sube el CV, muestra la vista previa y aplica. */
export function CvImport({ profile, onPrefill }: CvImportProps) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<CvDraft | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [opciones, setOpciones] = useState({ datos: true, extras: true, experiencias: true });
  const estado = useQuery({ queryKey: AI_STATUS_QUERY_KEY, queryFn: fetchAiStatus, staleTime: 5 * 60_000 });

  const leer = useMutation({
    mutationFn: parseCv,
    onSuccess: (d) => {
      setDraft(d);
      setOpciones({ datos: true, extras: true, experiencias: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo analizar el CV")),
  });

  const aplicar = useMutation({
    mutationFn: (d: CvDraft) => aplicarBorrador(d, profile!, opciones, archivo ?? undefined),
    onSuccess: (hecho) => {
      void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast.success(hecho.length ? `Se agregó: ${hecho.join(", ")}` : "Tu perfil ya tenía estos datos");
      setDraft(null);
    },
    onError: (error) => {
      // Lo aplicado antes del error ya quedó guardado: refrescamos igual.
      void queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast.error(apiErrorMessage(error));
    },
  });

  if (!estado.data?.enabled) return null;

  function elegir(file: File | undefined) {
    if (!file) return;
    if (file.size > CV_MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera los ${CV_MAX_MB} MB`);
      return;
    }
    setArchivo(file);
    leer.mutate(file);
  }

  function confirmar() {
    if (!draft) return;
    if (!profile) {
      onPrefill?.(draft);
      setDraft(null);
      toast.success("Formulario completado con tu CV", {
        description: "Revisa los datos, acepta el consentimiento y guarda.",
      });
      return;
    }
    aplicar.mutate(draft);
  }

  const campos = draft
    ? (Object.entries(draft.profile) as [keyof CvDraft["profile"], string | number][])
    : [];
  const nuevas = draft && profile ? nuevasExperiencias(draft.experiences, profile.experiences) : draft?.experiences ?? [];
  const faltantes = profile ? OPCIONALES.filter((c) => !profile[c] && draft?.profile[c]) : [];
  const x = draft?.extras;

  const casilla = (clave: keyof typeof opciones, visible: boolean) =>
    profile && visible ? (
      <Label className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
        <Checkbox checked={opciones[clave]} onCheckedChange={(v) => setOpciones((o) => ({ ...o, [clave]: v }))} />
        Aplicar
      </Label>
    ) : undefined;

  return (
    <>
      <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles aria-hidden className="size-4 text-primary" />
            Autocompletar con IA
          </CardTitle>
          <CardDescription>
            Sube tu CV (PDF o foto, máx. {CV_MAX_MB} MB) y la IA llenará tu perfil por ti. Revisarás todo antes de
            guardar. El archivo se analiza con Google Gemini; si es un PDF y aún no tienes CV adjunto, se guarda como tu CV.
          </CardDescription>
          <CardAction>
            <input ref={input} type="file" accept={CV_ACCEPT} className="hidden"
              onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = ""; }} />
            <Button onClick={() => input.current?.click()} disabled={leer.isPending}>
              {leer.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <FileUp aria-hidden />}
              {leer.isPending ? "Analizando CV..." : "Subir CV"}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Modal
        wide
        open={draft !== null}
        onClose={() => !aplicar.isPending && setDraft(null)}
        title="Esto encontramos en tu CV"
        description={profile
          ? "Elige qué aplicar. Solo se completa lo que falta: no se reemplaza lo que ya registraste."
          : "Se rellenará el formulario de registro para que lo revises."}
        footer={
          <>
            <Button variant="outline" disabled={aplicar.isPending} onClick={() => setDraft(null)}>Cancelar</Button>
            <Button disabled={aplicar.isPending} onClick={confirmar}>
              {aplicar.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}
              {profile ? "Aplicar a mi perfil" : "Usar en el formulario"}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="flex flex-col gap-3 text-sm">
            <Seccion icon={UserRound} titulo="Datos personales y académicos" control={casilla("datos", faltantes.length > 0)}>
              {campos.length === 0 ? (
                <p className="text-muted-foreground">No se detectaron datos personales.</p>
              ) : (
                <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {campos.map(([c, v]) => {
                    const seAplica = !profile || (faltantes as string[]).includes(c);
                    return (
                      <div key={c} className={`flex justify-between gap-2 ${seAplica ? "" : "opacity-50"}`}>
                        <dt className="text-muted-foreground">{ETIQUETAS[c]}</dt>
                        <dd className="truncate text-right font-medium">{valor(c, v)}</dd>
                      </div>
                    );
                  })}
                </dl>
              )}
              {profile && (
                <p className="text-xs text-muted-foreground">
                  {faltantes.length
                    ? "Se completarán teléfono, nacimiento o ciudad si los tienes vacíos."
                    : "Tus datos personales ya están completos: no se cambiarán."}
                </p>
              )}
            </Seccion>

            {x && hayExtras(x) && (
              <Seccion icon={Wrench} titulo="Datos profesionales" control={casilla("extras", true)}>
                {x.headline && <p className="font-medium">{x.headline}</p>}
                {x.summary && <p className="text-muted-foreground">{x.summary}</p>}
                {x.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {x.skills.map((s) => <Badge key={s} variant="soft">{s}</Badge>)}
                  </div>
                )}
                {(x.languages.length > 0 || x.certifications.length > 0) && (
                  <p className="text-xs text-muted-foreground">
                    {[...x.languages, ...x.certifications].join(" · ")}
                  </p>
                )}
              </Seccion>
            )}

            <Seccion
              icon={Briefcase}
              titulo={`Experiencia laboral (${nuevas.length}${profile ? " nuevas" : ""})`}
              control={casilla("experiencias", nuevas.length > 0)}
            >
              {nuevas.length === 0 ? (
                <p className="text-muted-foreground">
                  {draft.experiences.length ? "Todas ya están registradas en tu perfil." : "No se detectaron experiencias."}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {nuevas.map((e) => (
                    <li key={`${e.company}-${e.position}-${e.startDate}`} className="flex flex-col">
                      <span className="font-medium">{e.position} · {e.company}</span>
                      <span className="text-xs text-muted-foreground">
                        {e.sector} · {formatDate(e.startDate)} – {e.isCurrent ? "Actualidad" : formatDate(e.endDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {!profile && nuevas.length > 0 && (
                <p className="text-xs text-muted-foreground">Se agregarán al guardar tu perfil, junto con los datos profesionales.</p>
              )}
            </Seccion>
          </div>
        )}
      </Modal>
    </>
  );
}
