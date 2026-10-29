"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarClock, Check, MapPin, Search, Wallet } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { SALARY_RANGE_LABELS, apiErrorMessage } from "@/lib/graduates";
import {
  AREAS,
  CONTRACT_LABELS,
  type ContractType,
  EXPERIENCE_LEVELS,
  MODALITY_LABELS,
  type Modality,
  type Offer,
  QK,
  applyToOffer,
  fetchOffers,
  formatShortDate,
  initials,
} from "@/lib/jobs";

const SIN_FILTROS = { area: "", experience: "", location: "", contractType: "", modality: "" };

function Ofertas() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [detalle, setDetalle] = useState<Offer | null>(null);
  const search = useDeferredValue(busqueda.trim());

  const params = {
    ...filtros,
    contractType: (filtros.contractType || undefined) as ContractType | undefined,
    modality: (filtros.modality || undefined) as Modality | undefined,
    search,
  };
  const ofertas = useQuery({ queryKey: [...QK.offers, params], queryFn: () => fetchOffers(params) });
  // Ubicaciones a partir de todas las ofertas vigentes (sin filtrar).
  const todas = useQuery({ queryKey: [...QK.offers, {}], queryFn: () => fetchOffers() });
  const ubicaciones = [...new Set(todas.data?.map((o) => o.location) ?? [])].sort();

  const postular = useMutation({
    mutationFn: (o: Offer) => applyToOffer(o.id),
    onSuccess: (_, o) => {
      toast.success(`Postulaste a ${o.title}`, { description: "La empresa recibió tus datos de perfil." });
      setDetalle(null);
      void queryClient.invalidateQueries({ queryKey: QK.offers });
      void queryClient.invalidateQueries({ queryKey: QK.applications });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const set = (campo: keyof typeof filtros, valor: string) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const activos = Object.values(filtros).filter(Boolean).length;
  const lista = ofertas.data ?? [];

  return (
    <>
      <PageHeader
        title="Ofertas laborales"
        description="Oportunidades publicadas por empresas validadas por la escuela."
      />

      <Card className="gap-3">
        <CardContent className="flex flex-col gap-3">
          <div className="relative">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar ofertas" placeholder="Puesto, empresa o palabra clave" className="h-10 pl-9"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <NativeSelect aria-label="Área" className="w-full" value={filtros.area} onChange={(e) => set("area", e.target.value)}>
              <NativeSelectOption value="">Área</NativeSelectOption>
              {AREAS.map((a) => <NativeSelectOption key={a} value={a}>{a}</NativeSelectOption>)}
            </NativeSelect>
            <NativeSelect aria-label="Experiencia" className="w-full" value={filtros.experience} onChange={(e) => set("experience", e.target.value)}>
              <NativeSelectOption value="">Experiencia</NativeSelectOption>
              {EXPERIENCE_LEVELS.map((x) => <NativeSelectOption key={x} value={x}>{x}</NativeSelectOption>)}
            </NativeSelect>
            <NativeSelect aria-label="Ubicación" className="w-full" value={filtros.location} onChange={(e) => set("location", e.target.value)}>
              <NativeSelectOption value="">Ubicación</NativeSelectOption>
              {ubicaciones.map((u) => <NativeSelectOption key={u} value={u}>{u}</NativeSelectOption>)}
            </NativeSelect>
            <NativeSelect aria-label="Tipo de contrato" className="w-full" value={filtros.contractType} onChange={(e) => set("contractType", e.target.value)}>
              <NativeSelectOption value="">Tipo de contrato</NativeSelectOption>
              {Object.entries(CONTRACT_LABELS).map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}
            </NativeSelect>
            <NativeSelect aria-label="Modalidad" className="w-full" value={filtros.modality} onChange={(e) => set("modality", e.target.value)}>
              <NativeSelectOption value="">Modalidad</NativeSelectOption>
              {Object.entries(MODALITY_LABELS).map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{lista.length} {lista.length === 1 ? "oferta encontrada" : "ofertas encontradas"}</span>
            {activos > 0 && (
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setFiltros(SIN_FILTROS)}>
                Limpiar filtros ({activos})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {ofertas.isPending ? (
        <LoadingState label="Cargando ofertas..." />
      ) : ofertas.isError ? (
        <ErrorState>{apiErrorMessage(ofertas.error)}</ErrorState>
      ) : lista.length === 0 ? (
        <EmptyState icon={BriefcaseBusiness} title="No hay ofertas con esos criterios" description="Prueba quitando algunos filtros." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {lista.map((o) => (
            <Card key={o.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(o.company.name)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <CardTitle>{o.title}</CardTitle>
                    <span className="text-sm text-muted-foreground">{o.company.name}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="soft">{MODALITY_LABELS[o.modality]}</Badge>
                  <Badge variant="secondary">{CONTRACT_LABELS[o.contractType]}</Badge>
                  <Badge variant="outline">{o.experience}</Badge>
                </div>
                <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><MapPin aria-hidden className="size-3.5" />{o.location}</span>
                  {o.salaryRange && <span className="flex items-center gap-1.5"><Wallet aria-hidden className="size-3.5" />{SALARY_RANGE_LABELS[o.salaryRange]}</span>}
                  <span className="flex items-center gap-1.5"><CalendarClock aria-hidden className="size-3.5" />Hasta el {formatShortDate(o.deadline)}</span>
                </div>
              </CardContent>
              <CardFooter className="justify-between gap-2">
                <Button size="sm" variant="ghost" onClick={() => setDetalle(o)}>Ver detalle</Button>
                {o.applied ? (
                  <Button size="sm" variant="secondary" disabled>
                    <Check aria-hidden />
                    Postulado
                  </Button>
                ) : (
                  <Button size="sm" disabled={postular.isPending} onClick={() => postular.mutate(o)}>Postular</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={detalle !== null}
        onClose={() => setDetalle(null)}
        title={detalle?.title ?? ""}
        description={detalle ? `${detalle.company.name} · ${detalle.location}` : undefined}
      >
        {detalle && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="soft">{MODALITY_LABELS[detalle.modality]}</Badge>
              <Badge variant="secondary">{CONTRACT_LABELS[detalle.contractType]}</Badge>
              <Badge variant="outline">{detalle.experience}</Badge>
              <Badge variant="outline">{detalle.area}</Badge>
            </div>
            <section className="flex flex-col gap-1">
              <h3 className="font-medium">Descripción</h3>
              <p className="whitespace-pre-line text-muted-foreground">{detalle.description}</p>
            </section>
            {detalle.requirements && (
              <section className="flex flex-col gap-1">
                <h3 className="font-medium">Requisitos</h3>
                <p className="whitespace-pre-line text-muted-foreground">{detalle.requirements}</p>
              </section>
            )}
            <p className="text-xs text-muted-foreground">
              {detalle.salaryRange ? `${SALARY_RANGE_LABELS[detalle.salaryRange]} · ` : ""}
              Postulaciones hasta el {formatShortDate(detalle.deadline)}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDetalle(null)}>Cerrar</Button>
              {!detalle.applied && (
                <Button disabled={postular.isPending} onClick={() => postular.mutate(detalle)}>Postular</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function OfertasPage() {
  return (
    <RequireRole roles={["GRADUATE"]}>
      <Ofertas />
    </RequireRole>
  );
}
