import type { Escena, Lugar } from '../mundo/datos';

/**
 * Cómo se ve cada lugar de lado: ancho del cuarto, puertas a los lados y dónde se acomoda la gente.
 * Lógica pura, sin React.
 */

/** Alto del escenario en unidades del dibujo. */
export const ALTO = 400;
/** Altura del piso: aquí pisan todos. */
export const PISO = 352;
/** Qué tan cerca de la orilla tienes que llegar para cruzar una puerta. */
export const ORILLA = 28;
/** A qué distancia alguien ya está «cerca» para hablarle. */
export const CERCA = 92;

const ANCHO: Record<Escena, number> = {
  cama: 900,
  bano: 760,
  sotano: 820,
  oficina: 1000,
  archivo: 760,
  gym: 980,
  vestidor: 840,
  hotel: 900,
  bar: 1000,
  coche: 700,
};

/** Dónde se esconde el otro si él entra, como fracción del ancho, y cómo se llama. */
const ESCONDITE: Record<Escena, { x: number; nombre: string }> = {
  cama: { x: 0.86, nombre: 'el clóset' },
  bano: { x: 0.3, nombre: 'la cortina de la regadera' },
  sotano: { x: 0.8, nombre: 'las cajas' },
  oficina: { x: 0.86, nombre: 'el escritorio' },
  archivo: { x: 0.8, nombre: 'el archivero' },
  gym: { x: 0.86, nombre: 'el estante' },
  vestidor: { x: 0.82, nombre: 'los casilleros' },
  hotel: { x: 0.86, nombre: 'las cortinas' },
  bar: { x: 0.86, nombre: 'la barra' },
  coche: { x: 0.74, nombre: 'el asiento de atrás' },
};

export const anchoDe = (escena: Escena): number => ANCHO[escena];
export const esconditeDe = (escena: Escena): { x: number; nombre: string } => ESCONDITE[escena];

/** A dónde lleva una puerta: otro cuarto del mismo lugar, o la calle (abre el mapa). */
export type Destino = { tipo: 'lugar'; id: string; nombre: string } | { tipo: 'salida' };

/** Los cuartos de una zona van uno junto al otro: a la izquierda el anterior, a la derecha el siguiente. */
export function puertasDe(todos: readonly Lugar[], actual: Lugar): { izq: Destino; der: Destino } {
  const zona = todos.filter((l) => l.zona === actual.zona);
  const i = zona.findIndex((l) => l.id === actual.id);
  const a = i > 0 ? zona[i - 1] : null;
  const b = i >= 0 && i < zona.length - 1 ? zona[i + 1] : null;
  return {
    izq: a ? { tipo: 'lugar', id: a.id, nombre: a.nombre } : { tipo: 'salida' },
    der: b ? { tipo: 'lugar', id: b.id, nombre: b.nombre } : { tipo: 'salida' },
  };
}

const HUECOS = [0.44, 0.64, 0.3, 0.54, 0.76, 0.36, 0.7];

/**
 * Dónde se para cada quien. Siempre el mismo lugar para la misma persona, para que nadie
 * brinque de un lado a otro cada segundo. Él, si está, va a la derecha.
 */
export function posiciones(ids: readonly string[], ancho: number, conEl: boolean): Record<string, number> {
  const out: Record<string, number> = {};
  const usados: number[] = [];
  if (conEl) {
    out.el = Math.round(ancho * 0.8);
    usados.push(out.el);
  }
  const orden = [...ids].filter((id) => id !== 'el').sort();
  orden.forEach((id, i) => {
    let x = Math.round(ancho * HUECOS[i % HUECOS.length]) + (i >= HUECOS.length ? 40 : 0);
    // Que no queden encimados.
    while (usados.some((u) => Math.abs(u - x) < 110) && x < ancho - 120) x += 60;
    out[id] = x;
    usados.push(x);
  });
  return out;
}

/** La persona más cercana a `x`, si está a menos de `CERCA`. */
export function masCercano(x: number, gente: readonly { id: string; x: number }[]): string | null {
  let mejor: string | null = null;
  let d = CERCA;
  for (const g of gente) {
    const dd = Math.abs(g.x - x);
    if (dd < d) {
      d = dd;
      mejor = g.id;
    }
  }
  return mejor;
}

/** Hora del día para pintar la luz: 0 de día, 1 atardecer, 2 de noche. */
export function luzDe(reloj: number): 0 | 1 | 2 {
  const h = Math.floor(reloj / 60) % 24;
  if (h >= 7 && h < 18) return 0;
  if (h >= 18 && h < 20) return 1;
  return 2;
}
