import { ACTS as BASE_ACTS, level as buildLevel } from './data';
import type { Item } from './data';
import type { Act } from './types';

/**
 * Contenido que llega de la base de datos (tabla `contenido`) y se suma al que ya trae el juego.
 * Si no hay sesión o no hay conexión, todo sigue funcionando con el contenido incluido.
 */

export interface ContenidoRow {
  tipo: string;
  texto: string;
  datos: Record<string, unknown>;
  condiciones: Record<string, unknown>;
  peso?: number;
}

export interface Dialogo {
  him: string;
  you: string;
}

type Etapa = 'apertura' | 'medio' | 'cierre';

interface Pool {
  acts: Act[];
  dialogos: Record<Etapa, Dialogo[]>;
  oye: [string[], string[], string[]];
  silencio: string[];
  pensamientos: Record<string, string[]>;
  cierres: Record<string, string[]>;
  sentimientos: Record<string, string[]>;
}

const vacio = (): Pool => ({
  acts: [],
  dialogos: { apertura: [], medio: [], cierre: [] },
  oye: [[], [], []],
  silencio: [],
  pensamientos: {},
  cierres: {},
  sentimientos: {},
});

let pool: Pool = vacio();
let merged: readonly Act[] = BASE_ACTS;
let total = 0;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const push = (map: Record<string, string[]>, key: string, text: string): void => {
  (map[key] ??= []).push(text);
};

/** Todas las acciones: las del juego más las de la base de datos. */
export const allActs = (): readonly Act[] => merged;

/** Cuántas frases se cargaron de la base de datos. */
export const contenidoCargado = (): number => total;

function actsFromRows(rows: readonly ContenidoRow[], taken: ReadonlySet<string>): Act[] {
  const byLevel = new Map<number, ContenidoRow[]>();
  for (const row of rows) {
    const lvl = Number(row.condiciones.nivel);
    if (!Number.isInteger(lvl) || lvl < 1 || lvl > 10) continue;
    const id = str(row.datos.id);
    if (!id || taken.has(id) || !str(row.datos.label) || !str(row.datos.txt) || !str(row.datos.det)) continue;
    byLevel.set(lvl, [...(byLevel.get(lvl) ?? []), row]);
  }
  const out: Act[] = [];
  for (const [lvl, list] of byLevel) {
    const num = (r: ContenidoRow): number => Number(str(r.datos.id).split('-')[1]) || 0;
    list.sort((a, b) => num(a) - num(b));
    out.push(
      ...buildLevel(
        lvl,
        list.map((r): Item => [
          str(r.datos.id),
          str(r.datos.label),
          str(r.datos.txt),
          str(r.datos.det),
          { p: r.datos.priv === true, e: r.datos.conEl === true },
        ]),
      ),
    );
  }
  return out;
}

/** Reemplaza lo cargado antes por lo que llega ahora. */
export function cargarContenido(rows: readonly ContenidoRow[]): number {
  const next = vacio();
  const accionRows: ContenidoRow[] = [];
  let n = 0;
  for (const row of rows) {
    const text = str(row.texto).trim();
    if (!text) continue;
    const cond = row.condiciones ?? {};
    const datos = row.datos ?? {};
    if (row.tipo === 'accion') {
      accionRows.push({ ...row, datos, condiciones: cond });
      n++;
    } else if (row.tipo === 'minijuego' && datos.minijuego === 'llamada') {
      if (datos.clase === 'dialogo') {
        const etapa = str(cond.etapa) as Etapa;
        const you = str(datos.ella);
        if (next.dialogos[etapa] && you) next.dialogos[etapa].push({ him: text, you });
      } else if (datos.clase === 'oye') {
        const u = Number(cond.umbral);
        if (u >= 1 && u <= 3) next.oye[u - 1].push(text);
      } else if (datos.clase === 'silencio') {
        next.silencio.push(text);
      } else continue;
      n++;
    } else if (row.tipo === 'pensamiento' && datos.minijuego === 'llamada') {
      push(next.pensamientos, str(cond.veredicto), text);
      n++;
    } else if (row.tipo === 'escena' && datos.minijuego === 'llamada') {
      const v = str(cond.veredicto);
      push(next.cierres, v === 'herir' ? str(cond.nivel) : v, text);
      n++;
    } else if (row.tipo === 'sentimiento' && datos.minijuego === 'llamada') {
      push(next.sentimientos, str(cond.veredicto), text);
      n++;
    }
  }
  const baseIds = new Set(BASE_ACTS.map((a) => a.id));
  next.acts = actsFromRows(accionRows, baseIds);
  pool = next;
  merged = [...BASE_ACTS, ...next.acts].sort((a, b) => a.lvl - b.lvl || a.sat - b.sat);
  total = n;
  return n;
}

/** Une lo que trae el juego con lo que llegó de la base de datos. */
export const mezcla = (fijo: readonly string[], extra: readonly string[] | undefined): readonly string[] =>
  extra && extra.length ? [...fijo, ...extra] : fijo;

export const poolDialogos = (etapa: Etapa): readonly Dialogo[] => pool.dialogos[etapa];
export const poolOye = (umbral: 0 | 1 | 2): readonly string[] => pool.oye[umbral];
export const poolSilencio = (): readonly string[] => pool.silencio;
export const poolPensamientos = (clave: string): readonly string[] => pool.pensamientos[clave] ?? [];
export const poolCierres = (clave: string): readonly string[] => pool.cierres[clave] ?? [];
export const poolSentimientos = (clave: string): readonly string[] => pool.sentimientos[clave] ?? [];
