"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BriefcaseBusiness,
  Clock,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Smile,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BarList, StatCard } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/layout/page-header";
import { RequireRole } from "@/components/require-role";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { exportarEgresadosExcel } from "@/lib/export-excel";
import {
  EMPLOYMENT_STATUS_LABELS,
  type EmploymentStatus,
  SALARY_RANGE_LABELS,
  type SalaryRange,
  apiErrorMessage,
  fetchGraduates,
} from "@/lib/graduates";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/jobs";
import {
  type ReportFilters,
  describirFiltros,
  fetchReportSummary,
  filtrosAQuery,
  reportQueryKey,
} from "@/lib/reports";

function Reportes() {
  const [filtros, setFiltros] = useState<ReportFilters>({});
  const [exportando, setExportando] = useState(false);
  const consulta = useQuery({
    queryKey: reportQueryKey(filtros),
    queryFn: () => fetchReportSummary(filtros),
    placeholderData: keepPreviousData,
  });

  async function exportarExcel() {
    setExportando(true);
    try {
      // El detalle por egresado se filtra igual que los indicadores del backend.
      const todos = await fetchGraduates(filtros.cohort ? { cohort: filtros.cohort } : {});
      const filtrados = todos.filter((g) => {
        const egreso = g.graduationDate.slice(0, 10);
        return (
          (!filtros.program || g.program === filtros.program) &&
          (!filtros.from || egreso >= filtros.from) &&
          (!filtros.to || egreso <= filtros.to)
        );
      });
      await exportarEgresadosExcel(filtrados, describirFiltros(filtros));
      toast.success("Excel descargado");
    } catch {
      toast.error("No se pudo generar el Excel");
    } finally {
      setExportando(false);
    }
  }

  if (consulta.isPending) return <LoadingState />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const r = consulta.data;
  const set = (campo: keyof ReportFilters, valor: string | number | undefined) =>
    setFiltros((f) => ({ ...f, [campo]: valor || undefined }));
  const conEmpleo = r.employment.EMPLOYED + r.employment.INDEPENDENT;
  const totalPostulaciones = Object.values(r.jobBoard.applications).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Indicadores de empleabilidad para informes de gestión y acreditación."
        actions={
          <>
            <Button variant="outline" disabled={r.totalGraduates === 0 || exportando} onClick={() => void exportarExcel()}>
              <FileSpreadsheet aria-hidden />
              {exportando ? "Generando..." : "Excel"}
            </Button>
            <Link href={`/resumen-ejecutivo?${filtrosAQuery(filtros)}`} className={buttonVariants({ variant: "outline" })}>
              <FileText aria-hidden />
              PDF
            </Link>
          </>
        }
      />

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-promocion">Promoción</Label>
            <NativeSelect id="f-promocion" className="w-full" value={filtros.cohort ?? ""}
              onChange={(e) => set("cohort", Number(e.target.value))}>
              <NativeSelectOption value="">Todas</NativeSelectOption>
              {r.filterOptions.cohorts.map((p) => <NativeSelectOption key={p} value={p}>{p}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-programa">Programa</Label>
            <NativeSelect id="f-programa" className="w-full" value={filtros.program ?? ""}
              onChange={(e) => set("program", e.target.value)}>
              <NativeSelectOption value="">Todos</NativeSelectOption>
              {r.filterOptions.programs.map((p) => <NativeSelectOption key={p} value={p}>{p}</NativeSelectOption>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-desde">Egreso desde</Label>
            <Input id="f-desde" type="date" value={filtros.from ?? ""} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="f-hasta">Egreso hasta</Label>
            <Input id="f-hasta" type="date" min={filtros.from} value={filtros.to ?? ""} onChange={(e) => set("to", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {r.totalGraduates === 0 ? (
        <EmptyState icon={BarChart3} title="Sin datos para estos filtros"
          description="Ajusta la promoción, el programa o el rango de fechas." />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Egresados" icon={GraduationCap} value={r.totalGraduates} hint="Con los filtros aplicados" />
            <StatCard label="Empleabilidad" icon={TrendingUp} value={`${r.employabilityRate}%`}
              hint={`${conEmpleo} con empleo o independientes`} />
            <StatCard label="Inserción promedio" icon={Clock}
              value={r.avgInsertionMonths !== null ? `${r.avgInsertionMonths.toFixed(1)} m` : "—"}
              hint="Meses hasta el primer empleo" />
            <StatCard label="Satisfacción" icon={Smile}
              value={r.avgSatisfaction !== null ? r.avgSatisfaction.toFixed(2) : "—"}
              hint={`Promedio 1-5 · ${r.satisfactionAnswers} respuestas`} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tasa de empleabilidad</CardTitle>
                <CardDescription>Situación laboral actual</CardDescription>
              </CardHeader>
              <CardContent>
                <BarList
                  items={(Object.keys(EMPLOYMENT_STATUS_LABELS) as EmploymentStatus[]).map((e) => ({
                    label: EMPLOYMENT_STATUS_LABELS[e],
                    value: r.employment[e],
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sectores de inserción</CardTitle>
                <CardDescription>Sector del empleo actual de los egresados con trabajo</CardDescription>
              </CardHeader>
              <CardContent>
                {r.sectors.length ? (
                  <BarList items={r.sectors} />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Sin experiencias registradas.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rangos salariales</CardTitle>
                <CardDescription>Según el empleo actual declarado (opcional para el egresado)</CardDescription>
              </CardHeader>
              <CardContent>
                {r.salaryRanges.length ? (
                  <BarList
                    items={(Object.keys(SALARY_RANGE_LABELS) as SalaryRange[]).map((k) => ({
                      label: SALARY_RANGE_LABELS[k],
                      value: r.salaryRanges.find((s) => s.label === k)?.value ?? 0,
                    }))}
                  />
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">Ningún egresado indicó su rango salarial.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasa de respuesta por encuesta</CardTitle>
                <CardDescription>Respuestas sobre egresados del público objetivo</CardDescription>
              </CardHeader>
              <CardContent>
                {r.surveys.length ? (
                  <ul className="flex flex-col gap-3">
                    {r.surveys.map((s) => (
                      <li key={s.id} className="flex flex-col gap-1.5">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="truncate font-medium">{s.title}</span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {s.responses}/{s.eligible} · {s.responseRate}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, s.responseRate)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">No hay encuestas publicadas.</p>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness aria-hidden className="size-4 text-primary" />
            Bolsa de trabajo
          </CardTitle>
          <CardDescription>
            {r.jobBoard.openOffers} ofertas vigentes de {r.jobBoard.offers} publicadas ·{" "}
            {r.jobBoard.companies.APPROVED} empresas aprobadas · {totalPostulaciones} postulaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarList
            className="lg:grid lg:grid-cols-2 lg:gap-x-10"
            items={(Object.keys(APPLICATION_STATUS_LABELS) as ApplicationStatus[]).map((e) => ({
              label: APPLICATION_STATUS_LABELS[e],
              value: r.jobBoard.applications[e],
            }))}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default function ReportesPage() {
  return (
    <RequireRole roles={["ADMIN"]}>
      <Reportes />
    </RequireRole>
  );
}
