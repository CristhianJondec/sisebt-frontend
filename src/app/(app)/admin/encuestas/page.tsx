"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { SurveyStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  type SurveyStatus,
  audienceLabel,
  createSurvey,
  fetchSurveys,
} from "@/lib/surveys";
import { cn } from "@/lib/utils";

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
    <Card className="border-primary/25">
      <CardHeader className="border-b">
        <CardTitle>Nueva encuesta</CardTitle>
        <CardDescription>
          Se agregará automáticamente la pregunta de satisfacción con la formación (escala 1-5).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" required maxLength={150} value={title}
              placeholder="Seguimiento de egresados 2026"
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
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutacion.isPending}>Crear borrador</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const FILTROS: { valor: SurveyStatus | "ALL"; etiqueta: string }[] = [
  { valor: "ALL", etiqueta: "Todas" },
  { valor: "PUBLISHED", etiqueta: "Publicadas" },
  { valor: "DRAFT", etiqueta: "Borradores" },
  { valor: "CLOSED", etiqueta: "Cerradas" },
];

function ListadoEncuestas() {
  const [creando, setCreando] = useState(false);
  const [filtro, setFiltro] = useState<SurveyStatus | "ALL">("ALL");
  const { data, isPending, isError, error } = useQuery({
    queryKey: SURVEYS_QUERY_KEY,
    queryFn: fetchSurveys,
  });

  const visibles = data?.filter((s) => filtro === "ALL" || s.status === filtro) ?? [];

  return (
    <>
      <PageHeader
        title="Encuestas de seguimiento"
        description="Diseña, publica y analiza las encuestas dirigidas a los egresados."
        actions={
          !creando && (
            <Button onClick={() => setCreando(true)}>
              <Plus aria-hidden />
              Nueva encuesta
            </Button>
          )
        }
      />

      {creando && <NuevaEncuesta onClose={() => setCreando(false)} />}

      <Card className="gap-0 py-0">
        <div className="flex gap-1 overflow-x-auto border-b p-2">
          {FILTROS.map(({ valor, etiqueta }) => {
            const cantidad = valor === "ALL" ? data?.length : data?.filter((s) => s.status === valor).length;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                  filtro === valor && "bg-muted text-foreground",
                )}
              >
                {etiqueta}
                {cantidad !== undefined && (
                  <span className="rounded-full bg-background px-1.5 text-xs tabular-nums ring-1 ring-border">{cantidad}</span>
                )}
              </button>
            );
          })}
        </div>

        {isError ? (
          <div className="p-4">
            <ErrorState>{apiErrorMessage(error)}</ErrorState>
          </div>
        ) : isPending ? (
          <LoadingState className="m-4" />
        ) : visibles.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No hay encuestas en esta vista"
            description="Crea una nueva encuesta para empezar a recopilar respuestas." className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Encuesta</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Público</TableHead>
                <TableHead className="text-right">Preguntas</TableHead>
                <TableHead className="text-right">Respuestas</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell className="pl-4 font-medium">
                    <Link href={`/admin/encuestas/${s.id}`} className="group-hover:text-primary">
                      {s.title}
                    </Link>
                  </TableCell>
                  <TableCell>{s.period}</TableCell>
                  <TableCell>
                    <SurveyStatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.status === "DRAFT" ? "—" : audienceLabel(s.targetCohort)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.questionCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.responseCount}</TableCell>
                  <TableCell>
                    <Link href={`/admin/encuestas/${s.id}`} aria-label={`Abrir ${s.title}`}
                      className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                      <ChevronRight aria-hidden className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function EncuestasAdminPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <ListadoEncuestas />
    </RequireRole>
  );
}
