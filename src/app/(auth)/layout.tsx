import { BarChart3, BriefcaseBusiness, ClipboardCheck } from "lucide-react";
import { Brand } from "@/components/layout/brand";

const DESTACADOS = [
  { icon: ClipboardCheck, texto: "Seguimiento de la trayectoria profesional de cada egresado." },
  { icon: BriefcaseBusiness, texto: "Bolsa de trabajo que conecta egresados con empresas de la región." },
  { icon: BarChart3, texto: "Indicadores de empleabilidad para la mejora continua y la acreditación." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh w-full lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-950 p-10 text-white lg:flex xl:p-14">
        {/* Fondo decorativo: retícula tenue y un halo cian. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-[480px] rounded-full bg-cyan-500/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-40 size-[420px] rounded-full bg-cyan-400/10 blur-3xl" />

        <Brand inverted className="relative" />

        <div className="relative flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cyan-300">
              Universidad Nacional de Trujillo
            </span>
            <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
              El vínculo permanente entre la universidad y sus egresados.
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Sistema de Seguimiento de Egresados y Bolsa de Trabajo de la Escuela Profesional de
              Ingeniería de Sistemas.
            </p>
          </div>
          <ul className="flex flex-col gap-4">
            {DESTACADOS.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-sm text-zinc-300">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="pt-1.5">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} SISEBT · Facultad de Ingeniería
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
