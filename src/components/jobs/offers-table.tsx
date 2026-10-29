"use client";

import { Lock, LockOpen, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CONTRACT_LABELS, MODALITY_LABELS, type Offer, formatShortDate } from "@/lib/jobs";

export function OfferStatusBadge({ offer }: { offer: Offer }) {
  const vencida = offer.status === "OPEN" && !offer.acceptingApplications;
  const abierta = offer.status === "OPEN" && !vencida;
  return (
    <Badge variant={abierta ? "soft" : "secondary"}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {abierta ? "Abierta" : vencida ? "Vencida" : "Cerrada"}
    </Badge>
  );
}

interface OffersTableProps {
  offers: Offer[];
  showCompany?: boolean;
  /** Si se pasan, se muestran las acciones de editar y abrir/cerrar. */
  onEdit?: (offer: Offer) => void;
  onToggle?: (offer: Offer) => void;
}

/** Tabla de ofertas para el admin (con empresa) y para la empresa (sin ella). */
export function OffersTable({ offers, showCompany = true, onEdit, onToggle }: OffersTableProps) {
  if (offers.length === 0) {
    return <p className="p-10 text-center text-sm text-muted-foreground">No hay ofertas para mostrar.</p>;
  }
  const acciones = Boolean(onEdit || onToggle);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Oferta</TableHead>
          {showCompany && <TableHead>Empresa</TableHead>}
          <TableHead>Modalidad</TableHead>
          <TableHead>Contrato</TableHead>
          <TableHead>Fecha límite</TableHead>
          <TableHead className="text-right">Postulantes</TableHead>
          <TableHead>Estado</TableHead>
          {acciones && <TableHead className="w-24" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {offers.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="pl-4">
              <span className="flex flex-col">
                <span className="font-medium">{o.title}</span>
                <span className="text-xs text-muted-foreground">{o.area} · {o.location}</span>
              </span>
            </TableCell>
            {showCompany && <TableCell>{o.company.name}</TableCell>}
            <TableCell>{MODALITY_LABELS[o.modality]}</TableCell>
            <TableCell className="text-muted-foreground">{CONTRACT_LABELS[o.contractType]}</TableCell>
            <TableCell className="tabular-nums">{formatShortDate(o.deadline)}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{o.applicationCount}</TableCell>
            <TableCell>
              <OfferStatusBadge offer={o} />
            </TableCell>
            {acciones && (
              <TableCell>
                <div className="flex justify-end gap-0.5">
                  {onEdit && (
                    <Button size="icon-sm" variant="ghost" aria-label="Editar oferta" onClick={() => onEdit(o)}>
                      <Pencil aria-hidden />
                    </Button>
                  )}
                  {onToggle && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={o.status === "OPEN" ? "Cerrar oferta" : "Reabrir oferta"}
                      title={o.status === "OPEN" ? "Cerrar oferta" : "Reabrir oferta"}
                      onClick={() => onToggle(o)}
                    >
                      {o.status === "OPEN" ? <Lock aria-hidden /> : <LockOpen aria-hidden />}
                    </Button>
                  )}
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
