"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CompanyStatusNotice, useMyCompany } from "@/components/jobs/company-gate";
import { OfferForm } from "@/components/jobs/offer-form";
import { OffersTable } from "@/components/jobs/offers-table";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import {
  type Offer,
  type OfferInput,
  QK,
  createOffer,
  fetchMyOffers,
  setOfferStatus,
  updateOffer,
} from "@/lib/jobs";

function OfertasEmpresa() {
  const queryClient = useQueryClient();
  const empresa = useMyCompany();
  const ofertas = useQuery({ queryKey: QK.myOffers, queryFn: fetchMyOffers });
  // null = cerrado, "nueva" = alta, Offer = edición.
  const [editando, setEditando] = useState<Offer | "nueva" | null>(null);

  const refrescar = () => queryClient.invalidateQueries({ queryKey: QK.offers });

  const guardar = useMutation({
    mutationFn: (input: OfferInput) =>
      editando && editando !== "nueva" ? updateOffer(editando.id, input) : createOffer(input),
    onSuccess: (o) => {
      toast.success(editando === "nueva" ? `Oferta publicada: ${o.title}` : "Oferta actualizada");
      setEditando(null);
      void refrescar();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const alternar = useMutation({
    mutationFn: (o: Offer) => setOfferStatus(o.id, o.status === "OPEN" ? "CLOSED" : "OPEN"),
    onSuccess: (o) => {
      toast.success(o.status === "OPEN" ? `${o.title} está abierta` : `${o.title} fue cerrada`);
      void refrescar();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const aprobada = empresa.data?.status === "APPROVED";

  return (
    <>
      <PageHeader
        title="Mis ofertas"
        description="Publica y administra las ofertas laborales de tu empresa."
        actions={
          !editando && (
            <Button disabled={!aprobada} onClick={() => setEditando("nueva")}>
              <Plus aria-hidden />
              Nueva oferta
            </Button>
          )
        }
      />
      <CompanyStatusNotice company={empresa.data} />
      {editando && (
        <OfferForm
          key={editando === "nueva" ? "nueva" : editando.id}
          offer={editando === "nueva" ? undefined : editando}
          pending={guardar.isPending}
          onSubmit={(input) => guardar.mutate(input)}
          onCancel={() => setEditando(null)}
        />
      )}
      {ofertas.isPending ? (
        <LoadingState />
      ) : ofertas.isError ? (
        <ErrorState>{apiErrorMessage(ofertas.error)}</ErrorState>
      ) : (
        <Card className="gap-0 py-0">
          <OffersTable
            offers={ofertas.data}
            showCompany={false}
            onEdit={aprobada ? (o) => setEditando(o) : undefined}
            onToggle={(o) => alternar.mutate(o)}
          />
        </Card>
      )}
    </>
  );
}

export default function OfertasEmpresaPage() {
  return (
    <RequireRole roles={["COMPANY"]}>
      <OfertasEmpresa />
    </RequireRole>
  );
}
