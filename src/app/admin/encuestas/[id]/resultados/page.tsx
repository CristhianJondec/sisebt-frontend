"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  QUESTION_TYPE_LABELS,
  type QuestionSummary,
  SURVEY_STATUS_LABELS,
  audienceLabel,
  fetchSurveyResults,
} from "@/lib/surveys";

function ResumenPregunta({ q, indice }: { q: QuestionSummary; indice: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {indice + 1}. {q.text}
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
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
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
              {q.texts.map((t, i) => (
                <li key={i} className="rounded-md bg-muted p-2">{t}</li>
              ))}
            </ul>
          )
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opción</TableHead>
                <TableHead className="w-1/2" />
                <TableHead className="text-right">Conteo</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.options.map((o) => (
                <TableRow key={o.option}>
                  <TableCell>{o.option}</TableCell>
                  <TableCell>
                    <Progress value={o.percentage} aria-label={`${o.option}: ${o.percentage}%`} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{o.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

  if (isPending) {
    return <Loader2 aria-label="Cargando" className="size-5 animate-spin text-muted-foreground" />;
  }
  if (isError) {
    return <p className="text-sm text-destructive" role="alert">{apiErrorMessage(error)}</p>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {data.survey.title}
            <Badge variant="outline">{SURVEY_STATUS_LABELS[data.survey.status]}</Badge>
          </CardTitle>
          <CardDescription>
            Periodo {data.survey.period} · {audienceLabel(data.survey.targetCohort)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm">
            Tasa de respuesta:{" "}
            <span className="text-2xl font-semibold tabular-nums">{data.responseRate}%</span>{" "}
            <span className="text-muted-foreground">
              ({data.responses} de {data.eligible} egresados)
            </span>
          </p>
          <Progress value={Math.min(data.responseRate, 100)} aria-label="Tasa de respuesta" />
        </CardContent>
      </Card>

      {data.questions.map((q, i) => (
        <ResumenPregunta key={q.questionId} q={q} indice={i} />
      ))}
    </>
  );
}

export default function ResultadosPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href={`/admin/encuestas/${id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Encuesta
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Resultados</h1>
      </header>
      <RequireRole roles={["ADMIN"]}>
        <Resultados id={id} />
      </RequireRole>
    </main>
  );
}
