import type { Gesto } from './gestos';

/**
 * Ella en 3D, sin librerías: geometría propia (elipsoides y cápsulas) y WebGL directo.
 * Unidades en cm, y hacia arriba, x a la derecha de ella, z hacia el frente.
 */

export type V3 = [number, number, number];
export type M4 = number[]; // columna-mayor

export interface Malla {
  color: [number, number, number];
  spec: number;
  alpha: number;
  pos: number[];
  nrm: number[];
  idx: number[];
}

export interface PoseDatos {
  di: number;
  fi: number;
  dd: number;
  fd: number;
  inc: number;
  cab: number;
  sep?: number;
  rod?: number;
  baja?: number;
}

export type Atuendo = 'bikini' | 'short' | 'vestido';

export interface OpcionesChica {
  gesto: Gesto;
  pose: PoseDatos;
  atuendo: Atuendo;
  mojada: boolean;
}

export const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
export const mezcla = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------- matrices ----------
export const ident = (): M4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
export function mul(a: M4, b: M4): M4 {
  const o = new Array<number>(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
export const trans = (x: number, y: number, z: number): M4 => {
  const m = ident();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
};
export const rotZ = (deg: number): M4 => {
  const a = (deg * Math.PI) / 180;
  const m = ident();
  m[0] = Math.cos(a);
  m[1] = Math.sin(a);
  m[4] = -Math.sin(a);
  m[5] = Math.cos(a);
  return m;
};
export const rotY = (deg: number): M4 => {
  const a = (deg * Math.PI) / 180;
  const m = ident();
  m[0] = Math.cos(a);
  m[2] = -Math.sin(a);
  m[8] = Math.sin(a);
  m[10] = Math.cos(a);
  return m;
};
export const rotX = (deg: number): M4 => {
  const a = (deg * Math.PI) / 180;
  const m = ident();
  m[5] = Math.cos(a);
  m[6] = Math.sin(a);
  m[9] = -Math.sin(a);
  m[10] = Math.cos(a);
  return m;
};
export const pt = (m: M4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
export const dir = (m: M4, p: V3): V3 => [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]];
export const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

export function perspectiva(fov: number, asp: number, n: number, f: number): M4 {
  const t = 1 / Math.tan(fov / 2);
  return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0];
}

// ---------- acumuladores de geometría ----------
export class Acc {
  m: Malla;
  constructor(color: [number, number, number], spec = 0.1, alpha = 1) {
    this.m = { color, spec, alpha, pos: [], nrm: [], idx: [] };
  }
  base(): number {
    return this.m.pos.length / 3;
  }
}

const SEG = 18;
const RING = 12;

/** Elipsoide (lat0..lat1 en radianes) con marco `f`. */
export function elipsoide(a: Acc, f: M4, c: V3, r: V3, lat0 = -Math.PI / 2, lat1 = Math.PI / 2, seg = SEG, ring = RING): void {
  const b = a.base();
  for (let i = 0; i <= ring; i++) {
    const la = lat0 + ((lat1 - lat0) * i) / ring;
    for (let j = 0; j <= seg; j++) {
      const lo = (j / seg) * Math.PI * 2;
      const u: V3 = [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
      const p = pt(f, [c[0] + u[0] * r[0], c[1] + u[1] * r[1], c[2] + u[2] * r[2]]);
      const n = norm(dir(f, [u[0] / r[0], u[1] / r[1], u[2] / r[2]]));
      a.m.pos.push(...p);
      a.m.nrm.push(...n);
    }
  }
  for (let i = 0; i < ring; i++)
    for (let j = 0; j < seg; j++) {
      const k = b + i * (seg + 1) + j;
      a.m.idx.push(k, k + seg + 1, k + 1, k + 1, k + seg + 1, k + seg + 2);
    }
}

/** Cápsula cónica entre p0 y p1 (coordenadas ya en mundo). */
export function extremidad(a: Acc, p0: V3, p1: V3, r0: number, r1: number, seg = 14): void {
  const d: V3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const L = Math.hypot(...d) || 0.001;
  const y = norm(d);
  const ayuda: V3 = Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const x = norm(cross(ayuda, y));
  const z = cross(y, x);
  const anillos: { y: number; r: number; ny: number; nr: number }[] = [];
  const cap = 5;
  for (let i = 0; i <= cap; i++) {
    const ang = -Math.PI / 2 + (i / cap) * (Math.PI / 2);
    anillos.push({ y: r0 * Math.sin(ang), r: r0 * Math.cos(ang), ny: Math.sin(ang), nr: Math.cos(ang) });
  }
  for (let i = 0; i <= cap; i++) {
    const ang = (i / cap) * (Math.PI / 2);
    anillos.push({ y: L + r1 * Math.sin(ang), r: r1 * Math.cos(ang), ny: Math.sin(ang), nr: Math.cos(ang) });
  }
  const b = a.base();
  for (const an of anillos)
    for (let j = 0; j <= seg; j++) {
      const lo = (j / seg) * Math.PI * 2;
      const cx = Math.cos(lo);
      const sz = Math.sin(lo);
      const lp: V3 = [an.r * cx, an.y, an.r * sz];
      const ln: V3 = [an.nr * cx, an.ny, an.nr * sz];
      a.m.pos.push(p0[0] + x[0] * lp[0] + y[0] * lp[1] + z[0] * lp[2], p0[1] + x[1] * lp[0] + y[1] * lp[1] + z[1] * lp[2], p0[2] + x[2] * lp[0] + y[2] * lp[1] + z[2] * lp[2]);
      a.m.nrm.push(x[0] * ln[0] + y[0] * ln[1] + z[0] * ln[2], x[1] * ln[0] + y[1] * ln[1] + z[1] * ln[2], x[2] * ln[0] + y[2] * ln[1] + z[2] * ln[2]);
    }
  for (let i = 0; i < anillos.length - 1; i++)
    for (let j = 0; j < seg; j++) {
      const k = b + i * (seg + 1) + j;
      a.m.idx.push(k, k + seg + 1, k + 1, k + 1, k + seg + 1, k + seg + 2);
    }
}

/** Loft de secciones elípticas (y, rx, rz) con interpolación suave y normales promediadas. */
export function loft(a: Acc, f: M4, est: [number, number, number][], seg = 24, sub = 4): void {
  const cr = (p0: number, p1: number, p2: number, p3: number, t: number): number => 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  const E = [est[0], ...est, est[est.length - 1]];
  const filas: [number, number, number][] = [];
  for (let i = 1; i < E.length - 2; i++)
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      filas.push([cr(E[i - 1][0], E[i][0], E[i + 1][0], E[i + 2][0], t), cr(E[i - 1][1], E[i][1], E[i + 1][1], E[i + 2][1], t), cr(E[i - 1][2], E[i][2], E[i + 1][2], E[i + 2][2], t)]);
    }
  filas.push(est[est.length - 1]);
  const b = a.base();
  for (const [y, rx, rz] of filas)
    for (let j = 0; j <= seg; j++) {
      const lo = (j / seg) * Math.PI * 2;
      a.m.pos.push(...pt(f, [rx * Math.cos(lo), y, rz * Math.sin(lo)]));
      a.m.nrm.push(0, 0, 0);
    }
  for (let i = 0; i < filas.length - 1; i++)
    for (let j = 0; j < seg; j++) {
      const k = b + i * (seg + 1) + j;
      a.m.idx.push(k, k + seg + 1, k + 1, k + 1, k + seg + 1, k + seg + 2);
    }
  const P = a.m.pos;
  const N = a.m.nrm;
  for (let t = a.m.idx.length - 6 * (filas.length - 1) * seg; t < a.m.idx.length; t += 3) {
    const [i0, i1, i2] = [a.m.idx[t], a.m.idx[t + 1], a.m.idx[t + 2]];
    const u: V3 = [P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]];
    const v: V3 = [P[i2 * 3] - P[i0 * 3], P[i2 * 3 + 1] - P[i0 * 3 + 1], P[i2 * 3 + 2] - P[i0 * 3 + 2]];
    const n = cross(u, v);
    for (const i of [i0, i1, i2]) {
      N[i * 3] += n[0];
      N[i * 3 + 1] += n[1];
      N[i * 3 + 2] += n[2];
    }
  }
  for (let i = b; i < a.base(); i++) {
    // orientación hacia afuera (la malla se puede dibujar de ambos lados)
    const n = norm([N[i * 3], N[i * 3 + 1], N[i * 3 + 2]]);
    const cx = P[i * 3] - f[12];
    const cz = P[i * 3 + 2] - f[14];
    const s = n[0] * cx + n[2] * cz < 0 ? -1 : 1;
    N[i * 3] = n[0] * s;
    N[i * 3 + 1] = n[1] * s;
    N[i * 3 + 2] = n[2] * s;
  }
}

export const bez = (p0: [number, number], c: [number, number], p1: [number, number], t: number): [number, number] => [(1 - t) ** 2 * p0[0] + 2 * t * (1 - t) * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * t * (1 - t) * c[1] + t * t * p1[1]];

// ---------- construcción ----------
export const PIEL = hex('#f4cfb0');
export const PIEL_SOMBRA = hex('#e6b794');
export const PELO = hex('#2b1d22');
const PELO_MOJ = hex('#1b1220');


const CRX = 8.2;
const CRY = 9;
const CRZ = 8.4;
export const zsCara = (x: number, y: number): number => CRZ * Math.sqrt(Math.max(0.02, 1 - (x / CRX) ** 2 - (y / CRY) ** 2));

type Fabrica = (nombre: string, color: [number, number, number], spec?: number, alpha?: number) => Acc;

/** Cara a partir de un gesto, en el marco de la cabeza `Fc` (centro de la cabeza en el origen). */
export function dibujarCara(A: Fabrica, Fc: M4, g: Gesto, mojada: boolean): void {
  const has = (e: string) => g.extras.includes(e as Gesto['extras'][number]);
  const zs = zsCara;
  const ojoY = 1.2 + (g.my ?? 0) * -0.2;
  const tinta = A('tinta', hex('#3a2418'), 0.35);
  const blanco = A('brillo', [1, 1, 1], 0, 1);
  const cejaC = A('ceja', mezcla(PELO, PIEL, 0.15), 0.1);
  const boca = A('boca', hex('#b8605a'), 0.3);
  for (const s of [-1, 1]) {
    const cx = s * 3.7 + g.mx * 0.4;
    if (g.forma === 1 || g.forma === 2 || g.abre < 0.15) {
      const comba = g.forma === 1 ? 1 : -0.6;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        const [px, py] = bez([cx - 1.5, ojoY], [cx, ojoY + comba * 1.6], [cx + 1.5, ojoY], t);
        elipsoide(tinta, Fc, [px, py, zs(px, py) + 0.15], [0.42, 0.42, 0.42], -Math.PI / 2, Math.PI / 2, 6, 4);
      }
    } else {
      const ry = Math.max(1.05, Math.min(1.7, g.abre * 1.5));
      const rx = Math.min(1.5, ry + 0.25);
      const ox = cx + g.mx * 0.3;
      const oy = ojoY + g.my * 0.3 - (g.forma === 3 ? 0.2 : 0);
      elipsoide(tinta, Fc, [ox, oy, zs(ox, oy) - 0.25], [rx, ry, 0.9], -Math.PI / 2, Math.PI / 2, 14, 8);
      elipsoide(blanco, Fc, [ox + 0.5, oy + ry * 0.35, zs(ox, oy) + 0.5], [0.34, 0.34, 0.2], -Math.PI / 2, Math.PI / 2, 6, 4);
      if (g.forma === 3) {
        for (let i = 0; i <= 6; i++) {
          const t = i / 6;
          const [px, py] = bez([ox - rx, oy + ry * 0.25], [ox, oy + ry * 1.05], [ox + rx, oy + ry * 0.25], t);
          elipsoide(cejaC, Fc, [px, py, zs(px, py) + 0.15], [0.3, 0.3, 0.3], -Math.PI / 2, Math.PI / 2, 6, 4);
        }
      }
    }
    // ceja
    const by = ojoY + 3.1 + g.h * 1.1 + (s === 1 ? g.as * 0.7 : 0);
    const inner: [number, number] = [s * 1.9, by - g.a * 0.8];
    const outer: [number, number] = [s * 5.6, by + g.a * 0.6];
    const ctl: [number, number] = [s * 3.8, by + 0.55];
    for (let i = 0; i <= 8; i++) {
      const [px, py] = bez(inner, ctl, outer, i / 8);
      elipsoide(cejaC, Fc, [px, py, zs(px, py) + 0.2], [0.5, 0.36, 0.36], -Math.PI / 2, Math.PI / 2, 6, 4);
    }
    // rubor
    const fuerte = has('ruborFuerte');
    const rub = fuerte ? 0.6 : has('rubor') ? 0.42 : 0.26;
    const col = mezcla(PIEL, hex('#ee7f86'), rub);
    elipsoide(A(`rub${fuerte ? 2 : has('rubor') ? 1 : 0}`, col, mojada ? 0.5 : 0.05), Fc, [s * 5.6, -2.3, zs(s * 5.6, -2.3) - 0.35], [1.9, 1.1, 0.8], -Math.PI / 2, Math.PI / 2, 10, 6);
    if (has('brillo')) elipsoide(blanco, Fc, [s * 3.7 + 0.5, ojoY + 0.9, zs(s * 3.7, ojoY) + 0.6], [0.22, 0.22, 0.2], -Math.PI / 2, Math.PI / 2, 6, 4);
  }
  // nariz
  elipsoide(A('nariz', PIEL_SOMBRA, 0.05), Fc, [0, -1.4, zs(0, -1.4) + 0.1], [0.65, 0.5, 0.5], -Math.PI / 2, Math.PI / 2, 8, 6);
  // boca
  const mY = -4.4;
  const w = 1.9 * g.w;
  const cL = mY + 0.57 * g.k;
  const cR = cL + g.lado * 0.8;
  const mid = mY - 1.56 * g.k;
  const ctl: [number, number] = [0, 2 * mid - (cL + cR) / 2];
  for (let i = 0; i <= 10; i++) {
    const [px, py] = bez([-w, cL], ctl, [w, cR], i / 10);
    elipsoide(boca, Fc, [px, py, zs(px, py) + 0.12], [0.34, 0.3, 0.3], -Math.PI / 2, Math.PI / 2, 6, 4);
  }
  if (g.open > 0.08) {
    elipsoide(A('interior', hex('#6a2530'), 0.4), Fc, [0, mid - g.open * 0.8, zs(0, mid) - 0.3], [w * 0.75, 0.35 + g.open * 1.5, 0.8], -Math.PI / 2, Math.PI / 2, 12, 8);
    if (has('dientes')) elipsoide(blanco, Fc, [0, cL - 0.2, zs(0, cL) + 0.05], [w * 0.55, 0.35, 0.5], -Math.PI / 2, Math.PI / 2, 10, 4);
  }

}

export function construirChica(o: OpcionesChica): Malla[] {
  const { gesto: g, pose, atuendo, mojada } = o;
  const has = (e: string) => g.extras.includes(e as Gesto['extras'][number]);
  const bikini = atuendo !== 'vestido';
  const top = atuendo === 'short' ? hex('#ecbccb') : atuendo === 'vestido' ? hex('#d4748a') : hex('#e8667a');
  const bajo = atuendo === 'short' ? hex('#6f8fb8') : atuendo === 'vestido' ? hex('#d4748a') : hex('#e8667a');

  const accs = new Map<string, Acc>();
  const A = (nombre: string, color: [number, number, number], spec = 0.1, alpha = 1): Acc => {
    let a = accs.get(nombre);
    if (!a) {
      a = new Acc(color, spec, alpha);
      accs.set(nombre, a);
    }
    return a;
  };
  const piel = A('piel', PIEL, mojada ? 0.9 : 0.12);
  const pelo = A('pelo', mojada ? PELO_MOJ : PELO, mojada ? 0.7 : 0.25);

  const baja = (pose.baja ?? 0) * 0.4;
  const sep = (pose.sep ?? 0) * 0.5 * 0.4;
  const rod = (pose.rod ?? 0) * 0.4;
  const pivote: V3 = [0, 92, 0];
  const Fu = mul(trans(0, -baja, 0), mul(trans(...pivote), mul(rotZ(-pose.inc * 0.8), trans(-pivote[0], -pivote[1], -pivote[2]))));
  const cuello: V3 = [0, 146, 0];
  const Fh = mul(Fu, mul(trans(...cuello), mul(rotZ(-pose.cab * 0.8), trans(-cuello[0], -cuello[1], -cuello[2]))));
  const Fn = ident();

  // sombra en el suelo
  elipsoide(A('suelo', [0.08, 0.06, 0.1], 0, 0.22), Fn, [0, 0.1, 0], [30, 0.2, 22], -Math.PI / 2, Math.PI / 2, 24, 3);

  // ----- torso
  const TORSO: [number, number, number][] = [
    [81, 5, 4],
    [85, 10, 7.6],
    [91, 13.6, 9.6],
    [98, 12.6, 9],
    [104, 9.2, 6.8],
    [110, 8.5, 6.3],
    [117, 9.8, 7.2],
    [125, 11.2, 8.1],
    [132, 11.4, 7],
    [138, 13.8, 5.8],
    [142, 8, 4.6],
    [146, 3.2, 3],
  ];
  loft(piel, Fu, TORSO);
  extremidad(piel, pt(Fu, [0, 138, 0]), pt(Fh, [0, 148, 0.6]), 3.2, 2.9);

  if (atuendo === 'vestido') {
    const v = A('vestido', top, 0.08);
    loft(v, Fu, TORSO.filter((e) => e[0] >= 85 && e[0] <= 134).map(([y, x, z]) => [y, x + 0.45, z + 0.45] as [number, number, number]));
    elipsoide(v, Fu, [0, 74, 0], [18, 22, 15.5], -Math.PI / 2, 0.5, 20, 12);
  } else {
    const t = A('top', top, mojada ? 0.7 : 0.15);
    for (const s of [-1, 1]) {
      elipsoide(t, Fu, [s * 5.2, 125.5, 5.6], [4.6, 4.2, 4.2]);
      extremidad(t, pt(Fu, [s * 4.4, 130, 7]), pt(Fh, [s * 1.4, 146.5, 2.5]), 0.35, 0.35, 6);
      extremidad(t, pt(Fu, [s * 8.8, 125.5, 4]), pt(Fu, [s * 10.4, 124, -2]), 0.3, 0.3, 6);
    }
    const b = A('bajo', bajo, mojada ? 0.7 : 0.15);
    loft(b, Fu, [[82, 5.8, 4.8], [85, 11.2, 8.5], [91, 14.2, 10.2], [98, 13.2, 9.6], [101, 11.4, 8.4]]);
    if (atuendo === 'short') {
      for (const s of [-1, 1]) extremidad(b, pt(Fu, [s * 6.6, 90, 0]), [s * (6.5 + sep * 0.3), 68 - baja, 1 + baja * 0.25], 6.7, 5.7);
    }
  }

  // ----- piernas
  for (const s of [-1, 1]) {
    const cadera: V3 = [s * 6.6, 88 - baja, 0];
    const tobillo: V3 = [s * (6.8 + sep), 7.5, 0];
    const rodilla: V3 = [(cadera[0] + tobillo[0]) / 2 + s * rod, (cadera[1] + tobillo[1]) / 2 + 2, baja > 0 ? 5 + baja * 0.12 : 1.2];
    extremidad(piel, cadera, rodilla, 6.6, 4.8);
    extremidad(piel, rodilla, tobillo, 4.6, 3);
    elipsoide(A('zapato', hex('#f4efe6'), 0.2), Fn, [tobillo[0], 3.4, 3.8], [3.6, 3.2, 8]);
  }

  // ----- brazos
  const rad = (d: number) => (d * Math.PI) / 180;
  for (const [s, a1, a2] of [[-1, pose.di, pose.fi], [1, pose.dd, pose.fd]] as const) {
    const hombro = pt(Fu, [s * 15, 139, 0]);
    const codo0: V3 = [s * 15 + s * 26 * Math.sin(rad(a1)), 139 - 26 * Math.cos(rad(a1)), 6];
    const mano0: V3 = [codo0[0] + s * 24 * Math.sin(rad(a2)), codo0[1] - 24 * Math.cos(rad(a2)), 0];
    mano0[2] = Math.abs(mano0[0]) < 12 ? 11 : mano0[1] > 150 ? 3 : 6;
    const codo = pt(Fu, codo0);
    const mano = pt(Fu, mano0);
    elipsoide(piel, Fn, hombro, [3.6, 3.6, 3.6], -Math.PI / 2, Math.PI / 2, 10, 8);
    extremidad(piel, hombro, codo, 3.6, 3);
    extremidad(piel, codo, mano, 2.9, 2.2);
    elipsoide(piel, Fn, mano, [2.3, 2.9, 1.6], -Math.PI / 2, Math.PI / 2, 10, 8);
  }

  // ----- cabeza
  const hc: V3 = [0, 159, 0];
  const sc = 1.16;
  const Fc = mul(Fh, mul(trans(...hc), [sc, 0, 0, 0, 0, sc, 0, 0, 0, 0, sc, 0, 0, 0, 0, 1]));
  elipsoide(piel, Fc, [0, 0, 0], [CRX, CRY * 0.9, CRZ], -Math.PI / 2, Math.PI / 2, 22, 16);
  // pelo
  elipsoide(pelo, Fc, [0, 0.8, -1.6], [9, 9.2, 8.9], -Math.PI / 2, Math.PI / 2, 22, 14);
  elipsoide(pelo, Fc, [0.6, 7.2, 2.4], [8.9, 3.3, 5.6], -Math.PI / 2, Math.PI / 2, 20, 8);
  elipsoide(pelo, Fc, [0, -12, -6.5], [9.4, 15.5, 3.6], -Math.PI / 2, Math.PI / 2, 18, 14);
  for (const s of [-1, 1]) elipsoide(pelo, Fc, [s * 8.2, -9, -2.2], [2.4, 13.5, 4.8], -Math.PI / 2, Math.PI / 2, 14, 12);

  // cara
  const ojoY = 1.2 + (g.my ?? 0) * -0.2;
  const zs = zsCara;
  dibujarCara(A, Fc, g, mojada);

  // gotas de sudor / lágrimas / agua
  const agua = A('agua', hex('#7cc3ea'), 1, 0.85);
  const brillo = A('brilloPiel', [1, 1, 1], 0, 0.5);
  if (has('sudor') || mojada) {
    const gs: [number, number][] = [[6.5, 5], [-6.8, 3.5], [3, 7.2], [6.2, -4.8], [-5.4, -5]];
    for (const [x, y] of gs) elipsoide(agua, Fc, [x, y, zs(x, y) + 0.2], [0.5, 0.75, 0.4], -Math.PI / 2, Math.PI / 2, 8, 6);
    for (const [x, y, z] of [[-2, 128, 11], [3, 120, 9.6], [0, 111, 8], [5, 103, 8], [-6, 96, 9], [2, 134, 8.6]] as [number, number, number][]) elipsoide(agua, Fu, [x, y, z], [0.5, 0.8, 0.4], -Math.PI / 2, Math.PI / 2, 8, 6);
  }
  if (has('lagrima') || has('llanto')) for (const s of [-1, 1]) elipsoide(agua, Fc, [s * 4.2, ojoY - 1.8, zs(s * 4.2, ojoY - 1.8) + 0.2], [0.45, 1, 0.4], -Math.PI / 2, Math.PI / 2, 8, 6);
  if (mojada) {
    for (const s of [-1, 1]) {
      elipsoide(brillo, Fu, [s * 11, 139, 3.4], [3.2, 0.7, 1.2], -Math.PI / 2, Math.PI / 2, 10, 4);
      elipsoide(brillo, Fn, [s * 7.5, 55, 4.4], [0.9, 8, 0.7], -Math.PI / 2, Math.PI / 2, 8, 6);
    }
    elipsoide(brillo, Fu, [0, 107, 6.2], [1.1, 5.5, 0.6], -Math.PI / 2, Math.PI / 2, 8, 6);
  }

  return [...accs.values()].map((a) => a.m);
}

// ---------- render WebGL ----------
const VS = `attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;varying vec3 vN;varying vec3 vW;
void main(){vN=aN;vW=aP;gl_Position=uVP*vec4(aP,1.0);}`;
const FS = `precision mediump float;varying vec3 vN;varying vec3 vW;uniform vec3 uC;uniform float uS;uniform float uA;uniform vec3 uCam;
void main(){
 vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.0){N=-N;}
 vec3 L=normalize(vec3(-0.55,0.75,0.75));
 float d=dot(N,L);
 float t=smoothstep(-0.25,0.45,d);
 vec3 sombra=uC*vec3(0.74,0.6,0.7);
 vec3 col=mix(sombra,uC*1.04,t);
 float rim=pow(1.0-max(dot(N,V),0.0),3.0);
 col+=rim*0.16*vec3(1.0,0.9,0.95);
 vec3 R=reflect(-L,N);
 col+=pow(max(dot(R,V),0.0),32.0)*uS*vec3(1.0);
 gl_FragColor=vec4(clamp(col,0.0,1.0),uA);
}`;

export interface Vista {
  yaw: number;
  pitch: number;
  dist: number;
}

export class Renderizador {
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private bufs: { p: WebGLBuffer; n: WebGLBuffer; i: WebGLBuffer; cnt: number; m: Malla }[] = [];
  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('Sin WebGL');
    this.gl = gl;
    const sh = (t: number, src: string): WebGLShader => {
      const s = gl.createShader(t)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(p);
    this.prog = p;
  }
  subir(mallas: Malla[]): void {
    const gl = this.gl;
    for (const b of this.bufs) {
      gl.deleteBuffer(b.p);
      gl.deleteBuffer(b.n);
      gl.deleteBuffer(b.i);
    }
    this.bufs = mallas
      .filter((m) => m.idx.length > 0)
      .map((m) => {
        const mk = (target: number, data: ArrayBufferView): WebGLBuffer => {
          const b = gl.createBuffer()!;
          gl.bindBuffer(target, b);
          gl.bufferData(target, data, gl.STATIC_DRAW);
          return b;
        };
        return { p: mk(gl.ARRAY_BUFFER, new Float32Array(m.pos)), n: mk(gl.ARRAY_BUFFER, new Float32Array(m.nrm)), i: mk(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(m.idx)), cnt: m.idx.length, m };
      });
  }
  dibujar(v: Vista): void {
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.prog);
    const objetivo: V3 = [0, 86, 0];
    const cam = pt(mul(trans(...objetivo), mul(rotY(v.yaw), rotX(-v.pitch))), [0, 0, v.dist]);
    const f = norm([objetivo[0] - cam[0], objetivo[1] - cam[1], objetivo[2] - cam[2]]);
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const vista: M4 = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * cam[0] + r[1] * cam[1] + r[2] * cam[2]), -(u[0] * cam[0] + u[1] * cam[1] + u[2] * cam[2]), f[0] * cam[0] + f[1] * cam[1] + f[2] * cam[2], 1];
    const vp = mul(perspectiva(0.5, w / h, 20, 900), vista);
    gl.uniformMatrix4fv(gl.getUniformLocation(this.prog, 'uVP'), false, new Float32Array(vp));
    gl.uniform3f(gl.getUniformLocation(this.prog, 'uCam'), cam[0], cam[1], cam[2]);
    const aP = gl.getAttribLocation(this.prog, 'aP');
    const aN = gl.getAttribLocation(this.prog, 'aN');
    gl.getExtension('OES_element_index_uint');
    const orden = [...this.bufs].sort((a, b) => b.m.alpha - a.m.alpha);
    for (const b of orden) {
      gl.uniform3f(gl.getUniformLocation(this.prog, 'uC'), ...b.m.color);
      gl.uniform1f(gl.getUniformLocation(this.prog, 'uS'), b.m.spec);
      gl.uniform1f(gl.getUniformLocation(this.prog, 'uA'), b.m.alpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.p);
      gl.enableVertexAttribArray(aP);
      gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, b.n);
      gl.enableVertexAttribArray(aN);
      gl.vertexAttribPointer(aN, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
      gl.drawElements(gl.TRIANGLES, b.cnt, gl.UNSIGNED_INT, 0);
    }
  }
}
