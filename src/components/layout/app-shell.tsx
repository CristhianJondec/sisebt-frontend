"use client";

import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  FileUser,
  GraduationCap,
  House,
  KeyRound,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Brand } from "@/components/layout/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { QK, fetchNotifications } from "@/lib/jobs";
import { ROLE_LABELS, type Role, iniciales } from "@/lib/roles";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAVEGACION: Record<Role, NavSection[]> = {
  ADMIN: [
    { title: "General", items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }] },
    {
      title: "Seguimiento",
      items: [
        { href: "/admin/egresados", label: "Egresados", icon: GraduationCap },
        { href: "/admin/encuestas", label: "Encuestas", icon: ClipboardList },
        { href: "/admin/eventos", label: "Eventos", icon: CalendarDays },
      ],
    },
    {
      title: "Bolsa de trabajo",
      items: [
        { href: "/admin/empresas", label: "Empresas", icon: Building2 },
        { href: "/admin/ofertas", label: "Ofertas laborales", icon: BriefcaseBusiness },
        { href: "/admin/postulaciones", label: "Postulaciones", icon: FileUser },
      ],
    },
    {
      title: "Análisis",
      items: [{ href: "/admin/reportes", label: "Reportes", icon: BarChart3 }],
    },
    {
      title: "Sistema",
      items: [{ href: "/admin/usuarios", label: "Usuarios", icon: UsersRound }],
    },
  ],
  GRADUATE: [
    { title: "General", items: [{ href: "/", label: "Inicio", icon: House }] },
    {
      title: "Seguimiento",
      items: [
        { href: "/perfil", label: "Mi perfil", icon: UserRound },
        { href: "/encuestas", label: "Mis encuestas", icon: ClipboardList },
      ],
    },
    {
      title: "Bolsa de trabajo",
      items: [
        { href: "/ofertas", label: "Ofertas laborales", icon: BriefcaseBusiness },
        { href: "/postulaciones", label: "Mis postulaciones", icon: FileUser },
      ],
    },
    { title: "Comunidad", items: [{ href: "/eventos", label: "Eventos", icon: CalendarDays }] },
  ],
  COMPANY: [
    { title: "General", items: [{ href: "/", label: "Inicio", icon: House }] },
    {
      title: "Bolsa de trabajo",
      items: [
        { href: "/empresa/ofertas", label: "Mis ofertas", icon: BriefcaseBusiness },
        { href: "/empresa/postulantes", label: "Postulantes", icon: FileUser },
      ],
    },
    { title: "Cuenta", items: [{ href: "/empresa/perfil", label: "Perfil de empresa", icon: Building2 }] },
  ],
};

const CAMBIAR_PASSWORD = "/cambiar-password";

/** Avisos sin leer; se refresca cada minuto mientras la app esta abierta. */
function useNoLeidas(): number {
  const { user } = useSession();
  const { data } = useQuery({
    queryKey: QK.notifications,
    queryFn: fetchNotifications,
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });
  return data?.filter((n) => !n.read).length ?? 0;
}

function activo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useSession();
  const clearSession = useAuthStore((estado) => estado.clearSession);

  if (!user) return null;

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <Brand />
      </div>

      <nav aria-label="Principal" className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
        {NAVEGACION[user.role].map((seccion) => (
          <div key={seccion.title} className="flex flex-col gap-0.5">
            <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
              {seccion.title}
            </p>
            {seccion.items.map(({ href, label, icon: Icon }) => {
              const actual = activo(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  aria-current={actual ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    actual && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon aria-hidden className={cn("size-4", actual && "text-primary")} />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-3 border-t p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {iniciales(user.email)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium" title={user.email}>
            {user.email}
          </span>
          <span className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</span>
        </div>
        <Link href={CAMBIAR_PASSWORD} onClick={onNavigate} aria-label="Cambiar contraseña"
          title="Cambiar contraseña" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
          <KeyRound aria-hidden />
        </Link>
        <Button variant="ghost" size="icon-sm" aria-label="Cerrar sesión" title="Cerrar sesión"
          onClick={clearSession}>
          <LogOut aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/**
 * Marco de la aplicación autenticada: sidebar fija en escritorio y cajón en
 * móvil. Sin sesión redirige al login (la autorización real es del backend).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hidratada, token, user } = useSession();
  const debeCambiar = Boolean(user?.mustChangePassword) && pathname !== CAMBIAR_PASSWORD;
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(pathname);
  const noLeidas = useNoLeidas();

  // Cierra el cajón al cambiar de ruta (ajuste de estado durante el render).
  if (rutaMenu !== pathname) {
    setRutaMenu(pathname);
    setMenuAbierto(false);
  }

  useEffect(() => {
    if (hidratada && !token) router.replace("/login");
    // Contrasena temporal: no se navega a ningun otro sitio hasta cambiarla.
    else if (debeCambiar) router.replace(CAMBIAR_PASSWORD);
  }, [hidratada, token, debeCambiar, router]);

  if (!hidratada || !token || debeCambiar) return null;

  return (
    <div className="flex min-h-svh w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-sidebar lg:flex">
        <Sidebar />
      </aside>

      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] animate-in fade-in"
            onClick={() => setMenuAbierto(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] border-r bg-sidebar shadow-xl animate-in slide-in-from-left">
            <Sidebar onNavigate={() => setMenuAbierto(false)} />
            <Button variant="ghost" size="icon-sm" aria-label="Cerrar menú"
              className="absolute top-4 right-3" onClick={() => setMenuAbierto(false)}>
              <X aria-hidden />
            </Button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6 lg:px-10">
          <Button variant="ghost" size="icon-sm" aria-label="Abrir menú" className="lg:hidden"
            onClick={() => setMenuAbierto(true)}>
            <Menu aria-hidden />
          </Button>
          <Brand className="lg:hidden" />
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/notificaciones"
              aria-label={`Notificaciones (${noLeidas} sin leer)`}
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell aria-hidden className="size-4.5" />
              {noLeidas > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-background">
                  {noLeidas}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
