import { Acc, bez, dibujarCara, elipsoide, extremidad, hex, ident, loft, mezcla, mul, perspectiva, pt, rotY, trans, cross, norm, PELO, PIEL, PIEL_SOMBRA } from './chica3d';
import type { M4, Malla, V3 } from './chica3d';
import type { Escena } from './datos';
import type { Gesto } from './gestos';

/**
 * Mundo en 3D sin librerías: renderer con matrices por objeto, cuartos hechos con cajas,
 * hombres y mujeres animables (ciclo de caminata) y luz según la hora.
 */

export { PIEL, PIEL_SOMBRA, PELO, bez };

/* ---------- renderer ---------- */

export interface GPU {
  p: WebGLBuffer;
  n: WebGLBuffer;
  i: WebGLBuffer;
  cnt: number;
  color: [number, number, number];
  spec: number;
  alpha: number;
}

export interface Item {
  g: GPU[];
  m: M4;
}

export interface Camara {
  pos: V3;
  objetivo: V3;
  fov: number;
}

export interface Ambiente {
  luz: V3; // dirección hacia la luz
  luzCol: V3;
  amb: number;
  tinte: V3;
  cielo: V3;
  lampara?: { pos: V3; col: V3; fuerza: number };
}

const VS = `attribute vec3 aP;attribute vec3 aN;uniform mat4 uVP;uniform mat4 uM;varying vec3 vN;varying vec3 vW;
void main(){vec4 w=uM*vec4(aP,1.0);vW=w.xyz;vN=mat3(uM)*aN;gl_Position=uVP*w;}`;
const FS = `precision mediump float;varying vec3 vN;varying vec3 vW;
uniform vec3 uC;uniform float uS;uniform float uA;uniform vec3 uCam;
uniform vec3 uL;uniform vec3 uLC;uniform float uAmb;uniform vec3 uT;
uniform vec3 uP;uniform vec3 uPC;uniform float uPF;
void main(){
 vec3 N=normalize(vN);vec3 V=normalize(uCam-vW);if(dot(N,V)<0.0){N=-N;}
 float d=dot(N,normalize(uL));
 float t=smoothstep(-0.25,0.45,d);
 vec3 luz=uT*(uAmb+uLC*t);
 vec3 toP=uP-vW;float dist=length(toP);
 float pl=max(dot(N,toP/dist),0.0)*uPF/(1.0+dist*dist*0.00018);
 luz+=uPC*pl;
 vec3 col=uC*luz*vec3(1.02,0.97,1.0);
 float rim=pow(1.0-max(dot(N,V),0.0),3.0);
 col+=rim*0.10*uT;
 vec3 R=reflect(-normalize(uL),N);
 col+=pow(max(dot(R,V),0.0),32.0)*uS*uLC*0.8;
 gl_FragColor=vec4(clamp(col,0.0,1.0),uA);
}`;

export class Motor3D {
  gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private aP: number;
  private aN: number;
  vp: M4 = ident();
  constructor(public canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('Sin WebGL');
    this.gl = gl;
    gl.getExtension('OES_element_index_uint');
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
    for (const n of ['uVP', 'uM', 'uC', 'uS', 'uA', 'uCam', 'uL', 'uLC', 'uAmb', 'uT', 'uP', 'uPC', 'uPF']) this.loc[n] = gl.getUniformLocation(p, n);
    this.aP = gl.getAttribLocation(p, 'aP');
    this.aN = gl.getAttribLocation(p, 'aN');
  }

  subir(mallas: Malla[]): GPU[] {
    const gl = this.gl;
    return mallas
      .filter((m) => m.idx.length > 0)
      .map((m) => {
        const mk = (target: number, data: ArrayBufferView): WebGLBuffer => {
          const b = gl.createBuffer()!;
          gl.bindBuffer(target, b);
          gl.bufferData(target, data, gl.STATIC_DRAW);
          return b;
        };
        return { p: mk(gl.ARRAY_BUFFER, new Float32Array(m.pos)), n: mk(gl.ARRAY_BUFFER, new Float32Array(m.nrm)), i: mk(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(m.idx)), cnt: m.idx.length, color: m.color, spec: m.spec, alpha: m.alpha };
      });
  }

  liberar(g: GPU[]): void {
    for (const b of g) {
      this.gl.deleteBuffer(b.p);
      this.gl.deleteBuffer(b.n);
      this.gl.deleteBuffer(b.i);
    }
  }

  /** Matriz de proyección × vista para esta cámara. */
  preparar(cam: Camara): { vp: M4; pos: V3 } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const f = norm([cam.objetivo[0] - cam.pos[0], cam.objetivo[1] - cam.pos[1], cam.objetivo[2] - cam.pos[2]]);
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const c = cam.pos;
    const vista: M4 = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * c[0] + r[1] * c[1] + r[2] * c[2]), -(u[0] * c[0] + u[1] * c[1] + u[2] * c[2]), f[0] * c[0] + f[1] * c[1] + f[2] * c[2], 1];
    const vp = mul(perspectiva(cam.fov, w / h, 8, 1500), vista);
    this.vp = vp;
    return { vp, pos: c };
  }

  dibujar(items: Item[], cam: Camara, amb: Ambiente): void {
    const gl = this.gl;
    const { vp, pos } = this.preparar(cam);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(amb.cielo[0], amb.cielo[1], amb.cielo[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.prog);
    const L = this.loc;
    gl.uniformMatrix4fv(L.uVP, false, new Float32Array(vp));
    gl.uniform3f(L.uCam, pos[0], pos[1], pos[2]);
    gl.uniform3f(L.uL, amb.luz[0], amb.luz[1], amb.luz[2]);
    gl.uniform3f(L.uLC, amb.luzCol[0], amb.luzCol[1], amb.luzCol[2]);
    gl.uniform1f(L.uAmb, amb.amb);
    gl.uniform3f(L.uT, amb.tinte[0], amb.tinte[1], amb.tinte[2]);
    const lp = amb.lampara;
    gl.uniform3f(L.uP, lp ? lp.pos[0] : 0, lp ? lp.pos[1] : 0, lp ? lp.pos[2] : 0);
    gl.uniform3f(L.uPC, lp ? lp.col[0] : 0, lp ? lp.col[1] : 0, lp ? lp.col[2] : 0);
    gl.uniform1f(L.uPF, lp ? lp.fuerza : 0);
    for (const pasada of [1, 0]) {
      for (const it of items) {
        gl.uniformMatrix4fv(L.uM, false, new Float32Array(it.m));
        for (const b of it.g) {
          if ((b.alpha >= 1 ? 1 : 0) !== pasada) continue;
          gl.uniform3f(L.uC, b.color[0], b.color[1], b.color[2]);
          gl.uniform1f(L.uS, b.spec);
          gl.uniform1f(L.uA, b.alpha);
          gl.bindBuffer(gl.ARRAY_BUFFER, b.p);
          gl.enableVertexAttribArray(this.aP);
          gl.vertexAttribPointer(this.aP, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, b.n);
          gl.enableVertexAttribArray(this.aN);
          gl.vertexAttribPointer(this.aN, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
          gl.drawElements(gl.TRIANGLES, b.cnt, gl.UNSIGNED_INT, 0);
        }
      }
    }
  }
}

/** Proyecta un punto del mundo a píxeles CSS del canvas (o null si está detrás). */
export function proyectar(vp: M4, p: V3, ancho: number, alto: number): [number, number] | null {
  const x = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12];
  const y = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13];
  const w = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
  if (w <= 0.01) return null;
  return [(x / w * 0.5 + 0.5) * ancho, (1 - (y / w * 0.5 + 0.5)) * alto];
}

/* ---------- cajas y cuartos ---------- */

function caja(a: Acc, c: V3, s: V3, rot = 0): void {
  const F = mul(trans(c[0], c[1], c[2]), rotY(rot));
  const hx = s[0] / 2;
  const hy = s[1] / 2;
  const hz = s[2] / 2;
  const caras: [V3, V3, V3, V3, V3][] = [
    [[0, 0, 1], [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]],
    [[0, 0, -1], [hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]],
    [[1, 0, 0], [hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]],
    [[-1, 0, 0], [-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]],
    [[0, 1, 0], [-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]],
    [[0, -1, 0], [-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]],
  ];
  for (const [n, ...vs] of caras) {
    const b = a.base();
    const nw: V3 = [F[0] * n[0] + F[4] * n[1] + F[8] * n[2], F[1] * n[0] + F[5] * n[1] + F[9] * n[2], F[2] * n[0] + F[6] * n[1] + F[10] * n[2]];
    for (const v of vs) {
      a.m.pos.push(...pt(F, v));
      a.m.nrm.push(...nw);
    }
    a.m.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
}

const esfera = (a: Acc, c: V3, r: V3, seg = 12, ring = 8): void => elipsoide(a, ident(), c, r, -Math.PI / 2, Math.PI / 2, seg, ring);

export interface Hotspot {
  id: 'sabanas' | 'banar' | 'esconder' | 'esperar';
  nombre: string;
  pos: V3;
}

interface Receta {
  pared: string;
  piso: string;
  detalle: (A: (n: string, c: string, spec?: number, alpha?: number) => Acc, hora: number) => void;
  hotspots: Hotspot[];
}

const cieloDe = (hora: number): { sol: string; tinte: V3 } => {
  const h = hora / 60;
  if (h >= 7 && h < 17) return { sol: '#bfe3ff', tinte: [1, 1, 1] };
  if (h >= 17 && h < 20) return { sol: '#f3a56b', tinte: [1, 0.86, 0.78] };
  return { sol: '#17213d', tinte: [0.5, 0.56, 0.9] };
};

const RECETAS: Record<Escena, Receta> = {
  cama: {
    pared: '#c9b8d8',
    piso: '#6a5240',
    hotspots: [
      { id: 'sabanas', nombre: 'Sábanas', pos: [0, 50, -110] },
      { id: 'banar', nombre: 'Ducha', pos: [150, 120, -190] },
    ],
    detalle: (A, hora) => {
      caja(A('alfombra', '#3a4a78'), [0, 1, -20], [190, 1, 130]);
      caja(A('cama1', '#5a3d6e'), [0, 14, -120], [132, 28, 176]);
      caja(A('colchon', '#efe8f5'), [0, 32, -116], [126, 12, 170]);
      caja(A('manta', '#9a6ab8'), [0, 40, -92], [128, 8, 108]);
      caja(A('almohada', '#ffffff'), [-30, 42, -180], [44, 12, 26]);
      caja(A('almohada', '#ffffff'), [30, 42, -180], [44, 12, 26]);
      caja(A('cabecera', '#3f2a4d'), [0, 58, -206], [142, 70, 6]);
      caja(A('buro', '#4b3558'), [-104, 22, -188], [34, 44, 34]);
      esfera(A('lampara', '#ffe3a0', 0.6), [-104, 54, -188], [7, 10, 7]);
      caja(A('closet', '#3a2b46'), [165, 100, -150], [44, 200, 90]);
      caja(A('closet2', '#4a3858'), [165, 100, -104], [2, 190, 2]);
      const c = cieloDe(hora);
      caja(A('marco', '#f0ece6'), [120, 150, -207], [74, 84, 3]);
      caja(A('vidrio', c.sol, 0.8), [120, 150, -205], [64, 74, 3]);
      caja(A('cuadro', '#b88a68'), [-90, 150, -207], [46, 36, 2]);
    },
  },
  bano: {
    pared: '#bcd3d6',
    piso: '#e1e8ea',
    hotspots: [{ id: 'banar', nombre: 'Ducha', pos: [-120, 70, -140] }],
    detalle: (A) => {
      caja(A('banera', '#f4f8f9', 0.5), [-125, 26, -150], [86, 52, 176]);
      caja(A('agua', '#9fd0e8', 0.8, 0.8), [-125, 50, -150], [70, 2, 158]);
      caja(A('inodoro', '#f4f4f4', 0.5), [105, 20, -180], [28, 40, 38]);
      caja(A('tanque', '#f0f0f0', 0.5), [105, 52, -196], [30, 24, 12]);
      caja(A('mueble', '#8a6a4c'), [30, 42, -190], [70, 84, 36]);
      caja(A('lavabo', '#f6f6f6', 0.5), [30, 86, -186], [60, 6, 30]);
      caja(A('espejo', '#a8cfe8', 0.95), [30, 140, -207], [62, 76, 2]);
      caja(A('toalla', '#d86a8a'), [150, 110, -206], [20, 40, 3]);
      caja(A('tapete', '#d8a0b8'), [20, 1, -80], [70, 1, 40]);
    },
  },
  sotano: {
    pared: '#55595c',
    piso: '#3b3d3f',
    hotspots: [{ id: 'esconder', nombre: 'Caja', pos: [80, 40, -150] }],
    detalle: (A) => {
      caja(A('caja', '#8a6a46'), [80, 20, -150], [50, 40, 50], 12);
      caja(A('caja2', '#7a5a3a'), [130, 14, -120], [34, 28, 34], -8);
      caja(A('caja3', '#9a7a52'), [95, 55, -150], [34, 30, 34], 20);
      caja(A('estante', '#2e3032'), [-140, 100, -190], [96, 200, 30]);
      for (const y of [50, 100, 150]) caja(A('tabla', '#4e5256'), [-140, y, -184], [96, 4, 34]);
      caja(A('caja4', '#a88a5a'), [-160, 62, -186], [30, 20, 24]);
      caja(A('caja4', '#a88a5a'), [-120, 112, -186], [34, 24, 24]);
      caja(A('lavadora', '#cfd2d4', 0.4), [-20, 45, -190], [62, 90, 56]);
      esfera(A('foco', '#fff2b8', 0.8), [0, 258, -60], [6, 8, 6]);
      extremidad(A('tubo', '#6a6f73', 0.4), [-210, 262, -200], [210, 262, -200], 5, 5);
    },
  },
  oficina: {
    pared: '#d3d8e0',
    piso: '#76808c',
    hotspots: [],
    detalle: (A) => {
      for (const x of [-100, 100]) {
        caja(A('escritorio', '#a07a52'), [x, 74, -120], [120, 5, 54]);
        caja(A('pata', '#6a6f75'), [x - 54, 37, -120], [4, 74, 46]);
        caja(A('pata', '#6a6f75'), [x + 54, 37, -120], [4, 74, 46]);
        caja(A('monitor', '#202226', 0.4), [x, 100, -132], [46, 28, 3]);
        caja(A('pantalla', '#86b7e8', 0.5), [x, 100, -130], [42, 24, 1]);
        caja(A('silla', '#3a3f4a'), [x, 48, -70], [38, 6, 38]);
        caja(A('silla', '#3a3f4a'), [x, 76, -52], [38, 40, 5]);
      }
      caja(A('ventana', '#bfe3ff', 0.7), [0, 150, -207], [160, 80, 3]);
      esfera(A('maceta', '#4f9a5a'), [175, 40, -180], [16, 24, 16]);
      caja(A('archivero', '#9aa0a8'), [-175, 50, -180], [40, 100, 40]);
    },
  },
  archivo: {
    pared: '#aaaaa4',
    piso: '#5a5a58',
    hotspots: [],
    detalle: (A) => {
      for (const x of [-120, 0, 120]) {
        caja(A('estanteria', '#7a7c80'), [x, 105, -190], [96, 210, 36]);
        for (const y of [40, 90, 140, 190]) {
          caja(A('tabla', '#5a5c60'), [x, y, -184], [96, 3, 38]);
          caja(A(y % 100 === 40 ? 'carpeta1' : 'carpeta2', y % 100 === 40 ? '#e8e2cc' : '#cdd6e8'), [x - 20, y + 12, -184], [40, 20, 28]);
          caja(A('carpeta3', '#e0c8c8'), [x + 24, y + 10, -184], [30, 16, 28]);
        }
      }
      esfera(A('foco', '#f4f0d8', 0.8), [0, 262, -80], [8, 6, 8]);
    },
  },
  gym: {
    pared: '#cfd8d6',
    piso: '#2b2f33',
    hotspots: [],
    detalle: (A) => {
      caja(A('espejo', '#a9c4d3', 0.95), [0, 130, -207], [380, 130, 2]);
      caja(A('banca', '#202226'), [0, 34, -100], [34, 10, 100]);
      caja(A('patas', '#555a60'), [-12, 17, -80], [4, 34, 4]);
      caja(A('patas', '#555a60'), [12, 17, -120], [4, 34, 4]);
      for (const x of [-60, 60]) caja(A('rack', '#555a60'), [x, 80, -110], [5, 160, 5]);
      extremidad(A('barra', '#c9ced2', 0.7), [-75, 110, -110], [75, 110, -110], 1.8, 1.8);
      for (const x of [-64, -58, 58, 64]) esfera(A('disco', '#2e3238', 0.4), [x, 110, -110], [3, 17, 17]);
      for (let i = 0; i < 5; i++) esfera(A('mancuerna', '#34383e', 0.3), [-170 + i * 20, 28, -180], [8, 8, 8]);
      caja(A('portapesas', '#555a60'), [-150, 18, -180], [120, 36, 24]);
      caja(A('tapete', '#3a8a7a'), [90, 1, -30], [110, 1, 70]);
    },
  },
  vestidor: {
    pared: '#c8d3d8',
    piso: '#9aa8b0',
    hotspots: [{ id: 'banar', nombre: 'Ducha', pos: [-140, 110, -170] }],
    detalle: (A) => {
      for (let i = 0; i < 6; i++) {
        caja(A('casillero', '#4a6a7a'), [-150 + i * 60, 100, -190], [56, 200, 36]);
        caja(A('rejilla', '#2f4752'), [-150 + i * 60, 160, -171], [30, 4, 1]);
      }
      caja(A('banca', '#8a6a4c'), [0, 22, -90], [180, 10, 34]);
      caja(A('banca', '#6a5038'), [-70, 11, -90], [6, 22, 28]);
      caja(A('banca', '#6a5038'), [70, 11, -90], [6, 22, 28]);
      caja(A('cortina', '#8ab4d4', 0.5, 0.75), [-140, 120, -110], [90, 200, 2]);
    },
  },
  hotel: {
    pared: '#d8c2b8',
    piso: '#5a3a3a',
    hotspots: [{ id: 'sabanas', nombre: 'Sábanas', pos: [0, 50, -110] }],
    detalle: (A, hora) => {
      caja(A('alfombra', '#6a2a3c'), [0, 1, -10], [220, 1, 150]);
      caja(A('cama1', '#4a2a2e'), [0, 16, -120], [160, 32, 180]);
      caja(A('colchon', '#f6efe8'), [0, 36, -116], [154, 14, 174]);
      caja(A('manta', '#a8384e'), [0, 44, -88], [156, 8, 114]);
      for (const x of [-40, 40]) caja(A('almohada', '#fff'), [x, 48, -182], [56, 14, 28]);
      caja(A('cabecera', '#3a2024'), [0, 66, -207], [170, 90, 6]);
      for (const x of [-115, 115]) {
        caja(A('buro', '#5a3a2a'), [x, 24, -190], [36, 48, 36]);
        esfera(A('lampara', '#ffe3a0', 0.6), [x, 58, -190], [7, 11, 7]);
      }
      const c = cieloDe(hora);
      caja(A('vidrio', c.sol, 0.8), [160, 160, -207], [70, 100, 3]);
      caja(A('cortina', '#8a2a3c'), [118, 150, -203], [14, 150, 4]);
      caja(A('cortina', '#8a2a3c'), [202, 150, -203], [14, 150, 4]);
      caja(A('sofa', '#32404a'), [-150, 26, -30], [40, 52, 100]);
    },
  },
  bar: {
    pared: '#4a352a',
    piso: '#2a1d16',
    hotspots: [],
    detalle: (A) => {
      caja(A('barra', '#5a3a24'), [0, 52, -110], [320, 104, 40]);
      caja(A('barra2', '#26160e', 0.5), [0, 106, -108], [326, 6, 46]);
      for (let i = 0; i < 6; i++) esfera(A('taburete', '#8a2a2a'), [-130 + i * 52, 34, -70], [10, 34, 10]);
      caja(A('repisa', '#3a281c'), [0, 170, -200], [330, 5, 20]);
      const col = ['#3a8a5a', '#a8742e', '#7a3a8a', '#d8d4c8'];
      for (let i = 0; i < 14; i++) esfera(A(`botella${i % 4}`, col[i % 4], 0.6), [-150 + i * 23, 186, -200], [4, 14, 4]);
      for (const x of [-100, 100]) esfera(A('luz', '#ffd890', 0.9), [x, 230, -60], [8, 8, 8]);
    },
  },
  coche: {
    pared: '#1a2230',
    piso: '#1a1c20',
    hotspots: [],
    detalle: (A, hora) => {
      const c = cieloDe(hora);
      caja(A('cielo', c.sol, 0.1), [0, 150, -300], [600, 300, 2]);
      caja(A('tablero', '#25282e'), [0, 82, -90], [260, 34, 60]);
      caja(A('parabrisas', '#6a8aa8', 0.9, 0.35), [0, 150, -130], [250, 90, 2]);
      for (const x of [-60, 60]) {
        caja(A('asiento', '#3a3d45'), [x, 40, 20], [50, 20, 50]);
        caja(A('respaldo', '#3a3d45'), [x, 80, 46], [50, 64, 12]);
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        esfera(A('volante', '#15171a'), [-60 + Math.cos(a) * 18, 100 + Math.sin(a) * 18, -60], [2.5, 2.5, 2.5], 6, 4);
      }
      caja(A('pilar', '#1a1c20'), [-135, 130, -50], [8, 150, 8]);
      caja(A('pilar', '#1a1c20'), [135, 130, -50], [8, 150, 8]);
    },
  },
};

export const hotspotsDe = (esc: Escena): Hotspot[] => RECETAS[esc].hotspots;

export function construirCuarto(esc: Escena, hora: number): Malla[] {
  const r = RECETAS[esc];
  const accs = new Map<string, Acc>();
  const A = (n: string, c: string, spec = 0.08, alpha = 1): Acc => {
    let a = accs.get(n + c);
    if (!a) {
      a = new Acc(hex(c), spec, alpha);
      accs.set(n + c, a);
    }
    return a;
  };
  const pared = hex(r.pared);
  const rodapie = mezcla(pared, [0, 0, 0], 0.25);
  const mk = (c: [number, number, number], spec = 0.05): Acc => new Acc(c, spec);
  const piso = new Acc(hex(r.piso), 0.15);
  const p1 = mk(pared);
  const p2 = mk(rodapie);
  caja(piso, [0, -1, -60], [430, 2, 400]);
  caja(p1, [0, 145, -212], [430, 290, 4]);
  caja(p1, [-214, 145, -60], [4, 290, 400]);
  caja(p1, [214, 145, -60], [4, 290, 400]);
  caja(p2, [0, 6, -209], [430, 12, 3]);
  caja(p2, [-211, 6, -60], [3, 12, 400]);
  caja(p2, [211, 6, -60], [3, 12, 400]);
  if (esc !== 'coche') caja(mk(mezcla(pared, [1, 1, 1], 0.3)), [0, 300, -60], [430, 20, 400]);
  r.detalle(A, hora);
  return [piso.m, p1.m, p2.m, ...[...accs.values()].map((a) => a.m)];
}

export function ambienteDe(esc: Escena, hora: number): Ambiente {
  const h = hora / 60;
  const interior = esc === 'sotano' || esc === 'bar' || esc === 'archivo';
  let luzCol: V3 = [1, 0.96, 0.9];
  let amb = 0.62;
  let tinte: V3 = [1, 1, 1];
  let cielo: V3 = [0.07, 0.06, 0.1];
  if (h < 6 || h >= 20) {
    tinte = [0.62, 0.66, 0.95];
    amb = 0.34;
    luzCol = [0.4, 0.45, 0.75];
  } else if (h >= 17) {
    tinte = [1, 0.84, 0.74];
    amb = 0.5;
    luzCol = [1, 0.72, 0.5];
  }
  if (interior) {
    tinte = [1, 0.9, 0.78];
    amb = 0.4;
    luzCol = [0.9, 0.7, 0.5];
  }
  cielo = [0.07 * tinte[0], 0.06 * tinte[1], 0.1 * tinte[2]];
  const lamp: Ambiente['lampara'] = esc === 'cama' || esc === 'hotel' ? { pos: [-104, 70, -170], col: [1, 0.78, 0.42], fuerza: h >= 17 || h < 7 ? 1.3 : 0.45 } : esc === 'sotano' ? { pos: [0, 250, -60], col: [1, 0.9, 0.62], fuerza: 1.3 } : esc === 'bar' ? { pos: [0, 220, -60], col: [1, 0.7, 0.4], fuerza: 1.5 } : undefined;
  return { luz: [-0.4, 0.9, 0.7], luzCol, amb, tinte, cielo, lampara: lamp };
}

/* ---------- personas (hombres y mujeres que caminan) ---------- */

export interface FiguraH {
  piel: string;
  pelo: string;
  ropa: string;
  pantalon: string;
  gesto: Gesto;
  marcha: number; // -1..1 fase de la caminata
  brazos?: [number, number, number, number]; // di, fi, dd, fd
  bajo?: boolean; // hombros caídos (abatido)
}

export function construirHombre(o: FiguraH): Malla[] {
  const accs = new Map<string, Acc>();
  const A = (n: string, c: [number, number, number], spec = 0.1, alpha = 1): Acc => {
    let a = accs.get(n);
    if (!a) {
      a = new Acc(c, spec, alpha);
      accs.set(n, a);
    }
    return a;
  };
  const piel = A('piel', hex(o.piel), 0.12);
  const pelo = A('pelo', hex(o.pelo), 0.2);
  const camisa = A('camisa', hex(o.ropa), 0.1);
  const pantalon = A('pantalon', hex(o.pantalon), 0.1);
  const zapato = A('zapato', hex('#232326'), 0.3);
  const F = ident();
  const caida = o.bajo ? 1.6 : 0;
  const m = o.marcha;

  loft(camisa, F, [[96, 12.8, 8.8], [104, 12.6, 8.6], [112, 13.6, 9], [122, 15.6, 9.8], [130, 17.8, 10], [137, 18.6 - caida, 8.2], [141, 10, 5.6]]);
  extremidad(piel, [0, 138, 0], [0, 149, 0.8], 3.6, 3.2);
  loft(pantalon, F, [[76, 6, 5], [82, 11.4, 8.4], [90, 14, 9.6], [98, 13.4, 9.2], [100, 12.9, 8.9]]);

  for (const s of [-1, 1] as const) {
    const lad = s * m;
    const tob: V3 = [s * 7, 7.5 + Math.max(0, -lad) * 5, lad * 15];
    const rod: V3 = [s * 6.9, 47 + Math.max(0, -lad) * 4, lad * 7 + 2 + (lad < 0 ? 4 : 0)];
    extremidad(pantalon, [s * 6.8, 90, 0], rod, 7, 5.3);
    extremidad(pantalon, rod, tob, 5.2, 3.8);
    elipsoide(zapato, F, [tob[0], tob[1] - 3.5, tob[2] + 3.8], [3.9, 3.4, 8.6]);
    const ar = o.brazos ?? [7, 4, 7, 4];
    const a1 = s === -1 ? ar[0] : ar[2];
    const a2 = s === -1 ? ar[1] : ar[3];
    const rad = (d: number): number => (d * Math.PI) / 180;
    const hombro: V3 = [s * 18.2, 137 - caida, 0];
    const codo: V3 = [hombro[0] + s * 27 * Math.sin(rad(a1)), hombro[1] - 27 * Math.cos(rad(a1)), 2 - lad * 4];
    const mano: V3 = [codo[0] + s * 25 * Math.sin(rad(a2)), codo[1] - 25 * Math.cos(rad(a2)), -lad * 11 + 3];
    elipsoide(camisa, F, hombro, [4.6, 4.6, 4.6], -Math.PI / 2, Math.PI / 2, 10, 8);
    extremidad(camisa, hombro, [hombro[0] + (codo[0] - hombro[0]) * 0.55, hombro[1] + (codo[1] - hombro[1]) * 0.55, hombro[2] + (codo[2] - hombro[2]) * 0.55], 4.6, 4.3);
    extremidad(piel, [hombro[0] + (codo[0] - hombro[0]) * 0.5, hombro[1] + (codo[1] - hombro[1]) * 0.5, hombro[2] + (codo[2] - hombro[2]) * 0.5], codo, 3.7, 3.2);
    extremidad(piel, codo, mano, 3.2, 2.5);
    elipsoide(piel, F, mano, [2.7, 3.2, 1.9], -Math.PI / 2, Math.PI / 2, 10, 8);
  }

  // cabeza
  const Fc = mul(trans(0, 160 - caida * 0.6, 0.4), [1.1, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 1]);
  elipsoide(piel, Fc, [0, 0, 0], [8.2, 8.1, 8.4], -Math.PI / 2, Math.PI / 2, 22, 16);
  elipsoide(pelo, Fc, [0, 2.4, -1.2], [8.9, 8.3, 8.8], -Math.PI / 2, Math.PI / 2, 22, 14);
  elipsoide(pelo, Fc, [0.4, 7.4, 1.8], [8.4, 3, 6], -Math.PI / 2, Math.PI / 2, 18, 8);
  for (const s of [-1, 1]) elipsoide(piel, Fc, [s * 8.2, -0.4, 0], [1, 1.9, 1.2], -Math.PI / 2, Math.PI / 2, 8, 6);
  dibujarCara(A, Fc, o.gesto, false);
  return [...accs.values()].map((a) => a.m);
}
