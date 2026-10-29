import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Logotipo de SISEBT. `inverted` para fondos oscuros (panel del login). */
export function Brand({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <GraduationCap aria-hidden className="size-4.5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight">SISEBT</span>
        <span className={cn("mt-0.5 text-[11px]", inverted ? "text-zinc-400" : "text-muted-foreground")}>
          Egresados y empleo
        </span>
      </span>
    </Link>
  );
}
