import { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";

export type Degree = "BACHELOR" | "TITLED";
export type SalaryRange =
  | "UNDER_1000"
  | "FROM_1000_TO_2000"
  | "FROM_2000_TO_3500"
  | "FROM_3500_TO_5000"
  | "OVER_5000";
export type EmploymentStatus = "EMPLOYED" | "UNEMPLOYED" | "INDEPENDENT";

export const DEGREE_LABELS: Record<Degree, string> = {
  BACHELOR: "Bachiller",
  TITLED: "Titulado",
};

/** Debe coincidir con el enum SalaryRange del backend (lista fija). */
export const SALARY_RANGE_LABELS: Record<SalaryRange, string> = {
  UNDER_1000: "Menos de S/ 1,000",
  FROM_1000_TO_2000: "S/ 1,000 - 2,000",
  FROM_2000_TO_3500: "S/ 2,000 - 3,500",
  FROM_3500_TO_5000: "S/ 3,500 - 5,000",
  OVER_5000: "Más de S/ 5,000",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  EMPLOYED: "Empleado",
  UNEMPLOYED: "Desempleado",
  INDEPENDENT: "Independiente",
};

export interface Experience {
  id: string;
  company: string;
  position: string;
  sector: string;
  salaryRange: SalaryRange | null;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  isFirstJob: boolean;
  isSelfEmployed: boolean;
}

export interface GraduateProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string | null;
  birthDate: string | null;
  city: string | null;
  dataConsent: boolean;
  dataConsentAt: string;
  studentCode: string;
  program: string;
  admissionYear: number;
  graduationDate: string;
  degree: Degree;
  experiences: Experience[];
  employmentStatus: EmploymentStatus;
  insertionMonths: number | null;
}

export interface ProfileInput {
  dataConsent: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  phone?: string;
  birthDate?: string;
  city?: string;
  studentCode: string;
  program: string;
  admissionYear: number;
  graduationDate: string;
  degree: Degree;
}

export type ExperienceInput = Omit<Experience, "id" | "salaryRange" | "endDate"> & {
  salaryRange?: SalaryRange;
  endDate?: string;
};

export interface GraduateFilters {
  search?: string;
  cohort?: number;
  employmentStatus?: EmploymentStatus;
}

export const MY_PROFILE_QUERY_KEY = ["graduates", "me"] as const;

/** null si el egresado aun no tiene perfil (404). */
export async function fetchMyProfile(): Promise<GraduateProfile | null> {
  try {
    const { data } = await apiClient.get<GraduateProfile>("/graduates/me");
    return data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) return null;
    throw error;
  }
}

export async function saveMyProfile(input: ProfileInput): Promise<GraduateProfile> {
  const { data } = await apiClient.put<GraduateProfile>("/graduates/me", input);
  return data;
}

export async function addExperience(input: ExperienceInput): Promise<Experience> {
  const { data } = await apiClient.post<Experience>("/graduates/me/experiences", input);
  return data;
}

export async function updateExperience(id: string, input: ExperienceInput): Promise<Experience> {
  const { data } = await apiClient.put<Experience>(`/graduates/me/experiences/${id}`, input);
  return data;
}

export async function deleteExperience(id: string): Promise<void> {
  await apiClient.delete(`/graduates/me/experiences/${id}`);
}

export async function fetchGraduates(filters: GraduateFilters): Promise<GraduateProfile[]> {
  const { data } = await apiClient.get<GraduateProfile[]>("/graduates", { params: filters });
  return data;
}

export async function fetchGraduate(id: string): Promise<GraduateProfile> {
  const { data } = await apiClient.get<GraduateProfile>(`/graduates/${id}`);
  return data;
}

/** Las columnas son DATE: el backend responde ISO a medianoche UTC. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const [anio, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Extrae el mensaje del formato de error de Nest ({ message: string | string[] }). */
export function apiErrorMessage(error: unknown, fallback = "No se pudo contactar la API"): string {
  if (error instanceof AxiosError) {
    const mensaje = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(mensaje)) return mensaje.join(". ");
    if (mensaje) return mensaje;
  }
  return fallback;
}
