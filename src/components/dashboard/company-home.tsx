"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BriefcaseBusiness, Eye, FileUser, Plus, UserCheck } from "lucide-react";
import Link from "next/link";
import { BarList, StatCard } from "@/components/dashboard/charts";
import { CompanyStatusNotice, useMyCompany } from "@/components/jobs/company-gate";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationBadge } from "@/components/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  QK,
  fetchCompanyApplications,
  fetchMyOffers,
  formatShortDate,
  initials,
} from "@/lib/jobs";

export function CompanyHome() {
  const empresa = useMyCompany();
  const ofertas = useQuery({ queryKey: QK.myOffers, queryFn: fetchMyOffers });
  const postulaciones = useQuery({ queryKey: [...QK.applications, "company"], queryFn: fetchCompanyApplications });

  const o = ofertas.data ?? [];
  const p = postulaciones.data ?? [];
  const cuenta = (estado: ApplicationStatus) => p.filter((a) => a.status === estado).length;

  return (
    <>
      <PageHeader
        title={empresa.data ? empresa.data.name : "Panel de empresa"}
        description="Gestiona tus ofertas laborales y el avance de tus postulantes."
        actions={
          empresa.data?.status === "APPROVED" && (
            <Link href="/empresa/ofertas" className={buttonVariants()}>
              <Plus aria-hidden />
              Publicar oferta
            </Link>
          )
        }
      />

      <CompanyStatusNotice company={empresa.data} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ofertas vigentes" icon={BriefcaseBusiness} value={o.filter((x) => x.acceptingApplications).length}
          hint={`${o.length} publicadas en total`} />
        <StatCard label="Postulantes" icon={FileUser} value={p.length} hint="En todas tus ofertas" />
        <StatCard label="En revisión" icon={Eye} value={cuenta("IN_REVIEW")} />
        <StatCard label="Aceptados" icon={UserCheck} value={cuenta("ACCEPTED")} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Postulaciones recientes</CardTitle>
            <CardDescription>Últimos egresados que postularon a tus ofertas</CardDescription>
            <CardAction>
              <Link href="/empresa/postulantes" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ver todas <ArrowUpRight aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {p.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aún no recibes postulaciones.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {p.slice(0, 6).map((a) => {
                  const nombre = `${a.graduate.firstName} ${a.graduate.lastName}`;
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {initials(nombre)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{nombre}</span>
                        <span className="truncate text-xs text-muted-foreground">{a.offer.title} · {formatShortDate(a.createdAt)}</span>
                      </div>
                      <ApplicationBadge status={a.status} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Embudo de selección</CardTitle>
            <CardDescription>Postulaciones por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              items={(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((estado) => ({
                label: APPLICATION_STATUS_LABELS[estado],
                value: cuenta(estado),
              }))}
            />
          </CardContent>
        </Card>
      </section>
    </>
  );
}
