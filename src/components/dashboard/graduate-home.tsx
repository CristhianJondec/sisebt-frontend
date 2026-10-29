"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Clock,
  MapPin,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/charts";
import { formatInsertion } from "@/components/graduates/profile-view";
import { PageHeader } from "@/components/layout/page-header";
import { ErrorState, LoadingState } from "@/components/states";
import { EmploymentBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODALITY_LABELS, QK, fetchEvents, fetchOffers, formatShortDate, initials } from "@/lib/jobs";
import { DEGREE_LABELS, EMPLOYMENT_STATUS_LABELS, MY_PROFILE_QUERY_KEY, apiErrorMessage, fetchMyProfile } from "@/lib/graduates";
import { MY_SURVEYS_QUERY_KEY, fetchMySurveys, formatDateTime } from "@/lib/surveys";
import { useSession } from "@/lib/use-session";

export function GraduateHome() {
  const { user } = useSession();
  const perfil = useQuery({ queryKey: MY_PROFILE_QUERY_KEY, queryFn: fetchMyProfile });
  const encuestas = useQuery({ queryKey: MY_SURVEYS_QUERY_KEY, queryFn: fetchMySurveys });
  const ofertas = useQuery({ queryKey: [...QK.offers, {}], queryFn: () => fetchOffers() });
  const eventos = useQuery({ queryKey: QK.events, queryFn: fetchEvents });

  if (perfil.isPending) return <LoadingState />;
  if (perfil.isError) return <ErrorState>{apiErrorMessage(perfil.error)}</ErrorState>;

  const p = perfil.data;
  const pendientes = encuestas.data?.filter((s) => !s.answered) ?? [];

  return (
    <>
      <PageHeader
        title={`Hola, ${p?.firstName ?? user?.email.split("@")[0]}`}
        description="Este es tu espacio de seguimiento: mantén tu perfil al día y responde tus encuestas."
      />

      {!p && (
        <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="font-semibold">Completa tu perfil de egresado</p>
              <p className="text-sm text-muted-foreground">
                Registra tus datos personales y académicos para acceder a encuestas y a la bolsa de trabajo.
              </p>
            </div>
            <Link href="/perfil" className={buttonVariants({ className: "shrink-0" })}>
              Completar perfil
              <ArrowRight aria-hidden />
            </Link>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Situación laboral" icon={BriefcaseBusiness}
          value={p ? EMPLOYMENT_STATUS_LABELS[p.employmentStatus] : "—"}
          hint={p ? `${p.experiences.length} experiencias registradas` : "Perfil pendiente"} />
        <StatCard label="Inserción laboral" icon={Clock}
          value={p ? formatInsertion(p.insertionMonths) : "—"} hint="Desde tu fecha de egreso" />
        <StatCard label="Encuestas pendientes" icon={ClipboardList}
          value={encuestas.data ? pendientes.length : "—"}
          hint={encuestas.data ? `${encuestas.data.length - pendientes.length} respondidas` : undefined} />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Encuestas pendientes</CardTitle>
            <CardDescription>Tu opinión ayuda a mejorar la formación de la escuela</CardDescription>
            <CardAction>
              <Link href="/encuestas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ver todas
                <ArrowUpRight aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {encuestas.isPending ? (
              <LoadingState className="border-0" />
            ) : pendientes.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-4 text-sm">
                <CircleCheck aria-hidden className="size-5 text-primary" />
                Estás al día: no tienes encuestas pendientes.
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {pendientes.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 rounded-lg border p-3.5">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{s.title}</span>
                      <span className="text-xs text-muted-foreground">
                        Hasta el {formatDateTime(s.closesAt)} · {s.questions.length} preguntas
                      </span>
                    </div>
                    <Link href={`/encuestas/${s.id}`} className={buttonVariants({ size: "sm" })}>
                      Responder
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mi perfil</CardTitle>
            <CardAction>
              <Link href="/perfil" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <UserRound aria-hidden />
                Ver
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {p ? (
              <dl className="flex flex-col divide-y text-sm">
                {[
                  ["Programa", p.program],
                  ["Promoción", p.graduationDate.slice(0, 4)],
                  ["Grado", DEGREE_LABELS[p.degree]],
                  ["Código", p.studentCode],
                ].map(([dt, dd]) => (
                  <div key={dt} className="flex justify-between gap-4 py-2.5 first:pt-0">
                    <dt className="text-muted-foreground">{dt}</dt>
                    <dd className="truncate text-right font-medium">{dd}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 pt-2.5">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd><EmploymentBadge status={p.employmentStatus} /></dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Aún no has registrado tu perfil.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Ofertas para ti
            </CardTitle>
            <CardDescription>Oportunidades recientes de la bolsa de trabajo</CardDescription>
            <CardAction>
              <Link href="/ofertas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Explorar
                <ArrowUpRight aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {(ofertas.data?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No hay ofertas vigentes por ahora.</p>
            ) : (
            <ul className="flex flex-col divide-y">
              {ofertas.data!.slice(0, 3).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(o.company.name)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{o.title}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {o.company.name} · <MapPin aria-hidden className="size-3" /> {o.location}
                    </span>
                  </div>
                  <Badge variant="secondary">{MODALITY_LABELS[o.modality]}</Badge>
                </li>
              ))}
            </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Próximos eventos</CardTitle>
            <CardAction>
              <Link href="/eventos" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                <CalendarDays aria-hidden />
                Ver
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {(eventos.data ?? []).filter((e) => new Date(e.date) >= new Date()).slice(0, 3).map((e) => {
                const fecha = new Date(e.date);
                return (
                  <li key={e.id} className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border bg-card leading-none">
                      <span className="text-[10px] font-medium text-primary uppercase">
                        {fecha.toLocaleDateString("es-PE", { month: "short" })}
                      </span>
                      <span className="text-base font-semibold tabular-nums">{fecha.getDate()}</span>
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{e.title}</span>
                      <span className="text-xs text-muted-foreground">{e.type} · {formatShortDate(e.date)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
