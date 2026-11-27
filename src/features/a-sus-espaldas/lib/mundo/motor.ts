import { ETAPA_DESDE, ENCUENTRO, ETAPAS, LUGARES_BASE, NOMBRES_EL, ROL_LABEL, SEDUCE, T, circuloDe, DESCONOCIDOS, lugaresDeCasa, rutinaEl, TU_GENTE } from './datos';
import type { Lugar, Persona, Tramo } from './datos';
import { lineasDe } from '../palabras';

/**
 * Motor del mundo: reloj real, rutina de él, su quiebre, tu satisfacción en secreto y lo que él sospecha.
 * Todo son funciones puras sobre `Estado`; la pantalla solo las llama.
 */

export const MIN_POR_SEG = 1; // 1 segundo real = 1 minuto del juego

export interface Opcion {
  id: string;
  texto: string;
}

export interface Aviso {
  tipo: 'mensaje' | 'busca' | 'sorpresa' | 'descubierto' | 'nota';
  texto: string;
  opciones: Opcion[];
}

export interface Paso {
  texto: string;
  pose: string;
  gesto: string;
  mojada: boolean;
}

export interface EscenaEnCurso {
  con: string;
  lugar: string;
  cerca: boolean;
  paso: number;
  pasos: Paso[];
}

export interface Estado {
  v: 1;
  ciclo: number;
  nombre: string;
  dia: number;
  reloj: number;
  ultimo: number;
  lugar: string;
  quiebre: number;
  sospecha: number;
  tierno: number;
  sat: number;
  satCiclo: number;
  interes: Record<string, number>;
  veces: Record<string, number>;
  dicho: string[];
  sabe: string[];
  rastros: { sabanas: boolean; ropa: boolean; olor: number; escondido: boolean; despeinada?: boolean };
  /** a quién ya le llamó la atención su aspecto (se limpia al bañarte) */
  notaron?: string[];
  pendiente: string | null;
  escena: EscenaEnCurso | null;
  aviso: Aviso | null;
  ultima: string;
  log: string[];
  /** horas del juego en que un testigo le contará a él lo que vio */
  chismes: number[];
  /** veces que él notó cercanía rara */
  notas: number;
}

export function fresco(): Estado {
  return {
    v: 1,
    ciclo: 0,
    nombre: NOMBRES_EL[0],
    dia: 1,
    reloj: 8 * 60,
    ultimo: Date.now(),
    lugar: 'casa-habitacion',
    quiebre: 0,
    sospecha: 0,
    tierno: 0,
    sat: 0,
    satCiclo: 0,
    interes: {},
    veces: {},
    dicho: [],
    sabe: [],
    rastros: { sabanas: false, ropa: false, olor: 0, escondido: false, despeinada: false },
    notaron: [],
    pendiente: null,
    escena: null,
    aviso: null,
    ultima: 'Es una mañana tranquila. Él anda por la casa.',
    log: [],
    chismes: [],
    notas: 0,
  };
}

export function revivir(raw: unknown): Estado | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Estado>;
  if (o.v !== 1 || typeof o.reloj !== 'number' || typeof o.lugar !== 'string') return null;
  return { ...fresco(), ...o, ultimo: Date.now() } as Estado;
}

/* ---------- consultas ---------- */

export const personas = (ciclo: number): Persona[] => [...circuloDe(ciclo), ...TU_GENTE, ...DESCONOCIDOS];

export function lugares(ciclo: number): Lugar[] {
  const casas = personas(ciclo)
    .filter((p) => p.casa)
    .flatMap((p) => lugaresDeCasa(p));
  return [...LUGARES_BASE, ...casas];
}

export const lugarPorId = (ciclo: number, id: string): Lugar => lugares(ciclo).find((l) => l.id === id) ?? LUGARES_BASE[0];

export const etapaDe = (e: Pick<Estado, 'quiebre'>): number => {
  let k = 0;
  ETAPA_DESDE.forEach((d, i) => {
    if (e.quiebre >= d) k = i;
  });
  return k;
};

export const hora = (m: number): string => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

const enTramo = (t: Tramo, reloj: number): boolean => reloj >= t.de && reloj < t.a;

export function fmt(t: string, e: Estado, extra: { p?: Persona } = {}): string {
  const amigo = circuloDe(e.ciclo)[1].nombre;
  return t
    .replaceAll('{n}', e.nombre)
    .replaceAll('{amigo}', amigo)
    .replaceAll('{p}', extra.p?.nombre ?? '')
    .replaceAll('{r}', extra.p ? ROL_LABEL[extra.p.rol] : '');
}

/** Dónde está él ahora y qué hace. */
export function tramoEl(e: Estado): { lugar: string; hace: string } {
  const r = rutinaEl(etapaDe(e), e.dia);
  const t = r.find((x) => enTramo(x, e.reloj));
  return t ? { lugar: t.lugar, hace: fmt(t.hace, e) } : { lugar: 'casa-habitacion', hace: 'anda por la casa' };
}

export function dondeEsta(p: Persona, e: Estado): { lugar: string; hace: string } | null {
  const t = p.rutina.find((x) => enTramo(x, e.reloj));
  return t ? { lugar: t.lugar, hace: fmt(t.hace, e) } : null;
}

export function presentes(e: Estado, lugarId = e.lugar): { p: Persona; hace: string }[] {
  const out: { p: Persona; hace: string }[] = [];
  for (const p of personas(e.ciclo)) {
    const d = dondeEsta(p, e);
    if (d && d.lugar === lugarId) out.push({ p, hace: d.hace });
  }
  return out;
}

export const zonaDe = (e: Estado, lugarId: string): string => lugarPorId(e.ciclo, lugarId).zona;

/** Él está en la misma zona (la misma casa, el mismo gimnasio…). */
export const elCerca = (e: Estado): boolean => zonaDe(e, tramoEl(e).lugar) === zonaDe(e, e.lugar);
export const elAqui = (e: Estado): boolean => tramoEl(e).lugar === e.lugar;

/* ---------- utilidades ---------- */

const azar = <T,>(l: readonly T[]): T => l[Math.floor(Math.random() * l.length)];
const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));
const log = (e: Estado, t: string): string[] => [t, ...e.log].slice(0, 40);

/* ---------- el tiempo ---------- */

function unMinuto(e: Estado): Estado {
  const et = etapaDe(e);
  let s: Estado = { ...e };
  s.reloj += 1;
  if (s.reloj >= 1440) {
    s.reloj = 0;
    s.dia += 1;
    s.log = log(s, `Amanece el día ${s.dia}.`);
  }
  // Lo que él sospecha lo va quebrando solo, despacio.
  if (s.sospecha > 25) s.quiebre = clamp(s.quiebre + (s.sospecha / 100) * 0.02 * (1 + et * 0.15));
  s.sospecha = clamp(s.sospecha - (s.tierno > 0 ? 0.015 : 0.004));
  s.tierno = clamp(s.tierno - 0.01);
  s.rastros = { ...s.rastros, olor: Math.max(0, s.rastros.olor - 0.12) };

  const el = tramoEl(s);
  // Si encuentra tus rastros.
  if (el.lugar === 'casa-habitacion' && s.rastros.sabanas && Math.random() < 0.01) {
    s.sospecha = clamp(s.sospecha + 10);
    s.sabe = [...s.sabe, 'Las sábanas olían raro'];
    s.rastros = { ...s.rastros, sabanas: false };
    s.log = log(s, `${s.nombre} frunció la nariz al acostarse. Las sábanas olían a otro. No dijo nada.`);
  }
  if (el.lugar === 'casa-sotano' && s.rastros.escondido && Math.random() < 0.02) {
    s.sospecha = clamp(s.sospecha + 18);
    s.quiebre = clamp(s.quiebre + 3);
    s.sabe = [...s.sabe, 'Encontró algo escondido en el sótano'];
    s.rastros = { ...s.rastros, escondido: false };
    s.log = log(s, `${s.nombre} encontró algo que escondiste en el sótano. Se quedó mirándolo un buen rato.`);
  }
  if (s.aviso || s.escena) return s;
  // Eventos
  const lejos = !elCerca(s);
  if (lejos && Math.random() < 0.004 * (1 + et)) {
    s.aviso = { tipo: 'mensaje', texto: `${s.nombre}: «${azar(T.mensaje)}»`, opciones: [{ id: 'dulce', texto: 'Contestarle con cariño' }, { id: 'mentir', texto: 'Mentirle: «en casa de una amiga»' }, { id: 'ignorar', texto: 'Dejarlo en visto' }] };
  } else if (!elAqui(s) && et >= 1 && Math.random() < 0.003 * (et + 1)) {
    s.aviso = { tipo: 'busca', texto: `${s.nombre} te estaba buscando y viene hacia donde estás.`, opciones: [{ id: 'recibir', texto: 'Recibirlo con ternura' }, { id: 'ocupada', texto: 'Decirle que estás ocupada' }] };
  } else if (Math.random() < 0.0012) {
    s.aviso = { tipo: 'sorpresa', texto: fmt(azar(T.sorpresa), s), opciones: [{ id: 'agradecer', texto: 'Agradecerle con un beso' }, { id: 'fingir', texto: 'Fingir emoción (por dentro: «pobrecito»)' }] };
  } else if (Math.random() < 0.0015) {
    const p = fmt(azar(T.problemas), s);
    s.log = log(s, p);
    if (et >= 2) s.quiebre = clamp(s.quiebre + 0.8);
  }
  return s;
}

/** Avanza `min` minutos de juego. */
export function avanzar(e: Estado, min: number): Estado {
  let s = e;
  for (let i = 0; i < Math.max(0, Math.floor(min)); i++) s = unMinuto(s);
  return s;
}

/** Latido: pasa el tiempo real. Si estás en una escena o tienes un aviso, el reloj espera. */
export function tick(e: Estado, ahora = Date.now()): Estado {
  if (e.escena) return { ...e, ultimo: ahora };
  const seg = (ahora - e.ultimo) / 1000;
  const min = Math.min(120, Math.floor(seg * MIN_POR_SEG));
  if (min < 1) return e;
  const s = avanzar({ ...e, ultimo: e.ultimo + (min / MIN_POR_SEG) * 1000 }, min);
  return { ...s, ultimo: e.ultimo + (min / MIN_POR_SEG) * 1000 };
}

/* ---------- moverte ---------- */

export function ir(e: Estado, lugarId: string): Estado {
  if (e.escena || lugarId === e.lugar) return e;
  const a = zonaDe(e, e.lugar);
  const b = zonaDe(e, lugarId);
  const cuesta = a === b ? 4 : b === 'coche' || a === 'coche' ? 6 : 22;
  const nombre = lugarPorId(e.ciclo, lugarId).nombre;
  let s = avanzar({ ...e, lugar: lugarId }, cuesta);
  s = { ...s, lugar: lugarId, ultima: `Llegas a ${nombre.toLowerCase()}.`, log: log(s, `Fuiste a ${nombre.toLowerCase()}.`) };
  return s;
}

/* ---------- seducir ---------- */

type Acc = 'conversar' | 'indirecta' | 'mostrarte';
const GANA: Record<Acc, number> = { conversar: 9, indirecta: 13, mostrarte: 17 };
const BONO_RASGO: Record<Persona['rasgo'], Record<Acc, number>> = {
  timido: { conversar: 1.1, indirecta: 1, mostrarte: 1.2 },
  ingenuo: { conversar: 1.3, indirecta: 0.7, mostrarte: 1.2 },
  culpa: { conversar: 0.8, indirecta: 1.1, mostrarte: 1 },
  miedo: { conversar: 0.9, indirecta: 1.2, mostrarte: 0.9 },
};

export function seducir(e: Estado, p: Persona, acc: Acc): Estado {
  if (e.escena) return e;
  const gana = Math.round(GANA[acc] * BONO_RASGO[p.rasgo][acc]);
  const previo = e.interes[p.id] ?? 0;
  const cerca = elCerca(e);
  let texto = fmt(azar(SEDUCE[acc === 'conversar' ? 'conversar' : acc === 'indirecta' ? 'indirecta' : 'mostrarte'][p.rasgo]), e, { p });
  if (acc === 'indirecta') {
    const propios = lineasDe('indirectas');
    if (propios.length && Math.random() < 0.5) texto = `${fmt(azar(propios), e, { p })}`;
  }
  let s: Estado = { ...e, interes: { ...e.interes, [p.id]: clamp(previo + gana, 0, 130) } };
  // Mientras más cerca de él, más satisfacción y más riesgo.
  const gustoSecreto = cerca ? 3 : 1;
  s.sat += gustoSecreto;
  s.satCiclo += gustoSecreto;
  if (cerca && p.aprecio > 0.4) {
    s.sat += 2;
    s.satCiclo += 2;
    texto += ` ${fmt(azar(T.escenaOtro), e, { p })}`;
  }
  if (cerca && Math.random() < 0.12 + (p.aprecio > 0.4 ? 0.05 : 0)) {
    s.sospecha = clamp(s.sospecha + 6);
    texto += ` ${e.nombre} te miró desde lejos. Casi te descubre.`;
    s.sabe = [...s.sabe, `Te vio muy cerca de ${p.nombre}`];
  }
  s = avanzar(s, acc === 'conversar' ? 8 : 6);
  return { ...s, ultima: texto, log: log(s, `${p.nombre}: ${texto}`) };
}

export function chanceDeSi(e: Estado, p: Persona): number {
  const i = e.interes[p.id] ?? 0;
  return clamp(((i - p.umbral + 18) / 36) * 100);
}

const PASOS_RITMO = ['El ritmo sube. Te agarras de lo primero que encuentras.', 'Se te doblan las piernas; sigues, con la respiración cortada.', 'Tienes la piel mojada de sudor. Te aprietas contra él.', 'Todo se vuelve un solo movimiento largo y caliente.'];

export function proponer(e: Estado, p: Persona): Estado {
  if (e.escena) return e;
  const lugar = lugarPorId(e.ciclo, e.lugar);
  const chance = chanceDeSi(e, p);
  const dijoSi = Math.random() * 100 < chance;
  if (!dijoSi) {
    const t = fmt(azar(SEDUCE.no[p.rasgo]), e, { p });
    const s = avanzar({ ...e, interes: { ...e.interes, [p.id]: clamp((e.interes[p.id] ?? 0) - 4) } }, 4);
    return { ...s, ultima: t, log: log(s, `${p.nombre} dijo que no. ${t}`) };
  }
  if (!lugar.privado) {
    const t = `${fmt(azar(SEDUCE.si[p.rasgo]), e, { p })} Pero aquí no: hay que buscar un lugar privado.`;
    return { ...e, pendiente: p.id, ultima: t, log: log(e, t) };
  }
  const cerca = elCerca(e);
  const pasos: Paso[] = [];
  const propiosIni = lineasDe('encuentro-inicio');
  pasos.push({ texto: propiosIni.length && Math.random() < 0.5 ? fmt(azar(propiosIni), e, { p }) : fmt(`${fmt(azar(SEDUCE.si[p.rasgo]), e, { p })} ${azar(ENCUENTRO.inicio)}`, e, { p }), pose: 'deseo', gesto: 'deseoella', mojada: false });
  if (cerca) pasos.push({ texto: fmt(azar(ENCUENTRO.cerca), e, { p }), pose: 'aguanta', gesto: 'aguanta', mojada: false });
  if (p.aprecio > 0.4) pasos.push({ texto: fmt(azar(ENCUENTRO.aprecio), e, { p }), pose: 'cadera', gesto: 'seduccion', mojada: false });
  if (e.tierno > 20) pasos.push({ texto: fmt(azar(ENCUENTRO.tierno), e, { p }), pose: 'timida', gesto: 'ternurafingida', mojada: false });
  pasos.push({ texto: fmt(azar(PASOS_RITMO), e, { p }), pose: 'piernas', gesto: 'esfuerzo', mojada: false });
  pasos.push({ texto: fmt(azar(PASOS_RITMO), e, { p }), pose: 'sentadilla', gesto: 'jadeo', mojada: true });
  pasos.push({ texto: fmt(azar(PASOS_RITMO), e, { p }), pose: 'apoyada', gesto: 'gemido', mojada: true });
  const finPropio = lineasDe('encuentro-fin');
  pasos.push({ texto: finPropio.length && Math.random() < 0.5 ? fmt(azar(finPropio), e, { p }) : fmt(azar(ENCUENTRO.fin), e, { p }), pose: 'arqueada', gesto: 'orgasmo', mojada: true });
  pasos.push({ texto: fmt(azar(T.pobrecito), e, { p }), pose: 'rendida', gesto: 'agotada', mojada: true });
  return { ...e, pendiente: null, escena: { con: p.id, lugar: e.lugar, cerca, paso: 0, pasos }, ultima: 'Cierras la puerta.', log: log(e, `Te acostaste con ${p.nombre}.`) };
}

export function siguientePaso(e: Estado): Estado {
  if (!e.escena) return e;
  if (e.escena.paso < e.escena.pasos.length - 1) return { ...e, escena: { ...e.escena, paso: e.escena.paso + 1 } };
  return terminarEscena(e);
}

/** Lo que ganas y lo que pierde él cuando acaba el encuentro. */
function terminarEscena(e: Estado): Estado {
  const sc = e.escena;
  if (!sc) return e;
  const p = personas(e.ciclo).find((x) => x.id === sc.con);
  if (!p) return { ...e, escena: null };
  const lugar = lugarPorId(e.ciclo, sc.lugar);
  const et = etapaDe(e);
  const primera = (e.veces[p.id] ?? 0) === 0;
  const desglose: string[] = [];
  let sat = 8;
  if (sc.cerca) {
    sat += 10;
    desglose.push('con él cerca +10');
  }
  if (p.aprecio > 0.4) {
    const v = Math.round(p.aprecio * 14);
    sat += v;
    desglose.push(`alguien que él aprecia +${v}`);
  }
  if (e.tierno > 20) {
    sat += 8;
    desglose.push('él estaba tierno contigo +8');
  }
  if (e.sospecha < 20) {
    sat += 6;
    desglose.push('él no sospecha nada +6');
  } else if (e.sospecha < 50) {
    sat += 3;
  }
  if (primera) {
    sat += 5;
    desglose.push('primera vez con esta persona +5');
  }
  let s: Estado = { ...e, escena: null, sat: e.sat + sat, satCiclo: e.satCiclo + sat, veces: { ...e.veces, [p.id]: (e.veces[p.id] ?? 0) + 1 }, interes: { ...e.interes, [p.id]: clamp((e.interes[p.id] ?? 0) - 25, 0, 130) } };
  s.rastros = { ...s.rastros, sabanas: s.rastros.sabanas || lugar.escena === 'cama', ropa: s.rastros.ropa || Math.random() < 0.5, olor: 70, despeinada: true };
  s.notaron = [];
  let nota = `+${sat} de satisfacción (${desglose.join(', ') || 'lo básico'}).`;
  // Fugas: pequeños detalles que él nota sin entender.
  if (Math.random() < 0.28) {
    s.sospecha = clamp(s.sospecha + 4);
    s.sabe = [...s.sabe, 'Llegaste distinta'];
    nota += ` ${s.nombre} notó algo distinto en ti, aunque no sabe qué.`;
  }
  s = avanzar(s, 38);
  // Casi te descubre / te descubre
  if (sc.cerca && Math.random() < 0.3) {
    if (Math.random() < 0.1 * (1 + et * 0.2)) {
      s.quiebre = clamp(s.quiebre + 9);
      s.sospecha = Math.max(s.sospecha, 55);
      s.tierno = 0;
      s.sabe = [...s.sabe, `Te oyó con ${p.nombre}`];
      s.aviso = {
        tipo: 'descubierto',
        texto: `${s.nombre} abrió la puerta. No gritó. Se le quebró la cara y se quedó callado, mirándote. Está triste, muy triste.`,
        opciones: [
          { id: 'negar', texto: 'Negarlo todo' },
          { id: 'malentendido', texto: 'Decir que fue un malentendido' },
          { id: 'perdon', texto: 'Pedirle perdón llorando' },
          { id: 'abrazar', texto: 'Abrazarlo sin decir nada' },
        ],
      };
      nota += ' Y él lo vio.';
    } else {
      s.sospecha = clamp(s.sospecha + 8);
      s.sabe = [...s.sabe, 'Oyó ruidos en la casa'];
      nota += ` ${s.nombre} pasó justo por la puerta. Contuviste la respiración. Casi te descubre.`;
    }
  }
  s.ultima = nota;
  s.log = log(s, nota);
  return s;
}

/* ---------- con él ---------- */

export function ternura(e: Estado): Estado {
  if (e.escena) return e;
  const cerca = elAqui(e);
  if (!cerca) return { ...e, ultima: `${e.nombre} no está aquí. Búscalo.` };
  const t = `${azar(T.tierno)} (${azar(T.pobrecito)})`;
  let s: Estado = { ...e, tierno: clamp(e.tierno + 30), sospecha: clamp(e.sospecha - 9), quiebre: clamp(e.quiebre - 1.2), dicho: [...e.dicho, 'Le dijiste que lo amas'].slice(-12) };
  s = avanzar(s, 12);
  return { ...s, ultima: t, log: log(s, `Fuiste tierna con ${e.nombre}.`) };
}

export function distante(e: Estado): Estado {
  if (!elAqui(e)) return { ...e, ultima: `${e.nombre} no está aquí.` };
  const s = avanzar({ ...e, quiebre: clamp(e.quiebre + 3), sospecha: clamp(e.sospecha + 6), tierno: clamp(e.tierno - 20), dicho: [...e.dicho, 'Le dijiste que estabas cansada'].slice(-12) }, 6);
  return { ...s, ultima: `Le das la espalda. ${e.nombre} se queda mirando el techo, con ganas de preguntar.`, log: log(s, `Fuiste fría con ${e.nombre}.`) };
}

export function dejarPista(e: Estado): Estado {
  const s = avanzar({ ...e, sospecha: clamp(e.sospecha + 12), quiebre: clamp(e.quiebre + 2) }, 4);
  return { ...s, ultima: 'Dejas algo a la vista, como por descuido. Él lo va a encontrar.', log: log(s, 'Dejaste una pista a la vista.') };
}

export type Limpieza = 'sabanas' | 'ropa' | 'banar' | 'esconder';
export function limpiar(e: Estado, que: Limpieza): Estado {
  const r = { ...e.rastros };
  let t = '';
  if (que === 'sabanas') {
    r.sabanas = false;
    t = 'Cambias las sábanas.';
  } else if (que === 'ropa') {
    r.ropa = false;
    t = 'Escondes la ropa que quedó tirada.';
  } else if (que === 'banar') {
    r.olor = 0;
    r.despeinada = false;
    t = 'Te bañas hasta no oler a nadie. Te peinas frente al espejo: ya no se nota nada.';
  } else {
    r.escondido = true;
    r.sabanas = false;
    r.ropa = false;
    t = 'Guardas todo en una caja del sótano. Quizá no deberías.';
  }
  const s = avanzar({ ...e, rastros: r, notaron: que === 'banar' ? [] : e.notaron }, que === 'banar' ? 18 : 10);
  return { ...s, ultima: t, log: log(s, t) };
}

/** Frases de quien la ve despeinada, según quién sea. */
const NOTAN_EL = ['¿Y ese pelo?', 'Estás toda despeinada… ¿dónde andabas?', 'Tienes el pelo revuelto, amor.'];
const NOTAN_OTRO = ['Uy, vienes bien despeinada.', 'Ese pelo cuenta una historia, ¿eh?', 'Te falta un peine… y una explicación.'];

/**
 * Ella pasa junto a alguien con el pelo revuelto: él lo nota y se queda pensando; los demás
 * lo comentan y a veces se lo cuentan a él. Cada persona lo nota una sola vez hasta que te bañes.
 */
export function percibir(e: Estado, id: string, p?: Persona): { estado: Estado; frase: string } | null {
  if (!e.rastros.despeinada || e.escena) return null;
  const ya = e.notaron ?? [];
  if (ya.includes(id)) return null;
  const notaron = [...ya, id];
  if (id === 'el') {
    const frase = azar(NOTAN_EL);
    const s: Estado = {
      ...e,
      notaron,
      sospecha: clamp(e.sospecha + 7),
      sabe: [...e.sabe, 'Llegaste despeinada'].slice(-12),
      log: log(e, `${e.nombre} te mira el pelo revuelto. «${frase}»`),
    };
    return { estado: s, frase };
  }
  const frase = azar(NOTAN_OTRO);
  const s: Estado = { ...e, notaron, log: log(e, `${p?.nombre ?? 'Alguien'} te vio despeinada.`) };
  if (Math.random() < 0.3) s.chismes = [...(e.chismes ?? []), e.reloj + 120 + Math.floor(Math.random() * 240)];
  return { estado: s, frase };
}

/* ---------- avisos ---------- */

export function responder(e: Estado, id: string): Estado {
  const a = e.aviso;
  if (!a) return e;
  let s: Estado = { ...e, aviso: null };
  let t = '';
  switch (`${a.tipo}:${id}`) {
    case 'mensaje:dulce':
      s.tierno = clamp(s.tierno + 8);
      s.sospecha = clamp(s.sospecha - 3);
      t = 'Le escribes algo dulce. Cree cada palabra.';
      break;
    case 'mensaje:mentir':
      s.sospecha = clamp(s.sospecha + 4);
      s.sat += 3;
      s.satCiclo += 3;
      s.dicho = [...s.dicho, 'Le dijiste que estabas en casa de una amiga'].slice(-12);
      t = 'Le mientes sin pestañear. Te pica un poco el estómago, y te gusta.';
      break;
    case 'mensaje:ignorar':
      s.quiebre = clamp(s.quiebre + 1.5);
      s.sospecha = clamp(s.sospecha + 3);
      t = `${s.nombre} mira su celular. Vio que lo leíste.`;
      break;
    case 'busca:recibir':
      s.tierno = clamp(s.tierno + 15);
      s.sospecha = clamp(s.sospecha - 4);
      t = `${s.nombre} te abraza fuerte. Pobrecito, se le nota el miedo en las manos.`;
      break;
    case 'busca:ocupada':
      s.quiebre = clamp(s.quiebre + 2);
      s.sospecha = clamp(s.sospecha + 5);
      t = `${s.nombre} asiente, forzando una sonrisa, y se va despacio.`;
      break;
    case 'sorpresa:agradecer':
      s.tierno = clamp(s.tierno + 20);
      s.sat += 4;
      s.satCiclo += 4;
      t = `${s.nombre} sonríe como niño. Qué fácil es.`;
      break;
    case 'sorpresa:fingir':
      s.sat += 6;
      s.satCiclo += 6;
      s.sospecha = clamp(s.sospecha + 2);
      t = 'Finges la emoción. Por dentro: «pobrecito».';
      break;
    case 'descubierto:negar':
      if (Math.random() < 0.5) {
        s.sospecha = clamp(s.sospecha - 20);
        t = `«Estás imaginando cosas.» ${s.nombre} baja la cabeza. Quiere creerte y te cree, a medias.`;
      } else {
        s.quiebre = clamp(s.quiebre + 6);
        s.sospecha = clamp(s.sospecha + 10);
        t = `${s.nombre} no te cree y no dice nada. Eso es peor.`;
      }
      s.dicho = [...s.dicho, 'Le dijiste que lo imaginó'].slice(-12);
      break;
    case 'descubierto:malentendido':
      s.sospecha = clamp(s.sospecha - 10);
      s.quiebre = clamp(s.quiebre + 3);
      s.dicho = [...s.dicho, 'Le dijiste que fue un malentendido'].slice(-12);
      t = `«Fue un malentendido.» ${s.nombre} se frota la cara con las dos manos y dice que sí.`;
      break;
    case 'descubierto:perdon':
      s.quiebre = clamp(s.quiebre + 4);
      s.tierno = clamp(s.tierno + 25);
      s.sospecha = clamp(s.sospecha - 12);
      s.dicho = [...s.dicho, 'Le pediste perdón llorando'].slice(-12);
      t = `Lloras tú. ${s.nombre} te consuela a ti. Se le olvida que él es la víctima.`;
      break;
    default:
      s.tierno = clamp(s.tierno + 18);
      s.sospecha = clamp(s.sospecha - 8);
      s.dicho = [...s.dicho, 'Lo abrazaste sin decir nada'].slice(-12);
      t = `Lo abrazas en silencio. ${s.nombre} llora contra tu hombro, y no pregunta nada más.`;
  }
  s = avanzar(s, 6);
  return { ...s, ultima: t, log: log(s, t) };
}

/* ---------- ciclos ---------- */

export const puedeCambiar = (e: Estado): boolean => e.quiebre >= 70;

export function nuevoCiclo(e: Estado): Estado {
  const ciclo = e.ciclo + 1;
  const f = fresco();
  return {
    ...f,
    ciclo,
    nombre: NOMBRES_EL[ciclo % NOMBRES_EL.length],
    dia: e.dia,
    reloj: e.reloj,
    sat: e.sat,
    veces: e.veces,
    lugar: 'casa-habitacion',
    ultima: `Un nuevo ciclo: ahora es ${NOMBRES_EL[ciclo % NOMBRES_EL.length]}, y cree que eres la mujer de su vida.`,
    log: log(e, `Ciclo ${ciclo + 1}: ${NOMBRES_EL[ciclo % NOMBRES_EL.length]}.`),
  };
}

/* ---------- su vida se deteriora ---------- */

export function vidaDeEl(e: Estado): { duerme: string; come: string; gente: string; trabajo: string } {
  const et = etapaDe(e);
  return {
    duerme: ['duerme bien', 'duerme algo inquieto', 'duerme 5 horas', 'casi no duerme', 'llora antes de dormir', 'no duerme'][et],
    come: ['come normal', 'come normal', 'come menos', 'come de pie, sin ganas', 'olvida comer', 'ya no come'][et],
    gente: ['sale con sus amigos', 'sale con sus amigos', 'sale menos', 'evita a su gente', 'evita a todos', 'se encierra'][et],
    trabajo: ['rinde bien', 'rinde bien', 'se distrae', 'discute en la oficina', 'sale temprano', 'faltó al trabajo'][et],
  };
}

export const ETAPA_NOMBRE = (e: Estado): string => ETAPAS[etapaDe(e)];

/** 0..1: cuánto se ha llenado cada etapa. */
export function barrasDeEtapa(e: Estado): number[] {
  return ETAPA_DESDE.map((d, i) => {
    const sig = ETAPA_DESDE[i + 1] ?? 100;
    return clamp(((e.quiebre - d) / (sig - d)) * 100) / 100;
  });
}

/* ---------- sensor: lo que se ve cuando haces algo cerca de otros ---------- */

/** Efecto de un gesto de cercanía a la vista de alguien. `testigos`: otras personas presentes; `el`: él está aquí. */
export function cercaniaVista(e: Estado, nivel: 1 | 2, testigos: number, el: boolean): Estado {
  const s: Estado = { ...e, chismes: [...(e.chismes ?? [])] };
  if (testigos > 0) s.chismes.push(s.reloj + 120 + Math.floor(Math.random() * 240));
  if (el) {
    s.sospecha = Math.min(100, s.sospecha + (nivel === 2 ? 14 : 7));
    s.notas = (s.notas ?? 0) + 1;
  }
  return s;
}

/** Los chismes que ya maduraron: el testigo le cuenta a él. */
export function correrChismes(e: Estado): Estado {
  const lista = e.chismes ?? [];
  if (!lista.some((h) => e.reloj >= h)) return e;
  const quedan = lista.filter((h) => e.reloj < h);
  const t = `Alguien le contó a ${e.nombre} que te vio demasiado cerca de otra persona. Él lo guarda y no dice nada.`;
  return { ...e, chismes: quedan, sospecha: Math.min(100, e.sospecha + 10), sabe: [...e.sabe, 'Alguien le contó lo que vio'].slice(-12), ultima: t, log: log(e, t) };
}

/** Él lo nota si ya pasó varias veces. */
export function notaDeEl(e: Estado): boolean {
  return (e.notas ?? 0) >= 3;
}

/** Sacarla de apuros: respuesta rápida cuando él llega en mitad de un gesto. */
export function apuro(e: Estado, id: 'disimular' | 'apartarme' | 'tema' | 'nada'): Estado {
  let t = '';
  const s = { ...e };
  switch (id) {
    case 'disimular':
      s.sospecha = Math.max(0, s.sospecha - 4);
      t = 'Te acomodas el pelo como si nada. Él duda un segundo y lo deja pasar.';
      break;
    case 'apartarme':
      s.sospecha = Math.max(0, s.sospecha - 8);
      t = 'Das un paso atrás justo a tiempo. Él casi no lo vio.';
      break;
    case 'tema':
      s.sospecha = Math.max(0, s.sospecha - 6);
      t = 'Cambias de tema con una sonrisa. Él te sigue la corriente.';
      break;
    default:
      s.sospecha = Math.min(100, s.sospecha + 14);
      s.quiebre = Math.min(100, s.quiebre + 2);
      t = `${s.nombre} los vio. Se queda quieto, con la cara pálida.`;
  }
  return { ...s, ultima: t, log: log(s, t) };
}
