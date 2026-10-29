"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { SALARY_RANGE_LABELS, type SalaryRange } from "@/lib/graduates";
import {
  AREAS,
  CONTRACT_LABELS,
  type ContractType,
  EXPERIENCE_LEVELS,
  MODALITY_LABELS,
  type Modality,
  type Offer,
  type OfferInput,
} from "@/lib/jobs";

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

interface OfferFormProps {
  offer?: Offer;
  pending: boolean;
  onSubmit: (input: OfferInput) => void;
  onCancel: () => void;
}

/** Formulario de alta y edición de ofertas (empresa). */
export function OfferForm({ offer, pending, onSubmit, onCancel }: OfferFormProps) {
  const [v, setV] = useState({
    title: offer?.title ?? "",
    area: offer?.area ?? AREAS[0],
    experience: offer?.experience ?? EXPERIENCE_LEVELS[0],
    contractType: offer?.contractType ?? ("FULL_TIME" as ContractType),
    modality: offer?.modality ?? ("ONSITE" as Modality),
    location: offer?.location ?? "Trujillo",
    salaryRange: offer?.salaryRange ?? "",
    deadline: offer?.deadline.slice(0, 10) ?? enDias(30),
    description: offer?.description ?? "",
    requirements: offer?.requirements ?? "",
  });
  const set = (campo: keyof typeof v) => (e: { target: { value: string } }) =>
    setV((previo) => ({ ...previo, [campo]: e.target.value }));

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onSubmit({
      ...v,
      salaryRange: (v.salaryRange || undefined) as SalaryRange | undefined,
      requirements: v.requirements.trim() || undefined,
    });
  }

  return (
    <Card className="border-primary/25">
      <CardHeader className="border-b">
        <CardTitle>{offer ? "Editar oferta" : "Nueva oferta laboral"}</CardTitle>
        <CardDescription>Los egresados podrán postular hasta la fecha límite.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="o-title">Título del puesto *</Label>
            <Input id="o-title" required maxLength={150} placeholder="Desarrollador Backend Jr." value={v.title} onChange={set("title")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-area">Área</Label>
            <NativeSelect id="o-area" className="w-full" value={v.area} onChange={set("area")}>
              {AREAS.map((a) => <NativeSelectOption key={a} value={a}>{a}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-exp">Experiencia requerida</Label>
            <NativeSelect id="o-exp" className="w-full" value={v.experience} onChange={set("experience")}>
              {EXPERIENCE_LEVELS.map((x) => <NativeSelectOption key={x} value={x}>{x}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-contract">Tipo de contrato</Label>
            <NativeSelect id="o-contract" className="w-full" value={v.contractType} onChange={set("contractType")}>
              {Object.entries(CONTRACT_LABELS).map(([k, l]) => <NativeSelectOption key={k} value={k}>{l}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-modality">Modalidad</Label>
            <NativeSelect id="o-modality" className="w-full" value={v.modality} onChange={set("modality")}>
              {Object.entries(MODALITY_LABELS).map(([k, l]) => <NativeSelectOption key={k} value={k}>{l}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-location">Ubicación *</Label>
            <Input id="o-location" required maxLength={100} value={v.location} onChange={set("location")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-salary">Rango salarial</Label>
            <NativeSelect id="o-salary" className="w-full" value={v.salaryRange} onChange={set("salaryRange")}>
              <NativeSelectOption value="">No especificar</NativeSelectOption>
              {Object.entries(SALARY_RANGE_LABELS).map(([k, l]) => <NativeSelectOption key={k} value={k}>{l}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="o-deadline">Fecha límite *</Label>
            <Input id="o-deadline" type="date" required min={enDias(0)} value={v.deadline} onChange={set("deadline")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="o-desc">Descripción del puesto *</Label>
            <Textarea id="o-desc" rows={4} required maxLength={5000} placeholder="Funciones y beneficios del puesto"
              value={v.description} onChange={set("description")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="o-req">Requisitos</Label>
            <Textarea id="o-req" rows={3} maxLength={3000} placeholder="Conocimientos, certificaciones, disponibilidad"
              value={v.requirements} onChange={set("requirements")} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : offer ? "Guardar cambios" : "Publicar oferta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
