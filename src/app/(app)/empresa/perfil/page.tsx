"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, Clock, Save, XCircle } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useMyCompany } from "@/components/jobs/company-gate";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { CompanyStatusBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/graduates";
import { type Company, QK, saveMyCompany } from "@/lib/jobs";
import { useSession } from "@/lib/use-session";

function Formulario({ company }: { company: Company | null }) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [v, setV] = useState({
    name: company?.name ?? "",
    contactEmail: company?.contactEmail ?? user?.email ?? "",
    phone: company?.phone ?? "",
  });

  const guardar = useMutation({
    mutationFn: () => saveMyCompany({ ...v, phone: v.phone.trim() || undefined }),
    onSuccess: (c) => {
      queryClient.setQueryData(QK.myCompany, c);
      toast.success("Datos de la empresa guardados");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    guardar.mutate();
  }

  return (
    <form onSubmit={enviar} className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="c-name">Nombre de la empresa *</Label>
        <Input id="c-name" required maxLength={150} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-email">Correo de contacto *</Label>
        <Input id="c-email" type="email" required value={v.contactEmail}
          onChange={(e) => setV({ ...v, contactEmail: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="c-phone">Teléfono</Label>
        <Input id="c-phone" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
      </div>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" disabled={guardar.isPending}>
          <Save aria-hidden />
          {guardar.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function PerfilEmpresa() {
  const empresa = useMyCompany();

  if (empresa.isPending) return <LoadingState />;
  if (empresa.isError) return <ErrorState>{apiErrorMessage(empresa.error)}</ErrorState>;

  const c = empresa.data;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="border-b">
          <CardTitle>Datos de la empresa</CardTitle>
          <CardDescription>Solo pedimos lo mínimo para validar tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Formulario company={c} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Estado de la cuenta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {c ? (
            <CompanyStatusBadge status={c.status} />
          ) : (
            <Badge variant="outline" className="h-6">Sin registrar</Badge>
          )}
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            {c?.status === "APPROVED" ? (
              <><CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />Tu empresa está validada: puedes publicar ofertas.</>
            ) : c?.status === "REJECTED" ? (
              <><XCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />La solicitud fue rechazada. Comunícate con la escuela.</>
            ) : (
              <><Clock aria-hidden className="mt-0.5 size-4 shrink-0" />La oficina de egresados validará tu empresa. Una vez aprobada podrás publicar ofertas laborales.</>
            )}
          </p>
          {c && <p className="text-xs text-muted-foreground">{c.offerCount} ofertas publicadas</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PerfilEmpresaPage() {
  return (
    <RequireRole roles={["COMPANY"]}>
      <PageHeader title="Perfil de empresa" description="Datos de contacto visibles para la escuela y los egresados." />
      <PerfilEmpresa />
    </RequireRole>
  );
}
