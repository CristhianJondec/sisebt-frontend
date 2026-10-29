import { apiClient } from "@/lib/api-client";
import type { EmploymentStatus, SalaryRange } from "@/lib/graduates";
import type { ApplicationStatus, CompanyStatus } from "@/lib/jobs";

export interface ReportFilters {
  cohort?: number;
  program?: string;
  from?: string;
  to?: string;
}

export interface Bucket {
  label: string;
  value: number;
}

export interface ReportSummary {
  generatedAt: string;
  totalGraduates: number;
  employment: Record<EmploymentStatus, number>;
  employabilityRate: number;
  avgInsertionMonths: number | null;
  avgSatisfaction: number | null;
  satisfactionAnswers: number;
  sectors: Bucket[];
  salaryRanges: { label: SalaryRange; value: number }[];
  cohorts: Bucket[];
  programs: Bucket[];
  surveys: { id: string; title: string; status: string; eligible: number; responses: number; responseRate: number }[];
  jobBoard: {
    offers: number;
    openOffers: number;
    applications: Record<ApplicationStatus, number>;
    companies: Record<CompanyStatus, number>;
  };
  filterOptions: { programs: string[]; cohorts: number[] };
}

/** Filtros sin valores vacíos (el backend rechaza `cohort=`). */
export function limpiarFiltros(f: ReportFilters): ReportFilters {
  return Object.fromEntries(Object.entries(f).filter(([, v]) => v !== "" && v != null)) as ReportFilters;
}

export async function fetchReportSummary(filters: ReportFilters): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>("/reports/summary", { params: limpiarFiltros(filters) });
  return data;
}

export const reportQueryKey = (f: ReportFilters) => ["reports", "summary", limpiarFiltros(f)] as const;

/** Texto legible de los filtros activos, para encabezados y archivos exportados. */
export function describirFiltros(f: ReportFilters): string | undefined {
  const partes = [
    f.cohort && `promoción ${f.cohort}`,
    f.program,
    f.from && `egreso desde ${f.from}`,
    f.to && `egreso hasta ${f.to}`,
  ].filter(Boolean);
  return partes.length ? partes.join(", ") : undefined;
}

/** Filtros <-> query string (para abrir el resumen PDF con la misma vista). */
export function filtrosAQuery(f: ReportFilters): string {
  return new URLSearchParams(Object.entries(limpiarFiltros(f)).map(([k, v]) => [k, String(v)])).toString();
}

export function filtrosDesdeQuery(params: URLSearchParams): ReportFilters {
  const cohort = Number(params.get("cohort"));
  return limpiarFiltros({
    cohort: Number.isInteger(cohort) && cohort > 0 ? cohort : undefined,
    program: params.get("program") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
}
