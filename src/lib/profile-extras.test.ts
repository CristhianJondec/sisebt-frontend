import { describe, expect, it } from "vitest";
import type { GraduateProfile } from "@/lib/graduates";
import { aProfessionalInput, borrarLegado, extrasDesdePerfil, leerLegado } from "@/lib/profile-extras";

const PERFIL = {
  id: "p1",
  headline: "Dev",
  summary: null,
  linkedin: "linkedin.com/in/x",
  orcid: null,
  github: null,
  website: null,
  languages: "Español",
  skills: ["React", "SQL"],
  certifications: [],
  dois: ["10.1/abc"],
  availability: "OPEN",
} as unknown as GraduateProfile;

describe("perfil profesional", () => {
  it("convierte la respuesta de la API en el formulario y de vuelta", () => {
    const form = extrasDesdePerfil(PERFIL);
    expect(form).toMatchObject({ headline: "Dev", summary: "", skills: "React, SQL", availability: "OPEN" });

    expect(aProfessionalInput({ ...form, skills: " React ,SQL,, Docker ", availability: "" })).toMatchObject({
      skills: ["React", "SQL", "Docker"],
      dois: ["10.1/abc"],
      certifications: [],
      availability: null,
    });
  });

  it("lee los datos que versiones anteriores dejaron en el navegador y los borra", () => {
    window.localStorage.setItem(
      "sisebt-profile-extras",
      JSON.stringify({
        state: {
          extras: { p1: { headline: "Antiguo", skills: "Java", availability: "BUSCANDO" } },
          photos: { p1: "data:image/jpeg;base64,AAAA" },
        },
      }),
    );

    const legado = leerLegado("p1");
    expect(legado?.extras).toMatchObject({ headline: "Antiguo", availability: "SEEKING" });
    expect(legado?.photo).toBe("data:image/jpeg;base64,AAAA");
    expect(leerLegado("otro")).toBeNull();

    borrarLegado();
    expect(leerLegado("p1")).toBeNull();
  });
});
