"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, CircleCheck, FileUser, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/charts";
import { OffersTable } from "@/components/jobs/offers-table";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/graduates";
import { AREAS, MODALITY_LABELS, type Offer, QK, fetchOffers, setOfferStatus } from "@/lib/jobs";

function OfertasAdmin() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [area, setArea] = useState("");
  const [modalidad, setModalidad] = useState("");
  const consulta = useQuery({ queryKey: [...QK.offers, "admin"], queryFn: () => fetchOffers() });

  const alternar = useMutation({
    mutationFn: (o: Offer) => setOfferStatus(o.id, o.status === "OPEN" ? "CLOSED" : "OPEN"),
    onSuccess: (o) => {
      toast.success(o.status === "OPEN" ? `${o.title} reabierta` : `${o.title} cerrada`);
      void queryClient.invalidateQueries({ queryKey: QK.offers });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const todas = consulta.data;
  const ofertas = todas.filter(
    (o) =>
      (!area || o.area === area) &&
      (!modalidad || o.modality === modalidad) &&
      `${o.title} ${o.company.name}`.toLowerCase().includes(busqueda.trim().toLowerCase()),
  );

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ofertas publicadas" icon={BriefcaseBusiness} value={todas.length} />
        <StatCard label="Vigentes" icon={CircleCheck} value={todas.filter((o) => o.acceptingApplications).length} />
        <StatCard label="Postulaciones" icon={FileUser} value={todas.reduce((s, o) => s + o.applicationCount, 0)} />
      </section>

      <Card className="gap-0 py-0">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar oferta" placeholder="Buscar por puesto o empresa" className="pl-9"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <NativeSelect aria-label="Área" value={area} onChange={(e) => setArea(e.target.value)}>
            <NativeSelectOption value="">Todas las áreas</NativeSelectOption>
            {AREAS.map((a) => <NativeSelectOption key={a} value={a}>{a}</NativeSelectOption>)}
          </NativeSelect>
          <NativeSelect aria-label="Modalidad" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
            <NativeSelectOption value="">Todas las modalidades</NativeSelectOption>
            {Object.entries(MODALITY_LABELS).map(([v, l]) => <NativeSelectOption key={v} value={v}>{l}</NativeSelectOption>)}
          </NativeSelect>
        </div>
        <OffersTable offers={ofertas} onToggle={(o) => alternar.mutate(o)} />
      </Card>
    </>
  );
}

export default function OfertasAdminPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <PageHeader
        title="Ofertas laborales"
        description="Supervisa las ofertas publicadas por las empresas aprobadas."
      />
      <OfertasAdmin />
    </RequireRole>
  );
}
