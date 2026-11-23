'use client';

import { useEffect, useRef } from 'react';
import { ambienteDe, construirCuarto, construirHombre, hotspotsDe, Motor3D, proyectar } from '@/features/a-sus-espaldas/lib/mundo/mundo3d';
import type { Camara, GPU, Hotspot, Item } from '@/features/a-sus-espaldas/lib/mundo/mundo3d';
import { ident, mul, rotY, rotZ, trans } from '@/features/a-sus-espaldas/lib/mundo/chica3d';
import type { M4, V3 } from '@/features/a-sus-espaldas/lib/mundo/chica3d';
import type { Escena } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import styles from './vista3d.module.css';

export interface Habitante {
  id: string;
  nombre: string;
  piel: string;
  pelo: string;
  ropa: string;
  pantalon: string;
  gesto: Gesto;
  abatido?: boolean;
  /** texto corto bajo el nombre */
  nota?: string;
  /** se puede tocar */
  tocable?: boolean;
}

interface Props {
  escena: Escena;
  hora: number;
  gente: Habitante[];
  vista: 'pov' | 'tercera';
  foco?: string | null;
  alto: number;
  etiqueta: string;
  onTap?: (id: string) => void;
  hotspots?: Hotspot['id'][];
  onHotspot?: (id: Hotspot['id']) => void;
}

interface Actor {
  x: number;
  z: number;
  tx: number;
  tz: number;
  yaw: number;
  caminando: boolean;
  fase: number;
  hab: Habitante;
}

const SLOTS: [number, number][] = [
  [0, 35],
  [-85, 15],
  [85, 15],
  [-140, 60],
  [140, 60],
  [0, 85],
  [-60, 100],
  [60, 100],
];
const PUERTA: [number, number] = [190, 30];
const CICLO = 6;

const hora4 = (h: number): number => Math.floor(h / 60 / 4); // cambia el cielo cada 4 h
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Un cuarto en 3D con gente que respira, camina y cambia de cara. */
export function Vista3D({ escena, hora, gente, vista, foco = null, alto, etiqueta, onTap, hotspots = [], onHotspot }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const etq = useRef(new Map<string, HTMLElement>());
  const hot = useRef(new Map<string, HTMLElement>());
  const eng = useRef<{ motor: Motor3D | null; cuarto: GPU[]; clave: string; cache: Map<string, GPU[]>; actores: Map<string, Actor>; primera: boolean; cam: { pos: V3; obj: V3 }; ancho: number }>({ motor: null, cuarto: [], clave: '', cache: new Map(), actores: new Map(), primera: true, cam: { pos: [0, 150, 200], obj: [0, 125, -60] }, ancho: 0 });
  const props = useRef({ escena, hora, gente, vista, foco, alto, hotspots });
  props.current = { escena, hora, gente, vista, foco, alto, hotspots };

  // motor y bucle
  useEffect(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const E = eng.current;
    try {
      E.motor = new Motor3D(c);
    } catch {
      return;
    }
    const motor = E.motor;
    let raf = 0;
    let ultimo = performance.now();
    let acum = 0;

    const ajustar = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const anc = Math.max(200, w.clientWidth);
      if (E.ancho === anc && c.height === Math.round(props.current.alto * dpr)) return;
      E.ancho = anc;
      c.width = Math.round(anc * dpr);
      c.height = Math.round(props.current.alto * dpr);
    };

    const figura = (a: Actor, frame: number): GPU[] => {
      const h = a.hab;
      const k = `${h.id}|${h.gesto.id}|${frame}|${h.abatido ? 1 : 0}|${h.piel}`;
      let g = E.cache.get(k);
      if (!g) {
        const marcha = frame < 0 ? 0 : Math.sin((frame / CICLO) * Math.PI * 2);
        g = motor.subir(construirHombre({ piel: h.piel, pelo: h.pelo, ropa: h.ropa, pantalon: h.pantalon, gesto: h.gesto, marcha, bajo: h.abatido, brazos: h.abatido ? [5, 3, 5, 3] : undefined }));
        E.cache.set(k, g);
        if (E.cache.size > 160) {
          const primera = E.cache.keys().next().value as string;
          motor.liberar(E.cache.get(primera) ?? []);
          E.cache.delete(primera);
        }
      }
      return g;
    };

    const bucle = (ahora: number) => {
      raf = requestAnimationFrame(bucle);
      const dt = Math.min(0.1, (ahora - ultimo) / 1000);
      ultimo = ahora;
      acum += dt;
      if (acum < 1 / 30) return;
      const paso = acum;
      acum = 0;
      const P = props.current;
      ajustar();
      const t = ahora / 1000;

      // cuarto
      const clave = `${P.escena}|${hora4(P.hora)}`;
      if (clave !== E.clave) {
        motor.liberar(E.cuarto);
        E.cuarto = motor.subir(construirCuarto(P.escena, P.hora));
        E.clave = clave;
        // al cambiar de cuarto todos aparecen ya en su lugar
        E.actores.clear();
        E.primera = true;
      }

      // actores: altas, bajas y destinos
      const ids = new Set(P.gente.map((g) => g.id));
      for (const id of [...E.actores.keys()]) if (!ids.has(id)) E.actores.delete(id);
      P.gente.forEach((h, i) => {
        const slot = SLOTS[i % SLOTS.length];
        let a = E.actores.get(h.id);
        if (!a) {
          a = { x: E.primera ? slot[0] : PUERTA[0], z: E.primera ? slot[1] : PUERTA[1], tx: slot[0], tz: slot[1], yaw: E.primera ? 0 : -90, caminando: false, fase: Math.random() * 6, hab: h };
          E.actores.set(h.id, a);
        }
        a.hab = h;
        a.tx = slot[0];
        a.tz = slot[1];
      });
      E.primera = false;

      const items: Item[] = [{ g: E.cuarto, m: ident() }];
      const cabezas: [string, V3][] = [];
      for (const a of E.actores.values()) {
        const dx = a.tx - a.x;
        const dz = a.tz - a.z;
        const d = Math.hypot(dx, dz);
        if (d > 2) {
          const v = Math.min(d, 62 * paso);
          a.x += (dx / d) * v;
          a.z += (dz / d) * v;
          const yawObj = (Math.atan2(dx, dz) * 180) / Math.PI;
          a.yaw += ((((yawObj - a.yaw + 540) % 360) - 180)) * Math.min(1, paso * 9);
          a.caminando = true;
        } else {
          a.caminando = false;
          a.yaw += ((((0 - a.yaw + 540) % 360) - 180)) * Math.min(1, paso * 5);
        }
        const frame = a.caminando ? Math.floor((t * 7 + a.fase) % CICLO) : -1;
        const resp = 1 + 0.008 * Math.sin(t * 1.9 + a.fase);
        const balanceo = a.caminando ? 0 : 1.1 * Math.sin(t * 0.8 + a.fase);
        const rebote = a.caminando ? Math.abs(Math.sin(t * 7 * Math.PI / CICLO * 2)) * 1.6 : 0;
        const m: M4 = mul(trans(a.x, rebote, a.z), mul(rotY(a.yaw), mul(rotZ(balanceo), [1, 0, 0, 0, 0, resp, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])));
        items.push({ g: figura(a, frame), m });
        cabezas.push([a.hab.id, [a.x, 178, a.z]]);
      }

      // cámara
      const foc = P.foco ? E.actores.get(P.foco) : undefined;
      let pos: V3;
      let obj: V3;
      if (P.vista === 'pov') {
        pos = [Math.sin(t * 0.5) * 4, 152 + Math.sin(t * 1.1) * 1.4, 205];
        obj = foc ? [foc.x * 0.6, 135, foc.z] : [Math.sin(t * 0.3) * 14, 128, -60];
      } else {
        const principal = [...E.actores.values()][0];
        const cx = principal ? principal.x : 0;
        const cz = principal ? principal.z : -40;
        const ang = (Math.sin(t * 0.18) * 28 + 20) * (Math.PI / 180);
        pos = [cx + Math.sin(ang) * 290, 125 + Math.sin(t * 0.4) * 6, cz + Math.cos(ang) * 290 + 20];
        obj = [cx, 88, cz];
      }
      const k = Math.min(1, paso * 3);
      E.cam.pos = [lerp(E.cam.pos[0], pos[0], k), lerp(E.cam.pos[1], pos[1], k), lerp(E.cam.pos[2], pos[2], k)];
      E.cam.obj = [lerp(E.cam.obj[0], obj[0], k), lerp(E.cam.obj[1], obj[1], k), lerp(E.cam.obj[2], obj[2], k)];
      const cam: Camara = { pos: E.cam.pos, objetivo: E.cam.obj, fov: P.vista === 'pov' ? 0.95 : 0.8 };
      motor.dibujar(items, cam, ambienteDe(P.escena, P.hora));

      // etiquetas y hotspots sobre el 3D
      const ancho = E.ancho;
      for (const [id, p] of cabezas) {
        const el = etq.current.get(id);
        if (!el) continue;
        const s = proyectar(motor.vp, p, ancho, P.alto);
        if (s) {
          el.style.transform = `translate(${Math.min(Math.max(s[0], 60), ancho - 60)}px, ${Math.max(s[1], 44)}px) translate(-50%, -100%)`;
          el.style.opacity = '1';
        } else el.style.opacity = '0';
      }
      for (const h of hotspotsDe(P.escena)) {
        const el = hot.current.get(h.id);
        if (!el) continue;
        const s = proyectar(motor.vp, h.pos, ancho, P.alto);
        if (s) {
          el.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -50%)`;
          el.style.opacity = '1';
        } else el.style.opacity = '0';
      }
    };
    ajustar();
    raf = requestAnimationFrame(bucle);
    return () => {
      cancelAnimationFrame(raf);
      motor.liberar(E.cuarto);
      for (const g of E.cache.values()) motor.liberar(g);
      E.cache.clear();
      E.cuarto = [];
      E.clave = '';
      E.actores.clear();
      E.primera = true;
      E.motor = null;
    };
  }, []);

  const hs = hotspotsDe(escena).filter((h) => hotspots.includes(h.id));
  return (
    <div ref={wrap} className={styles.wrap} style={{ height: alto }}>
      <canvas ref={canvas} className={styles.canvas} style={{ height: alto }} />
      <span className={styles.etq}>{etiqueta}</span>
      <div className={styles.capa}>
        {gente.map((g) => (
          <button
            key={g.id}
            type="button"
            ref={(el) => {
              if (el) etq.current.set(g.id, el);
              else etq.current.delete(g.id);
            }}
            className={`${styles.nombre} ${foco === g.id ? styles.nombreOn : ''}`}
            disabled={!g.tocable}
            onClick={() => onTap?.(g.id)}
          >
            <strong>{g.nombre}</strong>
            {g.nota && <span>{g.nota}</span>}
          </button>
        ))}
        {hs.map((h) => (
          <button
            key={h.id}
            type="button"
            ref={(el) => {
              if (el) hot.current.set(h.id, el);
              else hot.current.delete(h.id);
            }}
            className={styles.hot}
            onClick={() => onHotspot?.(h.id)}
          >
            {h.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
