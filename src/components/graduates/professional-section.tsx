"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Code2,
  ExternalLink,
  FileText,
  Globe,
  Languages,
  Link2,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { type ChangeEvent, type FormEvent, type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CV_PDF_MAX_MB,
  type CvSource,
  type GraduateProfile,
  MY_PROFILE_QUERY_KEY,
  type PublicGraduateProfile,
  apiErrorMessage,
  deleteCvPdf,
  openCv,
  saveProfessional,
  uploadCvPdf,
} from "@/lib/graduates";
import {
  AVAILABILITY_LABELS,
  type Availability,
  type ProfileExtras,
  aProfessionalInput,
  extrasDesdePerfil,
  lista,
} from "@/lib/profile-extras";
const conProtocolo = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

function Enlace({ icon: Icon, label, valor, href }: { icon: typeof Globe; label: string; valor: string; href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        {valor ? (
          <a href={href ?? conProtocolo(valor)} target="_blank" rel="noreferrer"
            className="flex items-center gap-1 truncate text-sm font-medium text-primary hover:underline">
            <span className="truncate">{valor}</span>
            <ExternalLink aria-hidden className="size-3 shrink-0" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground/70">Sin registrar</span>
        )}
      </div>
    </div>
  );
}

function Campo({ id, label, children, className }: { id: string; label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Formulario({ inicial, pending, onSave, onCancel }: {
  inicial: ProfileExtras;
  pending: boolean;
  onSave: (datos: ProfileExtras) => void;
  onCancel: () => void;
}) {
  const [datos, setDatos] = useState(inicial);
  const set = <K extends keyof ProfileExtras>(campo: K, valor: ProfileExtras[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onSave(datos);
  }

  return (
    <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-2">
      <Campo id="x-headline" label="Titular profesional" className="sm:col-span-2">
        <Input id="x-headline" maxLength={120} placeholder="Ingeniero de Sistemas · Desarrollador Full Stack"
          value={datos.headline} onChange={(e) => set("headline", e.target.value)} />
      </Campo>
      <Campo id="x-summary" label="Resumen" className="sm:col-span-2">
        <Textarea id="x-summary" rows={3} maxLength={600} placeholder="Describe brevemente tu experiencia e intereses"
          value={datos.summary} onChange={(e) => set("summary", e.target.value)} />
      </Campo>
      <Campo id="x-linkedin" label="LinkedIn">
        <Input id="x-linkedin" placeholder="linkedin.com/in/usuario" value={datos.linkedin}
          onChange={(e) => set("linkedin", e.target.value)} />
      </Campo>
      <Campo id="x-orcid" label="ORCID">
        <Input id="x-orcid" placeholder="0000-0002-1825-0097" value={datos.orcid}
          onChange={(e) => set("orcid", e.target.value)} />
      </Campo>
      <Campo id="x-github" label="GitHub">
        <Input id="x-github" placeholder="github.com/usuario" value={datos.github}
          onChange={(e) => set("github", e.target.value)} />
      </Campo>
      <Campo id="x-website" label="Portafolio / sitio web">
        <Input id="x-website" placeholder="miportafolio.dev" value={datos.website}
          onChange={(e) => set("website", e.target.value)} />
      </Campo>
      <Campo id="x-dois" label="Publicaciones (DOI, separados por coma)" className="sm:col-span-2">
        <Input id="x-dois" placeholder="10.1000/xyz123, 10.1109/ACCESS.2024.0001" value={datos.dois}
          onChange={(e) => set("dois", e.target.value)} />
      </Campo>
      <Campo id="x-skills" label="Habilidades (separadas por coma)" className="sm:col-span-2">
        <Input id="x-skills" placeholder="React, SQL, Scrum, Power BI" value={datos.skills}
          onChange={(e) => set("skills", e.target.value)} />
      </Campo>
      <Campo id="x-languages" label="Idiomas">
        <Input id="x-languages" placeholder="Español (nativo), Inglés (B2)" value={datos.languages}
          onChange={(e) => set("languages", e.target.value)} />
      </Campo>
      <Campo id="x-availability" label="Disponibilidad laboral">
        <NativeSelect id="x-availability" className="w-full" value={datos.availability}
          onChange={(e) => set("availability", e.target.value as Availability)}>
          <NativeSelectOption value="">Sin especificar</NativeSelectOption>
          {Object.entries(AVAILABILITY_LABELS).map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}
        </NativeSelect>
      </Campo>
      <Campo id="x-certs" label="Certificaciones (separadas por coma)" className="sm:col-span-2">
        <Input id="x-certs" placeholder="AWS Cloud Practitioner, Scrum Master" value={datos.certifications}
          onChange={(e) => set("certifications", e.target.value)} />
      </Campo>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={pending}>Guardar</Button>
      </div>
    </form>
  );
}

/** CV en PDF guardado en la base: el egresado lo sube; admin y empresa lo abren. */
function Curriculum({ cvName, source, editable }: { cvName: string | null; source: CvSource; editable: boolean }) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const subir = useMutation({
    mutationFn: uploadCvPdf,
    onSuccess: (perfil) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, perfil);
      toast.success("CV guardado");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo subir el CV")),
  });
  const quitar = useMutation({
    mutationFn: deleteCvPdf,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast.success("CV eliminado");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });
  const abrir = useMutation({
    mutationFn: () => openCv(source),
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo abrir el CV")),
  });

  function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    if (archivo.type !== "application/pdf") return void toast.error("El CV debe ser un PDF");
    if (archivo.size > CV_PDF_MAX_MB * 1024 * 1024) return void toast.error(`El CV no puede superar ${CV_PDF_MAX_MB} MB`);
    subir.mutate(archivo);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
      <FileText aria-hidden className="size-5 text-primary" />
      <span className="min-w-0 flex-1 truncate text-sm">{cvName || "Currículum no adjuntado"}</span>
      {cvName && (
        <Button size="sm" variant="ghost" disabled={abrir.isPending} onClick={() => abrir.mutate()}>
          {abrir.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Ver CV
        </Button>
      )}
      {editable && (
        <>
          <Button size="sm" variant="outline" disabled={subir.isPending} onClick={() => input.current?.click()}>
            {subir.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
            {cvName ? "Reemplazar" : "Subir CV"}
          </Button>
          {cvName && (
            <Button size="icon-sm" variant="ghost" aria-label="Eliminar CV" disabled={quitar.isPending}
              onClick={() => { if (confirm("¿Eliminar tu CV?")) quitar.mutate(); }}>
              <Trash2 aria-hidden />
            </Button>
          )}
          <input ref={input} type="file" accept="application/pdf" className="sr-only" onChange={elegir} />
        </>
      )}
    </div>
  );
}

/** Perfil profesional: redes, publicaciones, habilidades y CV. */
export function ProfessionalSection({ profile, cvSource, editable = false }: {
  profile: GraduateProfile | PublicGraduateProfile;
  /** Ruta de descarga del CV según quién mira el perfil. */
  cvSource: CvSource;
  editable?: boolean;
}) {
  const queryClient = useQueryClient();
  const extras = extrasDesdePerfil(profile);
  const [editando, setEditando] = useState(false);
  const guardar = useMutation({
    mutationFn: (datos: ProfileExtras) => saveProfessional(aProfessionalInput(datos)),
    onSuccess: (perfil) => {
      queryClient.setQueryData(MY_PROFILE_QUERY_KEY, perfil);
      toast.success("Perfil profesional actualizado");
      setEditando(false);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const habilidades = lista(extras.skills);
  const certificaciones = lista(extras.certifications);
  const dois = lista(extras.dois);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Perfil profesional</CardTitle>
        <CardDescription>Redes, publicaciones, habilidades y currículum.</CardDescription>
        {editable && !editando && (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
              <Pencil aria-hidden />
              Editar
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {editando ? (
          <Formulario
            inicial={extras}
            pending={guardar.isPending}
            onCancel={() => setEditando(false)}
            onSave={(datos) => guardar.mutate(datos)}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {(extras.headline || extras.summary || extras.availability) && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {extras.headline && <p className="font-medium">{extras.headline}</p>}
                  {extras.availability && <Badge variant="soft">{AVAILABILITY_LABELS[extras.availability]}</Badge>}
                </div>
                {extras.summary && <p className="text-sm text-muted-foreground">{extras.summary}</p>}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Enlace icon={Link2} label="LinkedIn" valor={extras.linkedin} />
              <Enlace icon={BookOpen} label="ORCID" valor={extras.orcid}
                href={extras.orcid ? `https://orcid.org/${extras.orcid}` : undefined} />
              <Enlace icon={Code2} label="GitHub" valor={extras.github} />
              <Enlace icon={Globe} label="Portafolio" valor={extras.website} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Habilidades</span>
                {habilidades.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {habilidades.map((h) => <Badge key={h} variant="secondary">{h}</Badge>)}
                  </div>
                ) : <span className="text-sm text-muted-foreground/70">Sin registrar</span>}
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Languages aria-hidden className="size-3.5" /> Idiomas
                </span>
                <span className={extras.languages ? "text-sm font-medium" : "text-sm text-muted-foreground/70"}>
                  {extras.languages || "Sin registrar"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Award aria-hidden className="size-3.5" /> Certificaciones
                </span>
                {certificaciones.length ? (
                  <ul className="flex flex-col gap-1 text-sm font-medium">
                    {certificaciones.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                ) : <span className="text-sm text-muted-foreground/70">Sin registrar</span>}
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen aria-hidden className="size-3.5" /> Publicaciones (DOI)
                </span>
                {dois.length ? (
                  <ul className="flex flex-col gap-1">
                    {dois.map((d) => (
                      <li key={d}>
                        <a href={`https://doi.org/${d}`} target="_blank" rel="noreferrer"
                          className="text-sm font-medium text-primary hover:underline">{d}</a>
                      </li>
                    ))}
                  </ul>
                ) : <span className="text-sm text-muted-foreground/70">Sin registrar</span>}
              </div>
            </div>

            <Curriculum cvName={profile.cvName} source={cvSource} editable={editable} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
