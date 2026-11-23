'use client';

import { useEffect, useRef } from 'react';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import { construirChica, Renderizador, type Atuendo, type PoseDatos, type Vista } from '@/features/a-sus-espaldas/lib/mundo/chica3d';

interface Props {
  g: Gesto;
  pose: PoseDatos;
  atuendo?: Atuendo;
  mojada?: boolean;
  /** Ancho en px (el alto es 1.7 veces). */
  size?: number;
  yaw?: number;
  pitch?: number;
  /** Si true se puede girar arrastrando. */
  girar?: boolean;
}

/** Ella en 3D; arrastra para girarla. */
export function Chica3D({ g, pose, atuendo = 'bikini', mojada = false, size = 220, yaw = 22, pitch = 6, girar = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const rend = useRef<Renderizador | null>(null);
  const vista = useRef<Vista>({ yaw, pitch, dist: 400 });

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * 1.7 * dpr);
    try {
      rend.current = new Renderizador(c);
    } catch {
      rend.current = null;
    }
  }, [size]);

  useEffect(() => {
    const r = rend.current;
    if (!r) return;
    r.subir(construirChica({ gesto: g, pose, atuendo, mojada }));
    r.dibujar(vista.current);
  }, [g, pose, atuendo, mojada, size]);

  useEffect(() => {
    vista.current.yaw = yaw;
    vista.current.pitch = pitch;
    rend.current?.dibujar(vista.current);
  }, [yaw, pitch]);

  const arrastre = useRef<{ x: number; y: number } | null>(null);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Ella, ${g.nombre}`}
      style={{ width: size, height: size * 1.7, touchAction: 'none', cursor: girar ? 'grab' : 'default' }}
      onPointerDown={(e) => {
        if (!girar) return;
        arrastre.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const a = arrastre.current;
        if (!a || !rend.current) return;
        vista.current.yaw += (e.clientX - a.x) * 0.6;
        vista.current.pitch = Math.max(-20, Math.min(35, vista.current.pitch + (e.clientY - a.y) * 0.3));
        arrastre.current = { x: e.clientX, y: e.clientY };
        rend.current.dibujar(vista.current);
      }}
      onPointerUp={() => (arrastre.current = null)}
    />
  );
}
