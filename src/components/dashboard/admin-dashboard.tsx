"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Clock,
  FileUser,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BarList, ColumnChart, StatCard } from "@/components/dashboard/charts";
import { SystemStatus } from "@/components/dashboard/system-status";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { SurveyStatusBadge } from "@/components/status-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { exportarEgresadosExcel } from "@/lib/export-excel";
import { QK, fetchAllApplications, fetchCompanies, fetchOffers } from "@/lib/jobs";
import {
  EMPLOYMENT_STATUS_LABELS,
  type EmploymentStatus,
  type GraduateProfile,
  apiErrorMessage,
  fetchGraduates,
} from "@/lib/graduates";
import { SURVEYS_QUERY_KEY, fetchSurveys, formatDateTime } from "@/lib/surveys";

export const PROMOCIONES_VISIBLES = 8;

export function metricas(egresados: GraduateProfile[]) {
  const total = egresados.length;
  const porEstado = (estado: EmploymentStatus) => egresados.filter((g) => g.employmentStatus === estado).length;
  const conEmpleo = porEstado("EMPLOYED") + porEstado("INDEPENDENT");
  const meses = egresados.map((g) => g.insertionMonths).filter((m): m is number => m !== null);

  const anioActual = new Date().getFullYear();
  const promociones = Array.from({ length: PROMOCIONES_VISIBLES }, (_, i) => anioActual - PROMOCIONES_VISIBLES + 1 + i);

  const programas = new Map<string, number>();
  for (const g of egresados) programas.set(g.program, (programas.get(g.program) ?? 0) + 1);

  return {
    total,
    empleabilidad: total ? Math.round((conEmpleo / total) * 100) : 0,
    insercion: meses.length ? meses.reduce((a, b) => a + b, 0) / meses.length : null,
    estados: (Object.keys(EMPLOYMENT_STATUS_LABELS) as EmploymentStatus[]).map((estado) => ({
      label: EMPLOYMENT_STATUS_LABELS[estado],
      value: porEstado(estado),
    })),
    promociones: promociones.map((anio) => ({
      label: String(anio),
      value: egresados.filter((g) => g.graduationDate.startsWith(String(anio))).length,
    })),
    programas: [...programas.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5),
  };
}

export function AdminDashboard() {
  const egresados = useQuery({ queryKey: ["graduates", "list", {}], queryFn: () => fetchGraduates({}) });
  const encuestas = useQuery({ queryKey: SURVEYS_QUERY_KEY, queryFn: fetchSurveys });
  const empresas = useQuery({ queryKey: QK.companies, queryFn: fetchCompanies });
  const ofertas = useQuery({ queryKey: [...QK.offers, "admin"], queryFn: () => fetchOffers() });
  const postulaciones = useQuery({ queryKey: [...QK.applications, "all"], queryFn: fetchAllApplications });

  const m = egresados.data ? metricas(egresados.data) : null;
  const [exportando, setExportando] = useState(false);

  async function exportarExcel() {
    if (!egresados.data) return;
    setExportando(true);
    try {
      await exportarEgresadosExcel(egresados.data);
      toast.success("Excel de egresados descargado");
    } catch {
      toast.error("No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }
  const activas = encuestas.data?.filter((s) => s.status === "PUBLISHED").length ?? 0;
  const respuestas = encuestas.data?.reduce((suma, s) => suma + s.responseCount, 0) ?? 0;
  const recientes = [...(encuestas.data ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de egresados, empleabilidad y encuestas de seguimiento."
        actions={
          <>
            <SystemStatus />
            <Button variant="outline" onClick={exportarExcel} disabled={!egresados.data || exportando}>
              <FileSpreadsheet aria-hidden />
              {exportando ? "Generando..." : "Exportar Excel"}
            </Button>
            <Link href="/resumen-ejecutivo" className={buttonVariants()}>
              <FileText aria-hidden />
              Resumen ejecutivo
            </Link>
          </>
        }
      />

      {egresados.isError && <ErrorState>{apiErrorMessage(egresados.error)}</ErrorState>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Egresados" icon={GraduationCap} value={m ? m.total : "—"} hint="Perfiles registrados" />
        <StatCard label="Empleabilidad" icon={TrendingUp} value={m ? `${m.empleabilidad}%` : "—"}
          hint="Empleados e independientes" />
        <StatCard label="Inserción promedio" icon={Clock}
          value={m?.insercion != null ? `${m.insercion.toFixed(1)} m` : "—"} hint="Meses hasta el primer empleo" />
        <StatCard label="Encuestas activas" icon={ClipboardList} value={encuestas.data ? activas : "—"}
          hint={`${respuestas} respuestas en total`} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Egresados por promoción</CardTitle>
            <CardDescription>Últimos {PROMOCIONES_VISIBLES} años según la fecha de egreso</CardDescription>
          </CardHeader>
          <CardContent>
            {egresados.isPending ? (
              <LoadingState className="border-0 py-20" />
            ) : m && m.total > 0 ? (
              <ColumnChart items={m.promociones} />
            ) : (
              <EmptyState icon={GraduationCap} title="Sin egresados registrados" className="border-0" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Situación laboral</CardTitle>
            <CardDescription>Distribución actual de los egresados</CardDescription>
          </CardHeader>
          <CardContent>
            {egresados.isPending ? (
              <LoadingState className="border-0 py-20" />
            ) : m && m.total > 0 ? (
              <BarList items={m.estados} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Encuestas recientes</CardTitle>
            <CardDescription>Estado y participación de las últimas encuestas</CardDescription>
            <CardAction>
              <Link href="/admin/encuestas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ver todas
                <ArrowUpRight aria-hidden />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            {encuestas.isPending ? (
              <LoadingState className="border-0" />
            ) : encuestas.isError ? (
              <ErrorState>{apiErrorMessage(encuestas.error)}</ErrorState>
            ) : recientes.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Aún no hay encuestas" className="border-0" />
            ) : (
              <ul className="-mx-2 flex flex-col">
                {recientes.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/admin/encuestas/${s.id}`}
                      className="flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/60"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <ClipboardList aria-hidden className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{s.title}</span>
                        <span className="text-xs text-muted-foreground">
                          Periodo {s.period} · Creada el {formatDateTime(s.createdAt)}
                        </span>
                      </div>
                      <span className="hidden text-right text-xs text-muted-foreground sm:block">
                        <span className="block text-sm font-medium text-foreground tabular-nums">{s.responseCount}</span>
                        respuestas
                      </span>
                      <SurveyStatusBadge status={s.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Programas con más egresados</CardTitle>
            <CardDescription>Top 5 por número de perfiles</CardDescription>
          </CardHeader>
          <CardContent>
            {m && m.programas.length > 0 ? (
              <BarList items={m.programas} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Sin datos todavía.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bolsa de trabajo
          </CardTitle>
          <CardDescription>Actividad de empresas, ofertas y postulaciones</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/empresas", icon: Building2, label: "Empresas pendientes", value: empresas.data?.filter((c) => c.status === "PENDING").length ?? "—" },
            { href: "/admin/ofertas", icon: BriefcaseBusiness, label: "Ofertas abiertas", value: ofertas.data?.filter((o) => o.acceptingApplications).length ?? "—" },
            { href: "/admin/postulaciones", icon: FileUser, label: "Postulaciones", value: postulaciones.data?.length ?? "—" },
          ].map(({ href, icon: Icon, label, value }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon aria-hidden className="size-4" />
              </span>
              <div className="flex flex-1 flex-col">
                <span className="text-xl font-semibold tabular-nums">{value}</span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <ArrowUpRight aria-hidden className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
