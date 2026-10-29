"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
import { StatCard } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { USERS_QUERY_KEY, fetchUsers } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/graduates";
import { ROLE_LABELS, iniciales } from "@/lib/roles";
import { formatDateTime } from "@/lib/surveys";

function Usuarios() {
  const { data, isPending, isError, error } = useQuery({ queryKey: USERS_QUERY_KEY, queryFn: fetchUsers });

  const contar = (rol: keyof typeof ROLE_LABELS) => data?.filter((u) => u.role === rol).length ?? "—";

  return (
    <>
      <PageHeader title="Usuarios" description="Cuentas registradas en la plataforma y su rol de acceso." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" icon={UsersRound} value={data?.length ?? "—"} />
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
                <TableHead>Rol</TableHead>
                <TableHead>Fecha de registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {iniciales(u.email)}
                      </span>
                      <span className="font-medium">{u.email}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "soft" : "outline"}>{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">{formatDateTime(u.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
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
