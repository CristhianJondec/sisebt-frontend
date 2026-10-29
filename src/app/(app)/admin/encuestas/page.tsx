"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiErrorMessage } from "@/lib/graduates";
import {
  SURVEYS_QUERY_KEY,
  SURVEY_STATUS_LABELS,
  audienceLabel,
  createSurvey,
  fetchSurveys,
} from "@/lib/surveys";

function NuevaEncuesta({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");

  const mutacion = useMutation({
    mutationFn: createSurvey,
    onSuccess: async (encuesta) => {
      await queryClient.invalidateQueries({ queryKey: SURVEYS_QUERY_KEY });
      toast.success("Encuesta creada en borrador");
      router.push(`/admin/encuestas/${encuesta.id}`);
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate({ title, period, description: description.trim() || undefined });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva encuesta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" required maxLength={150} value={title}
              onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="period">Periodo *</Label>
            <Input id="period" required maxLength={30} placeholder="2026-I" value={period}
              onChange={(e) => setPeriod(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" maxLength={1000} value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Se agregará automáticamente la pregunta de satisfacción con la formación (escala 1-5).
          </p>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={mutacion.isPending}>Crear borrador</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ListadoEncuestas() {
  const [creando, setCreando] = useState(false);
  const { data, isPending, isError, error } = useQuery({
    queryKey: SURVEYS_QUERY_KEY,
    queryFn: fetchSurveys,
  });

  return (
    <>
      {creando ? (
        <NuevaEncuesta onClose={() => setCreando(false)} />
      ) : (
        <Button className="self-start" onClick={() => setCreando(true)}>
          <Plus aria-hidden />
          Nueva encuesta
        </Button>
      )}

      <Card>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive" role="alert">{apiErrorMessage(error)}</p>
          ) : isPending ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay encuestas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Encuesta</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Público</TableHead>
                  <TableHead className="text-right">Preguntas</TableHead>
                  <TableHead className="text-right">Respuestas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/encuestas/${s.id}`} className="underline-offset-4 hover:underline">
                        {s.title}
                      </Link>
                    </TableCell>
                    <TableCell>{s.period}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "PUBLISHED" ? "default" : "outline"}>
                        {SURVEY_STATUS_LABELS[s.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.status === "DRAFT" ? "-" : audienceLabel(s.targetCohort)}
                    </TableCell>
                    <TableCell className="text-right">{s.questionCount}</TableCell>
                    <TableCell className="text-right">{s.responseCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function EncuestasAdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
          <ArrowLeft aria-hidden />
          Inicio
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Encuestas de seguimiento</h1>
      </header>
      <RequireRole roles={["ADMIN"]}>
        <ListadoEncuestas />
      </RequireRole>
    </main>
  );
}
