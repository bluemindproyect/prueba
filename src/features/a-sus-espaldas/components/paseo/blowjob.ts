import { POSES } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO } from './Chico';
import type { PoseChico } from './Chico';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * La mamada: ella arrodillada a la altura de su cadera y él de pie, inclinado sobre ella con
 * las manos en su cabeza. Todo en segundos. Igual que en `abrazo`, el brazo «der» de cada
 * figura es el que mira al otro, porque el escenario voltea el dibujo.
 *
 * Ella va bajada con `Y_RODILLAS` en el eje Y y las rodillas dobladas por `flex`. Los `baja`
 * de las posturas acompañan esa bajada. Él se inclina con `inc` para poder alcanzarla: sin
 * inclinarse los brazos no llegan.
 *
 * Orden de fases: bajar, abrir la boca, mamar con el vaivén del ritmo, hundirse, salir a
 * respirar y, si toca, tragar.
 */

/** Qué tan hondo llega. */
export type Profundidad = 'suave' | 'honda' | 'garganta';

/** Efecto que Paseo le pide al escenario. `n` cambia en cada uso para que se repita. */
export interface Efecto {
  tipo: 'mamada';
  /** id de quien la recibe */
  con: string;
  n: number;
  gestos: { antes: Gesto; durante: Gesto; despues: Gesto };
  /** el ritmo con el que se mueve (el mismo del teléfono) */
  ritmo?: 'lento' | 'firme' | 'rapido';
  /** hasta dónde llega (ver `profundidadDe`) */
  profundidad?: Profundidad;
}

/** Cuánto hay que bajarla respecto al piso para que la boca quede a la altura de la cadera. */
export const Y_RODILLAS = 60;
/** Qué tan pegada queda a él (entre centros). */
export const SEPARACION = 20;

export const T_BAJAR = 0.7;
export const T_ABRIR = 0.35;
/** Periodo base del vaivén, en segundos; cada ritmo lo acorta. */
export const T_MAMAR = 1.1;
export const T_HUNDIR = 0.5;
export const T_SALIR = 0.6;
export const T_LIMPIAR = 1.8;
export const T_TRAGAR = 0.9;

const PARADA = POSES[0];

/* ---------- ella ---------- */

export const ELLA_BAJA: Pose = { ...PARADA, id: 'bajaMamada', nombre: 'Se agacha', di: 16, fi: -8, dd: 18, fd: -6, inc: 10, cab: 8, sep: 13, rod: 14, flex: 40, baja: 34, cara: 'labio' };
export const ELLA_AGACHA: Pose = { ...PARADA, id: 'agachada', nombre: 'Manos en sus muslos', di: 8, fi: -20, dd: 10, fd: -18, inc: 15, cab: 2, sep: 12, rod: 16, flex: 62, baja: 56, cara: 'labio' };
export const ELLA_MAMA: Pose = { ...PARADA, id: 'mamando', nombre: 'Mamando', di: 28, fi: 34, dd: 30, fd: 36, inc: 18, cab: -8, sep: 11, rod: 20, flex: 76, baja: 70, cara: 'ojoscerrados' };
export const ELLA_HONDO: Pose = { ...PARADA, id: 'hondo', nombre: 'Hasta el fondo', di: 33, fi: 40, dd: 35, fd: 42, inc: 21, cab: -16, sep: 10, rod: 22, flex: 80, baja: 74, cara: 'aguanta' };
export const ELLA_SALE: Pose = { ...PARADA, id: 'sale', nombre: 'Sale a respirar', di: 22, fi: 20, dd: 24, fd: 22, inc: 14, cab: 4, sep: 12, rod: 18, flex: 74, baja: 66, cara: 'jadeo' };
export const ELLA_TRAGA: Pose = { ...PARADA, id: 'traga', nombre: 'Traga', di: 18, fi: 12, dd: 20, fd: 14, inc: 12, cab: 6, sep: 12, rod: 17, flex: 72, baja: 64, cara: 'alivio' };

/* ---------- él ---------- */

export const EL_PLANTADO: PoseChico = { ...CHICO_PARADO };
export const EL_MANOS: PoseChico = { izq: [4, -6], der: [6, -8], cab: 8, inc: 10 };
export const EL_AGARRA: PoseChico = { izq: [-12, -14], der: [-18, -25], cab: 14, inc: 18 };
export const EL_CABEZA: PoseChico = { izq: [-16, -18], der: [-24, -30], cab: 20, inc: 22 };
export const EL_AGUANTA: PoseChico = { izq: [-14, -12], der: [-20, -22], cab: -10, inc: 24 };

const L = (a: number, b: number, t: number): number => a + (b - a) * t;
const C = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Suaviza de 0 a 1. */
export function suave(t: number): number {
  const x = C(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Arranca con un tirón hacia atrás antes de bajar, para que no salga plano. */
export function anticipo(t: number): number {
  const x = C(t, 0, 1);
  return x < 0.15 ? -0.12 * (x / 0.15) : suave((x - 0.15) / 0.85);
}

const RITMO: Record<'lento' | 'firme' | 'rapido', number> = { lento: 1.6, firme: 1.1, rapido: 0.72 };

/**
 * El vaivén de la cabeza: 0 cuando está arriba y 1 cuando está abajo. Cambia de velocidad con el
 * ritmo y se le suma un armónico para que no sea un péndulo perfecto.
 */
export function vaiven(t: number, ritmo: 'lento' | 'firme' | 'rapido' = 'firme'): number {
  const p = RITMO[ritmo];
  const a = 0.5 + 0.5 * Math.sin((t / p) * Math.PI * 2 - Math.PI / 2);
  const b = 0.12 * Math.sin((t / p) * Math.PI * 4);
  return C(a + b, 0, 1);
}

/** Envolvente de fondo: nunca es un 0 plano, siempre queda algo metido. */
export function fondo(ritmo: 'lento' | 'firme' | 'rapido' = 'firme'): number {
  return ritmo === 'rapido' ? 0.55 : ritmo === 'firme' ? 0.4 : 0.25;
}

/** Hasta dónde llega según la excitación (0 a 100). */
export function profundidadDe(excitacion: number): Profundidad {
  const e = C(excitacion, 0, 100);
  return e >= 78 ? 'garganta' : e >= 45 ? 'honda' : 'suave';
}

/** El gesto que le toca a ella en cada profundidad. */
export const CARA_DE: Record<Profundidad, string> = { suave: 'labio', honda: 'ojoscerrados', garganta: 'aguanta' };

/** Las poses de fondo según la profundidad, ya mezcladas con el vaivén. */
export function posesDe(profundidad: Profundidad, v: number): { ella: Pose; el: PoseChico } {
  const k = profundidad === 'garganta' ? 0.45 + v * 0.55 : profundidad === 'honda' ? 0.2 + v * 0.65 : v * 0.5;
  return {
    ella: mezclaPose(ELLA_MAMA, ELLA_HONDO, k),
    el:
      profundidad === 'garganta'
        ? mezclaChico(EL_CABEZA, EL_AGUANTA, 0.3 + v * 0.55)
        : profundidad === 'honda'
          ? mezclaChico(EL_AGARRA, EL_CABEZA, 0.25 + v * 0.6)
          : mezclaChico(EL_MANOS, EL_AGARRA, 0.3 + v * 0.5),
  };
}

/** Mezcla dos poses. `cara`, `id` y `nombre` los pone la pose dominante, no siempre la segunda. */
export function mezclaPose(a: Pose, b: Pose, t: number): Pose {
  const k = C(t, 0, 1);
  return {
    ...(k < 0.5 ? a : b),
    di: L(a.di, b.di, k),
    fi: L(a.fi, b.fi, k),
    dd: L(a.dd, b.dd, k),
    fd: L(a.fd, b.fd, k),
    inc: C(L(a.inc, b.inc, k), -15, 30),
    cab: C(L(a.cab, b.cab, k), -20, 30),
    sep: C(L(a.sep ?? 0, b.sep ?? 0, k), 0, 45),
    rod: C(L(a.rod ?? 0, b.rod ?? 0, k), -20, 40),
    baja: C(L(a.baja ?? 0, b.baja ?? 0, k), 0, 120),
    flex: C(L(a.flex ?? 0, b.flex ?? 0, k), 0, 110),
  };
}

export function mezclaChico(a: PoseChico, b: PoseChico, t: number): PoseChico {
  const k = C(t, 0, 1);
  return {
    izq: [L(a.izq[0], b.izq[0], k), L(a.izq[1], b.izq[1], k)],
    der: [L(a.der[0], b.der[0], k), L(a.der[1], b.der[1], k)],
    cab: C(L(a.cab ?? 0, b.cab ?? 0, k), -22, 22),
    inc: C(L(a.inc ?? 0, b.inc ?? 0, k), -15, 34),
    flex: C(L(a.flex ?? 0, b.flex ?? 0, k), 0, 110),
    paso: 0,
  };
}

export { CHICO_PARADO };