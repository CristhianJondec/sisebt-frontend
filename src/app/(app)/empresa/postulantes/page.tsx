"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { RankPanel } from "@/components/ai/rank-panel";
import { ApplicationsTable } from "@/components/jobs/applications-table";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Card } from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/graduates";
import { QK, fetchCompanyApplications } from "@/lib/jobs";

function Postulantes() {
  const consulta = useQuery({ queryKey: [...QK.applications, "company"], queryFn: fetchCompanyApplications });
  const [oferta, setOferta] = useState("");

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const ofertas = [...new Map(consulta.data.map((a) => [a.offer.id, a.offer.title])).entries()];
  const lista = oferta ? consulta.data.filter((a) => a.offer.id === oferta) : consulta.data;

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-3 border-b p-4">
        <span className="text-sm text-muted-foreground">{lista.length} postulantes</span>
        <NativeSelect aria-label="Filtrar por oferta" value={oferta} onChange={(e) => setOferta(e.target.value)}>
          <NativeSelectOption value="">Todas las ofertas</NativeSelectOption>
          {ofertas.map(([id, titulo]) => <NativeSelectOption key={id} value={id}>{titulo}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      <RankPanel offerId={oferta || null} applications={lista} />
      <ApplicationsTable applications={lista} showCompany={false} />
    </Card>
  );
}

export default function PostulantesPage() {
  return (
    <RequireRole roles={["COMPANY"]}>
      <PageHeader
        title="Postulantes"
        description="Revisa a los egresados que postularon y actualiza su estado; recibirán una notificación."
      />
      <Postulantes />
    </RequireRole>
  );
}
