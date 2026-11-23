/**
 * Palabras y frases propias. Las escribe la persona que juega en el formulario y se guardan
 * solo en su navegador; el juego las mezcla con las que ya trae.
 */

export const PALABRAS_KEY = 'a-sus-espaldas-palabras-v1';
const MAX_LINEAS = 300;
const MAX_LARGO = 220;

export interface Categoria {
  id: string;
  titulo: string;
  /** para qué sirve y en qué momento sale */
  sirve: string;
  ejemplo: string;
  /** dónde se usa ya */
  donde: 'llamada' | 'mundo';
}

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: 'comentario-bajo',
    titulo: 'Lo que se te escapa al empezar',
    sirve: 'Sales por el teléfono cuando la excitación va entre 2 y 4. Eliges si lo dices o lo callas. Si lo dices, él puede oírlo.',
    ejemplo: 'Ay… despacio… así está bien.',
    donde: 'llamada',
  },
  {
    id: 'comentario-medio',
    titulo: 'Lo que se te escapa a la mitad',
    sirve: 'Sales cuando la excitación va entre 5 y 7. Cada vez cuesta más callarlo y pesa más si él lo oye.',
    ejemplo: 'No pares… más fuerte… ahí.',
    donde: 'llamada',
  },
  {
    id: 'comentario-final',
    titulo: 'Lo que dices al llegar al máximo',
    sirve: 'Sale en el nivel 8, el orgasmo. Eliges «que se oiga» o «tragártelo». Es lo que más afecta a él y a tu satisfacción.',
    ejemplo: 'Dios… me vengo… no pares.',
    donde: 'llamada',
  },
  {
    id: 'oyo-suave',
    titulo: 'Lo que él dice cuando oye algo raro',
    sirve: 'Sale cuando se te escapó un ruido o una frase y él lo nota por primera vez. Puede escribir «{n}» donde va su nombre.',
    ejemplo: '¿Qué fue ese ruido? Se escuchó cerca.',
    donde: 'llamada',
  },
  {
    id: 'oyo-fuerte',
    titulo: 'Lo que él dice cuando ya sospecha',
    sirve: 'Sale cuando ya oyó varias cosas y empieza a juntar las piezas. Más directo que el anterior.',
    ejemplo: '¿Hay alguien contigo? Dime la verdad.',
    donde: 'llamada',
  },
  {
    id: 'pobrecito',
    titulo: 'Tus pensamientos sobre él («pobrecito»)',
    sirve: 'Lo que piensas de él mientras lo engañas. Aparecen debajo del medidor cuando él ya está sufriendo.',
    ejemplo: 'Pobrecito… cree cada palabra que le digo.',
    donde: 'llamada',
  },
  {
    id: 'imagina',
    titulo: 'Lo que él se imagina',
    sirve: 'Lo que él se figura que pasa, en tercera persona. Aparece en la tarjeta de su pensamiento durante la llamada.',
    ejemplo: 'Se la imagina sola, y algo no le encaja.',
    donde: 'llamada',
  },
  {
    id: 'indirectas',
    titulo: 'Indirectas para seducir a otros',
    sirve: 'Frases que le sueltas a alguien cuando lo estás seduciendo. Usa «{p}» para su nombre y «{n}» para el de él.',
    ejemplo: 'Qué calor hace hoy, ¿no, {p}?',
    donde: 'mundo',
  },
  {
    id: 'encuentro-inicio',
    titulo: 'Cómo empiezan los encuentros',
    sirve: 'La primera frase cuando cierras la puerta con alguien. Sensual, sin ser gráfico. Usa «{p}» y «{n}».',
    ejemplo: 'Cierras la puerta y {p} ya no sabe dónde poner las manos.',
    donde: 'mundo',
  },
  {
    id: 'encuentro-fin',
    titulo: 'Cómo terminan los encuentros',
    sirve: 'La última frase de un encuentro, cuando todo pasó. Usa «{p}» y «{n}».',
    ejemplo: 'Te quedas sin aire con la frente en su pecho.',
    donde: 'mundo',
  },
  {
    id: 'apodos',
    titulo: 'Cómo le dices a él',
    sirve: 'Apodos y cariños con que lo llamas delante de otros. Se mezclan en frases del mundo.',
    ejemplo: 'mi amor, mi tonto, cielo',
    donde: 'mundo',
  },
];

const limpiar = (raw: string): string[] => {
  const vistos = new Set<string>();
  const out: string[] = [];
  for (const l of raw.split('\n')) {
    const t = l.replace(/\s+/g, ' ').trim().slice(0, MAX_LARGO);
    if (t.length < 2 || vistos.has(t)) continue;
    vistos.add(t);
    out.push(t);
    if (out.length >= MAX_LINEAS) break;
  }
  return out;
};

export type Guardado = Record<string, string>;

export function reviveGuardado(raw: unknown): Guardado | null {
  if (!raw || typeof raw !== 'object') return null;
  const out: Guardado = {};
  for (const c of CATEGORIAS) {
    const v = (raw as Record<string, unknown>)[c.id];
    if (typeof v === 'string') out[c.id] = v;
  }
  return out;
}

export const guardadoVacio = (): Guardado => ({});

export const contarLineas = (texto: string | undefined): number => limpiar(texto ?? '').length;

/** Las líneas válidas que la persona escribió para una categoría. */
export function lineasDe(categoria: string): readonly string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(PALABRAS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as Record<string, unknown>;
    const v = data[categoria];
    return typeof v === 'string' ? limpiar(v) : [];
  } catch {
    return [];
  }
}
