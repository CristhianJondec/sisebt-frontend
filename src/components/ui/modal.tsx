"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Más ancho para contenido denso (vistas previas, análisis). */
  wide?: boolean;
}

/** Diálogo modal sencillo: overlay, cierre con Escape o clic fuera. */
export function Modal({ open, onClose, title, description, children, footer, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", alPulsar);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Cerrar" onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px] animate-in fade-in" />
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title"
        className={`relative flex max-h-[90vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} flex-col rounded-2xl border bg-card shadow-2xl animate-in fade-in zoom-in-95`}>
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={onClose}>
            <X aria-hidden />
          </Button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-4 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
