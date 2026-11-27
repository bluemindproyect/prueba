export type Modo = 'mamada' | 'perrito';
export type Fase = 'activo' | 'corrida';

export interface Estado {
  modo: Modo;
  carga: number;
  meta: number;
  chorros: number;
  orgasmos: number;
  fase: Fase;
  desdeCorrida: number;
  tiempo: number;
}

export interface ResultadoM {
  modo: Modo;
  orgasmos: number;
  chorros: number;
  segundos: number;
}

const META_BASE = 100;
const META_PASO = 22;
const META_TOPE = 300;
const SUBIDA = 36;
const SUBIDA_PASO = 3.4;
const CAIDA = 30;
const CAIDA_PASO = 2.6;
const PISO = 0.3;
const CORRIDA_MIN = 0.9;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function startMamada(modo: Modo = 'mamada'): Estado {
  return {
    modo,
    carga: 0,
    meta: META_BASE,
    chorros: 0,
    orgasmos: 0,
    fase: 'activo',
    desdeCorrida: 0,
    tiempo: 0,
  };
}

export function metaDe(orgasmos: number): number {
  return Math.min(META_TOPE, META_BASE + orgasmos * META_PASO);
}

export function nivelDe(s: Estado): number {
  return clamp((s.carga / s.meta) * 100, 0, 100);
}

export function cambiarModo(s: Estado, modo: Modo): Estado {
  if (s.modo === modo) return s;
  return { ...s, modo, carga: s.meta * 0.18, fase: 'activo' };
}

export function tickMamada(s: Estado, aprieta: boolean, dt: number): Estado {
  const tiempo = s.tiempo + dt;

  if (s.fase === 'corrida') {
    const carga = Math.max(0, s.carga - s.meta * 1.3 * dt);
    const chorros = s.chorros + (2.6 + s.orgasmos * 1.6) * dt;
    const listo = carga <= 0 && tiempo - s.desdeCorrida >= CORRIDA_MIN;
    if (listo) {
      const meta = metaDe(s.orgasmos);
      return { ...s, carga: meta * PISO, meta, fase: 'activo', chorros, tiempo };
    }
    return { ...s, carga, chorros, tiempo };
  }

  const vel = s.modo === 'perrito' ? 1.12 : 1;
  const subida = (SUBIDA + s.orgasmos * SUBIDA_PASO) * vel;
  const caida = (CAIDA + s.orgasmos * CAIDA_PASO) * vel;
  const carga = clamp(s.carga + (aprieta ? subida : -caida) * dt, 0, s.meta);

  if (carga >= s.meta) {
    return {
      ...s,
      carga: s.meta,
      fase: 'corrida',
      orgasmos: s.orgasmos + 1,
      desdeCorrida: tiempo,
      tiempo,
    };
  }

  return { ...s, carga, tiempo };
}

export function zoomDe(s: Estado): number {
  const n = nivelDe(s) / 100;
  return s.fase === 'corrida' ? 0.2 + n * 0.06 : n * 0.16;
}

export function resultadoM(s: Estado): ResultadoM {
  return {
    modo: s.modo,
    orgasmos: s.orgas