import { apiClient } from "@/lib/api-client";
import type { SalaryRange } from "@/lib/graduates";

// Los enums deben coincidir con los del backend (prisma/schema.prisma).
export type CompanyStatus = "PENDING" | "APPROVED" | "REJECTED";
export type ContractType = "FULL_TIME" | "PART_TIME" | "INTERNSHIP" | "PROJECT";
export type Modality = "ONSITE" | "REMOTE" | "HYBRID";
export type OfferStatus = "OPEN" | "CLOSED";
export type ApplicationStatus = "RECEIVED" | "IN_REVIEW" | "ACCEPTED" | "REJECTED";

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const CONTRACT_LABELS: Record<ContractType, string> = {
  FULL_TIME: "Tiempo completo",
  PART_TIME: "Medio tiempo",
  INTERNSHIP: "Prácticas",
  PROJECT: "Por proyecto",
};

export const MODALITY_LABELS: Record<Modality, string> = {
  ONSITE: "Presencial",
  REMOTE: "Remoto",
  HYBRID: "Híbrido",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  RECEIVED: "Recibida",
  IN_REVIEW: "En revisión",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

/** Lista fija: el backend valida exactamente estos valores. */
export const EXPERIENCE_LEVELS = ["Sin experiencia", "1 año", "2 a 3 años", "Más de 3 años"] as const;
export const AREAS = [
  "Desarrollo de software",
  "Datos y analítica",
  "Infraestructura y redes",
  "Soporte TI",
  "Gestión de proyectos",
] as const;

export interface Company {
  id: string;
  userId: string;
  name: string;
  contactEmail: string;
  phone: string | null;
  status: CompanyStatus;
  email: string;
  offerCount: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  area: string;
  experience: string;
  contractType: ContractType;
  modality: Modality;
  location: string;
  salaryRange: SalaryRange | null;
  deadline: string;
  status: OfferStatus;
  createdAt: string;
  company: { id: string; name: string };
  applicationCount: number;
  applied?: boolean;
  acceptingApplications: boolean;
}

export interface OfferInput {
  title: string;
  description: string;
  requirements?: string;
  area: string;
  experience: string;
  contractType: ContractType;
  modality: Modality;
  location: string;
  salaryRange?: SalaryRange;
  deadline: string;
}

export interface OfferFilters {
  search?: string;
  area?: string;
  experience?: string;
  location?: string;
  contractType?: ContractType;
  modality?: Modality;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  offer: { id: string; title: string; company: { id: string; name: string } };
  graduate: {
    id: string;
    firstName: string;
    lastName: string;
    program: string;
    email: string;
    phone: string | null;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface AppEvent {
  id: string;
  title: string;
  type: string;
  description: string | null;
  date: string;
  place: string;
  seats: number;
  registeredCount: number;
  registered: boolean;
}

export const QK = {
  offers: ["offers"] as const,
  myOffers: ["offers", "mine"] as const,
  applications: ["applications"] as const,
  companies: ["companies"] as const,
  myCompany: ["companies", "me"] as const,
  notifications: ["notifications"] as const,
  events: ["events"] as const,
};

// ------------------------------------------------------------- empresas

export interface CompanyRegistration {
  name: string;
  contactEmail: string;
  phone?: string;
  email: string;
  password: string;
}

export async function registerCompany(input: CompanyRegistration): Promise<Company> {
  const { data } = await apiClient.post<Company>("/companies/register", input);
  return data;
}

export async function fetchMyCompany(): Promise<Company> {
  const { data } = await apiClient.get<Company>("/companies/me");
  return data;
}

export async function saveMyCompany(input: { name: string; contactEmail: string; phone?: string }): Promise<Company> {
  const { data } = await apiClient.put<Company>("/companies/me", input);
  return data;
}

export async function fetchCompanies(): Promise<Company[]> {
  const { data } = await apiClient.get<Company[]>("/companies");
  return data;
}

export async function setCompanyStatus(id: string, status: "APPROVED" | "REJECTED"): Promise<Company> {
  const { data } = await apiClient.patch<Company>(`/companies/${id}/status`, { status });
  return data;
}

// --------------------------------------------------------------- ofertas

/** Quita filtros vacios para no mandar `?area=` al backend. */
function limpiar<T extends object>(filtros: T): Partial<T> {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== "" && v != null)) as Partial<T>;
}

export async function fetchOffers(filters: OfferFilters = {}): Promise<Offer[]> {
  const { data } = await apiClient.get<Offer[]>("/offers", { params: limpiar(filters) });
  return data;
}

export async function fetchMyOffers(): Promise<Offer[]> {
  const { data } = await apiClient.get<Offer[]>("/offers/mine");
  return data;
}

export async function createOffer(input: OfferInput): Promise<Offer> {
  const { data } = await apiClient.post<Offer>("/offers", limpiar(input));
  return data;
}

export async function updateOffer(id: string, input: OfferInput): Promise<Offer> {
  const { data } = await apiClient.put<Offer>(`/offers/${id}`, limpiar(input));
  return data;
}

export async function deleteOffer(id: string): Promise<void> {
  await apiClient.delete(`/offers/${id}`);
}

export async function setOfferStatus(id: string, status: OfferStatus): Promise<Offer> {
  const { data } = await apiClient.patch<Offer>(`/offers/${id}/status`, { status });
  return data;
}

export async function applyToOffer(id: string): Promise<Application> {
  const { data } = await apiClient.post<Application>(`/offers/${id}/apply`);
  return data;
}

// --------------------------------------------------------- postulaciones

export async function fetchMyApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>("/applications/mine");
  return data;
}

export async function fetchCompanyApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>("/applications/company");
  return data;
}

export async function fetchAllApplications(): Promise<Application[]> {
  const { data } = await apiClient.get<Application[]>("/applications");
  return data;
}

export async function setApplicationStatus(id: string, status: ApplicationStatus): Promise<Application> {
  const { data } = await apiClient.patch<Application>(`/applications/${id}/status`, { status });
  return data;
}

// -------------------------------------------------------- notificaciones

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>("/notifications/me");
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}

// --------------------------------------------------------------- eventos

export async function fetchEvents(): Promise<AppEvent[]> {
  const { data } = await apiClient.get<AppEvent[]>("/events");
  return data;
}

export async function registerToEvent(id: string): Promise<void> {
  await apiClient.post(`/events/${id}/register`);
}

export async function unregisterFromEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}/register`);
}

export interface EventInput {
  title: string;
  type: string;
  description?: string;
  /** ISO con zona horaria. */
  date: string;
  place: string;
  seats: number;
}

export async function createEvent(input: EventInput): Promise<void> {
  await apiClient.post("/events", input);
}

export async function deleteEvent(id: string): Promise<void> {
  await apiClient.delete(`/events/${id}`);
}

// ------------------------------------------------------------- formatos

export function formatShortDate(iso: string): string {
  // Las fechas DATE llegan a medianoche UTC: se formatean en UTC para no
  // retroceder un dia por la zona horaria de Peru.
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: iso.endsWith("T00:00:00.000Z") ? "UTC" : undefined,
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Hace un momento";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} ${h === 1 ? "hora" : "horas"}`;
  const d = Math.round(h / 24);
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  return formatShortDate(iso);
}

export function initials(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
