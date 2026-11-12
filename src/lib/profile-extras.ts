import type { GraduateProfile, JobAvailability, ProfessionalInput, PublicGraduateProfile } from "@/lib/graduates";

/**
 * Perfil profesional del egresado (titular, enlaces, habilidades...). Se guarda
 * en la base (PUT /graduates/me/professional). Este módulo solo traduce entre
 * la respuesta de la API y el formulario, que edita las listas como texto
 * separado por comas.
 */
export type Availability = "" | JobAvailability;

export const AVAILABILITY_LABELS: Record<JobAvailability, string> = {
  SEEKING: "Buscando empleo activamente",
  OPEN: "Abierto a oportunidades",
  UNAVAILABLE: "No disponible",
};

export interface ProfileExtras {
  headline: string;
  summary: string;
  linkedin: string;
  orcid: string;
  dois: string;
  github: string;
  website: string;
  skills: string;
  languages: string;
  certifications: string;
  availability: Availability;
}

export const lista = (texto: string) => texto.split(",").map((t) => t.trim()).filter(Boolean);

/** Respuesta de la API -> valores del formulario. */
export function extrasDesdePerfil(p: GraduateProfile | PublicGraduateProfile): ProfileExtras {
  return {
    headline: p.headline ?? "",
    summary: p.summary ?? "",
    linkedin: p.linkedin ?? "",
    orcid: p.orcid ?? "",
    dois: p.dois.join(", "),
    github: p.github ?? "",
    website: p.website ?? "",
    skills: p.skills.join(", "),
    languages: p.languages ?? "",
    certifications: p.certifications.join(", "),
    availability: p.availability ?? "",
  };
}

/** Valores del formulario -> cuerpo de PUT /graduates/me/professional. */
export function aProfessionalInput(x: ProfileExtras): ProfessionalInput {
  return {
    headline: x.headline,
    summary: x.summary,
    linkedin: x.linkedin,
    orcid: x.orcid,
    github: x.github,
    website: x.website,
    languages: x.languages,
    skills: lista(x.skills),
    certifications: lista(x.certifications),
    dois: lista(x.dois),
    availability: x.availability || null,
  };
}

/** Reduce la imagen a un cuadrado de `lado` px antes de enviarla a la API. */
export function recortarImagen(file: File, lado = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = lado;
      canvas.height = lado;
      const min = Math.min(img.width, img.height);
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, lado, lado);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ------------------------------------------------ datos antiguos del navegador

const CLAVE_LEGADA = "sisebt-profile-extras";
const DISPONIBILIDAD_LEGADA: Record<string, JobAvailability> = {
  BUSCANDO: "SEEKING",
  ABIERTO: "OPEN",
  NO_DISPONIBLE: "UNAVAILABLE",
};

interface Legado {
  extras: ProfileExtras | null;
  photo: string | null;
}

/**
 * Versiones anteriores guardaban estos datos en localStorage. Devuelve lo que
 * hubiera para el perfil, para subirlo una sola vez a la base.
 */
export function leerLegado(profileId: string): Legado | null {
  try {
    const raw = window.localStorage.getItem(CLAVE_LEGADA);
    if (!raw) return null;
    const estado = (JSON.parse(raw) as { state?: { extras?: Record<string, ProfileExtras & { availability: string }>; photos?: Record<string, string> } }).state;
    const extras = estado?.extras?.[profileId] ?? null;
    const photo = estado?.photos?.[profileId] ?? null;
    if (!extras && !photo) return null;
    return {
      extras: extras ? { ...extras, availability: DISPONIBILIDAD_LEGADA[extras.availability] ?? "" } : null,
      photo,
    };
  } catch {
    return null;
  }
}

/** Tras subirlo, se borra del navegador: la base es la única fuente. */
export function borrarLegado(): void {
  try {
    window.localStorage.removeItem(CLAVE_LEGADA);
  } catch {
    // Sin acceso al almacenamiento no hay nada que borrar.
  }
}
