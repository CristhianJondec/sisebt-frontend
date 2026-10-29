"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, FileUser } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { ApplicationBadge } from "@/components/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  QK,
  fetchMyApplications,
  formatShortDate,
  initials,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

const ETAPAS: ApplicationStatus[] = ["RECEIVED", "IN_REVIEW", "ACCEPTED"];

/** Línea de avance del proceso: recibida → en revisión → resultado. */
function Avance({ estado }: { estado: ApplicationStatus }) {
  const actual = estado === "REJECTED" ? 2 : ETAPAS.indexOf(estado);
  return (
    <ol className="flex items-center gap-2">
      {ETAPAS.map((etapa, i) => (
        <li key={etapa} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "h-1.5 flex-1 rounded-full bg-muted",
              i <= actual && (estado === "REJECTED" && i === 2 ? "bg-destructive/60" : "bg-primary"),
            )}
          />
          <span className={cn("hidden text-xs sm:inline", i <= actual ? "text-foreground" : "text-muted-foreground")}>
            {i === 2 && estado === "REJECTED" ? APPLICATION_STATUS_LABELS.REJECTED : APPLICATION_STATUS_LABELS[etapa]}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Postulaciones() {
  const consulta = useQuery({ queryKey: [...QK.applications, "mine"], queryFn: fetchMyApplications });

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;
  if (consulta.data.length === 0) {
    return (
      <EmptyState
        icon={FileUser}
        title="Aún no has postulado"
        description="Explora las ofertas laborales y postula con un clic usando tu perfil."
        action={<Link href="/ofertas" className={buttonVariants()}>Ver ofertas</Link>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {consulta.data.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                  {initials(a.offer.company.name)}
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{a.offer.title}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 aria-hidden className="size-3.5" />{a.offer.company.name}</span>
                    <span className="flex items-center gap-1"><CalendarDays aria-hidden className="size-3.5" />Postulaste el {formatShortDate(a.createdAt)}</span>
                  </span>
                </div>
              </div>
              <ApplicationBadge status={a.status} />
            </div>
            <Avance estado={a.status} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PostulacionesPage() {
  return (
    <RequireRole roles={["GRADUATE"]}>
      <PageHeader title="Mis postulaciones" description="Sigue el estado de tus procesos de selección." />
      <Postulaciones />
    </RequireRole>
  );
}
