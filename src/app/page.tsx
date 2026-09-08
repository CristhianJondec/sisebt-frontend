"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader2, RefreshCw } from "lucide-react";
import { SessionCard } from "@/components/session-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_URL } from "@/lib/api-client";
import { HEALTH_QUERY_KEY, fetchHealth } from "@/lib/health";

export default function Home() {
  const { data, error, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: fetchHealth,
  });

  // Tres estados diferenciados: cargando, error (Offline) y exito (Online).
  const etiqueta = isPending ? "Comprobando..." : isError ? "Offline" : "Online";
  const indicadores = Object.entries(data?.details ?? {});

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">SISEBT</h1>
        <p className="text-muted-foreground">
          Sistema de Seguimiento de Egresados y Bolsa de Trabajo
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isPending ? (
              <Loader2 aria-hidden className="size-5 animate-spin text-muted-foreground" />
            ) : isError ? (
              <CircleX aria-hidden className="size-5 text-destructive" />
            ) : (
              <CircleCheck aria-hidden className="size-5 text-emerald-600" />
            )}
            <span data-testid="backend-status">Backend Status: {etiqueta}</span>
          </CardTitle>
          <CardDescription>
            Consultando <code>{API_URL}/health</code>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {isPending && (
            <p className="text-sm text-muted-foreground" role="status">
              Contactando con la API...
            </p>
          )}

          {isError && (
            <p className="text-sm text-destructive" role="alert">
              No se pudo obtener el estado del backend: {error.message}
            </p>
          )}

          {indicadores.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicador</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicadores.map(([nombre, indicador]) => (
                  <TableRow key={nombre}>
                    <TableCell className="font-medium">{nombre}</TableCell>
                    <TableCell>{indicador.status}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {indicador.message ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Button
            variant="outline"
            className="self-start"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw aria-hidden className={isFetching ? "animate-spin" : undefined} />
            Reintentar
          </Button>
        </CardContent>
      </Card>

      <SessionCard />
    </main>
  );
}
