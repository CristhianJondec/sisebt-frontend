"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApplicationsTable } from "@/components/jobs/applications-table";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, QK, fetchAllApplications } from "@/lib/jobs";
import { cn } from "@/lib/utils";

function PostulacionesAdmin() {
  const consulta = useQuery({ queryKey: [...QK.applications, "all"], queryFn: fetchAllApplications });
  const [estado, setEstado] = useState<ApplicationStatus | null>(null);

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const todas = consulta.data;
  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEstado(estado === e ? null : e)}
            aria-pressed={estado === e}
            className={cn(
              "flex flex-col gap-1 rounded-xl border bg-card px-4 py-3 text-left shadow-xs transition-colors hover:border-primary/40",
              estado === e && "border-primary bg-primary/5",
            )}
          >
            <span className="text-xs text-muted-foreground">{APPLICATION_STATUS_LABELS[e]}</span>
            <span className="text-2xl font-semibold tabular-nums">{todas.filter((a) => a.status === e).length}</span>
          </button>
        ))}
      </section>

      <Card className="gap-0 py-0">
        <ApplicationsTable applications={estado ? todas.filter((a) => a.status === estado) : todas} />
      </Card>
    </>
  );
}

export default function PostulacionesAdminPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <PageHeader
        title="Postulaciones"
        description="Seguimiento del proceso de selección en todas las ofertas."
      />
      <PostulacionesAdmin />
    </RequireRole>
  );
}
