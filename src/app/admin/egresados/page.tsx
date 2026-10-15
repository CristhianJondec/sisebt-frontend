"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { formatInsertion } from "@/components/graduates/profile-view";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search aria-hidden className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar"
              placeholder="Buscar por nombre, DNI o código"
              className="pl-8"
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
          <p className="text-sm text-destructive" role="alert">
            {apiErrorMessage(error)}
          </p>
        )}

        {isPending ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : data && data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay egresados que coincidan.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Egresado</TableHead>
                <TableHead>DNI</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Promoción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inserción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/egresados/${g.id}`} className="underline-offset-4 hover:underline">
                      {g.lastName}, {g.firstName}
                    </Link>
                  </TableCell>
                  <TableCell>{g.dni}</TableCell>
                  <TableCell>{g.program}</TableCell>
                  <TableCell>{g.graduationDate.slice(0, 4)}</TableCell>
                  <TableCell>
                    <Badge variant={g.employmentStatus === "UNEMPLOYED" ? "outline" : "default"}>
                      {EMPLOYMENT_STATUS_LABELS[g.employmentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatInsertion(g.insertionMonths)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function EgresadosPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Inicio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Egresados</h1>
      </header>
      <RequireRole roles={["ADMIN"]}>
        <ListadoEgresados />
      </RequireRole>
    </main>
  );
}
