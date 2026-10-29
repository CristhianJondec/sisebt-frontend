"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Clock, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { CompanyStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/lib/graduates";
import { type Company, QK, fetchCompanies, formatShortDate, initials, setCompanyStatus } from "@/lib/jobs";

function Empresas() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const consulta = useQuery({ queryKey: QK.companies, queryFn: fetchCompanies });

  const resolver = useMutation({
    mutationFn: ({ c, aprobar }: { c: Company; aprobar: boolean }) =>
      setCompanyStatus(c.id, aprobar ? "APPROVED" : "REJECTED"),
    onSuccess: (c) => {
      toast.success(c.status === "APPROVED" ? `${c.name} fue aprobada` : `${c.name} fue rechazada`);
      void queryClient.invalidateQueries({ queryKey: QK.companies });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const todas = consulta.data;
  const termino = busqueda.trim().toLowerCase();
  const empresas = todas.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(termino));

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registradas" icon={Building2} value={todas.length} />
        <StatCard label="Aprobadas" icon={Check} value={todas.filter((c) => c.status === "APPROVED").length} />
        <StatCard label="Pendientes" icon={Clock} value={todas.filter((c) => c.status === "PENDING").length}
          hint="Requieren validación" />
      </section>

      <Card className="gap-0 py-0">
        <div className="border-b p-4">
          <div className="relative max-w-sm">
            <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Buscar empresa" placeholder="Buscar empresa" className="pl-9"
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
        </div>
        {empresas.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No hay empresas que coincidan.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Empresa</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Ofertas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-48 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="pl-4">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                        {initials(c.name)}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{c.contactEmail}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums">{c.phone ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatShortDate(c.createdAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.offerCount}</TableCell>
                  <TableCell>
                    <CompanyStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      {c.status !== "REJECTED" && (
                        <Button size="sm" variant="outline" disabled={resolver.isPending}
                          onClick={() => resolver.mutate({ c, aprobar: false })}>
                          <X aria-hidden />
                          Rechazar
                        </Button>
                      )}
                      {c.status !== "APPROVED" && (
                        <Button size="sm" disabled={resolver.isPending} onClick={() => resolver.mutate({ c, aprobar: true })}>
                          <Check aria-hidden />
                          Aprobar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function EmpresasPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <PageHeader
        title="Empresas"
        description="Valida las empresas registradas antes de que puedan publicar ofertas."
      />
      <Empresas />
    </RequireRole>
  );
}
