"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Copy, GraduationCap, KeyRound, Power, PowerOff, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type CambiosUsuario,
  USERS_QUERY_KEY,
  type UserAccount,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from "@/lib/auth";
import { apiErrorMessage } from "@/lib/graduates";
import { ROLE_LABELS, type Role, iniciales } from "@/lib/roles";
import { formatDateTime } from "@/lib/surveys";
import { useSession } from "@/lib/use-session";

function Usuarios() {
  const queryClient = useQueryClient();
  const { user: yo } = useSession();
  const { data, isPending, isError, error } = useQuery({ queryKey: USERS_QUERY_KEY, queryFn: fetchUsers });

  const actualizar = useMutation({
    mutationFn: ({ u, cambios }: { u: UserAccount; cambios: CambiosUsuario }) => updateUser(u.id, cambios),
    onSuccess: (u, { cambios }) => {
      toast.success(
        cambios.role
          ? `${u.email} ahora es ${ROLE_LABELS[u.role]}`
          : u.active
            ? `${u.email} fue reactivada`
            : `${u.email} fue desactivada`,
      );
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  // La temporal solo existe en esta respuesta: se muestra una vez y no se guarda.
  const [temporal, setTemporal] = useState<{ email: string; password: string } | null>(null);
  const restablecer = useMutation({
    mutationFn: (u: UserAccount) => resetUserPassword(u.id),
    onSuccess: (password, u) => {
      setTemporal({ email: u.email, password });
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function restablecerPassword(u: UserAccount) {
    if (confirm(`¿Restablecer la contraseña de ${u.email}? Se generará una temporal que deberá cambiar al entrar.`)) {
      restablecer.mutate(u);
    }
  }

  async function copiarTemporal() {
    if (!temporal) return;
    try {
      await navigator.clipboard.writeText(temporal.password);
      toast.success("Contraseña copiada");
    } catch {
      toast.error("No se pudo copiar: selecciónala y cópiala manualmente");
    }
  }

  function cambiarRol(u: UserAccount, role: Role) {
    // El usuario afectado debe volver a iniciar sesión (su token deja de valer).
    if (confirm(`¿Cambiar el rol de ${u.email} a ${ROLE_LABELS[role]}? Deberá iniciar sesión de nuevo.`)) {
      actualizar.mutate({ u, cambios: { role } });
    }
  }

  function alternarEstado(u: UserAccount) {
    if (!u.active || confirm(`¿Desactivar la cuenta ${u.email}? No podrá iniciar sesión hasta que la reactives.`)) {
      actualizar.mutate({ u, cambios: { active: !u.active } });
    }
  }

  const contar = (rol: keyof typeof ROLE_LABELS) => data?.filter((u) => u.role === rol).length ?? "—";
  const inactivas = data?.filter((u) => !u.active).length ?? 0;

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas registradas en la plataforma: cambia su rol, restablece la contraseña o desactiva el acceso."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" icon={UsersRound} value={data?.length ?? "—"}
          hint={inactivas ? `${inactivas} desactivadas` : undefined} />
        <StatCard label="Administradores" icon={ShieldCheck} value={contar("ADMIN")} />
        <StatCard label="Egresados" icon={GraduationCap} value={contar("GRADUATE")} />
        <StatCard label="Empresas" icon={Building2} value={contar("COMPANY")} />
      </section>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState>{apiErrorMessage(error)}</ErrorState>
      ) : data.length === 0 ? (
        <EmptyState icon={UsersRound} title="No hay usuarios registrados" />
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Usuario</TableHead>
                <TableHead className="w-44">Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead className="w-72 text-right">Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => {
                // El admin no puede quitarse el rol ni desactivarse (el backend también lo impide).
                const esYo = u.id === yo?.id;
                const ocupada =
                  (actualizar.isPending && actualizar.variables?.u.id === u.id) ||
                  (restablecer.isPending && restablecer.variables?.id === u.id);
                return (
                  <TableRow key={u.id} className={u.active ? undefined : "text-muted-foreground"}>
                    <TableCell className="pl-4">
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {iniciales(u.email)}
                        </span>
                        <span className="font-medium">{u.email}</span>
                        {esYo && <Badge variant="secondary">Tú</Badge>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <NativeSelect
                        size="sm"
                        className="w-full"
                        aria-label={`Rol de ${u.email}`}
                        title={esYo ? "No puedes cambiar tu propio rol" : undefined}
                        value={u.role}
                        disabled={esYo || ocupada}
                        onChange={(e) => cambiarRol(u, e.target.value as Role)}
                      >
                        {Object.entries(ROLE_LABELS).map(([valor, etiqueta]) => (
                          <NativeSelectOption key={valor} value={valor}>{etiqueta}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge variant={u.active ? "soft" : "outline"}>{u.active ? "Activa" : "Desactivada"}</Badge>
                        {u.mustChangePassword && <Badge variant="outline">Clave temporal</Badge>}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDateTime(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {!esYo && (
                        <span className="inline-flex gap-2">
                        <Button size="sm" variant="outline" disabled={ocupada}
                          aria-label={`Restablecer contraseña de ${u.email}`}
                          onClick={() => restablecerPassword(u)}>
                          <KeyRound aria-hidden />
                          Restablecer clave
                        </Button>
                        <Button size="sm" variant={u.active ? "outline" : "default"} disabled={ocupada}
                          aria-label={`${u.active ? "Desactivar" : "Reactivar"} ${u.email}`}
                          onClick={() => alternarEstado(u)}>
                          {u.active ? <PowerOff aria-hidden /> : <Power aria-hidden />}
                          {u.active ? "Desactivar" : "Reactivar"}
                        </Button>
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal
        open={temporal !== null}
        onClose={() => setTemporal(null)}
        title="Contraseña temporal generada"
        description={temporal ? `Entrégala a ${temporal.email}. Se muestra solo esta vez.` : undefined}
        footer={<Button onClick={() => setTemporal(null)}>Listo</Button>}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border bg-muted/50 px-4 py-3 text-center font-mono text-lg tracking-wider select-all">
              {temporal?.password}
            </code>
            <Button variant="outline" size="icon" aria-label="Copiar contraseña" onClick={copiarTemporal}>
              <Copy aria-hidden />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Al iniciar sesión con ella, el sistema le pedirá elegir una contraseña nueva.
          </p>
        </div>
      </Modal>
    </>
  );
}

export default function UsuariosPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Usuarios />
    </RequireRole>
  );
}
