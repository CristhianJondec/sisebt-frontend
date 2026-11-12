"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CircleAlert, CircleCheck, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  AI_STATUS_QUERY_KEY,
  MATCH_LEVEL_LABELS,
  type MatchLevel,
  type MatchResult,
  fetchAiStatus,
  matchOffer,
} from "@/lib/ai";
import { apiErrorMessage } from "@/lib/graduates";
import type { Offer } from "@/lib/jobs";

export const NIVEL_COLOR: Record<MatchLevel, string> = {
  ALTO: "text-emerald-600 dark:text-emerald-400",
  MEDIO: "text-amber-600 dark:text-amber-400",
  BAJO: "text-rose-600 dark:text-rose-400",
};

const NIVEL_BARRA: Record<MatchLevel, string> = {
  ALTO: "bg-emerald-500",
  MEDIO: "bg-amber-500",
  BAJO: "bg-rose-500",
};

export function ScoreBar({ score, level }: { score: number; level: MatchLevel }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={score}
      aria-valuemin={0} aria-valuemax={100} aria-label="Puntaje de compatibilidad">
      <div className={`h-full rounded-full transition-all ${NIVEL_BARRA[level]}`} style={{ width: `${score}%` }} />
    </div>
  );
}

function Lista({ icon: Icon, titulo, items, color }: {
  icon: typeof Sparkles; titulo: string; items: string[]; color: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="font-medium">{titulo}</h3>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-muted-foreground">
            <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${color}`} />
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Resultado({ r }: { r: MatchResult }) {
  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex flex-col gap-2 rounded-xl border p-4">
        <div className="flex items-baseline justify-between">
          <span className={`font-medium ${NIVEL_COLOR[r.level]}`}>{MATCH_LEVEL_LABELS[r.level]}</span>
          <span className={`text-3xl font-semibold tabular-nums ${NIVEL_COLOR[r.level]}`}>{r.score}%</span>
        </div>
        <ScoreBar score={r.score} level={r.level} />
        <p className="text-muted-foreground">{r.summary}</p>
      </div>
      <Lista icon={CircleCheck} titulo="A tu favor" items={r.strengths} color="text-emerald-500" />
      <Lista icon={CircleAlert} titulo="Lo que te falta" items={r.gaps} color="text-amber-500" />
      <Lista icon={Lightbulb} titulo="Cómo mejorar tu postulación" items={r.tips} color="text-primary" />
      <p className="text-xs text-muted-foreground">
        Análisis orientativo generado con IA a partir de tu perfil (sin nombre ni DNI). La decisión final es de la empresa.
      </p>
    </div>
  );
}

/** Botón "Compatibilidad IA" de una oferta: abre el análisis en un modal. */
export function MatchButton({ offer }: { offer: Offer }) {
  const [abierto, setAbierto] = useState(false);
  const estado = useQuery({ queryKey: AI_STATUS_QUERY_KEY, queryFn: fetchAiStatus, staleTime: 5 * 60_000 });
  const analizar = useMutation({ mutationFn: () => matchOffer(offer.id) });

  if (!estado.data?.enabled) return null;

  function abrir() {
    setAbierto(true);
    // El backend cachea: reabrir el mismo análisis no vuelve a gastar cuota.
    if (!analizar.data && !analizar.isPending) analizar.mutate();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={abrir}>
        <Sparkles aria-hidden className="text-primary" />
        Compatibilidad IA
      </Button>
      <Modal wide open={abierto} onClose={() => setAbierto(false)} title={`¿Qué tan compatible eres con ${offer.title}?`}
        description={offer.company.name}>
        {analizar.isPending ? (
          <div className="flex flex-col items-center gap-3 py-10 text-sm text-muted-foreground">
            <Loader2 aria-hidden className="size-6 animate-spin text-primary" />
            Comparando tu perfil con la oferta...
          </div>
        ) : analizar.isError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm">
            <p className="text-destructive">{apiErrorMessage(analizar.error, "No se pudo completar el análisis")}</p>
            <Button size="sm" variant="outline" onClick={() => analizar.mutate()}>Reintentar</Button>
          </div>
        ) : analizar.data ? (
          <Resultado r={analizar.data} />
        ) : null}
      </Modal>
    </>
  );
}
