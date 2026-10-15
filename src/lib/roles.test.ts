import { describe, expect, it } from "vitest";
import { validarPassword } from "@/lib/password-rules";
import { tieneRol } from "@/lib/roles";

describe("tieneRol", () => {
  it("es true si el rol del usuario esta en la lista", () => {
    expect(tieneRol({ role: "ADMIN" }, ["ADMIN"])).toBe(true);
    expect(tieneRol({ role: "COMPANY" }, ["ADMIN", "COMPANY"])).toBe(true);
  });

  it("es false si el rol no esta en la lista", () => {
    expect(tieneRol({ role: "GRADUATE" }, ["ADMIN"])).toBe(false);
  });

  it("es false sin sesion", () => {
    expect(tieneRol(null, ["ADMIN"])).toBe(false);
    expect(tieneRol(undefined, ["ADMIN"])).toBe(false);
  });
});

describe("validarPassword", () => {
  it("acepta desde 8 hasta 128 caracteres", () => {
    expect(validarPassword("a".repeat(8))).toBeNull();
    expect(validarPassword("a".repeat(128))).toBeNull();
  });

  it("rechaza contrasenas cortas o demasiado largas", () => {
    expect(validarPassword("a".repeat(7))).toMatch(/al menos 8/);
    expect(validarPassword("a".repeat(129))).toMatch(/no puede superar 128/);
  });
});
