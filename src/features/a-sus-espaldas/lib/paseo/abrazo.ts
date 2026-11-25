/**
 * El abrazo: cómo reacciona él cuando ella es tierna. Funciones puras, sin React.
 * Su cara cambia en tres momentos (antes de que lo abrace, mientras lo abraza y al soltarlo) y
 * depende de lo que siente: cuánto sospecha y qué tan roto está.
 */

export interface CarasAbrazo {
  antes: string;
  durante: string;
  despues: string;
}

/** Ids de gestos de él (ver `gestos.ts`). */
export function carasAbrazo(sospecha: number, quiebre: number): CarasAbrazo {
  if (quiebre >= 70) return { antes: 'decepcionado', durante: 'vidrioso', despues: 'lloriqueo' };
  if (sospecha >= 70) return { antes: 'receloso', durante: 'forzando', despues: 'sospechosoleve' };
  if (sospecha >= 45) return { antes: 'extrañado', durante: 'forzando', despues: 'ternura' };
  if (sospecha >= 20) return { antes: 'curioso', durante: 'ternura', despues: 'feliz' };
  return { antes: 'sereno', durante: 'enamorado', despues: 'feliz' };
}
