import { apiClient } from "@/lib/api-client";
import type { Degree, Experience, ExperienceInput, ProfileInput, SalaryRange } from "@/lib/graduates";
import { AREAS, type ContractType, type Modality } from "@/lib/jobs";
import { type ProfileExtras, lista } from "@/lib/profile-extras";

/** Gemini puede tardar con un PDF escaneado: más que el timeout general (10 s). */
const AI_TIMEOUT = 90_000;

export const CV_ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";
export const CV_MAX_MB = 5;

export interface CvDraft {
  profile: Partial<Pick<ProfileInput,
    "firstName" | "lastName" | "dni" | "phone" | "birthDate" | "city" |
    "studentCode" | "program" | "admissionYear" | "graduationDate">> & { degree?: Degree };
  extras: {
    headline: string;
    summary: string;
    skills: string[];
    languages: string[];
    certifications: string[];
    linkedin: string;
    github: string;
    website: string;
  };
  experiences: {
    company: string;
    position: string;
    sector: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    isSelfEmployed: boolean;
  }[];
}

export type MatchLevel = "ALTO" | "MEDIO" | "BAJO";

export interface MatchResult {
  score: number;
  level: MatchLevel;
  summary: string;
  strengths: string[];
  gaps: string[];
  tips: string[];
}

export interface RankedCandidate {
  graduateId: string;
  score: number;
  level: MatchLevel;
  summary: string;
}

export const MATCH_LEVEL_LABELS: Record<MatchLevel, string> = {
  ALTO: "Compatibilidad alta",
  MEDIO: "Compatibilidad media",
  BAJO: "Compatibilidad baja",
};

export const AI_STATUS_QUERY_KEY = ["ai", "status"] as const;

export async function fetchAiStatus(): Promise<{ enabled: boolean }> {
  const { data } = await apiClient.get<{ enabled: boolean }>("/ai/status");
  return data;
}

export async function parseCv(file: File): Promise<CvDraft> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<CvDraft>("/ai/cv", form, {
    timeout: AI_TIMEOUT,
    // axios pone el boundary del multipart si el Content-Type queda sin fijar.
    headers: { "Content-Type": undefined },
  });
  return data;
}

/** El backend toma el perfil profesional de la base. */
export async function matchOffer(offerId: string): Promise<MatchResult> {
  const { data } = await apiClient.post<MatchResult>(`/ai/offers/${offerId}/match`, undefined, {
    timeout: AI_TIMEOUT,
  });
  return data;
}

export async function rankApplicants(offerId: string): Promise<RankedCandidate[]> {
  const { data } = await apiClient.post<RankedCandidate[]>(`/ai/offers/${offerId}/rank`, undefined, {
    timeout: AI_TIMEOUT,
  });
  return data;
}

// ------------------------------------------------- aplicar el borrador del CV

/** Une listas separadas por comas sin repetir (sin distinguir mayúsculas). */
function unir(actual: string, nuevos: string[]): string {
  const items = lista(actual);
  const vistos = new Set(items.map((i) => i.toLowerCase()));
  for (const n of nuevos) {
    if (!vistos.has(n.toLowerCase())) {
      vistos.add(n.toLowerCase());
      items.push(n);
    }
  }
  return items.join(", ");
}

/** Completa lo vacío y suma a las listas: nunca borra lo que el egresado escribió. */
export function mergeExtras(actual: ProfileExtras, draft: CvDraft["extras"]): ProfileExtras {
  return {
    ...actual,
    headline: actual.headline || draft.headline,
    summary: actual.summary || draft.summary,
    linkedin: actual.linkedin || draft.linkedin,
    github: actual.github || draft.github,
    website: actual.website || draft.website,
    skills: unir(actual.skills, draft.skills),
    languages: unir(actual.languages, draft.languages),
    certifications: unir(actual.certifications, draft.certifications),
  };
}

const claveExp = (e: { company: string; position: string }) =>
  `${e.company}|${e.position}`.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Experiencias del CV que aún no están registradas. Si el egresado no tiene
 * ninguna, la más antigua se marca como primer empleo (métrica de inserción).
 */
export function nuevasExperiencias(draft: CvDraft["experiences"], actuales: Experience[]): ExperienceInput[] {
  const existentes = new Set(actuales.map(claveExp));
  const nuevas = draft.filter((e) => !existentes.has(claveExp(e)));
  const masAntigua = actuales.length === 0
    ? nuevas.reduce<string | null>((min, e) => (min === null || e.startDate < min ? e.startDate : min), null)
    : null;
  let marcada = false;
  return nuevas.map((e) => {
    const esPrimera = !marcada && e.startDate === masAntigua;
    if (esPrimera) marcada = true;
    return { ...e, isFirstJob: esPrimera };
  });
}

export const hayExtras = (x: CvDraft["extras"]) =>
  Boolean(x.headline || x.summary || x.linkedin || x.github || x.website ||
    x.skills.length || x.languages.length || x.certifications.length);

// ------------------------------------------------------ redactor de ofertas

/** Borrador de oferta: los mismos campos del formulario salvo la fecha límite. */
export interface OfferDraft {
  title: string;
  description: string;
  requirements: string;
  area: string;
  experience: string;
  contractType: ContractType;
  modality: Modality;
  location: string;
  salaryRange?: SalaryRange;
}

export async function draftOffer(idea: string): Promise<OfferDraft> {
  const { data } = await apiClient.post<OfferDraft>(
    "/ai/offers/draft",
    { idea, areas: [...AREAS] },
    { timeout: AI_TIMEOUT },
  );
  return data;
}

// ---------------------------------------------------- resumen de encuestas

export type Sentiment = "POSITIVO" | "NEUTRO" | "NEGATIVO";

export interface SurveySummary {
  overview: string;
  findings: string[];
  themes: { theme: string; mentions: number; sentiment: Sentiment; example: string }[];
  recommendations: string[];
  responses: number;
}

export async function summarizeSurvey(id: string): Promise<SurveySummary> {
  const { data } = await apiClient.post<SurveySummary>(`/ai/surveys/${id}/summary`, undefined, {
    timeout: AI_TIMEOUT,
  });
  return data;
}
