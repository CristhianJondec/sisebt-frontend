"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { NIVEL_COLOR, ScoreBar } from "@/components/ai/match-button";
import { Button } from "@/components/ui/button";
import { AI_STATUS_QUERY_KEY, fetchAiStatus, rankApplicants } from "@/lib/ai";
import { apiErrorMessage } from "@/lib/graduates";
import type { Application } from "@/lib/jobs";

/**
 * Ranking con IA de los postulantes de UNA oferta. La IA ve perfiles
 * anonimizados (carrera, grado, experiencia), nunca nombre ni DNI.
 */
export function RankPanel({ offerId, applications }: { offerId: string | null; applications: Application[] }) {
  const estado = useQuery({ queryKey: AI_STATUS_QUERY_KEY, queryFn: fetchAiStatus, staleTime: 5 * 60_000 });
  const ordenar = useMutation({ mutationFn: () => rankApplicants(offerId!) });
  const { reset } = ordenar;

  // Otra oferta seleccionada: el ranking anterior ya no aplica.
  useEffect(() => reset(), [offerId, reset]);

  if (!estado.data?.enabled || applications.length === 0) return null;
  if (!offerId) {
    return (
      <p className="flex items-center gap-2 border-b bg-primary/[0.03] px-4 py-2.5 text-xs text-muted-foreground">
        <Sparkles aria-hidden className="size-3.5 text-primary" />
        Elige una oferta para ordenar a sus postulantes por compatibilidad con IA.
      </p>
    );
  }

  const porId = new Map(applications.map((a) => [a.graduate.id, a]));

  return (
    <div className="flex flex-col gap-3 border-b bg-primary/[0.03] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Sparkles aria-hidden className="size-4 text-primary" />
            Ranking de compatibilidad con IA
          </span>
          <span className="text-xs text-muted-foreground">
            Orientativo: compara carrera, grado y experiencia con la oferta. Los datos se envían anonimizados.
          </span>
        </div>
        <Button size="sm" variant={ordenar.data ? "outline" : "default"} disabled={ordenar.isPending}
          onClick={() => ordenar.mutate()}>
          {ordenar.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}
          {ordenar.isPending ? "Analizando..." : ordenar.data ? "Volver a analizar" : "Ordenar con IA"}
        </Button>
      </div>

      {ordenar.isError && <p className="text-sm text-destructive">{apiErrorMessage(ordenar.error)}</p>}

      {ordenar.data && (
        <ol className="flex flex-col gap-2">
          {ordenar.data.map((r, i) => {
            const a = porId.get(r.graduateId);
            if (!a) return null;
            return (
              <li key={r.graduateId} className="grid grid-cols-[1.5rem_1fr_auto] items-start gap-3 rounded-lg border bg-card p-3">
                <span className="pt-0.5 text-sm font-semibold text-muted-foreground tabular-nums">{i + 1}</span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Link href={`/empresa/postulantes/${a.graduate.id}`} className="truncate text-sm font-medium hover:text-primary hover:underline">
                    {a.graduate.firstName} {a.graduate.lastName}
                  </Link>
                  <ScoreBar score={r.score} level={r.level} />
                  <p className="text-xs text-muted-foreground">{r.summary}</p>
                </div>
                <span className={`text-lg font-semibold tabular-nums ${NIVEL_COLOR[r.level]}`}>{r.score}%</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
