import { allActs, mezcla, poolCierres } from './contenido';
import { LEVELS, REACT, STATES, TARGETS, THOUGHTS } from './data';
import type { CallResult } from './minijuegos/llamada';
import { cloneLive, freshLive, reactToAct, reactToCall, relocate, reviveLive } from './live';
import type { Rng } from './live';
import { stage } from './stage';
import type { Act, CallVerdict, Chip, GameState, ModeId, Target, Turn } from './types';

export { stage } from './stage';
export { tick } from './live';
export type { Rng } from './live';

export const findAct = (id: string): Act | undefined => allActs().find((a) => a.id === id);
export const findTarget = (id: string): Target | undefined => TARGETS.find((t) => t.id === id);

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

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

/** ¿Jugar esta acción abre un minijuego con el modo actual? Solo si él no está en el cuarto. */
export function opensMini(act: Act, mode: ModeId): boolean {
  return act.mini === 'llamada' && mode === 'ausente';
}

/** ¿Se puede jugar esta acción con el modo actual? */
export function playable(act: Act, mode: ModeId, sat: number): boolean {
  if (act.lvl > level(sat)) return false;
  if (act.withHim && mode === 'ausente') return false;
  return true;
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
    live: freshLive(),
  };
}

const MODE_IDS: readonly ModeId[] = ['ausente', 'cerca', 'frente'];

/** Valida y completa lo guardado en localStorage. */
export function reviveState(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null;
  const saved = raw as Partial<GameState>;
  if (typeof saved.sat !== 'number') return null;
  const mode = saved.pick?.mode;
  const target = saved.pick?.target;
  const merged: GameState = {
    ...freshState(),
    ...saved,
    pick: {
      mode: mode && MODE_IDS.includes(mode) ? mode : 'ausente',
      target: target && findTarget(target) ? target : 'desc',
    },
    live: reviveLive(saved.live),
  };
  // Las acciones cambiaron de ids: lo último jugado en una versión vieja ya no existe.
  if (merged.last && (!findAct(merged.last.aid) || !findTarget(merged.last.tid))) merged.last = null;
  if (merged.last) merged.last = { ...merged.last, follow: merged.last.follow.filter((id) => findAct(id)) };
  merged.tab = Math.min(Math.max(1, merged.tab || 1), level(merged.sat));
  return merged;
}

function followUps(act: Act, lvl: number, mode: ModeId, rng: Rng): string[] {
  const ok = (x: Act) => x.lvl <= lvl && x.id !== act.id && !(x.withHim && mode === 'ausente');
  const ACTS = allActs();
  const ups = ACTS.filter((x) => ok(x) && x.sat > act.sat).slice(0, 3);
  if (ups.length < 2) {
    const pool = ACTS.filter((x) => ok(x) && x.lvl >= lvl - 1 && !ups.includes(x));
    while (ups.length < 3 && pool.length) {
      ups.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    }
  }
  return ups.map((x) => x.id);
}

export function setMode(prev: GameState, mode: ModeId, rng: Rng = Math.random): GameState {
  const next: GameState = {
    ...prev,
    combo: 0,
    pick: { ...prev.pick, mode },
    last: prev.last ? { ...prev.last, follow: [] } : null,
  };
  return relocate(next, rng);
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
  if (!act || !target || !playable(act, mode, prev.sat)) return prev;

  const s: GameState = { ...prev, log: [...prev.log], live: cloneLive(prev.live) };
  const n = chained ? s.combo + 1 : 0;
  if (!chained && s.cheat > 0) s.turn++;

  const name = displayName(s);
  const stale = act.lvl < before - 1;
  const base = act.sat * target.ms * (stale ? 0.5 : 1) * (1 + 0.15 * n);
  const short = fill(act.txt, name, target);
  const det = fill(act.det, name, target);
  let line: string;

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
    line = `${short}. ${det} ${fill('{n} no está. No se entera de nada.', name)}`;
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
      line = `${short}. ${det} ${fill('{n} voltea justo a tiempo para ver algo. No sabe bien qué vio, pero lo vio.', name)}`;
      thought = pickOne(THOUGHTS.visto, rng);
    } else {
      gain = base * 1.5;
      s.away++;
      s.streak++;
      const tail = act.withHim ? '{n} no sospecha nada.' : '{n} está a unos metros, de espaldas. No voltea.';
      line = `${short}. ${det} ${fill(tail, name)}`;
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
    const react = fill(pickOne(REACT[stageNow], rng), name);
    if (act.withHim) {
      // Aquí no hay engaño: él entiende lo que pasa mientras pasa.
      line = `Sin esconderte: ${lowerFirst(short)}. ${react}`;
    } else if (act.priv) {
      line = `${short}. ${det} ${fill('{n} se queda afuera. Sabe exactamente qué está pasando.', name)} ${react}`;
    } else {
      line = `${fill('Con {n} viendo: ', name)}${lowerFirst(short)}. ${det} ${react}`;
    }
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

  // Lo que pasa dentro de él (solo si está presente).
  const bpm0 = s.live.bpm;
  reactToAct(s, act, seen, rng);

  const chips: Chip[] = [{ text: `+${gain} satisfacción`, tone: 'up' }];
  if (n > 0) chips.push({ text: `combo ×${n + 1}`, tone: 'up' });
  if (!seen) chips.push({ text: 'te saliste con la tuya', tone: 'up' });
  if (stale) chips.push({ text: 'esto ya no te llena', tone: '' });
  if (s.h !== h0) chips.push({ text: `humillación +${s.h - h0}`, tone: 'him' });
  if (s.c !== c0) chips.push({ text: `confianza ${s.c - c0}`, tone: 'him' });
  if (s.s !== s0) chips.push({ text: `sospecha +${s.s - s0}`, tone: 'bad' });
  if (s.live.bpm - bpm0 >= 4) chips.push({ text: `pulso ${bpm0} → ${s.live.bpm}`, tone: 'bad' });
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
    follow: alive ? followUps(act, after, mode, rng) : [],
  };
  s.last = turn;

  const how =
    mode === 'ausente' ? 'él no estaba' : mode === 'frente' ? 'frente a él' : seen ? 'él cerca, te vio' : 'él cerca, no te vio';
  s.log.unshift(`Día ${s.turn} · ${short} (${how}).`);
  if (s.log.length > 40) s.log.length = 40;

  return s;
}

/* ---------- minijuego: llamada ---------- */

const CALL_TAIL: Record<CallVerdict, string> = {
  limpio: '{n} te dice que te quiere y cuelga tranquilo. No notó nada.',
  dudas: '{n} se queda un segundo callado. Algo no le cuadró, pero lo deja pasar.',
  sabe: '{n} escuchó lo que no debía. No dijo nada hasta que colgó.',
};

const CALL_TAIL_HURT = [
  '{n} nota que algo no está bien en tu voz. Pregunta si estás bien y se queda con la duda.',
  '{n} se queda callado. Oyó tu voz temblar y sabe que algo le duele, pero no se atreve a preguntar qué.',
] as const;

const CALL_TAIL_FAILED = 'Tu voz no tembló lo suficiente. {n} no notó nada y cuelga tranquilo.';

const CALL_CHIP: Record<CallVerdict, string> = {
  limpio: 'te creyó',
  dudas: 'le quedó una duda',
  sabe: 'lo escuchó todo',
};

/**
 * Resuelve una acción con la llamada ya jugada. Todo gira alrededor de él: lo que
 * oyó decide su sospecha, su confianza y cuánto lo humillaste. Si elegiste que lo
 * sintiera (`herir`), cuánto le dolió también sube tu satisfacción, hasta el doble.
 */
export function playCall(
  prev: GameState,
  actId: string,
  result: CallResult,
  chained = false,
  rng: Rng = Math.random,
): GameState {
  const act = findAct(actId);
  const target = findTarget(prev.pick.target);
  const before = level(prev.sat);
  if (!act || !target || !opensMini(act, prev.pick.mode) || !playable(act, prev.pick.mode, prev.sat)) return prev;

  const s: GameState = { ...prev, log: [...prev.log], live: cloneLive(prev.live) };
  const n = chained ? s.combo + 1 : 0;
  if (!chained && s.cheat > 0) s.turn++;

  const { verdict } = result;
  const name = displayName(s);
  const stale = act.lvl < before - 1;
  const hurting = result.intent === 'herir';
  const k = hurting ? result.hurt / 100 : 0; // qué tanto lo sintió, de 0 a 1
  // Lo que te dio la llamada a ti: lo alto que llegaste, lo que dijiste en voz alta y cómo terminó.
  const thrill =
    ((result.excit ?? 1) - 1) / 14 +
    (result.dijo ?? 0) * 0.04 +
    (result.climax === 'oyo' ? 0.5 : result.climax === 'oculto' ? 0.25 : 0);
  // Que él lo sienta te da más satisfacción: hasta el doble.
  const gain = Math.max(1, Math.round(act.sat * target.ms * (stale ? 0.5 : 1) * (1 + 0.15 * n) * (1 + k + thrill)));
  const short = fill(act.txt, name, target);
  const det = fill(act.det, name, target);
  let tail = pickOne(mezcla([CALL_TAIL[verdict]], poolCierres(verdict)), rng);
  if (hurting && verdict !== 'sabe') {
    const kind = k >= 0.6 ? 'fuerte' : k >= 0.25 ? 'leve' : 'fallo';
    const fixed = kind === 'fuerte' ? CALL_TAIL_HURT[1] : kind === 'leve' ? CALL_TAIL_HURT[0] : CALL_TAIL_FAILED;
    tail = pickOne(mezcla([fixed], poolCierres(kind)), rng);
  }
  const line = `${short}. ${det} ${fill(tail, name)}`;

  const seen = verdict === 'sabe';
  const stageNow = stage(s.h);
  let dh = 0;
  let dc = 0;
  let ds = 0;
  if (verdict === 'limpio') {
    ds = 2;
    dc = 4;
  } else if (verdict === 'dudas') {
    ds = 8 + result.exposure * 0.12;
    dc = -6;
    dh = act.hum * target.mh * 0.1;
  } else {
    ds = 22;
    dc = -14;
    dh = act.hum * target.mh * 0.7;
  }

  if (hurting) {
    // Lo sintió: si tembló lo bastante, ya no se queda tranquilo aunque no sepa por qué.
    if (k >= 0.25 && verdict === 'limpio') {
      ds = 0;
      dc = 0;
    }
    dh += act.hum * target.mh * 0.8 * k;
    dc -= 12 * k;
    ds += 8 * k;
  }

  s.cheat++;
  s.sat += gain;
  if (seen) {
    s.seen++;
    s.streak = 0;
  } else {
    s.away++;
    s.streak++;
  }
  if (s.streak > s.best) s.best = s.streak;
  s.combo = seen ? 0 : n;
  if (n + 1 > s.bestCombo) s.bestCombo = n + 1;

  const h0 = s.h;
  const c0 = s.c;
  const s0 = s.s;
  s.h = clamp(s.h + dh);
  s.c = clamp(s.c + dc);
  s.s = clamp(s.s + ds);
  const stageAfter = stage(s.h);

  const bpm0 = s.live.bpm;
  reactToCall(s, act, verdict, hurting ? result.hurt : 0, rng);

  const chips: Chip[] = [];
  // Si lo hiciste a propósito, lo que importa es cuánto lo sintió; solo se avisa si se dio cuenta de todo.
  if (!hurting || verdict === 'sabe') {
    chips.push({ text: CALL_CHIP[verdict], tone: verdict === 'limpio' ? 'up' : verdict === 'dudas' ? 'bad' : 'him' });
  }
  chips.push({ text: `+${gain} satisfacción`, tone: 'up' });
  if (hurting) {
    chips.push(
      result.hurt >= 25
        ? { text: `lo sintió ${result.hurt}%`, tone: 'him' }
        : { text: 'no logró sentirlo', tone: '' },
    );
  }
  if (result.climax === 'oyo') chips.push({ text: 'acabaste y él lo oyó', tone: 'him' });
  else if (result.climax === 'oculto') chips.push({ text: 'acabaste en silencio', tone: 'up' });
  if ((result.dijo ?? 0) > 0) chips.push({ text: `se te escapó ×${result.dijo}`, tone: 'up' });
  if (n > 0) chips.push({ text: `combo ×${n + 1}`, tone: 'up' });
  if (result.heard > 0) chips.push({ text: `oyó ruidos ×${result.heard}`, tone: 'bad' });
  if (result.cuts + result.missed > 0) chips.push({ text: `te cortaste ×${result.cuts + result.missed}`, tone: 'bad' });
  if (s.h !== h0) chips.push({ text: `humillación +${s.h - h0}`, tone: 'him' });
  if (s.c !== c0) chips.push({ text: `confianza ${s.c > c0 ? '+' : ''}${s.c - c0}`, tone: 'him' });
  if (s.s !== s0) chips.push({ text: `sospecha +${s.s - s0}`, tone: 'bad' });
  if (s.live.bpm - bpm0 >= 4) chips.push({ text: `pulso ${bpm0} → ${s.live.bpm}`, tone: 'bad' });

  const after = level(s.sat);
  const notes: string[] = [];
  if (stageAfter > stageNow) notes.push(`${name} cambió. Ahora está: ${STATES[stageAfter].toLowerCase()}.`);
  if (after > before) {
    notes.push(`Nivel ${after}. Lo de antes ya no alcanza: hay acciones nuevas.`);
    s.tab = after;
  }
  if (seen) notes.push('Lo oyó. Se cortó el combo.');

  s.last = {
    aid: act.id,
    tid: target.id,
    mode: s.pick.mode,
    seen,
    stage: stageAfter,
    line,
    thought: s.live.feed[0]?.text ?? '',
    chips,
    notes,
    follow: seen ? [] : followUps(act, after, s.pick.mode, rng),
  };

  const how = hurting
    ? `llamada, lo sintió ${result.hurt}%`
    : verdict === 'limpio'
      ? 'llamada, te creyó'
      : verdict === 'dudas'
        ? 'llamada, le quedó una duda'
        : 'llamada, lo oyó todo';
  s.log.unshift(`Día ${s.turn} · ${short} (${how}).`);
  if (s.log.length > 40) s.log.length = 40;
  return s;
}
