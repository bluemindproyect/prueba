import { POSES } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO } from './Chico';
import type { PoseChico } from './Chico';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * La mamada: ella agachada a la altura de su cadera y él de pie con las manos en su cabeza.
 * Todo en segundos. Igual que en `abrazo`, el brazo «der» de cada figura es el que mira al otro,
 * porque el escenario voltea el dibujo.
 *
 * Ella no está de pie: va bajada. El escenario tiene que colocarla con `Y_RODILLAS` de más en el
 * eje Y y voltearla hacia él. Los `baja` de las posturas son la flexión de las piernas encima de
 * esa bajada.
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

/** Cuánto hay que bajarla respecto al piso para que quede a la altura de la cadera. */
export const Y_RODILLAS = 78;
/** Qué tan pegada queda a él. */
export const SEPARACION = 26;

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

export const ELLA_BAJA: Pose = { ...PARADA, id: 'bajaMamada', nombre: 'Se agacha', di: 20, fi: -70, dd: 20, fd: -70, inc: 14, cab: 16, sep: 14, rod: 26, baja: 62, cara: 'labio' };
export const ELLA_AGACHA: Pose = { ...PARADA, id: 'agachada', nombre: 'Manos en sus muslos', di: 26, fi: -84, dd: 26, fd: -84, inc: 18, cab: 20, sep: 12, rod: 28, baja: 74, cara: 'labio' };
export const ELLA_MAMA: Pose = { ...PARADA, id: 'mamando', nombre: 'Mamando', di: 30, fi: -96, dd: 30, fd: -96, inc: 20, cab: 22, sep: 10, rod: 30, baja: 80, cara: 'ojoscerrados' };
export const ELLA_HONDO: Pose = { ...PARADA, id: 'hondo', nombre: 'Hasta el fondo', di: 32, fi: -104, dd: 32, fd: -104, inc: 24, cab: 26, sep: 9, rod: 32, baja: 86, cara: 'aguanta' };
export const ELLA_SALE: Pose = { ...PARADA, id: 'sale', nombre: 'Sale a respirar', di: 24, fi: -78, dd: 24, fd: -78, inc: 10, cab: -5, sep: 13, rod: 24, baja: 70, cara: 'jadeo' };
export const ELLA_TRAGA: Pose = { ...PARADA, id: 'traga', nombre: 'Traga', di: 22, fi: -72, dd: 22, fd: -72, inc: 12, cab: -11, sep: 12, rod: 22, baja: 68, cara: 'alivio' };

/* ---------- él ---------- */

export const EL_PLANTADO: PoseChico = { ...CHICO_PARADO };
export const EL_MANOS: PoseChico = { izq: [42, 62], der: [42, 62], cab: 8, inc: 2 };
export const EL_AGARRA: PoseChico = { izq: [52, 78], der: [46, 70], cab: 12, inc: 3 };
export const EL_CABEZA: PoseChico = { izq: [30, 40], der: [30, 40], cab: -14, inc: -4 };
export const EL_AGUANTA: PoseChico = { izq: [58, 84], der: [58, 84], cab: -18, inc: -6 };

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
  const k = profundidad === 'garganta' ? 0.35 + v * 0.65 : profundidad === 'honda' ? v * 0.6 : v * 0.35;
  return {
    ella: mezclaPose(ELLA_MAMA, ELLA_HONDO, k),
    el: mezclaChico(EL_AGARRA, EL_CABEZA, profundidad === 'garganta' ? 0.4 + v * 0.6 : v * 0.3),
  };
}

export function mezclaPose(a: Pose, b: Pose, t: number): Pose {
  return {
    ...b,
    di: L(a.di, b.di, t),
    fi: L(a.fi, b.fi, t),
    dd: L(a.dd, b.dd, t),
    fd: L(a.fd, b.fd, t),
    inc: C(L(a.inc, b.inc, t), -15, 30),
    cab: C(L(a.cab, b.cab, t), -20, 30),
    sep: C(L(a.sep ?? 0, b.sep ?? 0, t), 0, 45),
    rod: C(L(a.rod ?? 0, b.rod ?? 0, t), -20, 40),
    baja: C(L(a.baja ?? 0, b.baja ?? 0, t), 0, 180),
  };
}

export function mezclaChico(a: PoseChico, b: PoseChico, t: number): PoseChico {
  return {
    izq: [L(a.izq[0], b.izq[0], t), L(a.izq[1], b.izq[1], t)],
    der: [L(a.der[0], b.der[0], t), L(a.der[1], b.der[1], t)],
    cab: C(L(a.cab ?? 0, b.cab ?? 0, t), -22, 20),
    inc: C(L(a.inc ?? 0, b.inc ?? 0, t), -15, 15),
    paso: 0,
  };
}

export { CHICO_PARADO };