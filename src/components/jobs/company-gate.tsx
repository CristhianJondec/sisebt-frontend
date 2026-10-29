"use client";

import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { type Company, QK, fetchMyCompany } from "@/lib/jobs";

/** Empresa de la sesion; null si aun no registro sus datos (404). */
export function useMyCompany() {
  return useQuery({
    queryKey: QK.myCompany,
    queryFn: async (): Promise<Company | null> => {
      try {
        return await fetchMyCompany();
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) return null;
        throw error;
      }
    },
  });
}

/** Aviso cuando la empresa todavía no puede publicar ofertas. */
export function CompanyStatusNotice({ company }: { company: Company | null | undefined }) {
  if (company === undefined || company?.status === "APPROVED") return null;

  if (company === null) {
    return (
      <Alert>
        <AlertTitle>Registra los datos de tu empresa</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-2">
          Necesitamos el nombre y un correo de contacto para validar tu cuenta.
          <Link href="/empresa/perfil" className={buttonVariants({ size: "sm" })}>Completar datos</Link>
        </AlertDescription>
      </Alert>
    );
  }

  const rechazada = company.status === "REJECTED";
  return (
    <Alert variant={rechazada ? "destructive" : "default"}>
      {rechazada ? <XCircle aria-hidden /> : <Clock aria-hidden />}
      <AlertTitle>{rechazada ? "Tu empresa fue rechazada" : "Tu empresa está pendiente de aprobación"}</AlertTitle>
      <AlertDescription>
        {rechazada
          ? "Comunícate con la oficina de egresados para más información."
          : "La escuela validará tus datos. Cuando sea aprobada podrás publicar ofertas; te avisaremos con una notificación."}
      </AlertDescription>
    </Alert>
  );
}
