"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { BarList, ColumnChart } from "@/components/dashboard/charts";
import { Brand } from "@/components/layout/brand";
import { RequireRole } from "@/components/require-role";
import { ErrorState, LoadingState } from "@/components/states";
import { Button, buttonVariants } from "@/components/ui/button";
import { EMPLOYMENT_STATUS_LABELS, type EmploymentStatus, apiErrorMessage } from "@/lib/graduates";
import { describirFiltros, fetchReportSummary, filtrosDesdeQuery, reportQueryKey } from "@/lib/reports";
import { useSession } from "@/lib/use-session";

function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <section className="flex break-inside-avoid flex-col gap-4">
      <h2 className="flex items-center gap-3 text-base font-semibold tracking-tight">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-l-4 border-l-primary bg-card p-4">
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </div>
  );
}

function Panel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex break-inside-avoid flex-col gap-4 rounded-xl border bg-card p-5">
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {children}
    </div>
  );
}

function Resumen() {
  const { user } = useSession();
  const filtros = filtrosDesdeQuery(useSearchParams());
  const consulta = useQuery({ queryKey: reportQueryKey(filtros), queryFn: () => fetchReportSummary(filtros) });

  if (consulta.isPending) return <LoadingState label="Preparando el resumen..." />;
  if (consulta.isError) return <ErrorState>{apiErrorMessage(consulta.error)}</ErrorState>;

  const r = consulta.data;
  const descripcionFiltros = describirFiltros(filtros);
  const estados = (Object.keys(EMPLOYMENT_STATUS_LABELS) as EmploymentStatus[]).map((e) => ({
    label: EMPLOYMENT_STATUS_LABELS[e],
    value: r.employment[e],
  }));
  const tasas = r.surveys.filter((s) => s.eligible > 0).map((s) => s.responseRate);
  const tasaRespuesta = tasas.length ? Math.round(tasas.reduce((a, b) => a + b, 0) / tasas.length) : null;
  const respuestas = r.surveys.reduce((suma, s) => suma + s.responses, 0);
  const promocionTop = [...r.cohorts].sort((a, b) => b.value - a.value)[0];
  const programaTop = r.programs[0];
  const sectorTop = r.sectors[0];
  const desempleados = r.employment.UNEMPLOYED;
  const fecha = new Date(r.generatedAt).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
  const m = { total: r.totalGraduates, empleabilidad: r.employabilityRate, insercion: r.avgInsertionMonths };
  const satisfaccion = r.avgSatisfaction;

  const hallazgos = [
    `Se registran ${m.total} egresados${descripcionFiltros ? " para los filtros aplicados" : " en el sistema"}, con una tasa de empleabilidad de ${m.empleabilidad}% (empleados e independientes).`,
    m.insercion !== null
      ? `El tiempo promedio de inserción laboral es de ${m.insercion.toFixed(1)} meses desde la fecha de egreso.`
      : "Aún no hay suficientes experiencias registradas para estimar el tiempo de inserción laboral.",
    desempleados > 0 &&
      `${desempleados} ${desempleados === 1 ? "egresado se encuentra" : "egresados se encuentran"} sin empleo registrado, población prioritaria para la bolsa de trabajo.`,
    sectorTop && `El sector con más egresados empleados es ${sectorTop.label} (${sectorTop.value}).`,
    promocionTop && promocionTop.value > 0 &&
      `La promoción ${promocionTop.label} concentra el mayor número de perfiles (${promocionTop.value}).`,
    programaTop && `El programa con más egresados registrados es ${programaTop.label} (${programaTop.value}).`,
    `Hay ${r.surveys.length} ${r.surveys.length === 1 ? "encuesta publicada" : "encuestas publicadas"} y ${respuestas} respuestas acumuladas${
      tasaRespuesta !== null ? `, con una tasa de respuesta promedio de ${tasaRespuesta}%` : ""
    }.`,
    satisfaccion !== null && `La satisfacción promedio con la formación recibida es de ${satisfaccion.toFixed(2)} sobre 5.`,
    `La bolsa de trabajo cuenta con ${r.jobBoard.companies.APPROVED} empresas aprobadas, ${r.jobBoard.openOffers} ofertas vigentes y ${r.jobBoard.applications.ACCEPTED} postulaciones aceptadas.`,
  ].filter(Boolean) as string[];

  const recomendaciones = [
    m.empleabilidad < 70
      ? "Fortalecer la bolsa de trabajo y los convenios con empresas para elevar la empleabilidad."
      : "Mantener los vínculos con el sector empresarial que sostienen la alta empleabilidad.",
    tasaRespuesta === null || tasaRespuesta < 50
      ? "Incrementar la participación en encuestas mediante recordatorios y campañas de actualización de datos."
      : "Aprovechar la buena participación en encuestas para profundizar en necesidades de capacitación.",
    m.insercion !== null && m.insercion > 6
      ? "Reforzar la orientación laboral en los últimos ciclos para reducir el tiempo de inserción."
      : "Difundir los casos de inserción temprana como referencia para estudiantes y nuevas promociones.",
    "Usar estos indicadores como evidencia en los procesos de acreditación y mejora curricular.",
  ];

  return (
    <article className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 border-b-2 border-primary pb-6">
        <div className="flex items-center justify-between gap-4">
          <Brand />
          <span className="text-right text-xs text-muted-foreground">
            Generado el {fecha}
            {user && <span className="block">por {user.email}</span>}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wider text-primary uppercase">Resumen ejecutivo</span>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Seguimiento de egresados y empleabilidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Universidad Nacional de Trujillo · Facultad de Ingeniería · Escuela Profesional de Ingeniería de Sistemas
          </p>
          <p className="text-xs text-muted-foreground">
            Filtros: {descripcionFiltros ?? "todos los egresados registrados"}
          </p>
        </div>
      </header>

      <Seccion numero={1} titulo="Propósito">
        <p className="text-sm leading-relaxed text-foreground/85">
          Este documento resume la situación de los egresados registrados en SISEBT: su inserción en el mercado
          laboral, la distribución por promoción y programa, y la participación en las encuestas de seguimiento. Su
          objetivo es apoyar la toma de decisiones de las autoridades académicas, la mejora continua de la formación y
          los procesos de acreditación.
        </p>
      </Seccion>

      <Seccion numero={2} titulo="Indicadores clave">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
          <Kpi label="Egresados" value={String(m.total)} hint="Perfiles registrados" />
          <Kpi label="Empleabilidad" value={`${m.empleabilidad}%`} hint="Empleados e independientes" />
          <Kpi label="Inserción" value={m.insercion !== null ? `${m.insercion.toFixed(1)} m` : "—"} hint="Meses al primer empleo" />
          <Kpi label="Satisfacción" value={satisfaccion !== null ? satisfaccion.toFixed(2) : "—"} hint="Promedio sobre 5" />
        </div>
      </Seccion>

      <Seccion numero={3} titulo="Hallazgos principales">
        <ul className="flex flex-col gap-2.5">
          {hallazgos.map((h) => (
            <li key={h} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              {h}
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion numero={4} titulo="Análisis gráfico">
        <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
          <div className="md:col-span-2 print:col-span-2">
            <Panel titulo="Egresados por promoción">
              <ColumnChart items={r.cohorts} height={170} showValues />
            </Panel>
          </div>
          <Panel titulo="Situación laboral">
            <BarList items={estados} />
          </Panel>
          <Panel titulo="Sectores de inserción">
            {r.sectors.length ? <BarList items={r.sectors} /> : <p className="text-sm text-muted-foreground">Sin datos.</p>}
          </Panel>
        </div>
      </Seccion>

      <Seccion numero={5} titulo="Encuestas de seguimiento">
        {r.surveys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay encuestas publicadas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 font-medium">Encuesta</th>
                <th className="py-2 text-right font-medium">Público objetivo</th>
                <th className="py-2 text-right font-medium">Respuestas</th>
                <th className="py-2 text-right font-medium">Tasa</th>
              </tr>
            </thead>
            <tbody>
              {r.surveys.slice(0, 8).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium">{s.title}</td>
                  <td className="py-2.5 text-right tabular-nums">{s.eligible}</td>
                  <td className="py-2.5 text-right tabular-nums">{s.responses}</td>
                  <td className="py-2.5 text-right tabular-nums">{s.responseRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Seccion>

      <Seccion numero={6} titulo="Recomendaciones">
        <ol className="flex flex-col gap-2.5">
          {recomendaciones.map((r, i) => (
            <li key={r} className="flex gap-3 text-sm leading-relaxed">
              <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
              {r}
            </li>
          ))}
        </ol>
      </Seccion>

      <footer className="border-t pt-4 text-xs text-muted-foreground">
        Fuente: SISEBT — Sistema de Seguimiento de Egresados y Bolsa de Trabajo. Datos al {fecha}.
      </footer>
    </article>
  );
}

export default function ResumenEjecutivoPage() {
  return (
    <div className="min-h-svh bg-muted/40 py-8 print:bg-white print:py-0 [print-color-adjust:exact]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4">
        <div className="flex items-center justify-between gap-2 print:hidden">
          <Link href="/admin/reportes" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Volver a reportes
          </Link>
          <Button onClick={() => window.print()}>
            <Printer aria-hidden />
            Imprimir / Guardar PDF
          </Button>
        </div>
        <div className="rounded-2xl border bg-background p-8 shadow-sm sm:p-12 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <RequireRole roles={["ADMIN"]}>
            <Suspense fallback={<LoadingState label="Preparando el resumen..." />}>
              <Resumen />
            </Suspense>
          </RequireRole>
        </div>
      </div>
    </div>
  );
}
