"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AI_STATUS_QUERY_KEY, type OfferDraft, draftOffer, fetchAiStatus } from "@/lib/ai";
import { apiErrorMessage } from "@/lib/graduates";

const EJEMPLO =
  "Ej.: Practicante de sistemas para soporte y redes, medio tiempo, en Trujillo. Que sepa Linux y tenga buena actitud.";

/**
 * Bloque "Redactar con IA" del formulario de ofertas: la empresa describe el
 * puesto en pocas líneas y la IA completa título, descripción y requisitos.
 */
export function OfferWriter({ onDraft, hasContent }: {
  onDraft: (draft: OfferDraft) => void;
  /** Si el formulario ya tiene texto, se pide confirmación antes de reemplazarlo. */
  hasContent: boolean;
}) {
  const [idea, setIdea] = useState("");
  const estado = useQuery({ queryKey: AI_STATUS_QUERY_KEY, queryFn: fetchAiStatus, staleTime: 5 * 60_000 });

  const redactar = useMutation({
    mutationFn: draftOffer,
    onSuccess: (draft) => {
      onDraft(draft);
      toast.success("Oferta redactada", { description: "Revisa los campos y ajusta lo que necesites antes de publicar." });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "No se pudo redactar la oferta")),
  });

  if (!estado.data?.enabled) return null;

  const valida = idea.trim().length >= 10;

  function generar() {
    if (!valida) return;
    if (hasContent && !window.confirm("Se reemplazarán el título, la descripción y los requisitos actuales. ¿Continuar?")) {
      return;
    }
    redactar.mutate(idea.trim());
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-transparent p-4 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sparkles aria-hidden className="size-4 text-primary" />
          Redactar con IA
        </span>
        <span className="text-xs text-muted-foreground">
          Describe el puesto en pocas líneas y la IA llenará el formulario. No se publica nada hasta que lo confirmes.
        </span>
      </div>
      <Textarea aria-label="Idea del puesto" rows={2} maxLength={1500} placeholder={EJEMPLO} value={idea}
        onChange={(e) => setIdea(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            generar();
          }
        }} />
      <div className="flex justify-end">
        <Button type="button" size="sm" disabled={!valida || redactar.isPending} onClick={generar}>
          {redactar.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}
          {redactar.isPending ? "Redactando..." : "Generar oferta"}
        </Button>
      </div>
    </div>
  );
}
