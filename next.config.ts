import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Playwright levanta un segundo `next dev` con su propia salida (ver
  // playwright.config.ts); por defecto se usa .next.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Necesario para la imagen de produccion: emite .next/standalone con un
  // server.js y solo las dependencias realmente usadas. No se activa solo.
  output: "standalone",
};

export default nextConfig;
