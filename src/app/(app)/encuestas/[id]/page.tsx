"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/graduates";
import {
  type GraduateSurvey,
  MY_SURVEYS_QUERY_KEY,
  type Question,
  SCALE_VALUES,
  apiFieldErrors,
  fetchMySurvey,
  submitSurvey,
} from "@/lib/surveys";

type Respuestas = Record<string, string[]>;

interface CampoProps {
  question: Question;
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}

function CampoPregunta({ question: q, values, error, onChange }: CampoProps) {
  const idError = `${q.id}-error`;
  const invalida = error ? true : undefined;

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={error ? idError : undefined}>
      <legend className="mb-3 font-medium">
        {q.text} {q.required && <span className="text-destructive">*</span>}
      </legend>

      {q.type === "TEXT" && (
        <Textarea aria-label={q.text} aria-invalid={invalida} maxLength={2000} value={values[0] ?? ""}
          onChange={(e) => onChange([e.target.value])} />
      )}

      {q.type === "SINGLE_CHOICE" && (
        <RadioGroup value={values[0] ?? ""} onValueChange={(v) => onChange([String(v)])}>
          {q.options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <RadioGroupItem value={o} aria-invalid={invalida} />
              {o}
            </label>
          ))}
        </RadioGroup>
      )}

      {q.type === "MULTIPLE_CHOICE" && (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3.5 py-2.5 text-sm transition-colors hover:bg-muted/50 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <Checkbox aria-invalid={invalida} checked={values.includes(o)}
                onCheckedChange={(marcada) =>
                  onChange(marcada ? [...values, o] : values.filter((v) => v !== o))
                } />
              {o}
            </label>
          ))}
        </div>
      )}

      {q.type === "SCALE" && (
        <RadioGroup value={values[0] ?? ""} onValueChange={(v) => onChange([String(v)])}
          className="flex flex-col gap-2">
          <div className="grid grid-cols-5 gap-2 sm:max-w-md">
            {SCALE_VALUES.map((v) => (
              <label key={v} className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border bg-card py-3 text-sm font-medium transition-colors hover:bg-muted/50 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 has-[[data-checked]]:text-primary">
                <RadioGroupItem value={v} aria-invalid={invalida} />
                {v}
              </label>
            ))}
          </div>
          <span className="flex justify-between text-xs text-muted-foreground sm:max-w-md">
            <span>1 = Nada</span>
            <span>5 = Mucho</span>
          </span>
        </RadioGroup>
      )}

      {error && (
        <p id={idError} className="text-sm text-destructive" role="alert">{error}</p>
      )}
    </fieldset>
  );
}

function validar(survey: GraduateSurvey, respuestas: Respuestas): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const q of survey.questions) {
    const values = (respuestas[q.id] ?? []).filter((v) => v.trim());
    if (q.required && values.length === 0) errores[q.id] = "Esta pregunta es obligatoria";
  }
  return errores;
}

function FormularioEncuesta({ survey }: { survey: GraduateSurvey }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [errores, setErrores] = useState<Record<string, string>>({});

  const mutacion = useMutation({
    mutationFn: () =>
      submitSurvey(
        survey.id,
        Object.entries(respuestas).map(([questionId, values]) => ({
          questionId,
          values: values.filter((v) => v.trim()),
        })),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: MY_SURVEYS_QUERY_KEY });
      toast.success("¡Gracias! Tus respuestas fueron enviadas");
      router.push("/encuestas");
    },
    onError: (error) => {
      setErrores(apiFieldErrors(error));
      toast.error(apiErrorMessage(error));
    },
  });

  const contestadas = survey.questions.filter((q) =>
    (respuestas[q.id] ?? []).some((v) => v.trim()),
  ).length;

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = validar(survey, respuestas);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      toast.error("Responde las preguntas obligatorias marcadas");
      return;
    }
    mutacion.mutate();
  }

  function cambiar(questionId: string, values: string[]) {
    setRespuestas((previo) => ({ ...previo, [questionId]: values }));
    setErrores((previo) => {
      const resto = { ...previo };
      delete resto[questionId];
      return resto;
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <div className="sticky top-14 z-10 -mx-1 flex items-center gap-4 rounded-xl border bg-card/90 px-4 py-3 shadow-xs backdrop-blur">
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {contestadas} de {survey.questions.length}
        </span>
        <Progress className="flex-1" value={(contestadas / Math.max(survey.questions.length, 1)) * 100}
          aria-label="Progreso de la encuesta" />
      </div>
      {survey.questions.map((q, i) => (
        <Card key={q.id} className={errores[q.id] ? "border-destructive/40" : undefined}>
          <CardContent className="flex gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1">
              <CampoPregunta question={q} values={respuestas[q.id] ?? []} error={errores[q.id]}
                onChange={(values) => cambiar(q.id, values)} />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="submit" size="lg" className="self-end" disabled={mutacion.isPending}>
        <Send aria-hidden />
        Enviar respuestas
      </Button>
    </form>
  );
}

function ResponderEncuesta({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: [...MY_SURVEYS_QUERY_KEY, id],
    queryFn: () => fetchMySurvey(id),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState>{apiErrorMessage(error)}</ErrorState>;

  return (
    <>
      <PageHeader
        back={{ href: "/encuestas", label: "Mis encuestas" }}
        title={data.title}
        description={
          <>
            Periodo {data.period}
            {data.description && <span className="mt-1 block text-foreground/80">{data.description}</span>}
          </>
        }
      />
      {data.answered ? (
        <EmptyState icon={CircleCheck} title="Ya respondiste esta encuesta" description="¡Gracias por tu participación!" />
      ) : (
        <FormularioEncuesta survey={data} />
      )}
    </>
  );
}

export default function ResponderEncuestaPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <RequireRole roles={["GRADUATE"]}>
        <ResponderEncuesta id={id} />
      </RequireRole>
    </div>
  );
}
