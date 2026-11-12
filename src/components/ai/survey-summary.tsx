"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Lightbulb, ListChecks, Loader2, MessagesSquare, Quote, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AI_STATUS_QUERY_KEY, type Sentiment, fetchAiStatus, summarizeSurvey } from "@/lib/ai";
import { apiErrorMessage } from "@/lib/graduates";

const SENTIMIENTO: Record<Sentiment, { label: string; className: string }> = {
  POSITIVO: { label: "Positivo", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  NEUTRO: { label: "Neutro", className: "bg-muted text-muted-foreground" },
  NEGATIVO: { label: "Negativo", className: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
};

function Bloque({ icon: Icon, titulo, items }: { icon: typeof Sparkles; titulo: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Icon aria-hidden className="size-4 text-primary" />
        {titulo}
      </h3>
      <ul className="flex flex-col gap-1.5 pl-6 text-sm text-muted-foreground">
        {items.map((t) => <li key={t} className="list-disc">{t}</li>)}
      </ul>
    </section>
  );
}

/** Informe con IA de una encuesta: hallazgos, temas de las respuestas abiertas y recomendaciones. */
export function SurveySummaryCard({ surveyId, responses }: { surveyId: string; responses: number }) {
  const estado = useQuery({ queryKey: AI_STATUS_QUERY_KEY, queryFn: fetchAiStatus, staleTime: 5 * 60_000 });
  const resumir = useMutation({ mutationFn: () => summarizeSurvey(surveyId) });
  const { reset } = resumir;

  useEffect(() => reset(), [surveyId, reset]);

  if (!estado.data?.enabled) return null;

  const r = resumir.data;
  // Llegaron respuestas nuevas desde el último análisis.
  const desactualizado = r !== undefined && r.responses !== responses;

  return (
    <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.05] to-transparent">
      <CardHeader className={r ? "border-b" : undefined}>
        <CardTitle className="flex items-center gap-2">
          <Sparkles aria-hidden className="size-4 text-primary" />
          Resumen con IA
        </CardTitle>
        <CardDescription>
          {r
            ? `Análisis de ${r.responses} respuesta${r.responses === 1 ? "" : "s"}${desactualizado ? " · hay respuestas nuevas" : ""}. Orientativo: verifica las cifras con los gráficos.`
            : responses === 0
              ? "Disponible cuando la encuesta reciba respuestas."
              : "Obtén hallazgos clave, temas recurrentes de las respuestas abiertas y recomendaciones para el informe."}
        </CardDescription>
        <CardAction>
          <Button variant={r && !desactualizado ? "outline" : "default"} disabled={responses === 0 || resumir.isPending}
            onClick={() => resumir.mutate()}>
            {resumir.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}
            {resumir.isPending ? "Analizando..." : r ? "Volver a analizar" : "Generar resumen"}
          </Button>
        </CardAction>
      </CardHeader>

      {resumir.isError && (
        <CardContent>
          <p className="text-sm text-destructive">{apiErrorMessage(resumir.error, "No se pudo generar el resumen")}</p>
        </CardContent>
      )}

      {r && (
        <CardContent className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed">{r.overview}</p>

          <Bloque icon={ListChecks} titulo="Hallazgos clave" items={r.findings} />

          {r.themes.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <MessagesSquare aria-hidden className="size-4 text-primary" />
                Temas en las respuestas abiertas
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {r.themes.map((t) => (
                  <div key={t.theme} className="flex flex-col gap-1.5 rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{t.theme}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline" className="tabular-nums">~{t.mentions}</Badge>
                        <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${SENTIMIENTO[t.sentiment].className}`}>
                          {SENTIMIENTO[t.sentiment].label}
                        </span>
                      </span>
                    </div>
                    {t.example && (
                      <p className="flex gap-1.5 text-xs text-muted-foreground italic">
                        <Quote aria-hidden className="size-3 shrink-0" />
                        {t.example}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <Bloque icon={Lightbulb} titulo="Recomendaciones" items={r.recommendations} />
        </CardContent>
      )}
    </Card>
  );
}
