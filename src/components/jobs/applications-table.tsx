"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { ApplicationBadge } from "@/components/status-badges";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/lib/graduates";
import {
  APPLICATION_STATUS_LABELS,
  type Application,
  type ApplicationStatus,
  QK,
  formatShortDate,
  initials,
  setApplicationStatus,
} from "@/lib/jobs";

/**
 * Postulaciones con cambio de estado: cada cambio notifica al egresado.
 * El admin ve la empresa; la empresa no.
 */
export function ApplicationsTable({
  applications,
  showCompany = true,
}: {
  applications: Application[];
  showCompany?: boolean;
}) {
  const queryClient = useQueryClient();
  const cambiar = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) => setApplicationStatus(id, status),
    onSuccess: (a) => {
      toast.success(`${a.graduate.firstName} ${a.graduate.lastName}: ${APPLICATION_STATUS_LABELS[a.status]}`);
      void queryClient.invalidateQueries({ queryKey: QK.applications });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (applications.length === 0) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Todavía no hay postulaciones.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Postulante</TableHead>
          <TableHead>Oferta</TableHead>
          {showCompany && <TableHead>Empresa</TableHead>}
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="w-44">Cambiar estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((a) => {
          const nombre = `${a.graduate.firstName} ${a.graduate.lastName}`;
          return (
            <TableRow key={a.id}>
              <TableCell className="pl-4">
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials(nombre)}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-medium">{nombre}</span>
                    <a href={`mailto:${a.graduate.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                      <Mail aria-hidden className="size-3" />
                      {a.graduate.email}
                    </a>
                  </span>
                </span>
              </TableCell>
              <TableCell>{a.offer.title}</TableCell>
              {showCompany && <TableCell className="text-muted-foreground">{a.offer.company.name}</TableCell>}
              <TableCell className="tabular-nums">{formatShortDate(a.createdAt)}</TableCell>
              <TableCell>
                <ApplicationBadge status={a.status} />
              </TableCell>
              <TableCell>
                <NativeSelect
                  size="sm"
                  className="w-full"
                  aria-label={`Estado de ${nombre}`}
                  value={a.status}
                  disabled={cambiar.isPending && cambiar.variables?.id === a.id}
                  onChange={(e) => cambiar.mutate({ id: a.id, status: e.target.value as ApplicationStatus })}
                >
                  {Object.entries(APPLICATION_STATUS_LABELS).map(([valor, etiqueta]) => (
                    <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
