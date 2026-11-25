import { POSES } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO } from './Chico';
import type { PoseChico } from './Chico';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * El abrazo animado: las posturas de los dos y cuánto dura cada parte. Todo en segundos.
 * En las dos figuras el brazo «der» (el del lado +x del dibujo) es el que mira al otro, porque
 * el escenario voltea el dibujo según hacia dónde mira cada quien.
 */

/** Efecto que Paseo le pide al escenario. `n` cambia en cada uso para que se repita. */
export interface Efecto {
  tipo: 'abrazo';
  /** id de quien recibe el abrazo */
  con: string;
  n: number;
  gestos: { antes: Gesto; durante: Gesto; despues: Gesto };
}

/** Qué tan juntos quedan los dos al abrazarse (en unidades del escenario). */
export const SEPARACION = 44;
export const T_ABRIR = 0.35;
export const T_ABRAZAR = 0.45;
export const T_MANTENER = 1.7;
export const T_SOLTAR = 0.5;
/** Cuánto sigue su cara de después de soltarlo. */
export const T_DESPUES = 2.2;

const PARADA = POSES[0];

export const ELLA_ABRE: Pose = { ...PARADA, id: 'abrazoAbre', nombre: 'Abre los brazos', di: 28, fi: 38, dd: 64, fd: 72, cab: 5, cara: 'dulce' };
export const ELLA_ABRAZA: Pose = { ...PARADA, id: 'abrazo', nombre: 'Abrazándolo', di: 16, fi: -92, dd: 104, fd: 86, inc: 3, cab: 9, cara: 'dulce' };

export const EL_ABRE: PoseChico = { izq: [26, 30], der: [62, 62], cab: 3 };
export const EL_ABRAZA: PoseChico = { izq: [14, -90], der: [102, 84], cab: 9, inc: 3 };

const L = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Suaviza de 0 a 1. */
export function suave(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

export function mezclaPose(a: Pose, b: Pose, t: number): Pose {
  return {
    ...b,
    di: L(a.di, b.di, t),
    fi: L(a.fi, b.fi, t),
    dd: L(a.dd, b.dd, t),
    fd: L(a.fd, b.fd, t),
    inc: L(a.inc, b.inc, t),
    cab: L(a.cab, b.cab, t),
    sep: L(a.sep ?? 0, b.sep ?? 0, t),
    rod: L(a.rod ?? 0, b.rod ?? 0, t),
    baja: L(a.baja ?? 0, b.baja ?? 0, t),
  };
}

export function mezclaChico(a: PoseChico, b: PoseChico, t: number): PoseChico {
  return {
    izq: [L(a.izq[0], b.izq[0], t), L(a.izq[1], b.izq[1], t)],
    der: [L(a.der[0], b.der[0], t), L(a.der[1], b.der[1], t)],
    cab: L(a.cab ?? 0, b.cab ?? 0, t),
    inc: L(a.inc ?? 0, b.inc ?? 0, t),
    paso: 0,
  };
}

export { CHICO_PARADO };
