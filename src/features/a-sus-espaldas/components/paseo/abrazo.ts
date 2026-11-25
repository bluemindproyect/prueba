import { POSES } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO } from './Chico';
import type { PoseChico } from './Chico';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * El abrazo animado: las posturas de los dos y cuánto dura cada parte. Todo en segundos.
 * En las dos figuras el brazo «der» (el del lado +x del dibujo) es el que mira al otro, porque
 * el escenario voltea el dibujo según hacia dónde mira cada quien.
 *
 * No es un abrazo de saludo: arranca con un tirón hacia atrás, cierra, se pega, y a partir de
 * ahí se menea con la cadera y se buscan el cuello. `nivelDe` decide cuánto sube: con poca
 * excitación se queda en abrazo apretado; pasado el medio, ella le echa los brazos al cuello y
 * él le agarra el culo; arriba, se le cuelga de la espalda.
 */

/** Qué tan lejos llega el abrazo. */
export type Nivel = 'normal' | 'pegado' | 'espaldas';

/** Efecto que Paseo le pide al escenario. `n` cambia en cada uso para que se repita. */
export interface Efecto {
  tipo: 'abrazo';
  /** id de quien recibe el abrazo */
  con: string;
  n: number;
  gestos: { antes: Gesto; durante: Gesto; despues: Gesto };
  /** qué tan apretado va el abrazo, de 0 a 1 (ver `fuerzaDe`) */
  fuerza?: number;
  /** hasta dónde sube (ver `nivelDe`) */
  nivel?: Nivel;
}

/** Qué tan juntos quedan los dos al abrazarse (en unidades del escenario). */
export const SEPARACION = 40;
export const T_ABRIR = 0.5;
export const T_CERRAR = 0.7;
export const T_PEGAR = 0.5;
export const T_MANTENER = 2.6;
/** Cada cuánto se menea la cadera mientras están pegados. */
export const T_MENEO = 0.9;
export const T_SOLTAR = 0.8;
/** Cuánto sigue su cara de después de soltarlo. */
export const T_DESPUES = 2.4;

const PARADA = POSES[0];

/* ---------- abrir ---------- */

export const ELLA_ABRE: Pose = { ...PARADA, id: 'abrazoAbre', nombre: 'Abre los brazos', di: 28, fi: 38, dd: 64, fd: 72, cab: 5, cara: 'dulce' };
export const EL_ABRE: PoseChico = { izq: [26, 30], der: [62, 62], cab: 3 };

/* ---------- cerrar ---------- */

export const ELLA_ABRAZA: Pose = { ...PARADA, id: 'abrazo', nombre: 'Abrazándolo', di: 16, fi: -92, dd: 104, fd: 86, inc: 3, cab: 11, cara: 'dulce' };
export const EL_ABRAZA: PoseChico = { izq: [14, -90], der: [102, 84], cab: 10, inc: 3 };

/* ---------- pegado: brazos al cuello y manos en el culo ---------- */

export const ELLA_PEGADA: Pose = {
  ...PARADA,
  id: 'pegada',
  nombre: 'Pegada a él',
  di: 24,
  fi: -112,
  dd: 118,
  fd: 106,
  inc: 7,
  cab: -9,
  sep: 13,
  rod: 17,
  cara: 'labio',
};
export const EL_PEGADO: PoseChico = { izq: [20, -104], der: [120, 94], cab: -13, inc: 7 };

/* ---------- de espaldas: ella delante, él encima de su espalda ---------- */

export const ELLA_ESPALDAS: Pose = { ...PARADA, id: 'espaldas', nombre: 'De espaldas', di: 10, fi: -44, dd: 10, fd: -44, inc: -4, cab: 13, sep: 10, cara: 'ojoscerrados' };
export const EL_DETRAS: PoseChico = { izq: [66, 94], der: [66, 94], cab: 14, inc: 5 };

const L = (a: number, b: number, t: number): number => a + (b - a) * t;
const C = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Suaviza de 0 a 1. */
export function suave(t: number): number {
  const x = C(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Arranca con un tirón hacia atrás de un 12 % antes de cerrar, para que no salga plano. */
export function anticipo(t: number): number {
  const x = C(t, 0, 1);
  return x < 0.15 ? -0.12 * (x / 0.15) : suave((x - 0.15) / 0.85);
}

/**
 * El meneo: sube y baja la cadera contra él. Devuelve un valor en grados para sumar a `inc` y
 * a `baja`; el segundo armónico hace que no sea un péndulo perfecto.
 */
export function meneo(t: number): number {
  const a = Math.sin((t / T_MENEO) * Math.PI * 2);
  const b = Math.sin((t / T_MENEO) * Math.PI * 4) * 0.35;
  return (a + b) * 1.7;
}

/** Latido del pecho: se le nota a él cuando el abrazo sube de nivel. */
export function late(t: number): number {
  return Math.max(0, Math.sin((t / 0.62) * Math.PI * 2)) * 0.8;
}

/**
 * Qué tan apretado es el abrazo según lo que él desconfíe: a 0 de sospecha aprieta entero,
 * a 100 se queda en un 45 %, rígido y con los brazos a medias.
 */
export function fuerzaDe(sospecha: number): number {
  return 1 - C(sospecha / 100, 0, 1) * 0.55;
}

/**
 * Hasta dónde llega según la excitación del momento (0 a 100). Por debajo de 35 se queda en
 * abrazo apretado; de 35 a 70 se pega con los brazos al cuello; de 70 para arriba se le cuelga
 * de la espalda. Si él desconfía mucho, el nivel baja uno.
 */
export function nivelDe(excitacion: number, sospecha = 0): Nivel {
  const e = C(excitacion, 0, 100);
  const n: Nivel = e >= 70 ? 'espaldas' : e >= 35 ? 'pegado' : 'normal';
  if (sospecha >= 60 && n === 'espaldas') return 'pegado';
  if (sospecha >= 60 && n === 'pegado') return 'normal';
  return n;
}

/** Las poses de cierre de un nivel, ya mezcladas con la fuerza del abrazo. */
export function posesDe(nivel: Nivel, fuerza: number): { ella: Pose; el: PoseChico } {
  const f = C(fuerza, 0, 1);
  if (nivel === 'espaldas') {
    return { ella: mezclaPose(ELLA_ABRAZA, ELLA_ESPALDAS, 0.4 + f * 0.6), el: mezclaChico(EL_ABRAZA, EL_DETRAS, 0.4 + f * 0.6) };
  }
  if (nivel === 'pegado') {
    return { ella: mezclaPose(ELLA_ABRAZA, ELLA_PEGADA, 0.35 + f * 0.65), el: mezclaChico(EL_ABRAZA, EL_PEGADO, 0.35 + f * 0.65) };
  }
  return { ella: mezclaPose(ELLA_ABRAZA, ELLA_PEGADA, f * 0.35), el: mezclaChico(EL_ABRAZA, EL_PEGADO, f * 0.35) };
}

export function mezclaPose(a: Pose, b: Pose, t: number): Pose {
  return {
    ...b,
    di: L(a.di, b.di, t),
    fi: L(a.fi, b.fi, t),
    dd: L(a.dd, b.dd, t),
    fd: L(a.fd, b.fd, t),
    inc: C(L(a.inc, b.inc, t), -15, 15),
    cab: C(L(a.cab, b.cab, t), -20, 20),
    sep: C(L(a.sep ?? 0, b.sep ?? 0, t), 0, 40),
    rod: C(L(a.rod ?? 0, b.rod ?? 0, t), -20, 25),
    baja: C(L(a.baja ?? 0, b.baja ?? 0, t), 0, 60),
  };
}

export function mezclaChico(a: PoseChico, b: PoseChico, t: number): PoseChico {
  return {
    izq: [L(a.izq[0], b.izq[0], t), L(a.izq[1], b.izq[1], t)],
    der: [L(a.der[0], b.der[0], t), L(a.der[1], b.der[1], t)],
    cab: C(L(a.cab ?? 0, b.cab ?? 0, t), -20, 20),
    inc: C(L(a.inc ?? 0, b.inc ?? 0, t), -15, 15),
    paso: 0,
  };
}

export { CHICO_PARADO };