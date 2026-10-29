"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import { MY_SURVEYS_QUERY_KEY, fetchMySurveys, formatDateTime } from "@/lib/surveys";

function MisEncuestas() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: MY_SURVEYS_QUERY_KEY,
    queryFn: fetchMySurveys,
  });

  if (isPending) {
    return <Loader2 aria-label="Cargando" className="size-5 animate-spin text-muted-foreground" />;
  }
  if (isError) {
    return <p className="text-sm text-destructive" role="alert">{apiErrorMessage(error)}</p>;
  }
  if (data.length === 0) {
    return <p className="text-muted-foreground">No tienes encuestas vigentes por ahora.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((s) => (
        <Card key={s.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {s.title}
              {s.answered ? (
                <Badge variant="secondary">
                  <CircleCheck aria-hidden />
                  Respondida
                </Badge>
              ) : (
                <Badge>Pendiente</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Periodo {s.period} · Disponible hasta el {formatDateTime(s.closesAt)} ·{" "}
              {s.questions.length} preguntas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {s.description && <p className="text-sm">{s.description}</p>}
            {!s.answered && (
              <Link href={`/encuestas/${s.id}`} className={buttonVariants({ className: "self-start" })}>
                Responder
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EncuestasPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Inicio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Mis encuestas</h1>
      </header>
      <RequireRole roles={["GRADUATE"]}>
        <MisEncuestas />
      </RequireRole>
    </main>
  );
}
