import {
  AWAY_THOUGHTS,
  CALL_THOUGHTS,
  CAUGHT_THOUGHTS,
  DOING,
  FOUND_THOUGHTS,
  MOOD_THOUGHTS,
  MOVES,
  OBLIVIOUS_THOUGHTS,
  PUZZLE_THOUGHTS,
  RELIEF_THOUGHTS,
  SHOCK_THOUGHTS,
} from './data';
import { stage } from './stage';
import type { Act, CallVerdict, FeedKind, GameState, Live, Mood } from './types';

export type Rng = () => number;

const HIST_LEN = 40;
const FEED_LEN = 8;
const PUZZLES_LEN = 5;

const clamp100 = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const clampBpm = (n: number): number => Math.max(48, Math.min(190, Math.round(n)));

function pickOne<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

export function freshLive(): Live {
  return {
    clock: 0,
    bpm: 66,
    hist: Array.from({ length: HIST_LEN }, () => 66),
    tension: 0,
    confusion: 0,
    mood: 'sereno',
    doing: DOING.away[0],
    feed: [],
    puzzles: [],
    nextThought: 3,
    nextMove: 12,
    seq: 0,
  };
}

export function cloneLive(live: Live): Live {
  return { ...live, hist: [...live.hist], feed: [...live.feed], puzzles: [...live.puzzles] };
}

/** Valida lo guardado. Las partidas viejas no traen `live`. */
export function reviveLive(raw: unknown): Live {
  const fresh = freshLive();
  if (!raw || typeof raw !== 'object') return fresh;
  const r = raw as Partial<Live>;
  return {
    ...fresh,
    ...r,
    hist: Array.isArray(r.hist) && r.hist.length ? r.hist.slice(-HIST_LEN) : fresh.hist,
    feed: Array.isArray(r.feed) ? r.feed.slice(0, FEED_LEN) : fresh.feed,
    puzzles: Array.isArray(r.puzzles) ? r.puzzles.slice(0, PUZZLES_LEN) : fresh.puzzles,
  };
}

export const isPresent = (state: Pick<GameState, 'pick'>): boolean => state.pick.mode !== 'ausente';

/** Pulso en reposo: sube un poco con la sospecha y con lo que ha sufrido. */
export function restBpm(state: Pick<GameState, 's' | 'h'>): number {
  return 62 + Math.round(state.s * 0.1) + stage(state.h) * 2;
}

export function moodOf(state: Pick<GameState, 's' | 'h'>, live: Pick<Live, 'tension' | 'confusion'>): Mood {
  if (live.tension >= 70) return 'alterado';
  if (state.h >= 60) return 'resignado';
  if (state.s >= 60) return 'desconfiado';
  if (state.h >= 30) return 'dolido';
  if (live.confusion >= 30) return 'confundido';
  if (live.tension >= 25 || state.s >= 30) return 'inquieto';
  return 'sereno';
}

function push(live: Live, kind: FeedKind, text: string, hot = false): void {
  live.seq += 1;
  live.feed.unshift({ id: live.seq, kind, text, at: live.clock, hot });
  if (live.feed.length > FEED_LEN) live.feed.length = FEED_LEN;
}

/** Sube la tensión y el pulso en el momento. Con valores negativos los baja. */
function spike(live: Live, amount: number): void {
  live.tension = Math.max(0, Math.min(100, live.tension + amount));
  if (amount > 0) live.bpm = clampBpm(live.bpm + amount * 0.45);
}

function addPuzzle(live: Live, clue: string): void {
  if (live.puzzles.includes(clue)) return;
  live.puzzles.unshift(clue);
  if (live.puzzles.length > PUZZLES_LEN) live.puzzles.length = PUZZLES_LEN;
}

function doingFor(mood: Mood, present: boolean, rng: Rng): string {
  return pickOne(present ? DOING[mood] : DOING.away, rng);
}

/** Cuando cambias dónde está él. No hace ruido: solo lo acomoda. */
export function relocate(state: GameState, rng: Rng = Math.random): GameState {
  const live = cloneLive(state.live);
  const present = isPresent(state);
  live.doing = doingFor(live.mood, present, rng);
  live.nextThought = 2;
  return { ...state, live };
}

/**
 * Lo que pasa dentro de él cuando haces algo. Modifica `state.live`, que debe
 * ser una copia. Si no está, no pasa nada: no se entera.
 */
export function reactToAct(state: GameState, act: Act, seen: boolean, rng: Rng): void {
  const live = state.live;
  const mode = state.pick.mode;
  if (mode === 'ausente') return;

  const st = stage(state.h);
  if (mode === 'frente') {
    spike(live, 40 + act.hum * 0.6);
    live.confusion = Math.max(0, live.confusion - 10);
    push(live, 'thought', pickOne(SHOCK_THOUGHTS[st], rng), true);
    if (rng() < 0.6) push(live, 'thought', pickOne(SHOCK_THOUGHTS[st], rng), true);
  } else if (seen) {
    spike(live, 30 + act.risk * 0.3);
    live.confusion = Math.min(100, live.confusion + 12);
    push(live, 'thought', pickOne(CAUGHT_THOUGHTS, rng), true);
  } else {
    spike(live, 3 + rng() * 5);
    if (act.withHim) push(live, 'thought', pickOne(OBLIVIOUS_THOUGHTS, rng));
    else if (rng() < 0.3) push(live, 'thought', pickOne(MOOD_THOUGHTS.inquieto, rng));
  }

  // Lo que le queda sin cuadrar solo cuenta si estaba cerca y no lo vio todo.
  if (act.clue && mode === 'cerca') {
    addPuzzle(live, act.clue);
    live.confusion = Math.min(100, live.confusion + 8 + act.risk * 0.1);
  }
  live.mood = moodOf(state, live);
  live.doing = doingFor(live.mood, true, rng);
}

/**
 * Lo que pasa dentro de él después de una llamada. A diferencia de `reactToAct`, aquí
 * sí le afecta aunque no esté en el cuarto: está al teléfono. Modifica `state.live`,
 * que debe ser una copia, y se llama después de actualizar `state.s` y `state.h`.
 */
export function reactToCall(state: GameState, act: Act, verdict: CallVerdict, rng: Rng): void {
  const live = state.live;
  if (verdict === 'limpio') {
    spike(live, -12);
    live.confusion = Math.max(0, live.confusion - 5);
    push(live, 'thought', pickOne(CALL_THOUGHTS.limpio, rng));
  } else if (verdict === 'dudas') {
    spike(live, 18);
    live.confusion = Math.min(100, live.confusion + 18);
    addPuzzle(live, act.clue ?? 'una llamada en la que se oía algo raro');
    push(live, 'thought', pickOne(CALL_THOUGHTS.dudas, rng));
  } else {
    spike(live, 50 + act.hum * 0.3);
    live.confusion = Math.min(100, live.confusion + 10);
    push(live, 'thought', pickOne(CALL_THOUGHTS.sabe, rng), true);
    if (rng() < 0.6) push(live, 'thought', pickOne(CAUGHT_THOUGHTS, rng), true);
  }
  live.mood = moodOf(state, live);
  live.doing = doingFor(live.mood, true, rng);
}

function ambientThought(live: Live, present: boolean, rng: Rng): void {
  let text: string;
  if (!present) {
    text = pickOne(AWAY_THOUGHTS, rng);
  } else if (live.mood === 'confundido' && live.puzzles.length) {
    text = pickOne(PUZZLE_THOUGHTS, rng).replace('{p}', pickOne(live.puzzles, rng));
  } else {
    const key = live.mood === 'confundido' ? 'inquieto' : live.mood;
    text = pickOne(MOOD_THOUGHTS[key], rng);
  }
  // No repetir el mismo pensamiento seguido.
  if (live.feed[0]?.text === text) return;
  push(live, 'thought', text, live.tension > 50);
}

function hisMove(state: GameState, live: Live, present: boolean, rng: Rng): void {
  const move = pickOne(present ? MOVES[live.mood] : MOVES.away, rng);
  push(live, 'move', move.text);
  if (move.check) {
    if (live.confusion >= 25 || live.puzzles.length >= 2) {
      state.s = clamp100(state.s + 8);
      state.c = clamp100(state.c - 6);
      spike(live, 25);
      live.confusion = Math.min(100, live.confusion + 6);
      push(live, 'thought', pickOne(FOUND_THOUGHTS, rng), true);
    } else {
      live.tension = Math.max(0, live.tension - 10);
      state.c = clamp100(state.c + 2);
      push(live, 'thought', pickOne(RELIEF_THOUGHTS, rng));
    }
  } else {
    spike(live, move.dt ?? 0);
    if (move.dc) state.c = clamp100(state.c + move.dc);
    if (move.dh) state.h = clamp100(state.h + move.dh);
  }
}

/** Un segundo de tiempo real. No modifica el estado anterior. */
export function tick(prev: GameState, rng: Rng = Math.random): GameState {
  const state: GameState = { ...prev, live: cloneLive(prev.live) };
  const live = state.live;
  const present = isPresent(state);

  live.clock += 1;

  // La tensión se calma sola, pero la sospecha y el daño dejan un piso cuando está cerca.
  const floor = present ? Math.min(40, state.s * 0.25 + state.h * 0.08) : 0;
  live.tension = Math.max(floor, live.tension * 0.955 - 0.3);
  live.confusion = Math.max(0, live.confusion - 0.2);
  if (live.clock % 45 === 0 && live.puzzles.length) live.puzzles.pop(); // se lo explica solo

  const target = Math.min(185, restBpm(state) + live.tension * 0.85);
  live.bpm = clampBpm(live.bpm + (target - live.bpm) * 0.4 + (rng() - 0.5) * 3);
  live.hist.push(live.bpm);
  if (live.hist.length > HIST_LEN) live.hist.splice(0, live.hist.length - HIST_LEN);

  const before = live.mood;
  live.mood = moodOf(state, live);
  if (live.mood !== before) live.doing = doingFor(live.mood, present, rng);

  live.nextThought -= 1;
  if (live.nextThought <= 0) {
    ambientThought(live, present, rng);
    live.nextThought = present
      ? live.tension > 50
        ? 3 + Math.floor(rng() * 3)
        : 7 + Math.floor(rng() * 6)
      : 9 + Math.floor(rng() * 7);
  }

  live.nextMove -= 1;
  if (live.nextMove <= 0) {
    hisMove(state, live, present, rng);
    live.nextMove = 14 + Math.floor(rng() * 15);
    live.mood = moodOf(state, live);
  }

  return state;
}
