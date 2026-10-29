import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Datos complementarios del perfil (foto y enlaces profesionales). Aún no
 * existen en el backend: se guardan solo en este navegador (localStorage).
 */
export type Availability = "" | "BUSCANDO" | "ABIERTO" | "NO_DISPONIBLE";

export const AVAILABILITY_LABELS: Record<Exclude<Availability, "">, string> = {
  BUSCANDO: "Buscando empleo activamente",
  ABIERTO: "Abierto a oportunidades",
  NO_DISPONIBLE: "No disponible",
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
  cvName: string;
}

export const EXTRAS_VACIOS: ProfileExtras = {
  headline: "",
  summary: "",
  linkedin: "",
  orcid: "",
  dois: "",
  github: "",
  website: "",
  skills: "",
  languages: "",
  certifications: "",
  availability: "",
  cvName: "",
};

interface ExtrasState {
  photos: Record<string, string>;
  extras: Record<string, ProfileExtras>;
  setPhoto: (id: string, dataUrl: string | null) => void;
  setExtras: (id: string, extras: ProfileExtras) => void;
}

export const useProfileExtras = create<ExtrasState>()(
  persist(
    (set) => ({
      photos: {},
      extras: {},
      setPhoto: (id, dataUrl) =>
        set((s) => {
          const photos = { ...s.photos };
          if (dataUrl) photos[id] = dataUrl;
          else delete photos[id];
          return { photos };
        }),
      setExtras: (id, extras) => set((s) => ({ extras: { ...s.extras, [id]: extras } })),
    }),
    {
      name: "sisebt-profile-extras",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? { getItem: () => null, setItem: () => undefined, removeItem: () => undefined }
          : window.localStorage,
      ),
    },
  ),
);

/** Reduce la imagen a un cuadrado de `lado` px para no llenar el localStorage. */
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
