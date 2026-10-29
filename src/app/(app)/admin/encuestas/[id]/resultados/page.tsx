"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, MessageSquareText, Smile, Target, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { BarList, StatCard } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { SurveyStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiErrorMessage } from "@/lib/graduates";
import {
  QUESTION_TYPE_LABELS,
  type QuestionSummary,
  audienceLabel,
  fetchSurveyResults,
} from "@/lib/surveys";

function ResumenPregunta({ q, indice }: { q: QuestionSummary; indice: number }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
            {indice + 1}
          </span>
          {q.text}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2 pl-9">
          <Badge variant="secondary">{QUESTION_TYPE_LABELS[q.type]}</Badge>
          {q.answered} respuesta{q.answered === 1 ? "" : "s"}
          {q.average !== null && (
            <span className="font-medium text-foreground">· Promedio {q.average.toFixed(2)} / 5</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {q.type === "TEXT" ? (
          q.texts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin respuestas.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto text-sm">
              {q.texts.map((t, i) => (
                <li key={i} className="flex gap-3 rounded-lg border bg-muted/30 p-3">
                  <MessageSquareText aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {t}
                </li>
              ))}
            </ul>
          )
        ) : (
          <BarList
            className="max-w-2xl"
            items={q.options.map((o) => ({ label: o.option, value: o.count, percentage: o.percentage }))}
          />
        )}
      </CardContent>
    </Card>
  );
}

function Resultados({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["surveys", "results", id],
    queryFn: () => fetchSurveyResults(id),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;

  const satisfaccion = data.questions.find((q) => q.isSatisfaction)?.average ?? null;

  return (
    <>
      <PageHeader
        back={{ href: `/admin/encuestas/${id}`, label: "Encuesta" }}
        title="Resultados"
        description={
          <span className="flex flex-wrap items-center gap-2">
            {data.survey.title} · Periodo {data.survey.period} · {audienceLabel(data.survey.targetCohort)}
            <SurveyStatusBadge status={data.survey.status} />
          </span>
        }
        actions={
          <Button variant="outline" disabled title="Disponible próximamente">
            <Download aria-hidden />
            Exportar
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tasa de respuesta</p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{data.responseRate}%</p>
            <Progress value={Math.min(data.responseRate, 100)} aria-label="Tasa de respuesta" />
          </CardContent>
        </Card>
        <StatCard label="Respuestas" icon={Users} value={data.responses} hint="Egresados que respondieron" />
        <StatCard label="Elegibles" icon={Target} value={data.eligible} hint="Público objetivo" />
        <StatCard label="Satisfacción" icon={Smile}
          value={satisfaccion !== null ? satisfaccion.toFixed(2) : "—"} hint="Promedio sobre 5" />
      </section>

      {data.questions.map((q, i) => (
        <ResumenPregunta key={q.questionId} q={q} indice={i} />
      ))}
    </>
  );
}

export default function ResultadosPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireRole roles={["ADMIN"]}>
      <Resultados id={id} />
    </RequireRole>
  );
}
