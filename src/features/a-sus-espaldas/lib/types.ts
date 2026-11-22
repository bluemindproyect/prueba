export type ModeId = 'ausente' | 'cerca' | 'frente';

/** Minijuegos que reemplazan la resolución automática de una acción. */
export type MiniId = 'llamada';

/** Qué quieres lograr en un minijuego: que no se note, o que él lo sienta. */
export type MiniIntent = 'ocultar' | 'herir';

/** Lo que él termina entendiendo después de una llamada. */
export type CallVerdict = 'limpio' | 'dudas' | 'sabe';

export interface Mode {
  id: ModeId;
  label: string;
  sub: string;
}

export interface Target {
  id: string;
  label: string;
  /** etiqueta corta para la escena */
  tag: string;
  /** cómo se nombra dentro de las frases */
  t: string;
  /** multiplicador de satisfacción */
  ms: number;
  /** multiplicador de humillación */
  mh: number;
  /** pensamientos extra cuando es esta persona */
  th?: readonly string[];
}

export interface Act {
  id: string;
  lvl: number;
  label: string;
  txt: string;
  sat: number;
  hum: number;
  risk: number;
  /** pasa a puerta cerrada: si él está presente se queda afuera */
  priv?: boolean;
  /** él participa sin saber lo que pasa: no se puede jugar si no está */
  withHim?: boolean;
  /** lo que a él le puede quedar sin cuadrar (frase corta, en minúscula) */
  clue?: string;
  /** lo que pasó, dado a entender (versión en la que él no sabe nada) */
  det: string;
  /** si está, jugar esta acción abre un minijuego (solo cuando él no está en el cuarto) */
  mini?: MiniId;
}

export type ChipTone = '' | 'up' | 'him' | 'bad';

export interface Chip {
  text: string;
  tone: ChipTone;
}

/** Resultado de la última jugada. */
export interface Turn {
  aid: string;
  tid: string;
  mode: ModeId;
  seen: boolean;
  /** estado de él después de la jugada (0 a 4) */
  stage: number;
  line: string;
  thought: string;
  chips: Chip[];
  notes: string[];
  /** ids de acciones para seguir el combo */
  follow: string[];
}

/* ---------- tiempo real ---------- */

export type Mood = 'sereno' | 'inquieto' | 'confundido' | 'desconfiado' | 'dolido' | 'resignado' | 'alterado';

export type FeedKind = 'thought' | 'move';

/** Un pensamiento suyo o algo que hace, en la lista en vivo. */
export interface FeedItem {
  id: number;
  kind: FeedKind;
  text: string;
  /** segundo del reloj en que ocurrió */
  at: number;
  /** salió en un momento de mucha tensión */
  hot: boolean;
}

/** Lo que pasa dentro de él, que sigue corriendo aunque no hagas nada. */
export interface Live {
  /** segundos desde que empezó */
  clock: number;
  /** latidos por minuto */
  bpm: number;
  /** últimos latidos, para la gráfica */
  hist: number[];
  /** 0 a 100. Sube con lo que ve o sospecha y baja con el tiempo */
  tension: number;
  /** 0 a 100. Cuánto no le cuadra */
  confusion: number;
  mood: Mood;
  /** qué está haciendo ahora */
  doing: string;
  /** más nuevo primero, máximo 8 */
  feed: FeedItem[];
  /** cosas que no le cuadran, máximo 5 */
  puzzles: string[];
  nextThought: number;
  nextMove: number;
  seq: number;
}

export interface GameState {
  name: string;
  sat: number;
  cheat: number;
  away: number;
  streak: number;
  best: number;
  seen: number;
  combo: number;
  bestCombo: number;
  /** confianza, sospecha y humillación de él (0 a 100) */
  c: number;
  s: number;
  h: number;
  turn: number;
  log: string[];
  last: Turn | null;
  tab: number;
  pick: { mode: ModeId; target: string };
  live: Live;
}
