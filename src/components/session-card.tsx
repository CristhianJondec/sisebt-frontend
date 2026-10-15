"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, GraduationCap, LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleGate } from "@/components/role-gate";
import { USERS_QUERY_KEY, fetchUsers } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";
import { tieneRol } from "@/lib/roles";
import { useSession } from "@/lib/use-session";

/** GET /users es exclusivo de ADMIN en el backend (los demas reciben 403). */
const ROLES_LISTADO_USUARIOS = ["ADMIN"] as const;

export function SessionCard() {
  const { hidratada, token, user } = useSession();
  const clearSession = useAuthStore((estado) => estado.clearSession);

  // Solo consultamos la ruta protegida si hay token (sin el, el interceptor
  // recibiria un 401 y nos mandaria al login en bucle) y si el rol puede verla.
  const usuarios = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
    enabled: Boolean(token) && tieneRol(user, ROLES_LISTADO_USUARIOS),
  });

  if (!hidratada) return null;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sesion</CardTitle>
          <CardDescription>No has iniciado sesion.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Este Button (estilo base-nova) no expone `asChild`, asi que
              aplicamos las clases directamente sobre el Link. */}
          <Link href="/login" className={buttonVariants()}>
            <LogIn aria-hidden />
            Iniciar sesion
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sesion</CardTitle>
        <CardDescription>
          <span data-testid="session-email">{user?.email}</span> ({user?.role})
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <RoleGate roles={["GRADUATE"]}>
          <Link href="/perfil" className={buttonVariants({ className: "self-start" })}>
            <UserRound aria-hidden />
            Mi perfil
          </Link>
          <Link href="/encuestas" className={buttonVariants({ variant: "outline", className: "self-start" })}>
            <ClipboardList aria-hidden />
            Mis encuestas
          </Link>
        </RoleGate>

        <RoleGate roles={ROLES_LISTADO_USUARIOS}>
          <Link href="/admin/egresados" className={buttonVariants({ className: "self-start" })}>
            <GraduationCap aria-hidden />
            Ver egresados
          </Link>
          <Link href="/admin/encuestas" className={buttonVariants({ variant: "outline", className: "self-start" })}>
            <ClipboardList aria-hidden />
            Encuestas
          </Link>
        </RoleGate>

        <RoleGate roles={ROLES_LISTADO_USUARIOS}>
          <p className="text-sm text-muted-foreground">
            La tabla siguiente viene de <code>GET /users</code>, una ruta solo para
            administradores: el interceptor de axios adjunta el bearer token.
          </p>

          {usuarios.data && usuarios.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.data.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.email}</TableCell>
                    <TableCell>{usuario.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </RoleGate>

        <Button variant="outline" className="self-start" onClick={clearSession}>
          <LogOut aria-hidden />
          Cerrar sesion
        </Button>
      </CardContent>
    </Card>
  );
}
