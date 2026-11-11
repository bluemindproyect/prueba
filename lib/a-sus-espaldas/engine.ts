import { ACTS, LEVELS, REACT, STATES, TARGETS, THOUGHTS } from './data';
import type { Act, Chip, GameState, ModeId, Target, Turn } from './types';

/** Generador de números entre 0 y 1. Se inyecta para poder probar el motor. */
export type Rng = () => number;

export const findAct = (id: string): Act | undefined => ACTS.find((a) => a.id === id);
export const findTarget = (id: string): Target | undefined => TARGETS.find((t) => t.id === id);

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function pickOne<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function level(sat: number): number {
  let l = 1;
  LEVELS.forEach((min, i) => {
    if (sat >= min) l = i + 1;
  });
  return l;
}

/** Estado de él según su humillación: 0 Tranquilo … 4 Quebrado. */
export function stage(humiliation: number): number {
  if (humiliation < 15) return 0;
  if (humiliation < 35) return 1;
  if (humiliation < 60) return 2;
  if (humiliation < 85) return 3;
  return 4;
}

/** Probabilidad (%) de que él te vea cuando está cerca. */
export function risk(act: Act, suspicion: number, chain = 0): number {
  return Math.min(95, Math.round(act.risk + suspicion * 0.4 + 8 * chain));
}

export function displayName(state: Pick<GameState, 'name'>): string {
  return state.name.trim() || 'él';
}

export function fill(text: string, name: string, target?: Target): string {
  return text.replace(/\{n\}/g, name).replace(/\{t\}/g, target ? target.t : '');
}

/** Satisfacción que muestra el botón antes de jugarlo. */
export function gainPreview(act: Act, target: Target, mode: ModeId): number {
  return Math.round(act.sat * target.ms * (mode === 'frente' ? 2 : 1));
}

export function freshState(): GameState {
  return {
    name: 'Daniel',
    sat: 0,
    cheat: 0,
    away: 0,
    streak: 0,
    best: 0,
    seen: 0,
    combo: 0,
    bestCombo: 0,
    c: 90,
    s: 5,
    h: 0,
    turn: 1,
    log: [],
    last: null,
    tab: 1,
    pick: { mode: 'ausente', target: 'desc' },
  };
}

/** Valida y completa lo guardado en localStorage. */
export function reviveState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const saved = raw as Partial<GameState>;
  if (typeof saved.sat !== 'number') return null;
  const merged: GameState = {
    ...freshState(),
    ...saved,
    pick: {
      mode: saved.pick?.mode ?? 'ausente',
      target: saved.pick?.target ?? 'desc',
    },
  };
  if (merged.last && !merged.last.aid) merged.last = null;
  return merged;
}

function followUps(act: Act, lvl: number, rng: Rng): string[] {
  const ups = ACTS.filter((x) => x.lvl <= lvl && x.id !== act.id && x.sat > act.sat).slice(0, 3);
  if (ups.length < 2) {
    const pool = ACTS.filter((x) => x.lvl <= lvl && x.lvl >= lvl - 1 && x.id !== act.id && !ups.includes(x));
    while (ups.length < 3 && pool.length) {
      ups.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  }
  return ups.map((x) => x.id);
}

export function setMode(prev: GameState, mode: ModeId): GameState {
  return {
    ...prev,
    combo: 0,
    pick: { ...prev.pick, mode },
    last: prev.last ? { ...prev.last, follow: [] } : null,
  };
}

export function setTarget(prev: GameState, target: string): GameState {
  return {
    ...prev,
    combo: 0,
    pick: { ...prev.pick, target },
    last: prev.last ? { ...prev.last, follow: [] } : null,
  };
}

export function setTab(prev: GameState, tab: number): GameState {
  return { ...prev, tab };
}

export function setName(prev: GameState, name: string): GameState {
  return { ...prev, name };
}

/** Juega una acción y devuelve el estado nuevo. No modifica el anterior. */
export function play(prev: GameState, actId: string, chained: boolean, rng: Rng = Math.random): GameState {
  const act = findAct(actId);
  const target = findTarget(prev.pick.target);
  const mode = prev.pick.mode;
  const before = level(prev.sat);
  if (!act || !target || act.lvl > before) return prev;

  const s: GameState = { ...prev, log: [...prev.log] };
  const n = chained ? s.combo + 1 : 0;
  if (!chained && s.cheat > 0) s.turn++;

  const name = displayName(s);
  const stale = act.lvl < before - 1;
  const base = act.sat * target.ms * (stale ? 0.5 : 1) * (1 + 0.15 * n);
  const short = fill(act.txt, name, target);
  let line = `${short}. ${fill(act.det, name, target)}`;

  let gain: number;
  let thought: string;
  let dh = 0;
  let dc = 0;
  let ds = 0;
  let seen = false;
  const stageNow = stage(s.h);

  s.cheat++;
  if (mode === 'ausente') {
    gain = base;
    s.away++;
    s.streak++;
    line += ' ' + fill('{n} no está. No se entera de nada.', name);
    thought = pickOne([...(target.th ?? []), ...THOUGHTS.ausente], rng);
  } else if (mode === 'cerca') {
    if (rng() * 100 < risk(act, s.s, n)) {
      gain = base * 1.2;
      seen = true;
      s.seen++;
      s.streak = 0;
      ds = 15;
      dh = act.hum * target.mh * 0.6;
      dc = -8;
      line += ' ' + fill('{n} voltea justo a tiempo para ver algo. No sabe bien qué vio, pero lo vio.', name);
      thought = pickOne(THOUGHTS.visto, rng);
    } else {
      gain = base * 1.5;
      s.away++;
      s.streak++;
      line += ' ' + fill('{n} está a unos metros, de espaldas. No voltea.', name);
      thought = pickOne([...(target.th ?? []), ...THOUGHTS.ok], rng);
    }
  } else {
    gain = base * 2;
    seen = true;
    s.seen++;
    s.streak = 0;
    dh = act.hum * target.mh;
    dc = -dh / 2;
    ds = 10;
    if (act.priv) {
      line += ' ' + fill('{n} se queda afuera. Sabe exactamente qué está pasando.', name);
    } else {
      line = fill('Con {n} viendo: ', name) + line.charAt(0).toLowerCase() + line.slice(1);
    }
    line += ' ' + fill(pickOne(REACT[stageNow], rng), name);
    thought = pickOne(THOUGHTS.frente, rng);
  }

  // Si estaba cerca y te vio, se corta el combo. Frente a él, el combo sigue.
  const alive = !(mode === 'cerca' && seen);
  if (n >= 2 && alive && rng() < 0.5) thought = pickOne(THOUGHTS.combo, rng);

  gain = Math.max(1, Math.round(gain));
  s.sat += gain;
  if (s.streak > s.best) s.best = s.streak;
  s.combo = alive ? n : 0;
  if (n + 1 > s.bestCombo) s.bestCombo = n + 1;

  const h0 = s.h;
  const c0 = s.c;
  const s0 = s.s;
  s.h = clamp(s.h + dh);
  s.c = clamp(s.c + dc);
  s.s = clamp(s.s + ds);
  const stageAfter = stage(s.h);

  const chips: Chip[] = [{ text: `+${gain} satisfacción`, tone: 'up' }];
  if (n > 0) chips.push({ text: `combo ×${n + 1}`, tone: 'up' });
  if (!seen) chips.push({ text: 'te saliste con la tuya', tone: 'up' });
  if (stale) chips.push({ text: 'esto ya no te llena', tone: '' });
  if (s.h !== h0) chips.push({ text: `humillación +${s.h - h0}`, tone: 'him' });
  if (s.c !== c0) chips.push({ text: `confianza ${s.c - c0}`, tone: 'him' });
  if (s.s !== s0) chips.push({ text: `sospecha +${s.s - s0}`, tone: 'bad' });
  if (mode === 'ausente') chips.push({ text: 'sin efecto en él', tone: '' });

  const after = level(s.sat);
  const notes: string[] = [];
  if (stageAfter > stageNow) notes.push(`${name} cambió. Ahora está: ${STATES[stageAfter].toLowerCase()}.`);
  if (after > before) {
    notes.push(`Nivel ${after}. Lo de antes ya no alcanza: hay acciones nuevas.`);
    s.tab = after;
  }
  if (!alive) notes.push('Te vio. Se cortó el combo.');

  const turn: Turn = {
    aid: act.id,
    tid: target.id,
    mode,
    seen,
    stage: stageAfter,
    line,
    thought,
    chips,
    notes,
    follow: alive ? followUps(act, after, rng) : [],
  };
  s.last = turn;

  const how =
    mode === 'ausente' ? 'él no estaba' : mode === 'frente' ? 'frente a él' : seen ? 'él cerca, te vio' : 'él cerca, no te vio';
  s.log.unshift(`Día ${s.turn} · ${short} (${how}).`);
  if (s.log.length > 40) s.log.length = 40;

  return s;
}
