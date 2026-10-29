"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import { type AppEvent, QK, fetchEvents, registerToEvent, unregisterFromEvent } from "@/lib/jobs";

function Eventos() {
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: QK.events, queryFn: fetchEvents });

  const inscripcion = useMutation({
    mutationFn: (e: AppEvent) => (e.registered ? unregisterFromEvent(e.id) : registerToEvent(e.id)),
    onSuccess: (_, e) => {
      toast.success(e.registered ? `Inscripción cancelada: ${e.title}` : `Inscripción registrada: ${e.title}`);
      void queryClient.invalidateQueries({ queryKey: QK.events });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;
  if (consulta.data.length === 0) {
    return <EmptyState icon={CalendarDays} title="No hay eventos programados" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {consulta.data.map((e) => {
        const fecha = new Date(e.date);
        const pasado = fecha < new Date();
        const lleno = e.registeredCount >= e.seats;
        return (
          <Card key={e.id}>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-xl border bg-primary/5 leading-none">
                <span className="text-xs font-medium text-primary uppercase">
                  {fecha.toLocaleDateString("es-PE", { month: "short" })}
                </span>
                <span className="mt-1 text-2xl font-semibold tabular-nums">{fecha.getDate()}</span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{e.title}</span>
                  <Badge variant="secondary">{e.type}</Badge>
                </div>
                {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock aria-hidden className="size-3.5" />
                    {fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })} h
                  </span>
                  <span className="flex items-center gap-1.5"><MapPin aria-hidden className="size-3.5" />{e.place}</span>
                  <span className="flex items-center gap-1.5">
                    <Users aria-hidden className="size-3.5" />
                    {e.registeredCount} / {e.seats} inscritos
                  </span>
                </div>
              </div>
              <Button
                variant={e.registered ? "outline" : "default"}
                disabled={pasado || (lleno && !e.registered) || inscripcion.isPending}
                onClick={() => inscripcion.mutate(e)}
              >
                {pasado ? "Finalizado" : e.registered ? "Cancelar inscripción" : lleno ? "Sin cupos" : "Inscribirme"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function EventosPage() {
  return (
    <RequireRole roles={["GRADUATE"]}>
      <PageHeader title="Eventos" description="Ferias laborales, charlas y reuniones de egresados." />
      <Eventos />
    </RequireRole>
  );
}
