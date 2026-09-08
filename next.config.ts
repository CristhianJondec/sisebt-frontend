import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Necesario para la imagen de produccion: emite .next/standalone con un
  // server.js y solo las dependencias realmente usadas. No se activa solo.
  output: "standalone",
};

export default nextConfig;
