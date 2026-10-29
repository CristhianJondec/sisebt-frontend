"use client";

import { Camera, ImageUp, Trash2 } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { recortarImagen, useProfileExtras } from "@/lib/profile-extras";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  profileId: string;
  initials: string;
  editable?: boolean;
  className?: string;
}

function Imagen({ src, initials, className }: { src?: string | null; initials: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- data URL local, no pasa por next/image
    <img src={src} alt="Foto de perfil" className={cn("rounded-full object-cover", className)} />
  ) : (
    <span className={cn("flex items-center justify-center rounded-full bg-primary/10 font-semibold text-primary", className)}>
      {initials}
    </span>
  );
}

/** Foto de perfil; si es editable, abre un modal para cambiarla. */
export function ProfileAvatar({ profileId, initials, editable = false, className }: ProfileAvatarProps) {
  const foto = useProfileExtras((s) => s.photos[profileId]);
  const setPhoto = useProfileExtras((s) => s.setPhoto);
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function abrir() {
    setBorrador(foto ?? null);
    setAbierto(true);
  }

  async function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) return void toast.error("Selecciona una imagen (JPG o PNG)");
    if (archivo.size > 5 * 1024 * 1024) return void toast.error("La imagen no puede superar 5 MB");
    setBorrador(await recortarImagen(archivo));
  }

  function guardar() {
    try {
      setPhoto(profileId, borrador);
      toast.success(borrador ? "Foto de perfil actualizada" : "Foto de perfil eliminada");
      setAbierto(false);
    } catch {
      toast.error("No se pudo guardar la imagen");
    }
  }

  const avatar = <Imagen src={foto} initials={initials} className={cn("size-16 text-xl ring-4 ring-primary/5", className)} />;

  if (!editable) return avatar;

  return (
    <>
      <button type="button" onClick={abrir} aria-label="Cambiar foto de perfil"
        className="group relative shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {avatar}
        <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
          <Camera aria-hidden className="size-3.5" />
        </span>
      </button>

      <Modal
        open={abierto}
        onClose={() => setAbierto(false)}
        title="Foto de perfil"
        description="Usa una foto nítida de tu rostro, con fondo claro."
        footer={
          <>
            <Button variant="outline" onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={borrador === (foto ?? null)}>Guardar foto</Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-5">
          <Imagen src={borrador} initials={initials} className="size-32 text-4xl ring-4 ring-primary/10" />
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageUp aria-hidden className="size-5" />
            </span>
            <span className="text-sm font-medium">Subir una imagen</span>
            <span className="text-xs text-muted-foreground">JPG o PNG, máximo 5 MB. Se recortará en cuadrado.</span>
          </button>
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={elegir} />
          {borrador && (
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setBorrador(null)}>
              <Trash2 aria-hidden />
              Quitar foto
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}
