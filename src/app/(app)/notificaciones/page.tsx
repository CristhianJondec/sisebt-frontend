"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/graduates";
import {
  type AppNotification,
  QK,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  relativeTime,
} from "@/lib/jobs";
import { cn } from "@/lib/utils";

function Notificaciones() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: QK.notifications, queryFn: fetchNotifications });
  const refrescar = () => queryClient.invalidateQueries({ queryKey: QK.notifications });

  const leer = useMutation({ mutationFn: markNotificationRead, onSuccess: refrescar });
  const leerTodas = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: refrescar });

  const lista = consulta.data ?? [];
  const pendientes = lista.filter((n) => !n.read).length;

  function abrir(n: AppNotification) {
    if (!n.read) leer.mutate(n.id);
    if (n.link) router.push(n.link);
  }

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description={pendientes > 0 ? `Tienes ${pendientes} sin leer.` : "Estás al día."}
        actions={
          <Button variant="outline" disabled={pendientes === 0 || leerTodas.isPending} onClick={() => leerTodas.mutate()}>
            <CheckCheck aria-hidden />
            Marcar todas como leídas
          </Button>
        }
      />
      {consulta.isPending ? (
        <LoadingState />
      ) : consulta.isError ? (
        <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>
      ) : lista.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" description="Aquí verás los avisos sobre tus postulaciones, ofertas y encuestas." />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {lista.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => abrir(n)}
                  className={cn(
                    "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40",
                    !n.read && "bg-primary/[0.03]",
                  )}
                >
                  <span className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    n.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                  )}>
                    <Bell aria-hidden className="size-4" />
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                    <span className="text-sm text-muted-foreground">{n.message}</span>
                    <span className="mt-1 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</span>
                  </span>
                  {!n.read && <span aria-label="Sin leer" className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function NotificacionesPage() {
  return (
    <RequireRole roles={["ADMIN", "GRADUATE", "COMPANY"]}>
      <Notificaciones />
    </RequireRole>
  );
}
