"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Lock,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { SurveyStatusBadge } from "@/components/status-badges";
import { QuestionForm } from "@/components/surveys/question-form";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { apiErrorMessage } from "@/lib/graduates";
import {
  QUESTION_TYPE_LABELS,
  SURVEYS_QUERY_KEY,
  type SurveyDetail,
  audienceLabel,
  closeSurvey,
  dayToIso,
  deleteQuestion,
  deleteSurvey,
  fetchSurvey,
  formatDateTime,
  publishSurvey,
  reorderQuestions,
  surveyKey,
} from "@/lib/surveys";

const ANIO_ACTUAL = new Date().getFullYear();
const PROMOCIONES = Array.from({ length: 30 }, (_, i) => ANIO_ACTUAL - i);

function Preguntas({ survey }: { survey: SurveyDetail }) {
  const queryClient = useQueryClient();
  const editable = survey.status === "DRAFT";
  // null: ninguno abierto; "new": alta; id: edición.
  const [editando, setEditando] = useState<string | null>(null);

  const refrescar = () => queryClient.invalidateQueries({ queryKey: surveyKey(survey.id) });

  const eliminar = useMutation({
    mutationFn: (questionId: string) => deleteQuestion(survey.id, questionId),
    onSuccess: refrescar,
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const reordenar = useMutation({
    mutationFn: (ids: string[]) => reorderQuestions(survey.id, ids),
    onSuccess: refrescar,
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function mover(indice: number, delta: -1 | 1) {
    const ids = survey.questions.map((q) => q.id);
    const destino = indice + delta;
    [ids[indice], ids[destino]] = [ids[destino]!, ids[indice]!];
    reordenar.mutate(ids);
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Preguntas ({survey.questions.length})</CardTitle>
        {!editable && (
          <CardDescription>La encuesta ya fue publicada: las preguntas no se pueden modificar.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="flex flex-col gap-2.5">
          {survey.questions.map((q, i) =>
            editando === q.id ? (
              <li key={q.id}>
                <QuestionForm surveyId={survey.id} question={q} onClose={() => setEditando(null)} />
              </li>
            ) : (
              <li key={q.id} className="group flex items-start gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                  {i + 1}
                </span>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="font-medium">
                    {q.text} {q.required && <span className="text-destructive">*</span>}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">{QUESTION_TYPE_LABELS[q.type]}</Badge>
                    {q.isSatisfaction && <Badge variant="soft">Satisfacción (por defecto)</Badge>}
                  </div>
                  {q.options.length > 0 && (
                    <p className="text-sm text-muted-foreground">{q.options.join(" · ")}</p>
                  )}
                </div>
                {editable && (
                  <div className="flex gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
                    <Button size="icon-sm" variant="ghost" aria-label="Subir" disabled={i === 0 || reordenar.isPending}
                      onClick={() => mover(i, -1)}>
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Bajar"
                      disabled={i === survey.questions.length - 1 || reordenar.isPending}
                      onClick={() => mover(i, 1)}>
                      <ArrowDown aria-hidden />
                    </Button>
                    {!q.isSatisfaction && (
                      <>
                        <Button size="icon-sm" variant="ghost" aria-label="Editar" onClick={() => setEditando(q.id)}>
                          <Pencil aria-hidden />
                        </Button>
                        <Button size="icon-sm" variant="ghost" aria-label="Eliminar"
                          disabled={eliminar.isPending}
                          onClick={() => {
                            if (confirm("¿Eliminar esta pregunta?")) eliminar.mutate(q.id);
                          }}>
                          <Trash2 aria-hidden className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            ),
          )}
        </ol>

        {editable &&
          (editando === "new" ? (
            <QuestionForm surveyId={survey.id} question={null} onClose={() => setEditando(null)} />
          ) : (
            <Button variant="outline" className="self-start" onClick={() => setEditando("new")}>
              <Plus aria-hidden />
              Agregar pregunta
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}

function Publicar({ survey }: { survey: SurveyDetail }) {
  const queryClient = useQueryClient();
  const [opensAt, setOpensAt] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [closesAt, setClosesAt] = useState("");
  const [cohort, setCohort] = useState("");

  const mutacion = useMutation({
    mutationFn: () =>
      publishSurvey(survey.id, {
        opensAt: dayToIso(opensAt),
        closesAt: dayToIso(closesAt, true),
        targetCohort: cohort ? Number(cohort) : undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEY });
      toast.success("Encuesta publicada");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (closesAt < opensAt) {
      toast.error("La fecha de cierre debe ser posterior a la de apertura");
      return;
    }
    if (confirm("Una vez publicada no podrás modificar las preguntas. ¿Publicar?")) mutacion.mutate();
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Send aria-hidden className="size-4 text-primary" />
          Publicar
        </CardTitle>
        <CardDescription>Define el periodo de respuesta y a quién va dirigida.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="opensAt">Apertura *</Label>
            <Input id="opensAt" type="date" required value={opensAt}
              onChange={(e) => setOpensAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="closesAt">Cierre *</Label>
            <Input id="closesAt" type="date" required min={opensAt} value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cohort">Público objetivo</Label>
            <NativeSelect id="cohort" className="w-full" value={cohort}
              onChange={(e) => setCohort(e.target.value)}>
              <NativeSelectOption value="">Todos los egresados</NativeSelectOption>
              {PROMOCIONES.map((anio) => (
                <NativeSelectOption key={anio} value={anio}>Promoción {anio}</NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex justify-end sm:col-span-3">
            <Button type="submit" disabled={mutacion.isPending}>
              <Send aria-hidden />
              Publicar encuesta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function EditorEncuesta({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: survey, isPending, isError, error } = useQuery({
    queryKey: surveyKey(id),
    queryFn: () => fetchSurvey(id),
  });

  const eliminar = useMutation({
    mutationFn: () => deleteSurvey(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEY });
      toast.success("Encuesta eliminada");
      router.push("/admin/encuestas");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const cerrar = useMutation({
    mutationFn: () => closeSurvey(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEY });
      toast.success("Encuesta cerrada");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;

  return (
    <>
      <PageHeader
        back={{ href: "/admin/encuestas", label: "Encuestas" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {survey.title}
            <SurveyStatusBadge status={survey.status} />
          </span>
        }
        description={
          <>
            Periodo {survey.period}
            {survey.status !== "DRAFT" &&
              ` · ${formatDateTime(survey.opensAt)} al ${formatDateTime(survey.closesAt)} · ${audienceLabel(survey.targetCohort)}`}
            {survey.description && <span className="mt-1 block text-foreground/80">{survey.description}</span>}
          </>
        }
        actions={
          <>
            {survey.status !== "DRAFT" && (
              <Link href={`/admin/encuestas/${id}/resultados`} className={buttonVariants()}>
                <BarChart3 aria-hidden />
                Ver resultados
              </Link>
            )}
            {survey.status === "PUBLISHED" && (
              <Button variant="outline" disabled={cerrar.isPending}
                onClick={() => {
                  if (confirm("¿Cerrar la encuesta? Ya no se aceptarán respuestas.")) cerrar.mutate();
                }}>
                <Lock aria-hidden />
                Cerrar encuesta
              </Button>
            )}
            {survey.status === "DRAFT" && (
              <Button variant="destructive" disabled={eliminar.isPending}
                onClick={() => {
                  if (confirm("¿Eliminar este borrador?")) eliminar.mutate();
                }}>
                <Trash2 aria-hidden />
                Eliminar borrador
              </Button>
            )}
          </>
        }
      />

      <Preguntas survey={survey} />
      {survey.status === "DRAFT" && <Publicar survey={survey} />}
    </>
  );
}

export default function EncuestaAdminPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <RequireRole roles={["ADMIN"]}>
        <EditorEncuesta id={id} />
      </RequireRole>
    </div>
  );
}
