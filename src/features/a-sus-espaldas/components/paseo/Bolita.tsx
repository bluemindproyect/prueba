'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/cn';
import styles from './bolita.module.css';

/**
 * La bolita de acciones. Aparece sobre quien tienes cerca. Si la mantienes apretada se abren
 * más bolitas alrededor; arrastras hasta la que quieras y al soltar se hace. También se puede
 * tocar una vez para abrirla y luego tocar la opción (o con el teclado: Enter y Tab).
 */

export interface BolitaAccion {
  id: string;
  ico: string;
  texto: string;
  hacer: () => void;
  rosa?: boolean;
  off?: boolean;
}

export interface BolitaDatos {
  /** id de quien está cerca; al cambiar se cierra la bolita */
  id: string;
  ico: string;
  titulo: string;
  acciones: readonly BolitaAccion[];
}

/** Distancia del centro de la bolita al centro de cada opción. */
const R = 92;
/** Cuánto hay que mantener apretado para que se abran las opciones. */
const ESPERA = 190;
/** Qué tan cerca del centro de una opción cuenta como «estar sobre ella». */
const RADIO_SOBRE = 38;
const MARGEN = 34;
const MARGEN_ARRIBA = 70;
const MARGEN_ABAJO = 40;

const rad = (g: number): number => (g * Math.PI) / 180;

/** Ángulos (en grados, 0 = derecha, -90 = arriba) de las n opciones repartidas alrededor de `centro`. */
function repartir(n: number, centro: number): number[] {
  const paso = n <= 1 ? 0 : Math.min(50, 150 / (n - 1));
  return Array.from({ length: n }, (_, i) => centro + (i - (n - 1) / 2) * paso);
}

/** Hacia dónde abrir el abanico para que quepa en la pantalla: arriba, abajo, derecha o izquierda. */
function elegirCentro(n: number, cx: number, cy: number, w: number, h: number): number {
  let mejor = -90;
  let mejorN = -1;
  for (const c of [-90, 90, 0, 180]) {
    let caben = 0;
    for (const a of repartir(n, c)) {
      const x = cx + R * Math.cos(rad(a));
      const y = cy + R * Math.sin(rad(a));
      if (x >= MARGEN && x <= w - MARGEN && y >= MARGEN_ARRIBA && y <= h - MARGEN_ABAJO) caben++;
    }
    if (caben > mejorN) {
      mejorN = caben;
      mejor = c;
    }
  }
  return mejor;
}

interface Props {
  datos: BolitaDatos;
  /** centro de la bolita dentro de la pantalla, en px */
  x: number;
  y: number;
  /** tamaño de la pantalla, en px */
  w: number;
  h: number;
}

export function Bolita({ datos, x, y, w, h }: Props) {
  const { acciones } = datos;
  const [abierta, setAbierta] = useState(false);
  const [sobre, setSobre] = useState<string | null>(null);
  const abiertaRef = useRef(false);
  const modo = useRef<'arrastre' | 'toque'>('toque');
  const dedo = useRef<{ id: number; x0: number; y0: number; mov: number; cierra: boolean } | null>(null);
  const espera = useRef<number | undefined>(undefined);
  const bola = useRef<HTMLButtonElement>(null);
  const sobreRef = useRef<string | null>(null);

  const centro = useMemo(() => elegirCentro(acciones.length, x, y, w, h), [acciones.length, x, y, w, h]);
  const sitios = useMemo(
    () => repartir(acciones.length, centro).map((a) => ({ x: Math.round(R * Math.cos(rad(a))), y: Math.round(R * Math.sin(rad(a))) })),
    [acciones.length, centro],
  );
  // Si el abanico abre hacia arriba, el rótulo va abajo de la bolita; en los demás casos, arriba.
  const rotuloAbajo = centro === -90;

  const abrir = (m: 'arrastre' | 'toque') => {
    modo.current = m;
    abiertaRef.current = true;
    setAbierta(true);
    try {
      navigator.vibrate?.(12);
    } catch {
      /* sin vibración */
    }
  };
  const cerrar = () => {
    window.clearTimeout(espera.current);
    abiertaRef.current = false;
    sobreRef.current = null;
    dedo.current = null;
    setAbierta(false);
    setSobre(null);
  };

  useEffect(() => () => window.clearTimeout(espera.current), []);

  useEffect(() => {
    if (!abierta) return;
    const tecla = (ev: globalThis.KeyboardEvent) => {
      if (ev.key === 'Escape') cerrar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierta]);

  const ejecutar = (id: string) => {
    const a = acciones.find((x0) => x0.id === id);
    if (!a || a.off) return;
    cerrar();
    a.hacer();
  };

  /** Qué opción está bajo el dedo (por cercanía a su centro). */
  const bajoElDedo = (cx: number, cy: number): string | null => {
    const b = bola.current?.getBoundingClientRect();
    if (!b) return null;
    const ox = b.left + b.width / 2;
    const oy = b.top + b.height / 2;
    let mejor: string | null = null;
    let dMejor = RADIO_SOBRE;
    acciones.forEach((a, i) => {
      if (a.off) return;
      const d = Math.hypot(cx - (ox + sitios[i].x), cy - (oy + sitios[i].y));
      if (d < dMejor) {
        dMejor = d;
        mejor = a.id;
      }
    });
    return mejor;
  };

  const marcar = (id: string | null) => {
    if (sobreRef.current === id) return;
    sobreRef.current = id;
    setSobre(id);
    if (id) {
      try {
        navigator.vibrate?.(8);
      } catch {
        /* sin vibración */
      }
    }
  };

  const abajo = (ev: ReactPointerEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    dedo.current = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, mov: 0, cierra: abiertaRef.current && modo.current === 'toque' };
    if (!abiertaRef.current) {
      window.clearTimeout(espera.current);
      espera.current = window.setTimeout(() => {
        if (dedo.current && !abiertaRef.current) abrir('arrastre');
      }, ESPERA);
    }
  };

  const mover = (ev: ReactPointerEvent<HTMLButtonElement>) => {
    const d = dedo.current;
    if (!d || d.id !== ev.pointerId) return;
    d.mov = Math.max(d.mov, Math.hypot(ev.clientX - d.x0, ev.clientY - d.y0));
    if (!abiertaRef.current && d.mov > 10) {
      window.clearTimeout(espera.current);
      abrir('arrastre');
    }
    if (abiertaRef.current && modo.current === 'arrastre') marcar(bajoElDedo(ev.clientX, ev.clientY));
  };

  const arriba = (ev: ReactPointerEvent<HTMLButtonElement>) => {
    ev.stopPropagation();
    const d = dedo.current;
    if (!d || d.id !== ev.pointerId) return;
    window.clearTimeout(espera.current);
    dedo.current = null;
    ev.currentTarget.releasePointerCapture?.(ev.pointerId);
    if (d.cierra) {
      cerrar();
      return;
    }
    if (!abiertaRef.current) {
      // Un toque rápido: se abre y se elige tocando.
      abrir('toque');
      return;
    }
    if (modo.current === 'arrastre') {
      const id = bajoElDedo(ev.clientX, ev.clientY);
      if (id) ejecutar(id);
      else if (d.mov < 12) {
        // Mantuvo y soltó sin mover: se queda abierta para elegir tocando.
        modo.current = 'toque';
        marcar(null);
      } else cerrar();
    }
  };

  const cancelar = () => {
    if (modo.current === 'arrastre') cerrar();
    else dedo.current = null;
  };

  const teclado = (ev: KeyboardEvent<HTMLButtonElement>) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      if (abiertaRef.current) cerrar();
      else abrir('toque');
    }
  };

  const activa = sobre ? acciones.find((a) => a.id === sobre) : null;

  return (
    <div className={styles.ancla} style={{ left: x, top: y }} data-tour="bolita">
      {abierta && (
        <div
          className={styles.velo}
          onPointerDown={(ev) => {
            ev.stopPropagation();
            cerrar();
          }}
        />
      )}
      {abierta && (
        <p className={cn(styles.rotulo, rotuloAbajo ? styles.rotuloAbajo : styles.rotuloArriba)} aria-live="polite">
          {activa ? activa.texto : modo.current === 'arrastre' ? 'Arrastra a una opción' : datos.titulo}
        </p>
      )}
      {abierta &&
        acciones.map((a, i) => (
          <div key={a.id} className={styles.sitio} style={{ ['--x' as string]: `${sitios[i].x}px`, ['--y' as string]: `${sitios[i].y}px`, ['--d' as string]: `${i * 45}ms` }}>
            <button
              type="button"
              className={cn(styles.opcion, a.rosa && styles.opcionRosa, sobre === a.id && styles.opcionSobre, a.off && styles.opcionOff)}
              aria-label={a.texto}
              aria-disabled={a.off}
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={() => ejecutar(a.id)}
            >
              <span aria-hidden>{a.ico}</span>
            </button>
          </div>
        ))}
      <button
        ref={bola}
        type="button"
        className={cn(styles.bola, abierta && styles.bolaAbierta)}
        aria-label={`Acciones con ${datos.titulo}`}
        aria-haspopup="true"
        aria-expanded={abierta}
        onPointerDown={abajo}
        onPointerMove={mover}
        onPointerUp={arriba}
        onPointerCancel={cancelar}
        onKeyDown={teclado}
        onContextMenu={(ev) => ev.preventDefault()}
      >
        <span aria-hidden>{datos.ico}</span>
      </button>
    </div>
  );
}
