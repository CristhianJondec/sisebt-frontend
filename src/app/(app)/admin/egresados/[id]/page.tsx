"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExperienceSection } from "@/components/graduates/experience-section";
import { ProfileView } from "@/components/graduates/profile-view";
import { RequireRole } from "@/components/require-role";
import { buttonVariants } from "@/components/ui/button";
import { apiErrorMessage, fetchGraduate } from "@/lib/graduates";

function DetalleEgresado({ id }: { id: string }) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["graduates", "detail", id],
    queryFn: () => fetchGraduate(id),
  });

  if (isPending) {
    return <Loader2 aria-label="Cargando" className="size-5 animate-spin text-muted-foreground" />;
  }
  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {apiErrorMessage(error)}
      </p>
    );
  }

  return (
    <>
      <h2 className="text-xl font-semibold">
        {data.firstName} {data.lastName}
      </h2>
      <ProfileView profile={data} />
      <ExperienceSection experiences={data.experiences} />
    </>
  );
}

export default function DetalleEgresadoPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <Link
        href="/admin/egresados"
        className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}
      >
        <ArrowLeft aria-hidden />
        Egresados
      </Link>
      <RequireRole roles={["ADMIN"]}>
        <DetalleEgresado id={id} />
      </RequireRole>
    </main>
  );
}
