"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/graduates";
import {
  type Question,
  type QuestionType,
  QUESTION_TYPE_LABELS,
  addQuestion,
  surveyKey,
  updateQuestion,
} from "@/lib/surveys";

interface QuestionFormProps {
  surveyId: string;
  question: Question | null;
  onClose: () => void;
}

export function QuestionForm({ surveyId, question, onClose }: QuestionFormProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(question?.text ?? "");
  const [type, setType] = useState<QuestionType>(question?.type ?? "SINGLE_CHOICE");
  // Una opción por línea: lo más simple de editar para un MVP.
  const [options, setOptions] = useState(question?.options.join("\n") ?? "");
  const [required, setRequired] = useState(question?.required ?? true);

  const conOpciones = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";

  const mutacion = useMutation({
    mutationFn: () => {
      const input = {
        text,
        type,
        required,
        options: conOpciones ? options.split("\n").map((o) => o.trim()).filter(Boolean) : [],
      };
      return question
        ? updateQuestion(surveyId, question.id, input)
        : addQuestion(surveyId, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: surveyKey(surveyId) });
      toast.success(question ? "Pregunta actualizada" : "Pregunta agregada");
      onClose();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate();
  }

  return (
    <form onSubmit={enviar} className="grid gap-4 rounded-xl border border-primary/25 bg-muted/30 p-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="q-text">Enunciado *</Label>
        <Input id="q-text" required maxLength={500} value={text}
          onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="q-type">Tipo</Label>
        <NativeSelect id="q-type" className="w-full" value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}>
          {Object.entries(QUESTION_TYPE_LABELS).map(([valor, etiqueta]) => (
            <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <Checkbox checked={required} onCheckedChange={setRequired} />
        Obligatoria
      </label>
      {conOpciones && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="q-options">Opciones * (una por línea, mínimo 2)</Label>
          <Textarea id="q-options" required rows={4} value={options}
            onChange={(e) => setOptions(e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={mutacion.isPending}>Guardar pregunta</Button>
      </div>
    </form>
  );
}
