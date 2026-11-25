import type { Rng } from './llamada';

/**
 * Minijuego «Mamada». La barra sube mientras aprietas y baja si sueltas. Al llegar al límite
 * él se viene, pero la escena no termina: sigues tú. Solo acaba cuando sueltas después de que
 * se haya corrido al menos una vez.
 * Lógica pura, sin React.
 */

export type FaseM = 'sube' | 'corrida' | 'fin';

export interface Mamada {
  t: number;
  fase: FaseM;
  /** 0 a 100: lo cerca que está */
  nivel: number;
  pico: number;
  /** cuántos chorros lleva */
  chorros: number;
  /** 0 a 1, suavizado: qué tan pegada está la boca (para animar) */
  succion: number;
  /** segundos seguidos sin apretar ya corrido */
  descanso: number;
  /** segundos de sobreestimulación */
  sobre: number;
  log: readonly string[];
}

export interface ResultadoM {
  chorros: number;
  segundos: number;
  pico: number;
  /** aguantó de más después de correrse */
  sobre: number;
}

const UP = 26;
const DOWN = 30;
const CORRIDA_SECS = 1.4;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export function startMamada(): Mamada {
  return { t: 0, fase: 'sube', nivel: 0, pico: 0, chorros: 0, succion: 0, descanso: 0, sobre: 0, log: [] };
}

/** Avanza `dt` segundos con la boca apretada o no. */
export function tickMamada(prev: Mamada, aprieta: boolean, dt: number, rng: Rng = Math.random): Mamada {
  if (prev.fase === 'fin') return prev;
  const s: Mamada = { ...prev };
  const d = Math.min(dt, 0.2);
  s.t += d;
  s.succion = clamp(s.succion + (aprieta ? 6 : -5) * d, 0, 1);

  if (s.fase === 'sube') {
    // Cuanto más arriba, más rápido sube: el final se acelera solo.
    const ritmo = UP * (1 + s.nivel / 150);
    s.nivel = clamp(s.nivel + (aprieta ? ritmo : -DOWN) * d, 0, 100);
    if (s.nivel >= 100) {
      s.fase = 'corrida';
      s.log = [...s.log, 'Se viene. No pares.'];
      s.chorros = 1;
    }
  } else {
    // Corriéndose: la barra oscila arriba y cada vez cuesta más.
    s.sobre += d;
    s.nivel = clamp(s.nivel + (aprieta ? 14 : -46) * d, 0, 100);
    if (aprieta) {
      s.descanso = 0;
      s.chorros = Math.min(9, s.chorros + d * 1.25);
      if (rng() < d * 0.5) s.log = [...s.log, 'Otro chorro.'];
    } else {
      s.descanso += d;
      if (s.descanso >= CORRIDA_SECS && s.chorros >= 1) {
        s.fase = 'fin';
        s.log = [...s.log, 'Lo sueltas. Sigue goteando.'];
      }
    }
  }
  s.pico = Math.max(s.pico, s.nivel);
  return s;
}

/** Cuánto acerca la cámara, de 0 a 1. */
export function zoomDe(s: Pick<Mamada, 'fase' | 'sobre'>): number {
  if (s.fase !== 'corrida') return 0;
  return clamp(0.45 + s.sobre * 0.12, 0, 1);
}

export function resultadoM(s: Mamada): ResultadoM {
  return { chorros: Math.round(s.chorros), segundos: Math.round(s.t), pico: Math.round(s.pico), sobre: Math.round(s.sobre) };
}