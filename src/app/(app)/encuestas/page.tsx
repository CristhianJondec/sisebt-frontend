"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, CircleCheck, ClipboardList, ListChecks } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import { MY_SURVEYS_QUERY_KEY, fetchMySurveys, formatDateTime } from "@/lib/surveys";

function MisEncuestas() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: MY_SURVEYS_QUERY_KEY,
    queryFn: fetchMySurveys,
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No tienes encuestas vigentes"
        description="Te avisaremos cuando la escuela publique una nueva encuesta de seguimiento."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((s) => (
        <Card key={s.id} className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="mb-1">
              {s.answered ? (
                <Badge variant="secondary">
                  <CircleCheck aria-hidden />
                  Respondida
                </Badge>
              ) : (
                <Badge variant="soft">Pendiente</Badge>
              )}
            </div>
            <CardTitle>{s.title}</CardTitle>
            {s.description && <CardDescription className="line-clamp-2">{s.description}</CardDescription>}
          </CardHeader>
          <CardContent className="mt-auto flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarClock aria-hidden className="size-3.5" />
              Hasta el {formatDateTime(s.closesAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <ListChecks aria-hidden className="size-3.5" />
              {s.questions.length} preguntas · Periodo {s.period}
            </span>
          </CardContent>
          <CardFooter className="justify-end">
            {s.answered ? (
              <span className="text-sm text-muted-foreground">¡Gracias por participar!</span>
            ) : (
              <Link href={`/encuestas/${s.id}`} className={buttonVariants({ size: "sm" })}>
                Responder
                <ArrowRight aria-hidden />
              </Link>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function EncuestasPage() {
  return (
    <RequireRole roles={["GRADUATE"]}>
      <PageHeader
        title="Mis encuestas"
        description="Encuestas de seguimiento dirigidas a tu promoción."
      />
      <MisEncuestas />
    </RequireRole>
  );
}
