"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, Download, GraduationCap, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { formatInsertion } from "@/components/graduates/profile-view";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { EmploymentBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EMPLOYMENT_STATUS_LABELS,
  type EmploymentStatus,
  apiErrorMessage,
  fetchGraduates,
} from "@/lib/graduates";
import { exportarEgresadosExcel } from "@/lib/export-excel";

const ANIO_ACTUAL = new Date().getFullYear();
const PROMOCIONES = Array.from({ length: 30 }, (_, i) => ANIO_ACTUAL - i);

function ListadoEgresados() {
  const [busqueda, setBusqueda] = useState("");
  const [promocion, setPromocion] = useState("");
  const [estado, setEstado] = useState("");
  // Evita una petición por cada tecla mientras se escribe.
  const busquedaDiferida = useDeferredValue(busqueda);

  const filtros = {
    search: busquedaDiferida.trim() || undefined,
    cohort: promocion ? Number(promocion) : undefined,
    employmentStatus: (estado || undefined) as EmploymentStatus | undefined,
  };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["graduates", "list", filtros],
    queryFn: () => fetchGraduates(filtros),
    placeholderData: keepPreviousData,
  });

  const [exportando, setExportando] = useState(false);
  async function exportar() {
    if (!data) return;
    setExportando(true);
    try {
      const aplicados = [
        filtros.search && `búsqueda "${filtros.search}"`,
        filtros.cohort && `promoción ${filtros.cohort}`,
        filtros.employmentStatus && EMPLOYMENT_STATUS_LABELS[filtros.employmentStatus],
      ].filter(Boolean).join(", ");
      await exportarEgresadosExcel(data, aplicados || undefined);
      toast.success("Excel de egresados descargado");
    } catch {
      toast.error("No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }

  return (
    <>
    <PageHeader
      title="Egresados"
      description="Directorio de egresados con su situación laboral y tiempo de inserción."
      actions={
        <Button variant="outline" onClick={exportar} disabled={!data?.length || exportando}>
          <Download aria-hidden />
          {exportando ? "Generando..." : "Exportar Excel"}
        </Button>
      }
    />
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-2 border-b p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar"
            placeholder="Buscar por nombre, DNI o código"
            className="pl-9"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <NativeSelect aria-label="Promoción" value={promocion} onChange={(e) => setPromocion(e.target.value)}>
          <NativeSelectOption value="">Todas las promociones</NativeSelectOption>
          {PROMOCIONES.map((anio) => (
            <NativeSelectOption key={anio} value={anio}>{anio}</NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Estado laboral" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <NativeSelectOption value="">Todos los estados</NativeSelectOption>
          {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([valor, etiqueta]) => (
            <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {isError && (
        <div className="p-4">
          <ErrorState>{apiErrorMessage(error)}</ErrorState>
        </div>
      )}

      {isPending ? (
        <LoadingState className="m-4" />
      ) : data && data.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No hay egresados que coincidan"
          description="Prueba con otros filtros o un término de búsqueda distinto."
          className="m-4"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Egresado</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Promoción</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Inserción</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((g) => (
              <TableRow key={g.id} className="group">
                <TableCell className="pl-4">
                  <Link href={`/admin/egresados/${g.id}`} className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {`${g.firstName[0] ?? ""}${g.lastName[0] ?? ""}`.toUpperCase()}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-medium group-hover:text-primary">
                        {g.lastName}, {g.firstName}
                      </span>
                      <span className="text-xs text-muted-foreground">{g.email}</span>
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="tabular-nums">{g.dni}</TableCell>
                <TableCell>{g.program}</TableCell>
                <TableCell className="tabular-nums">{g.graduationDate.slice(0, 4)}</TableCell>
                <TableCell>
                  <EmploymentBadge status={g.employmentStatus} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatInsertion(g.insertionMonths)}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/egresados/${g.id}`}
                    aria-label={`Ver ficha de ${g.firstName} ${g.lastName}`}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <ChevronRight aria-hidden className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data && data.length > 0 && (
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          {data.length} {data.length === 1 ? "egresado" : "egresados"}
        </div>
      )}
    </Card>
    </>
  );
}

export default function EgresadosPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <ListadoEgresados />
    </RequireRole>
  );
}
