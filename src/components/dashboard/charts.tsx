import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
}

/** Indicador principal: un número grande con su etiqueta. */
export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="mt-2 truncate text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon aria-hidden className="size-4" />
        </span>
      </CardContent>
    </Card>
  );
}

export interface BarItem {
  label: string;
  value: number;
  /** Porcentaje a mostrar; si falta se calcula sobre el total de la lista. */
  percentage?: number;
}

/** Barras horizontales de un solo tono: magnitud por categoría. */
export function BarList({ items, className }: { items: BarItem[]; className?: string }) {
  const total = items.reduce((suma, i) => suma + i.value, 0);
  const maximo = Math.max(...items.map((i) => i.percentage ?? i.value), 1);

  return (
    <ul className={cn("flex flex-col gap-3.5", className)}>
      {items.map((item) => {
        const porcentaje = item.percentage ?? (total ? Math.round((item.value / total) * 100) : 0);
        const ancho = ((item.percentage ?? item.value) / maximo) * 100;
        return (
          <li key={item.label} className="group flex flex-col gap-1.5" title={`${item.label}: ${item.value} (${porcentaje}%)`}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 font-medium tabular-nums">
                {item.value}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{porcentaje}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 group-hover:bg-primary/85"
                style={{ width: `${item.value > 0 ? Math.max(ancho, 2) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Columnas verticales de un solo tono (p. ej. egresados por promoción). */
export function ColumnChart({ items, height = 180, showValues = false }: { items: BarItem[]; height?: number; showValues?: boolean }) {
  const maximo = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative flex items-end gap-2 sm:gap-3" style={{ height }}>
        {/* Líneas guía recesivas */}
        <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="border-t border-dashed border-border/70" />
          ))}
        </div>
        {items.map((item) => (
          <div
            key={item.label}
            className="group relative flex h-full flex-1 flex-col items-center justify-end"
            title={`${item.label}: ${item.value}`}
          >
            <span className={cn("mb-1 text-xs font-medium text-muted-foreground tabular-nums transition-opacity", !showValues && "opacity-0 group-hover:opacity-100")}>
              {item.value}
            </span>
            <div
              className="w-full max-w-10 rounded-t-[4px] bg-primary/85 transition-colors group-hover:bg-primary"
              style={{ height: `${(item.value / maximo) * 85}%`, minHeight: item.value > 0 ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 border-t pt-2 sm:gap-3">
        {items.map((item) => (
          <span key={item.label} className="flex-1 text-center text-xs text-muted-foreground tabular-nums">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
