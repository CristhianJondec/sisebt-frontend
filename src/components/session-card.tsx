"use client";

import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
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
import { USERS_QUERY_KEY, fetchUsers } from "@/lib/auth";
import { useAuthStore } from "@/lib/auth-store";
import { useSession } from "@/lib/use-session";

export function SessionCard() {
  const { hidratada, token, user } = useSession();
  const clearSession = useAuthStore((estado) => estado.clearSession);

  // Solo consultamos la ruta protegida si hay token; sin el, el interceptor
  // recibiria un 401 y nos mandaria al login en bucle.
  const usuarios = useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
    enabled: Boolean(token),
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
        <p className="text-sm text-muted-foreground">
          La tabla siguiente viene de <code>GET /users</code>, una ruta protegida:
          el interceptor de axios adjunta el bearer token.
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

        <Button variant="outline" className="self-start" onClick={clearSession}>
          <LogOut aria-hidden />
          Cerrar sesion
        </Button>
      </CardContent>
    </Card>
  );
}
