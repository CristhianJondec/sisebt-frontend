"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <legend className="mb-2 font-medium">
        {q.text} {q.required && <span className="text-destructive">*</span>}
      </legend>

      {q.type === "TEXT" && (
        <Textarea aria-label={q.text} aria-invalid={invalida} maxLength={2000} value={values[0] ?? ""}
          onChange={(e) => onChange([e.target.value])} />
      )}

      {q.type === "SINGLE_CHOICE" && (
        <RadioGroup value={values[0] ?? ""} onValueChange={(v) => onChange([String(v)])}>
          {q.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={o} aria-invalid={invalida} />
              {o}
            </label>
          ))}
        </RadioGroup>
      )}

      {q.type === "MULTIPLE_CHOICE" && (
        <div className="flex flex-col gap-2">
          {q.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
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
          className="flex flex-wrap gap-4">
          {SCALE_VALUES.map((v) => (
            <label key={v} className="flex flex-col items-center gap-1 text-sm">
              <RadioGroupItem value={v} aria-invalid={invalida} />
              {v}
            </label>
          ))}
          <span className="self-end text-xs text-muted-foreground">1 = Nada · 5 = Mucho</span>
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
      {survey.questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="flex gap-2">
            <span className="text-sm text-muted-foreground tabular-nums">{i + 1}.</span>
            <div className="flex-1">
              <CampoPregunta question={q} values={respuestas[q.id] ?? []} error={errores[q.id]}
                onChange={(values) => cambiar(q.id, values)} />
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="submit" className="self-start" disabled={mutacion.isPending}>
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
          <CardTitle>{data.title}</CardTitle>
          <CardDescription>Periodo {data.period}</CardDescription>
        </CardHeader>
        {data.description && (
          <CardContent>
            <p className="text-sm">{data.description}</p>
          </CardContent>
        )}
      </Card>
      {data.answered ? (
        <p className="text-muted-foreground">Ya respondiste esta encuesta. ¡Gracias!</p>
      ) : (
        <FormularioEncuesta survey={data} />
      )}
    </>
  );
}

export default function ResponderEncuestaPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/encuestas" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Mis encuestas
        </Link>
      </header>
      <RequireRole roles={["GRADUATE"]}>
        <ResponderEncuesta id={id} />
      </RequireRole>
    </main>
  );
}
