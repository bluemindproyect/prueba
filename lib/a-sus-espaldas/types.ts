export type ModeId = 'ausente' | 'cerca' | 'frente';

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
  /** lo que pasó, dado a entender */
  det: string;
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
}
