import { AxiosError } from "axios";
import { apiClient } from "@/lib/api-client";

export type SurveyStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type QuestionType = "TEXT" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SCALE";

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
  CLOSED: "Cerrada",
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  TEXT: "Texto",
  SINGLE_CHOICE: "Opción única",
  MULTIPLE_CHOICE: "Opción múltiple",
  SCALE: "Escala 1-5",
};

export const SCALE_VALUES = ["1", "2", "3", "4", "5"] as const;

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  required: boolean;
  order: number;
  isSatisfaction: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string | null;
  period: string;
  status: SurveyStatus;
  opensAt: string | null;
  closesAt: string | null;
  targetCohort: number | null;
  createdAt: string;
}

export interface SurveyDetail extends Survey {
  questions: Question[];
}

export interface SurveyListItem extends Survey {
  questionCount: number;
  responseCount: number;
}

export interface GraduateSurvey extends SurveyDetail {
  answered: boolean;
}

export interface SurveyInput {
  title: string;
  description?: string;
  period: string;
}

export interface QuestionInput {
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export interface PublishInput {
  opensAt: string;
  closesAt: string;
  targetCohort?: number;
}

export interface AnswerInput {
  questionId: string;
  values: string[];
}

export interface QuestionSummary {
  questionId: string;
  text: string;
  type: QuestionType;
  isSatisfaction: boolean;
  answered: number;
  options: { option: string; count: number; percentage: number }[];
  average: number | null;
  texts: string[];
}

export interface SurveyResults {
  survey: Survey;
  eligible: number;
  responses: number;
  responseRate: number;
  questions: QuestionSummary[];
}

export const SURVEYS_QUERY_KEY = ["surveys"] as const;
export const surveyKey = (id: string) => ["surveys", "detail", id] as const;
export const MY_SURVEYS_QUERY_KEY = ["surveys", "me"] as const;

// ---------------------------------------------------------------- admin

export async function fetchSurveys(): Promise<SurveyListItem[]> {
  const { data } = await apiClient.get<SurveyListItem[]>("/surveys");
  return data;
}

export async function fetchSurvey(id: string): Promise<SurveyDetail> {
  const { data } = await apiClient.get<SurveyDetail>(`/surveys/${id}`);
  return data;
}

export async function createSurvey(input: SurveyInput): Promise<SurveyDetail> {
  const { data } = await apiClient.post<SurveyDetail>("/surveys", input);
  return data;
}

export async function deleteSurvey(id: string): Promise<void> {
  await apiClient.delete(`/surveys/${id}`);
}

export async function publishSurvey(id: string, input: PublishInput): Promise<SurveyDetail> {
  const { data } = await apiClient.post<SurveyDetail>(`/surveys/${id}/publish`, input);
  return data;
}

export async function closeSurvey(id: string): Promise<SurveyDetail> {
  const { data } = await apiClient.post<SurveyDetail>(`/surveys/${id}/close`);
  return data;
}

export async function addQuestion(surveyId: string, input: QuestionInput): Promise<Question> {
  const { data } = await apiClient.post<Question>(`/surveys/${surveyId}/questions`, input);
  return data;
}

export async function updateQuestion(
  surveyId: string,
  questionId: string,
  input: QuestionInput,
): Promise<Question> {
  const { data } = await apiClient.put<Question>(
    `/surveys/${surveyId}/questions/${questionId}`,
    input,
  );
  return data;
}

export async function deleteQuestion(surveyId: string, questionId: string): Promise<void> {
  await apiClient.delete(`/surveys/${surveyId}/questions/${questionId}`);
}

export async function reorderQuestions(
  surveyId: string,
  questionIds: string[],
): Promise<SurveyDetail> {
  const { data } = await apiClient.put<SurveyDetail>(`/surveys/${surveyId}/questions/order`, {
    questionIds,
  });
  return data;
}

export async function fetchSurveyResults(id: string): Promise<SurveyResults> {
  const { data } = await apiClient.get<SurveyResults>(`/surveys/${id}/results`);
  return data;
}

// -------------------------------------------------------------- egresado

export async function fetchMySurveys(): Promise<GraduateSurvey[]> {
  const { data } = await apiClient.get<GraduateSurvey[]>("/surveys/me");
  return data;
}

export async function fetchMySurvey(id: string): Promise<GraduateSurvey> {
  const { data } = await apiClient.get<GraduateSurvey>(`/surveys/me/${id}`);
  return data;
}

export async function submitSurvey(id: string, answers: AnswerInput[]): Promise<void> {
  await apiClient.post(`/surveys/me/${id}/responses`, { answers });
}

// ---------------------------------------------------------------- utilidades

/** Errores por pregunta que devuelve el backend al enviar respuestas. */
export function apiFieldErrors(error: unknown): Record<string, string> {
  if (error instanceof AxiosError) {
    const errores = (error.response?.data as { errors?: Record<string, string> } | undefined)
      ?.errors;
    if (errores) return errores;
  }
  return {};
}

/** 'YYYY-MM-DD' local -> ISO al inicio o al final de ese día. */
export function dayToIso(day: string, endOfDay = false): string {
  return new Date(`${day}T${endOfDay ? "23:59:59.999" : "00:00:00"}`).toISOString();
}

export function formatDateTime(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("es-PE") : "-";
}

export function audienceLabel(targetCohort: number | null): string {
  return targetCohort === null ? "Todos los egresados" : `Promoción ${targetCohort}`;
}
