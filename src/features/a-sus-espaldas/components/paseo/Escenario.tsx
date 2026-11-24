'use client';

import { memo, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Cuerpo, POSES, ROPA_BIKINI, ROPA_CASUAL } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO, CuerpoChico } from './Chico';
import { Cuarto } from './Cuarto';
import { ALTO, ORILLA, PISO, masCercano } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import type { Destino } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import type { Escena, Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import styles from './paseo.module.css';

/** Escala de ella y de ellos dentro del escenario. */
export const SE = 0.46;
export const SC = 0.5;
const VEL = 170;

export interface Figura {
  id: string;
  nombre: string;
  x: number;
  look: Look;
  g: Gesto;
  /** 0 a 5 corazones; null para él */
  corazones: number | null;
  esEl?: boolean;
}

export interface Burbuja {
  id: string;
  texto: string;
  n: number;
}

const PASO_A: Pose = { ...POSES[0], id: 'pasoA', di: 18, fi: 8, dd: 3, fd: 0, sep: 13 };
const PASO_B: Pose = { ...POSES[0], id: 'pasoB', di: 3, fi: 0, dd: 18, fd: 8, sep: 3 };

const f1 = (n: number): string => n.toFixed(1);

/** Coloca un dibujo (centro x = 120, pies en y = 437) en el escenario, mirando a la derecha (1) o a la izquierda (-1). */
export function poner(x: number, dir: 1 | -1, s: number, sube = 0): string {
  return `translate(${f1(x - 120 * s * dir)} ${f1(PISO - 437 * s + sube)}) scale(${(s * dir).toFixed(3)} ${s.toFixed(3)})`;
}

const CORAZON = 'M0 3 C-4 -3 -9 1 0 9 C9 1 4 -3 0 3Z';

export function Corazones({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={CORAZON} transform={`translate(${x - 26 + i * 13} ${y}) scale(0.95)`} fill={i < n ? '#e8507f' : 'none'} stroke="#e88fb0" strokeWidth="1.4" />
      ))}
    </g>
  );
}

function lineas(texto: string, max = 24): string[] {
  const out: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    if ((actual + ' ' + palabra).trim().length > max && actual) {
      out.push(actual);
      actual = palabra;
    } else actual = (actual + ' ' + palabra).trim();
  }
  if (actual) out.push(actual);
  return out.slice(0, 5);
}

export function Globo({ x, texto, min, max }: { x: number; texto: string; min: number; max: number }) {
  const ls = lineas(texto);
  const w = 214;
  const h = 14 + ls.length * 16;
  const cx = Math.max(min + w / 2 + 6, Math.min(max - w / 2 - 6, x));
  const y = PISO - 236 - h;
  return (
    <g className={styles.globo}>
      <rect x={cx - w / 2} y={y} width={w} height={h} rx="12" fill="#f4eef8" />
      <path d={`M${x - 8} ${y + h - 1} L${x} ${y + h + 12} L${x + 8} ${y + h - 1} Z`} fill="#f4eef8" />
      {ls.map((l, i) => (
        <text key={i} x={cx} y={y + 21 + i * 16} className={styles.globoTexto}>
          {l}
        </text>
      ))}
    </g>
  );
}

const PersonaFig = memo(function PersonaFig({ fig, mira, cerca }: { fig: Figura; mira: 1 | -1; cerca: boolean }) {
  const top = PISO - 206;
  return (
    <g>
      {cerca && <ellipse cx={fig.x} cy={PISO + 5} rx="40" ry="8" className={fig.esEl ? styles.anilloEl : styles.anillo} />}
      <g className={styles.respira} style={{ transformOrigin: `${fig.x}px ${PISO}px` }}>
        <g transform={poner(fig.x, mira, SC)}>
          <CuerpoChico look={fig.look} g={fig.g} />
        </g>
      </g>
      {fig.corazones !== null && <Corazones x={fig.x} y={top - 30} n={fig.corazones} />}
      <text x={fig.x} y={top - 8} className={fig.esEl ? styles.nombreEl : styles.nombre}>
        {fig.esEl ? `♥ ${fig.nombre}` : fig.nombre}
      </text>
    </g>
  );
});

interface Props {
  /** cambia al entrar a otro cuarto: reinicia la posición */
  clave: string;
  escena: Escena;
  ancho: number;
  luz: 0 | 1 | 2;
  puertas: { izq: Destino; der: Destino };
  gente: readonly Figura[];
  ropa: 'normal' | 'bikini';
  /** sube cada vez que se cambia de ropa, para el destello */
  ropaN: number;
  gestoElla: Gesto;
  seguidor: { look: Look; g: Gesto; nombre: string } | null;
  entrada: 'izq' | 'der' | 'centro';
  bloqueado: boolean;
  burbuja: Burbuja | null;
  onCerca: (id: string | null) => void;
  onPuerta: (lado: 'izq' | 'der') => void;
}

/** El cuarto de lado. Tocas o mantienes el dedo y ella camina hacia allá; la cámara la sigue. */
export function Escenario(props: Props) {
  const { clave, escena, ancho, luz, puertas, gente, ropa, ropaN, gestoElla, seguidor, entrada, bloqueado, burbuja } = props;
  const caja = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState({ w: 390, h: 460 });
  const inicio = (): number => (entrada === 'izq' ? 70 : entrada === 'der' ? ancho - 70 : Math.round(ancho * 0.26));
  const pos = useRef({ x: inicio(), dir: 1 as 1 | -1, fx: inicio() - 56, fdir: 1 as 1 | -1, fase: 0, ffase: 0, camina: false, fcamina: false });
  const objetivo = useRef<number | null>(null);
  const dedo = useRef<{ id: number; cx: number } | null>(null);
  const tecla = useRef<0 | 1 | -1>(0);
  const cercaRef = useRef<string | null>(null);
  const enPuerta = useRef(false);
  const [, setFrame] = useState(0);
  const vivo = useRef(props);
  vivo.current = props;

  // Al entrar a otro cuarto: aparece junto a la puerta por la que entró.
  useEffect(() => {
    const x = inicio();
    const dir: 1 | -1 = entrada === 'der' ? -1 : 1;
    pos.current = { ...pos.current, x, dir, fx: x - dir * 56, fdir: dir, camina: false, fcamina: false };
    objetivo.current = null;
    dedo.current = null;
    enPuerta.current = false;
    cercaRef.current = null;
    vivo.current.onCerca(null);
    setFrame((n) => n + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    const el = caja.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      if (r.width > 0 && r.height > 0) setTam({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Flechas del teclado.
  useEffect(() => {
    const abajo = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'a') tecla.current = -1;
      else if (ev.key === 'ArrowRight' || ev.key === 'd') tecla.current = 1;
    };
    const arriba = (ev: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(ev.key)) {
        tecla.current = 0;
        objetivo.current = null;
      }
    };
    window.addEventListener('keydown', abajo);
    window.addEventListener('keyup', arriba);
    return () => {
      window.removeEventListener('keydown', abajo);
      window.removeEventListener('keyup', arriba);
    };
  }, []);

  const vistaAncho = (w: number, h: number): number => Math.max(240, (ALTO * w) / Math.max(1, h));
  const camara = (x: number, vw: number, an: number): number => (vw >= an ? (an - vw) / 2 : Math.max(0, Math.min(an - vw, x - vw / 2)));

  // El bucle: mover a ella, al que la sigue, revisar puertas y quién está cerca.
  useEffect(() => {
    let raf = 0;
    let antes = performance.now();
    const paso = (ahora: number) => {
      const dt = Math.min(0.05, (ahora - antes) / 1000);
      antes = ahora;
      const v = vivo.current;
      const p = pos.current;
      let cambio = false;
      if (v.bloqueado) {
        objetivo.current = null;
        dedo.current = null;
      } else if (dedo.current && caja.current) {
        const r = caja.current.getBoundingClientRect();
        const vw = vistaAncho(r.width, r.height);
        objetivo.current = camara(p.x, vw, v.ancho) + ((dedo.current.cx - r.left) / r.width) * vw;
      } else if (tecla.current !== 0) {
        objetivo.current = p.x + tecla.current * 200;
      }
      const antesCamina = p.camina;
      const obj = objetivo.current;
      if (obj !== null) {
        const meta = Math.max(14, Math.min(v.ancho - 14, obj));
        const d = meta - p.x;
        if (Math.abs(d) < 3) {
          if (!dedo.current && tecla.current === 0) objetivo.current = null;
          p.camina = false;
        } else {
          p.x += Math.sign(d) * Math.min(Math.abs(d), VEL * dt);
          p.dir = d > 0 ? 1 : -1;
          p.camina = true;
          p.fase += dt * 8;
          cambio = true;
        }
      } else p.camina = false;
      if (antesCamina !== p.camina) cambio = true;

      if (v.seguidor) {
        const meta = p.x - p.dir * 58;
        const d = meta - p.fx;
        if (Math.abs(d) > 5) {
          p.fx += Math.sign(d) * Math.min(Math.abs(d), VEL * 1.1 * dt);
          p.fdir = d > 0 ? 1 : -1;
          p.fcamina = true;
          p.ffase += dt * 8;
          cambio = true;
        } else if (p.fcamina) {
          p.fcamina = false;
          p.fdir = p.x >= p.fx ? 1 : -1;
          cambio = true;
        }
      }

      // Puertas: llegar a la orilla caminando hacia ella.
      if (p.x > ORILLA + 24 && p.x < v.ancho - ORILLA - 24) enPuerta.current = false;
      if (!v.bloqueado && !enPuerta.current && p.camina) {
        if (p.x <= ORILLA && p.dir < 0) {
          enPuerta.current = true;
          objetivo.current = null;
          dedo.current = null;
          v.onPuerta('izq');
        } else if (p.x >= v.ancho - ORILLA && p.dir > 0) {
          enPuerta.current = true;
          objetivo.current = null;
          dedo.current = null;
          v.onPuerta('der');
        }
      }

      const c = masCercano(p.x, v.gente);
      if (c !== cercaRef.current) {
        cercaRef.current = c;
        v.onCerca(c);
        cambio = true;
      }
      if (cambio) setFrame((n) => (n + 1) % 1000000);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, []);

  const p = pos.current;
  const vw = vistaAncho(tam.w, tam.h);
  const camX = camara(p.x, vw, ancho);

  const tocar = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (bloqueado) return;
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    dedo.current = { id: ev.pointerId, cx: ev.clientX };
  };
  const mover = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (dedo.current && dedo.current.id === ev.pointerId) dedo.current.cx = ev.clientX;
  };
  const soltar = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!dedo.current || dedo.current.id !== ev.pointerId || !caja.current) return;
    const r = caja.current.getBoundingClientRect();
    const w = vistaAncho(r.width, r.height);
    objetivo.current = camara(p.x, w, ancho) + ((ev.clientX - r.left) / r.width) * w;
    dedo.current = null;
  };

  const poseElla = p.camina ? (Math.floor(p.fase) % 2 === 0 ? PASO_A : PASO_B) : POSES[0];
  const sube = p.camina ? -Math.abs(Math.sin(p.fase * Math.PI)) * 3 : 0;
  const quienHabla = burbuja ? (burbuja.id === 'ella' ? p.x : burbuja.id === 'sigue' ? p.fx : gente.find((g) => g.id === burbuja.id)?.x ?? p.x) : 0;

  return (
    <div
      ref={caja}
      className={styles.escena}
      onPointerDown={tocar}
      onPointerMove={mover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      data-tour="escena"
      aria-label="Escena. Toca o mantén el dedo para caminar."
    >
      <svg className={styles.svg} viewBox={`${f1(camX)} 0 ${f1(vw)} ${ALTO}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Tu lugar">
        <Cuarto escena={escena} ancho={ancho} luz={luz} puertas={puertas} />
        {gente.map((g) => (
          <PersonaFig key={g.id} fig={g} mira={p.x < g.x ? -1 : 1} cerca={cercaRef.current === g.id} />
        ))}
        {seguidor && (
          <g>
            <g transform={poner(p.fx, p.fdir, SC, p.fcamina ? -Math.abs(Math.sin(p.ffase * Math.PI)) * 2.5 : 0)}>
              <CuerpoChico look={seguidor.look} g={seguidor.g} pose={{ ...CHICO_PARADO, paso: p.fcamina ? Math.sin(p.ffase * Math.PI) : 0, izq: [7 + (p.fcamina ? Math.sin(p.ffase * Math.PI) * 12 : 0), 3], der: [7 - (p.fcamina ? Math.sin(p.ffase * Math.PI) * 12 : 0), 3] }} />
            </g>
            <text x={p.fx} y={PISO - 214} className={styles.nombreSigue}>
              ♥ {seguidor.nombre}
            </text>
          </g>
        )}
        <g transform={poner(p.x, p.dir, SE, sube)}>
          <Cuerpo g={gestoElla} ropa={ropa === 'bikini' ? ROPA_BIKINI : ROPA_CASUAL} pose={poseElla} />
        </g>
        {ropaN > 0 && (
          <g key={ropaN} className={styles.destello} style={{ transformOrigin: `${p.x}px ${PISO - 100}px` }}>
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <path key={a} d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="#ffe7a8" transform={`translate(${f1(p.x + Math.cos((a * Math.PI) / 180) * 62)} ${f1(PISO - 100 + Math.sin((a * Math.PI) / 180) * 80)})`} />
            ))}
          </g>
        )}
        {burbuja && <Globo key={burbuja.n} x={quienHabla} texto={burbuja.texto} min={camX} max={camX + vw} />}
      </svg>
    </div>
  );
}
