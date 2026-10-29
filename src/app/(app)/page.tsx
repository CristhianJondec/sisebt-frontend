"use client";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CompanyHome } from "@/components/dashboard/company-home";
import { GraduateHome } from "@/components/dashboard/graduate-home";
import { RequireRole } from "@/components/require-role";
import { useSession } from "@/lib/use-session";

/** Inicio según el rol: dashboard (admin), espacio del egresado o panel de empresa. */
export default function Home() {
  const { user } = useSession();

  return (
    <RequireRole roles={["ADMIN", "GRADUATE", "COMPANY"]}>
      {user?.role === "ADMIN" ? <AdminDashboard /> : user?.role === "GRADUATE" ? <GraduateHome /> : <CompanyHome />}
    </RequireRole>
  );
}
