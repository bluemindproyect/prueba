import { mezcla, poolDialogos, poolOye, poolSilencio } from '../contenido';
import type { CallVerdict, MiniIntent } from '../types';

/**
 * Minijuego «Llamada»: él llama mientras estás con el otro.
 *
 * - Botón derecho (hablar): mantenlo apretado para contestar. Si lo sueltas, dejas de hablar.
 * - Botón izquierdo (nivelar): una aguja sube sola con el ritmo de lo que pasa y debes
 *   mantenerla en el centro. Si no la bajas, se nota; si aprietas de más, se va al otro lado.
 *
 * Antes de empezar eliges qué quieres lograr:
 * - `ocultar`: que no se note nada.
 * - `herir`: que él oiga tu voz temblar. Eso se logra dejando que la aguja suba a la
 *   franja de temblor mientras hablas. Cuanto más y más tiempo, más lo siente él, y más
 *   ganas tú. Si te pasas, se da cuenta de todo.
 *
 * Todo se mide desde él: cuánto alcanza a oír, qué le queda y qué entiende.
 * Este archivo es lógica pura, sin React.
 */

export interface CallExchange {
  /** lo que dice él (usa {n} para su nombre) */
  him: string;
  /** lo que debes contestar, completo, manteniendo el botón */
  you: string;
}

export const CALL_SCRIPT: readonly CallExchange[] = [
  { him: 'Hola, mi amor. ¿Cómo va la noche?', you: 'Bien, tranquila por aquí. ¿Y tú?' },
  { him: '¿Dónde estás? Se oye música de fondo.', you: 'En casa de una amiga. Ya me voy.' },
  { him: 'Te noto la voz rara. ¿Estás bien?', you: 'Subí las escaleras corriendo, nada más.' },
  { him: 'Te quiero, ¿eh? Cuídate mucho, {n} se queda esperándote.', you: 'Yo también te quiero. Duerme bien.' },
];

/** Lo que dice él cuando oye algo. Sale al cruzar cada umbral de `HEAR_AT`. */
export const CALL_HEARS: readonly string[] = [
  '¿Qué fue ese ruido?',
  'Se te corta la voz… ¿estás bien?',
  '¿Hay alguien ahí contigo?',
];

/** Cuánto de «lo que él oye» (0 a 100) hace falta para que diga cada frase. */
export const HEAR_AT: readonly number[] = [30, 55, 80];

/* ---------- ajustes ---------- */

export const HIM_SECS = 2.6; // lo que tarda en decir su frase
export const WINDOW_SECS = 11; // tiempo que tienes para contestar
const BEAT_SECS = 1.1; // pausa entre frases
const CHARS_PER_SEC = 12; // qué tan rápido sale lo que dices mientras mantienes el botón

const PUSH_UP = 2.8; // cuánto empuja la aguja hacia arriba el ritmo
const PUSH_DOWN = 3.6; // cuánto la baja tu botón
const DAMPING = 2.5;

export const SAFE = 0.3; // dentro de esto no se nota
export const LOUD = 0.6; // pasado esto se oye claro

// En `herir`: cuánto sube «lo que siente él» por segundo, según la zona de la aguja.
const HURT_SPEAKING = { warn: 9, loud: 14 } as const;
const HURT_LISTENING = { warn: 2, loud: 4 } as const;
const HURT_DECAY = 0.8;

export type CallPhase = 'him' | 'you' | 'beat' | 'done';

export interface CallLine {
  who: 'him' | 'you';
  text: string;
  /** lo que dijiste se quedó a medias */
  cut?: boolean;
  /** lo dice porque oyó algo */
  heard?: boolean;
}

export interface CallState {
  intent: MiniIntent;
  /** segundos desde que empezó */
  t: number;
  /** -1 (te pasaste) a 1 (se desbordó). 0 es el centro */
  needle: number;
  vel: number;
  /** fases del ritmo, para que cada llamada sea distinta */
  phi: readonly [number, number];
  phase: CallPhase;
  phaseT: number;
  /** las frases de esta llamada, en orden */
  script: readonly CallExchange[];
  /** lo que dice él cuando oye algo (una por umbral de `HEAR_AT`) */
  hears: readonly string[];
  /** lo que dice si no contestas (una por frase) */
  silences: readonly string[];
  /** en qué frase de `script` va */
  idx: number;
  /** cuántas letras de tu respuesta ya dijiste */
  chars: number;
  speaking: boolean;
  /** segundos callada mientras él espera tu respuesta */
  silence: number;
  /** 0 a 100: cuánto alcanza a oír él */
  exposure: number;
  peak: number;
  /** 0 a 100: cuánto lo siente él (solo cuenta con la intención `herir`) */
  hurt: number;
  /** cuántas veces dijo que oyó algo */
  heard: number;
  /** cuántas veces soltaste el botón con la frase a medias */
  cuts: number;
  /** frases que no alcanzaste a contestar */
  missed: number;
  hangup: boolean;
  /** frases ya terminadas, la más vieja primero */
  log: readonly CallLine[];
}

export interface CallInput {
  /** botón de hablar apretado */
  talk: boolean;
  /** botón de nivelar apretado */
  press: boolean;
}

export interface CallResult {
  intent: MiniIntent;
  /** cuánto lo sintió él (0 a 100). Siempre 0 con la intención `ocultar` */
  hurt: number;
  verdict: CallVerdict;
  /** cuánto alcanzó a oír al final (0 a 100) */
  exposure: number;
  peak: number;
  heard: number;
  cuts: number;
  missed: number;
  hangup: boolean;
  seconds: number;
  /** solo en la llamada con decisiones */
  /** nivel de excitación más alto que alcanzó (1 a 8) */
  excit?: number;
  /** cuántos comentarios dijiste en voz alta */
  dijo?: number;
  /** cuántos te callaste */
  calló?: number;
  /** cómo fue el final: lo oyó, lo ocultaste o no llegaste */
  climax?: 'oyo' | 'oculto' | 'no';
  /** quién colgó */
  colgo?: 'ella' | 'el';
  /** cuánto sospecha él al final (0 a 100) */
  sosp?: number;
  /** lo tuviste en altavoz: lo oyó todo el rato */
  altavoz?: boolean;
}

export type Rng = () => number;

export const fillName = (text: string, name: string): string => text.replace(/\{n\}/g, name);

const pickFrom = <T,>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/** Arma el guion de esta llamada: una apertura, dos del medio y un cierre. Cada llamada sale distinta. */
export function buildScript(rng: Rng): readonly CallExchange[] {
  const take = (list: readonly CallExchange[], fixed: readonly CallExchange[], n: number): CallExchange[] => {
    const all = [...fixed, ...list];
    const out: CallExchange[] = [];
    while (out.length < n && all.length) out.push(all.splice(Math.floor(rng() * all.length), 1)[0]);
    return out;
  };
  const toEx = (d: { him: string; you: string }): CallExchange => ({ him: d.him, you: d.you });
  const fijoApertura = CALL_SCRIPT.slice(0, 1);
  const fijoMedio = CALL_SCRIPT.slice(1, 3);
  const fijoCierre = CALL_SCRIPT.slice(3);
  return [
    ...take(poolDialogos('apertura').map(toEx), fijoApertura, 1),
    ...take(poolDialogos('medio').map(toEx), fijoMedio, 2),
    ...take(poolDialogos('cierre').map(toEx), fijoCierre, 1),
  ];
}

export function startCall(rng: Rng = Math.random, intent: MiniIntent = 'ocultar'): CallState {
  const hears = [0, 1, 2].map((i) => pickFrom(mezcla([CALL_HEARS[i]], poolOye(i as 0 | 1 | 2)), rng));
  const script = buildScript(rng);
  const silences = script.map(() => pickFrom(mezcla(['¿Hola? ¿Sigues ahí?'], poolSilencio()), rng));
  return {
    script,
    hears,
    silences,
    intent,
    t: 0,
    needle: 0,
    vel: 0,
    phi: [rng() * Math.PI * 2, rng() * Math.PI * 2],
    phase: 'him',
    phaseT: 0,
    idx: 0,
    chars: 0,
    speaking: false,
    silence: 0,
    exposure: 0,
    peak: 0,
    hurt: 0,
    heard: 0,
    cuts: 0,
    missed: 0,
    hangup: false,
    log: [],
  };
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** Lo que empuja la aguja hacia arriba (0 a 1). Va subiendo con el tiempo, con oleadas y arrebatos. */
export function drive(t: number, phi: readonly [number, number]): number {
  const ramp = Math.min(1, 0.45 + t / 45);
  const wave = 0.5 + 0.5 * Math.sin(t * 0.9 + phi[0]);
  const burst = Math.pow(Math.max(0, Math.sin(t * 2.1 + phi[1])), 4);
  return clamp(0.12 + ramp * (0.45 * wave + 0.65 * burst), 0, 1);
}

/** Cómo de mal se oye lo que pasa según dónde está la aguja. */
export type Zone = 'safe' | 'warn' | 'loud';

export function zoneOf(needle: number): Zone {
  const a = Math.abs(needle);
  return a > LOUD ? 'loud' : a > SAFE ? 'warn' : 'safe';
}

export function replyLength(s: Pick<CallState, 'idx' | 'script'>): number {
  return s.script[s.idx]?.you.length ?? 0;
}

/** Avanza `dt` segundos. No modifica el estado anterior. */
export function stepCall(prev: CallState, input: CallInput, dt: number): CallState {
  if (prev.phase === 'done') return prev;
  const s: CallState = { ...prev };
  const dtc = Math.min(dt, 0.1); // si la pestaña se congela, no saltar de golpe
  s.t += dtc;

  // La aguja: la empuja el ritmo hacia arriba y tu botón hacia abajo, con inercia.
  const acc = drive(s.t, s.phi) * PUSH_UP - (input.press ? PUSH_DOWN : 0);
  s.vel = (s.vel + acc * dtc) * Math.max(0, 1 - DAMPING * dtc);
  s.needle += s.vel * dtc;
  if (s.needle > 1) {
    s.needle = 1;
    s.vel = Math.min(0, s.vel);
  } else if (s.needle < -1) {
    s.needle = -1;
    s.vel = Math.max(0, s.vel);
  }

  // Hablar: solo cuenta mientras te toca contestar.
  const answering = s.phase === 'you';
  const len = replyLength(s);
  const wasSpeaking = prev.speaking;
  s.speaking = answering && input.talk && s.chars < len;

  if (answering) {
    if (s.speaking) {
      s.chars = Math.min(len, s.chars + CHARS_PER_SEC * dtc);
      s.silence = 0;
    } else if (s.chars < len) {
      s.silence += dtc;
    }
    // Soltaste con la frase a medias: se corta y se nota.
    if (wasSpeaking && !s.speaking && s.chars < len) {
      s.cuts += 1;
      s.exposure += 4;
    }
  }

  // Lo que él oye: sube cuando la aguja se va y más si estás hablando; baja si todo está parejo.
  let leak = zoneOf(s.needle) === 'loud' ? 12 : zoneOf(s.needle) === 'warn' ? 4 : 0;
  if (s.speaking) leak *= 1.8;
  // Si lo haces a propósito, lo que él oye es un temblor que no sabe ubicar: se nota menos de golpe.
  if (s.intent === 'herir') leak *= 0.5;
  if (answering && !s.speaking && s.chars < len && s.silence > 3) leak += 3;
  s.exposure = clamp(s.exposure + (leak > 0 ? leak : -1.2) * dtc, 0, 100);
  if (s.exposure > s.peak) s.peak = s.exposure;

  // Que lo sienta: la voz temblando (aguja fuera del centro) hace daño, más si estás hablando.
  if (s.intent === 'herir') {
    const zone = zoneOf(s.needle);
    const rates = s.speaking ? HURT_SPEAKING : HURT_LISTENING;
    s.hurt = clamp(s.hurt + (zone === 'safe' ? -HURT_DECAY : rates[zone]) * dtc, 0, 100);
  }

  let log = s.log;
  while (s.heard < HEAR_AT.length && s.exposure >= HEAR_AT[s.heard]) {
    log = [...log, { who: 'him', text: s.hears[s.heard], heard: true }];
    s.heard += 1;
  }

  // Fases de la conversación.
  s.phaseT += dtc;
  const line = s.script[s.idx];
  if (s.phase === 'him' && s.phaseT >= HIM_SECS) {
    log = [...log, { who: 'him', text: line.him }];
    s.phase = 'you';
    s.phaseT = 0;
    s.chars = 0;
    s.silence = 0;
  } else if (s.phase === 'you') {
    if (s.chars >= len) {
      log = [...log, { who: 'you', text: line.you }];
      s.phase = 'beat';
      s.phaseT = 0;
    } else if (s.phaseT >= WINDOW_SECS) {
      s.missed += 1;
      s.exposure = Math.min(100, s.exposure + 15);
      s.peak = Math.max(s.peak, s.exposure);
      const said = line.you.slice(0, Math.floor(s.chars)).trimEnd();
      log = [...log, { who: 'you', text: said ? `${said}…` : '…', cut: true }];
      if (s.silence > 4) log = [...log, { who: 'him', text: s.silences[s.idx] ?? '¿Hola?', heard: true }];
      s.phase = 'beat';
      s.phaseT = 0;
    }
  } else if (s.phase === 'beat' && s.phaseT >= BEAT_SECS) {
    s.idx += 1;
    s.phase = s.idx >= s.script.length ? 'done' : 'him';
    s.phaseT = 0;
    s.chars = 0;
    s.speaking = false;
  }

  if (s.exposure >= 100) {
    s.hangup = true;
    s.phase = 'done';
    s.speaking = false;
  }
  s.log = log;
  return s;
}

export function callResult(s: CallState): CallResult {
  const score = Math.max(s.exposure, s.peak * 0.8);
  const verdict: CallVerdict = s.hangup || score >= 60 ? 'sabe' : score >= 25 ? 'dudas' : 'limpio';
  return {
    intent: s.intent,
    hurt: s.intent === 'herir' ? Math.round(s.hurt) : 0,
    verdict,
    exposure: Math.round(s.exposure),
    peak: Math.round(s.peak),
    heard: s.heard,
    cuts: s.cuts,
    missed: s.missed,
    hangup: s.hangup,
    seconds: Math.round(s.t),
  };
}