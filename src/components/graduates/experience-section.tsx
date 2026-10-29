"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  type Experience,
  type ExperienceInput,
  MY_PROFILE_QUERY_KEY,
  SALARY_RANGE_LABELS,
  type SalaryRange,
  addExperience,
  apiErrorMessage,
  deleteExperience,
  formatDate,
  toDateInput,
  updateExperience,
} from "@/lib/graduates";

const VACIA: ExperienceInput = {
  company: "",
  position: "",
  sector: "",
  salaryRange: undefined,
  startDate: "",
  endDate: "",
  isCurrent: false,
  isFirstJob: false,
  isSelfEmployed: false,
};

function desdeExperiencia(e: Experience): ExperienceInput {
  return {
    company: e.company,
    position: e.position,
    sector: e.sector,
    salaryRange: e.salaryRange ?? undefined,
    startDate: toDateInput(e.startDate),
    endDate: toDateInput(e.endDate),
    isCurrent: e.isCurrent,
    isFirstJob: e.isFirstJob,
    isSelfEmployed: e.isSelfEmployed,
  };
}

interface ExperienceFormProps {
  experience: Experience | null;
  onClose: () => void;
}

function ExperienceForm({ experience, onClose }: ExperienceFormProps) {
  const queryClient = useQueryClient();
  const [datos, setDatos] = useState<ExperienceInput>(() =>
    experience ? desdeExperiencia(experience) : VACIA,
  );
  const set = <K extends keyof ExperienceInput>(campo: K, valor: ExperienceInput[K]) =>
    setDatos((previo) => ({ ...previo, [campo]: valor }));

  const mutacion = useMutation({
    mutationFn: (input: ExperienceInput) =>
      experience ? updateExperience(experience.id, input) : addExperience(input),
    onSuccess: async () => {
      // El estado laboral y el tiempo de inserción son derivados: recargamos el perfil.
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast.success(experience ? "Experiencia actualizada" : "Experiencia agregada");
      onClose();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!datos.isCurrent && datos.endDate && datos.endDate < datos.startDate) {
      toast.error("La fecha de fin debe ser igual o posterior a la de inicio");
      return;
    }
    mutacion.mutate({
      ...datos,
      endDate: datos.isCurrent ? undefined : datos.endDate || undefined,
      salaryRange: datos.salaryRange || undefined,
    });
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 rounded-xl border bg-muted/30 p-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="company">Empresa *</Label>
        <Input id="company" required maxLength={150} value={datos.company}
          onChange={(e) => set("company", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="position">Cargo *</Label>
        <Input id="position" required maxLength={150} value={datos.position}
          onChange={(e) => set("position", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="sector">Sector *</Label>
        <Input id="sector" required maxLength={100} placeholder="Tecnología, Educación..."
          value={datos.sector} onChange={(e) => set("sector", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="salaryRange">Rango salarial</Label>
        <NativeSelect id="salaryRange" className="w-full" value={datos.salaryRange ?? ""}
          onChange={(e) => set("salaryRange", (e.target.value || undefined) as SalaryRange)}>
          <NativeSelectOption value="">Prefiero no indicarlo</NativeSelectOption>
          {Object.entries(SALARY_RANGE_LABELS).map(([valor, etiqueta]) => (
            <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate">Fecha de inicio *</Label>
        <Input id="startDate" type="date" required value={datos.startDate}
          onChange={(e) => set("startDate", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="endDate">Fecha de fin {datos.isCurrent ? "" : "*"}</Label>
        <Input id="endDate" type="date" required={!datos.isCurrent} disabled={datos.isCurrent}
          min={datos.startDate || undefined} value={datos.isCurrent ? "" : datos.endDate}
          onChange={(e) => set("endDate", e.target.value)} />
      </div>

      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox checked={datos.isCurrent} onCheckedChange={(v) => set("isCurrent", v)} />
          Trabajo actual
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox checked={datos.isFirstJob} onCheckedChange={(v) => set("isFirstJob", v)} />
          Primer empleo
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <Checkbox checked={datos.isSelfEmployed} onCheckedChange={(v) => set("isSelfEmployed", v)} />
          Independiente / cuenta propia
        </Label>
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutacion.isPending}>
          {mutacion.isPending ? "Guardando..." : "Guardar experiencia"}
        </Button>
      </div>
    </form>
  );
}

interface ExperienceSectionProps {
  experiences: Experience[];
  /** Solo el propio egresado puede modificar; el admin ve en modo lectura. */
  editable?: boolean;
}

export function ExperienceSection({ experiences, editable = false }: ExperienceSectionProps) {
  const queryClient = useQueryClient();
  // undefined: sin formulario; null: nueva; Experience: editando esa.
  const [editando, setEditando] = useState<Experience | null | undefined>(undefined);

  const eliminar = useMutation({
    mutationFn: deleteExperience,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_PROFILE_QUERY_KEY });
      toast.success("Experiencia eliminada");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Experiencia laboral</CardTitle>
        <CardDescription>Trayectoria profesional desde el egreso.</CardDescription>
        {editable && editando === undefined && (
          <CardAction>
            <Button size="sm" onClick={() => setEditando(null)}>
              <Plus aria-hidden />
              Agregar
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editando === null && <ExperienceForm experience={null} onClose={() => setEditando(undefined)} />}

        {experiences.length === 0 && editando === undefined && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Briefcase aria-hidden className="size-4.5" />
            </span>
            <p className="text-sm text-muted-foreground">Sin experiencias registradas.</p>
          </div>
        )}

        {experiences.map((exp) =>
          editando?.id === exp.id ? (
            <ExperienceForm key={exp.id} experience={exp} onClose={() => setEditando(undefined)} />
          ) : (
            <div key={exp.id} className="flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/30">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase aria-hidden className="size-4.5" />
              </span>
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-medium">{exp.position}</p>
                <p className="text-sm">{exp.company}</p>
                <p className="text-sm text-muted-foreground">
                  {exp.sector} · {formatDate(exp.startDate)} –{" "}
                  {exp.isCurrent ? "Actualidad" : formatDate(exp.endDate)}
                  {exp.salaryRange && ` · ${SALARY_RANGE_LABELS[exp.salaryRange]}`}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {exp.isCurrent && <Badge variant="soft">Actual</Badge>}
                  {exp.isFirstJob && <Badge variant="secondary">Primer empleo</Badge>}
                  {exp.isSelfEmployed && <Badge variant="outline">Independiente</Badge>}
                </div>
              </div>
              {editable && (
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label="Editar experiencia"
                    onClick={() => setEditando(exp)}>
                    <Pencil aria-hidden />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="Eliminar experiencia"
                    disabled={eliminar.isPending}
                    onClick={() => {
                      if (window.confirm(`¿Eliminar la experiencia en ${exp.company}?`)) {
                        eliminar.mutate(exp.id);
                      }
                    }}>
                    <Trash2 aria-hidden className="text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ),
        )}
      </CardContent>
    </Card>
  );
}
