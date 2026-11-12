"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
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
import { QK, createEvent, deleteEvent, fetchEvents } from "@/lib/jobs";

const TIPOS = ["Feria laboral", "Charla", "Taller", "Conferencia", "Networking"];

function NuevoEvento({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Feria laboral");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  const [seats, setSeats] = useState("100");
  const [description, setDescription] = useState("");

  const mutacion = useMutation({
    mutationFn: createEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.events });
      toast.success("Evento creado");
      onClose();
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    mutacion.mutate({
      title,
      type,
      // datetime-local no trae zona: se interpreta en la hora local del navegador.
      date: new Date(date).toISOString(),
      place,
      seats: Number(seats),
      description: description.trim() || undefined,
    });
  }

  return (
    <Card className="border-primary/25">
      <CardHeader className="border-b">
        <CardTitle>Nuevo evento</CardTitle>
        <CardDescription>Los egresados lo verán en su sección Eventos y podrán inscribirse.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" required maxLength={150} value={title}
              placeholder="Feria Laboral UNT 2026" onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Tipo *</Label>
            <Input id="type" required maxLength={50} list="tipos-evento" value={type}
              onChange={(e) => setType(e.target.value)} />
            <datalist id="tipos-evento">
              {TIPOS.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="date">Fecha y hora *</Label>
            <Input id="date" type="datetime-local" required value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="place">Lugar *</Label>
            <Input id="place" required maxLength={150} value={place}
              placeholder="Campus UNT - Auditorio central" onChange={(e) => setPlace(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="seats">Cupos *</Label>
            <Input id="seats" type="number" required min={1} max={10000} value={seats}
              onChange={(e) => setSeats(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea id="description" maxLength={2000} value={description}
              onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutacion.isPending}>Crear evento</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ListadoEventos() {
  const queryClient = useQueryClient();
  const [creando, setCreando] = useState(false);
  const consulta = useQuery({ queryKey: QK.events, queryFn: fetchEvents });

  const eliminar = useMutation({
    mutationFn: deleteEvent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QK.events });
      toast.success("Evento eliminado");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Ferias laborales, charlas y talleres para la comunidad de egresados."
        actions={
          !creando && (
            <Button onClick={() => setCreando(true)}>
              <Plus aria-hidden />
              Nuevo evento
            </Button>
          )
        }
      />

      {creando && <NuevoEvento onClose={() => setCreando(false)} />}

      <Card className="gap-0 py-0">
        {consulta.isError ? (
          <div className="p-4">
            <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>
          </div>
        ) : consulta.isPending ? (
          <LoadingState className="m-4" />
        ) : consulta.data.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No hay eventos registrados"
            description="Crea un evento para que los egresados puedan inscribirse." className="m-4" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Evento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Lugar</TableHead>
                <TableHead className="text-right">Inscritos</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.data.map((e) => {
                const fecha = new Date(e.date);
                const pasado = fecha < new Date();
                return (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{e.title}</span>
                        <Badge variant="secondary">{e.type}</Badge>
                        {pasado && <Badge variant="outline">Realizado</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {fecha.toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.place}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {e.registeredCount} / {e.seats}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" aria-label={`Eliminar ${e.title}`}
                        disabled={eliminar.isPending}
                        onClick={() => {
                          if (confirm(`¿Eliminar "${e.title}"? Se cancelarán sus ${e.registeredCount} inscripciones.`)) {
                            eliminar.mutate(e.id);
                          }
                        }}>
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function EventosAdminPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <ListadoEventos />
    </RequireRole>
  );
}
