"use client";

import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { HEALTH_QUERY_KEY, fetchHealth } from "@/lib/health";
import { cn } from "@/lib/utils";

/** Indicador compacto del estado de la API (GET /health). Clic para reintentar. */
export function SystemStatus() {
  const { isPending, isError, isFetching, error, refetch } = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: fetchHealth,
  });

  const etiqueta = isPending ? "Comprobando..." : isError ? "API sin conexión" : "API en línea";

  return (
    <button
      type="button"
      onClick={() => void refetch()}
      disabled={isFetching}
      title={isError ? `No se pudo obtener el estado: ${error.message}` : "Volver a comprobar"}
      className="inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3.5 text-xs font-medium shadow-xs transition-colors hover:bg-muted disabled:opacity-80"
    >
      <span className="relative flex size-2">
        {!isPending && !isError && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            isPending ? "bg-muted-foreground" : isError ? "bg-destructive" : "bg-primary",
          )}
        />
      </span>
      <span data-testid="backend-status">{etiqueta}</span>
      {isFetching && !isPending && <RefreshCw aria-hidden className="size-3 animate-spin text-muted-foreground" />}
    </button>
  );
}
