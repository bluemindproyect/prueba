import { mezcla, poolLlamada } from '../contenido';
import { lineasDe } from '../palabras';
import type { Opcion, Pregunta, Tono } from '../contenido';
import type { CallResult, Rng } from './llamada';
import type { CallVerdict } from '../types';

/**
 * Llamada con decisiones. Él pregunta, tú eliges qué contestas; el otro tiene un ritmo que
 * también eliges; la excitación sube del 1 al 8 y en cada nivel decides si lo dices o lo callas.
 * Todo se mide desde él: lo que sospecha, lo que oye y cuánto le duele.
 * Lógica pura, sin React.
 */

export type Ritmo = 'lento' | 'firme' | 'rapido';
export type Fase = 'pregunta' | 'reaccion' | 'comenta' | 'quefue' | 'cuelga' | 'fin';
export type Quien = 'el' | 'ella' | 'ritmo' | 'nota';

export interface Linea {
  who: Quien;
  text: string;
  /** el tono con que lo dijiste, o lo que él oyó */
  tono?: Tono | 'oyo';
}

export interface Comentario {
  nivel: number;
  texto: string;
}

export interface Call2 {
  t: number;
  fase: Fase;
  faseT: number;
  excit: number;
  maxExcit: number;
  ritmo: Ritmo;
  sosp: number;
  dano: number;
  oido: number;
  peak: number;
  heard: number;
  hechos: readonly string[];
  usadas: readonly string[];
  pregunta: Pregunta | null;
  preguntas: number;
  prompt: Comentario | null;
  nivelPedido: number;
  dijo: number;
  callo: number;
  climax: 'oyo' | 'oculto' | 'no';
  colgo: 'ella' | 'el' | null;
  /** lo que está pasando dentro de él */
  piensa: string;
  imagina: string;
  hace: string;
  /** lo que piensas tú de él */
  pobre: string;
  /** frase de cómo va el otro (según el ritmo) */
  narra: string;
  log: readonly Linea[];
  /** qué tan lento sube la excitación: 1 es la llamada corta de siempre; 0.2 es la larga del paseo */
  escala: number;
  /** segundos máximos antes de forzar el final (0 = sin límite) */
  limite: number;
  /** cuántas preguntas como máximo */
  maxPreg: number;
}

/** Opciones al empezar una llamada. */
export interface OpcionesLlamada {
  /** la llamada del paseo: dura hasta 10 minutos y el ritmo que eliges decide cuánto tarda */
  largo?: boolean;
}

/** Lo más que dura la llamada larga, en segundos (10 minutos reales). */
export const LIMITE_LARGO = 600;

/* ---------- ajustes ---------- */

const EXCIT_RATE: Record<Ritmo, number> = { lento: 0.06, firme: 0.12, rapido: 0.22 };
const MAX_PREGUNTAS = 24;
const REACT_SECS = 2.4;
const START_EXCIT = 1;

const DELTA: Record<Tono, { sosp: number; dano: number; oido: number }> = {
  calma: { sosp: -7, dano: 0, oido: 0 },
  evade: { sosp: 6, dano: 2, oido: 0 },
  tiembla: { sosp: 8, dano: 11, oido: 4 },
  verdad: { sosp: 4, dano: 17, oido: 2 },
  choca: { sosp: 17, dano: 5, oido: 3 },
};

/* ---------- contenido incluido (si no hay base de datos) ---------- */

const op = (tono: Tono, texto: string, hecho = ''): Opcion => ({ tono, hecho, texto });

const FIJAS: readonly Pregunta[] = [
  {
    id: 'fija-donde',
    texto: 'Hola, mi amor. ¿Dónde estás? Se oye raro.',
    tema: 'donde',
    etapa: 'inicio',
    opciones: [
      op('calma', 'En casa de una amiga, cenando algo.', 'amiga'),
      op('calma', 'En casa, tirada en la cama con la tele.', 'casa'),
      op('evade', 'Por ahí, luego te cuento. ¿Tú cómo estás?'),
      op('tiembla', 'En casa… sola… pensando en ti.', 'casa'),
    ],
  },
  {
    id: 'fija-voz',
    texto: 'Te noto la voz rara. ¿Estás bien?',
    tema: 'voz',
    opciones: [
      op('calma', 'Estoy cansada, nada más.'),
      op('evade', 'No es nada, ¿y tú cómo estás?'),
      op('tiembla', 'Es que… te extrañaba mucho…'),
      op('verdad', 'Un poco confundida, sí. Han sido días raros.'),
    ],
  },
  {
    id: 'fija-directa',
    texto: '¿Estás con alguien?',
    tema: 'directa',
    opciones: [
      op('calma', 'No, estoy sola. ¿Por qué lo preguntas?'),
      op('evade', '¿Por qué me preguntas eso justo ahora?'),
      op('tiembla', 'Estoy… con alguien… no es lo que piensas…'),
      op('verdad', 'Con una amiga. Y ya, no preguntes más.'),
    ],
  },
];

const FILLERS: readonly Pregunta[] = [
  { id: 'fija-dia', texto: 'Cuéntame algo de tu día. Me gusta oírte hablar.', tema: 'relleno', opciones: [
    op('calma', 'Casi nada, lo de siempre. Pensé en ti un rato.'),
    op('evade', 'Mejor cuéntame tú, el mío fue aburrido.'),
    op('tiembla', 'Fue… largo… y ahora… estoy muy rara…'),
    op('verdad', 'Hubo cosas que no te voy a contar hoy.'),
  ] },
  { id: 'fija-bonito', texto: 'Dime algo bonito antes de dormir.', tema: 'relleno', opciones: [
    op('calma', 'Eres lo mejor que me ha pasado, de verdad.'),
    op('evade', 'Qué cursi estás hoy. Descansa, anda.'),
    op('tiembla', 'No me merezco… que me digas esas cosas…'),
    op('verdad', 'Ojalá fuera tan buena como crees.'),
  ] },
  { id: 'fija-nocuelgues', texto: 'No cuelgues todavía, quédate un ratito más.', tema: 'relleno', opciones: [
    op('calma', 'Claro, aquí sigo. No tengo prisa.'),
    op('evade', 'Un ratito, que ya me estoy durmiendo.'),
    op('tiembla', 'Me quedo… no… me cuesta… hablar…'),
    op('verdad', 'No puedo mucho más, perdóname.'),
  ] },
  { id: 'fija-quiero', texto: 'Te quiero muchísimo, ¿lo sabes?', tema: 'relleno', opciones: [
    op('calma', 'Lo sé, mi amor. Yo también te quiero.'),
    op('evade', 'Yo también, tonto. Ya duérmete.'),
    op('tiembla', 'Yo… te quiero… perdóname…'),
    op('verdad', 'Te quiero, pero no sé si como tú mereces.'),
  ] },
  { id: 'fija-seguro', texto: '¿Seguro que estás bien? Me quedé inquieto.', tema: 'relleno', opciones: [
    op('calma', 'Seguro. Estoy tranquila, de verdad.'),
    op('evade', '¿Por qué tanta pregunta? Estás raro.'),
    op('tiembla', 'No sé… no sé… estoy… sensible…'),
    op('verdad', 'No del todo. Pero no quiero hablar de eso.'),
  ] },
];

const FIJA_QUEFUE: Pregunta = {
  id: 'fija-quefue',
  texto: '¿Qué fue eso? ¿Estás bien?',
  tema: 'quefue',
  opciones: [
    op('calma', 'Un calambre, me dio de repente. Ya pasó.'),
    op('evade', 'Nada, me asusté. Se me cayó algo.'),
    op('tiembla', 'No sé… me dio… algo… perdóname…'),
    op('verdad', 'Estoy con alguien. Perdóname.'),
  ],
};

const FIJAS_TEXTO = {
  reaccion: {
    calma: ['Qué bien. Me quedo más tranquilo.'],
    evade: ['Cambiaste de tema muy rápido, ¿no?'],
    tiembla: ['Te siento temblando. ¿Qué te pasa?'],
    verdad: ['Eso me dolió, aunque lo digas bajito.'],
    choca: ['Hace un momento decías otra cosa.'],
  } as Record<string, readonly string[]>,
  comentario: ['Ay… sigue así… no pares.', 'Más… dame más… por favor.', 'Dios… qué rico… justo ahí.', 'No pares… me vuelves loca.', 'Ya casi… no pares.', 'Me voy a venir… no pares.', 'Sí… ahí… ya casi…', 'Ay Dios… me vengo…'],
  oyo: { suave: ['¿Qué fue ese ruido?'], fuerte: ['¿Hay alguien contigo? Dime la verdad.'] } as Record<string, readonly string[]>,
  imagina: {
    baja: ['Se imagina a su novia sola, tranquila.'],
    media: ['Se imagina cada detalle, y alguno no encaja.'],
    alta: ['Se imagina las manos de otro en su cintura.'],
  } as Record<string, readonly string[]>,
  pobre: ['Pobrecito… cree cada palabra que le digo.', 'Pobrecito… si supiera lo que estoy sintiendo.'],
  ritmo: {
    lento: ['Va despacio, saboreándote. Te alcanza para hablar con calma.'],
    firme: ['Mantiene un ritmo firme. Se te escapa algún suspiro.'],
    rapido: ['Te lo está haciendo muy rápido. Casi no puedes hablar.'],
  } as Record<string, readonly string[]>,
  despedida: {
    'el-tranquilo': ['Bueno, te dejo. Te quiero mucho.'],
    'el-roto': ['Tengo que colgar. Necesito pensar un rato.'],
    'ella-tranquilo': ['Tengo que colgar, amor. Hablamos mañana.'],
    'ella-roto': ['Perdóname. Te cuelgo. Hablamos luego.'],
  } as Record<string, readonly string[]>,
  hace: {
    tranquilo: ['Está en el sofá, con el teléfono en la oreja y una sonrisa.'],
    inquieto: ['Camina por el cuarto sin soltar el teléfono.'],
    desconfiado: ['Se pasa la mano por la cara, mirando la pared.'],
    herido: ['Está sentado en el borde de la cama, sin moverse.'],
  } as Record<string, readonly string[]>,
};

/* ---------- utilidades ---------- */

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const pick = <T,>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];
const pickText = (items: readonly string[] | undefined, fallback: readonly string[], rng: Rng): string =>
  pick(mezcla(fallback, items), rng);

export const nivelDe = (s: Pick<Call2, 'excit'>): number => clamp(Math.floor(s.excit), 1, 8);

export function bandaSosp(sosp: number): 'baja' | 'media' | 'alta' {
  return sosp < 25 ? 'baja' : sosp < 55 ? 'media' : 'alta';
}

export function animoDe(sosp: number, dano: number): 'tranquilo' | 'inquieto' | 'desconfiado' | 'herido' {
  const v = Math.max(sosp, dano * 0.9);
  return v < 20 ? 'tranquilo' : v < 45 ? 'inquieto' : v < 70 ? 'desconfiado' : 'herido';
}

/** Pulso de él: sube con lo que sospecha y lo que le duele. */
export const pulsoDe = (s: Pick<Call2, 'sosp' | 'dano'>): number => Math.round(64 + s.sosp * 0.42 + s.dano * 0.3);

const allPreguntas = (): readonly Pregunta[] => {
  const extra = poolLlamada().preguntas;
  return extra.length ? [...FIJAS, ...FILLERS, ...extra] : [...FIJAS, ...FILLERS];
};

function siguientePregunta(s: Pick<Call2, 'usadas' | 'hechos' | 'sosp'>, rng: Rng): Pregunta | null {
  const primera = s.usadas.length === 0;
  const todas = allPreguntas().filter((q) => !s.usadas.includes(q.id));
  let cand = todas.filter((q) => (q.etapa === 'inicio') === primera && (!q.requiere || s.hechos.includes(q.requiere)));
  // Si se acabaron, puede repetir alguna (menos la última) para que la llamada siga.
  if (cand.length === 0) {
    const ultima = s.usadas[s.usadas.length - 1];
    cand = allPreguntas().filter((q) => q.etapa !== 'inicio' && q.id !== ultima && (!q.requiere || s.hechos.includes(q.requiere)));
  }
  if (cand.length === 0) return null;
  // Si ya dijiste dónde estás, él tiende a preguntar por eso. Si sospecha, se vuelve directo.
  const pesos = cand.map((q) => {
    let w = 1;
    if (q.requiere) w += 2.5;
    if (s.sosp >= 40 && ['directa', 'trampa', 'celos', 'ruido', 'resp'].includes(q.tema)) w += 3;
    if (s.sosp < 25 && ['quiere1', 'quiere2', 'recuerdo', 'plan', 'manana'].includes(q.tema)) w += 2;
    return w;
  });
  let r = rng() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cand.length; i++) {
    r -= pesos[i];
    if (r <= 0) return cand[i];
  }
  return cand[cand.length - 1];
}

function refrescar(s: Call2, rng: Rng): void {
  const L = poolLlamada();
  const banda = bandaSosp(s.sosp);
  s.imagina = pickText([...(L.imagina[banda] ?? []), ...lineasDe('imagina')], FIJAS_TEXTO.imagina[banda], rng);
  const animo = animoDe(s.sosp, s.dano);
  s.hace = pickText(L.ritmo[`x-${animo}`], FIJAS_TEXTO.hace[animo], rng);
  s.pobre = pickText([...(L.pobrecito[s.dano >= 35 ? 'alta' : 'baja'] ?? []), ...lineasDe('pobrecito')], FIJAS_TEXTO.pobre, rng);
}

function llevarA(s: Call2, fase: Fase): void {
  s.fase = fase;
  s.faseT = 0;
}

/* ---------- inicio ---------- */

export function startCall2(rng: Rng = Math.random, opts: OpcionesLlamada = {}): Call2 {
  const s: Call2 = {
    t: 0,
    fase: 'pregunta',
    faseT: 0,
    excit: START_EXCIT,
    maxExcit: START_EXCIT,
    ritmo: 'firme',
    sosp: 4,
    dano: 0,
    oido: 0,
    peak: 0,
    heard: 0,
    hechos: [],
    usadas: [],
    pregunta: null,
    preguntas: 0,
    prompt: null,
    nivelPedido: 1,
    dijo: 0,
    callo: 0,
    climax: 'no',
    colgo: null,
    piensa: '',
    imagina: '',
    hace: '',
    pobre: '',
    narra: '',
    log: [],
    escala: opts.largo ? 0.2 : 1,
    limite: opts.largo ? LIMITE_LARGO : 0,
    maxPreg: opts.largo ? 400 : MAX_PREGUNTAS,
  };
  const q = siguientePregunta(s, rng);
  s.pregunta = q;
  if (q) s.usadas = [q.id];
  s.preguntas = 1;
  s.log = q ? [{ who: 'el', text: q.texto }] : [];
  s.narra = pickText(poolLlamada().ritmo[s.ritmo], FIJAS_TEXTO.ritmo[s.ritmo], rng);
  refrescar(s, rng);
  return s;
}

/* ---------- decisiones ---------- */

export function setRitmo(prev: Call2, ritmo: Ritmo, rng: Rng = Math.random): Call2 {
  if (prev.ritmo === ritmo || prev.fase === 'fin') return prev;
  const s = { ...prev, ritmo };
  s.narra = pickText(poolLlamada().ritmo[ritmo], FIJAS_TEXTO.ritmo[ritmo], rng);
  s.log = [...s.log, { who: 'ritmo', text: s.narra }];
  return s;
}

function oyeAlgo(s: Call2, rng: Rng): void {
  // Cada vez que lo que oye cruza un umbral, él lo dice.
  const umbrales = [28, 58, 88];
  while (s.heard < umbrales.length && s.oido >= umbrales[s.heard]) {
    const fuerte = s.heard >= 1;
    const clave = fuerte ? 'fuerte' : 'suave';
    const text = pickText([...(poolLlamada().oyo[clave] ?? []), ...lineasDe(`oyo-${clave}`)], FIJAS_TEXTO.oyo[clave], rng);
    s.log = [...s.log, { who: 'el', text, tono: 'oyo' }];
    s.sosp = clamp(s.sosp + (fuerte ? 18 : 9), 0, 100);
    s.dano = clamp(s.dano + (fuerte ? 12 : 6), 0, 100);
    s.heard += 1;
  }
  s.peak = Math.max(s.peak, s.oido);
}

/** Eliges una de las respuestas de la pregunta que tienes enfrente. */
export function responder(prev: Call2, idx: number, rng: Rng = Math.random): Call2 {
  const q = prev.pregunta;
  if (!q || (prev.fase !== 'pregunta' && prev.fase !== 'quefue')) return prev;
  const o = q.opciones[idx];
  if (!o) return prev;
  const s: Call2 = { ...prev };
  const d = DELTA[o.tono];
  s.sosp = clamp(s.sosp + d.sosp, 0, 100);
  s.dano = clamp(s.dano + d.dano, 0, 100);
  s.oido = clamp(s.oido + d.oido, 0, 100);
  if (o.hecho) s.hechos = [...s.hechos, o.hecho];
  s.log = [...s.log, { who: 'ella', text: o.texto, tono: o.tono }];
  oyeAlgo(s, rng);
  const reaccion = pickText(poolLlamada().reacciones[o.tono], FIJAS_TEXTO.reaccion[o.tono], rng);
  s.log = [...s.log, { who: 'el', text: reaccion }];
  s.piensa = reaccion;
  s.pregunta = null;
  refrescar(s, rng);
  if (prev.fase === 'quefue') {
    llevarA(s, 'cuelga');
    return s;
  }
  llevarA(s, 'reaccion');
  return s;
}

/** En cada nivel te sale una frase: la dices o te la callas. */
export function comentar(prev: Call2, decir: boolean, rng: Rng = Math.random): Call2 {
  const p = prev.prompt;
  if (!p || prev.fase !== 'comenta') return prev;
  const s: Call2 = { ...prev, prompt: null };
  const nivel = p.nivel;
  if (nivel >= 8) {
    s.climax = decir ? 'oyo' : 'oculto';
    if (decir) {
      s.dijo += 1;
      s.log = [...s.log, { who: 'ella', text: p.texto, tono: 'oyo' }];
      s.oido = clamp(s.oido + 46, 0, 100);
      s.dano = clamp(s.dano + 22, 0, 100);
      s.sosp = clamp(s.sosp + 18, 0, 100);
    } else {
      s.callo += 1;
      s.log = [...s.log, { who: 'nota', text: 'Te muerdes los labios y te lo tragas todo.' }];
      s.oido = clamp(s.oido + (s.ritmo === 'rapido' ? 10 : 4), 0, 100);
    }
    oyeAlgo(s, rng);
    const L = poolLlamada();
    const pq = L.quefue.length ? pick(L.quefue, rng) : FIJA_QUEFUE;
    // Si lo dijiste en voz alta, o si ya había oído mucho, te lo pregunta de frente.
    if (decir || s.oido >= 50) {
      s.pregunta = pq;
      s.log = [...s.log, { who: 'el', text: pq.texto }];
      llevarA(s, 'quefue');
    } else {
      llevarA(s, 'cuelga');
    }
    refrescar(s, rng);
    return s;
  }
  if (decir) {
    s.dijo += 1;
    s.excit = Math.min(8, s.excit + 0.25);
    s.log = [...s.log, { who: 'ella', text: p.texto, tono: 'oyo' }];
    s.oido = clamp(s.oido + 12 + nivel * 2 + (s.ritmo === 'rapido' ? 6 : 0), 0, 100);
    s.dano = clamp(s.dano + 5 + nivel, 0, 100);
    oyeAlgo(s, rng);
  } else {
    s.callo += 1;
    s.oido = clamp(s.oido - 3, 0, 100);
    s.log = [...s.log, { who: 'nota', text: 'Te lo callas. Te sale solo un suspiro.' }];
  }
  s.peak = Math.max(s.peak, s.oido);
  refrescar(s, rng);
  llevarA(s, prev.pregunta ? 'pregunta' : 'reaccion');
  return s;
}

/** Al final: cuelgas tú o lo dejas colgar a él. */
export function colgar(prev: Call2, quien: 'ella' | 'el', rng: Rng = Math.random): Call2 {
  if (prev.fase !== 'cuelga') return prev;
  const s: Call2 = { ...prev, colgo: quien };
  const roto = animoDe(s.sosp, s.dano) === 'herido' || s.dano >= 60;
  const animo = roto ? 'roto' : 'tranquilo';
  const text = pickText(poolLlamada().despedida[`${quien}-${animo}`], FIJAS_TEXTO.despedida[`${quien}-${animo}`], rng);
  s.log = [...s.log, { who: quien === 'el' ? 'el' : 'ella', text }];
  if (quien === 'ella') {
    // Cortar tú deja a él con la última palabra sin decir: pesa un poco más.
    s.dano = clamp(s.dano + 4, 0, 100);
  } else {
    s.sosp = clamp(s.sosp + 3, 0, 100);
  }
  llevarA(s, 'fin');
  return s;
}

/* ---------- el tiempo ---------- */

/** Avanza `dt` segundos. La excitación sube con el ritmo, con el daño y con tus pensamientos. */
export function tick2(prev: Call2, dt: number, rng: Rng = Math.random): Call2 {
  if (prev.fase === 'fin' || prev.fase === 'comenta') return prev;
  const s: Call2 = { ...prev };
  const d = Math.min(dt, 0.2);
  s.t += d;
  s.faseT += d;

  if (s.fase === 'pregunta' || s.fase === 'reaccion') {
    const bonus = (s.dano / 100) * 0.09 + (s.pobre && s.dano >= 35 ? 0.03 : 0);
    s.excit = Math.min(8, s.excit + (EXCIT_RATE[s.ritmo] + bonus) * s.escala * d);
    // Pasados los 10 minutos de la llamada larga, el final llega solo.
    if (s.limite > 0 && s.t >= s.limite) s.excit = 8;
    s.maxExcit = Math.max(s.maxExcit, s.excit);
    // Si el otro va rápido, tu voz se te escapa un poco, aunque no digas nada.
    if (s.ritmo === 'rapido') s.oido = clamp(s.oido + 0.5 * Math.max(0.35, s.escala) * d, 0, 100);
    else s.oido = clamp(s.oido - 0.4 * d, 0, 100);
    s.peak = Math.max(s.peak, s.oido);
  }

  // ¿Subiste de nivel? Te sale la frase.
  const nivel = nivelDe(s);
  if (s.fase !== 'cuelga' && s.fase !== 'quefue' && nivel > s.nivelPedido) {
    s.nivelPedido = nivel;
    if (nivel >= 2) {
      const L = poolLlamada();
      const lista = L.comentarios[String(nivel)];
      const banda = nivel <= 4 ? 'bajo' : nivel <= 7 ? 'medio' : 'final';
      const texto = pickText([...(lista ?? []), ...lineasDe(`comentario-${banda}`)], [FIJAS_TEXTO.comentario[nivel - 1] ?? FIJAS_TEXTO.comentario[0]], rng);
      s.prompt = { nivel, texto };
      llevarA(s, 'comenta');
      return s;
    }
  }

  if (s.fase === 'reaccion' && s.faseT >= (s.escala < 1 ? REACT_SECS * 2.5 : REACT_SECS)) {
    if (s.sosp >= 100) {
      s.log = [...s.log, { who: 'el', text: 'No puedo más con esto. Voy a colgar.' }];
      s.colgo = 'el';
      llevarA(s, 'fin');
      return s;
    }
    const q = s.preguntas >= s.maxPreg ? null : siguientePregunta(s, rng);
    if (!q) {
      llevarA(s, 'cuelga');
      return s;
    }
    s.pregunta = q;
    s.usadas = [...s.usadas, q.id];
    s.preguntas += 1;
    s.log = [...s.log, { who: 'el', text: q.texto }];
    llevarA(s, 'pregunta');
  }
  return s;
}

/* ---------- resultado ---------- */

export function resultado(s: Call2): CallResult {
  const score = Math.max(s.oido, s.peak * 0.8, s.sosp * 0.9);
  const veredicto: CallVerdict = s.sosp >= 100 || score >= 60 ? 'sabe' : score >= 25 ? 'dudas' : 'limpio';
  return {
    intent: s.dano >= 25 ? 'herir' : 'ocultar',
    hurt: Math.round(s.dano),
    verdict: veredicto,
    exposure: Math.round(s.oido),
    peak: Math.round(s.peak),
    heard: s.heard,
    cuts: 0,
    missed: 0,
    hangup: s.colgo === 'el' && s.sosp >= 70,
    seconds: Math.round(s.t),
    excit: Math.round(s.maxExcit * 10) / 10,
    dijo: s.dijo,
    calló: s.callo,
    climax: s.climax,
    colgo: s.colgo ?? undefined,
    sosp: Math.round(s.sosp),
  };
}
