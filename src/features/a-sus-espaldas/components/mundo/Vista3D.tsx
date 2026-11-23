'use client';

import { useEffect, useRef } from 'react';
import { ambienteDe, construirCuarto, hotspotsDe, Motor3D, proyectar } from '@/features/a-sus-espaldas/lib/mundo/mundo3d';
import type { Camara, GPU, Hotspot, Item } from '@/features/a-sus-espaldas/lib/mundo/mundo3d';
import { ident } from '@/features/a-sus-espaldas/lib/mundo/chica3d';
import type { V3 } from '@/features/a-sus-espaldas/lib/mundo/chica3d';
import type { Escena } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import { Chica } from './Chica';
import { Rostro } from './Rostro';
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
  etiqueta?: string;
  onTap?: (id: string) => void;
  hotspots?: Hotspot['id'][];
  onHotspot?: (id: Hotspot['id']) => void;
  /** si viene, ella camina con joystick y la cámara la sigue */
  ella?: { gesto: Gesto };
  /** persona más cercana a ella (o null) */
  onCerca?: (id: string | null) => void;
  /** reduce etiquetas y controles (ventanita) */
  mini?: boolean;
}

interface Actor {
  x: number;
  z: number;
  tx: number;
  tz: number;
  caminando: boolean;
  fase: number;
  flip: number;
  sx: number;
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
const LIM = { x0: -165, x1: 165, z0: -20, z1: 95 };
const ALTO_MUNDO = 172;
const ALTO_SPRITE = 224;
const rango = 78;

const hora4 = (h: number): number => Math.floor(h / 60 / 4);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

function Chico2D({ h }: { h: Habitante }) {
  return (
    <div className={styles.chico}>
      <Rostro g={h.gesto} aspecto={{ piel: h.piel, pelo: h.pelo }} size={50} />
      <svg width="64" height="132" viewBox="0 0 64 132" aria-hidden className={styles.cuerpo}>
        <ellipse cx="32" cy="128" rx="24" ry="4" fill="#000" fillOpacity="0.15" />
        <rect x="26" y="0" width="12" height="8" rx="3" fill={h.piel} />
        <rect x="6" y="6" width="9" height="46" rx="4.5" fill={h.ropa} />
        <rect x="49" y="6" width="9" height="46" rx="4.5" fill={h.ropa} />
        <rect x="8" y="48" width="7" height="12" rx="3.5" fill={h.piel} />
        <rect x="49" y="48" width="7" height="12" rx="3.5" fill={h.piel} />
        <rect x="12" y="4" width="40" height="52" rx="10" fill={h.ropa} />
        <rect x="14" y="52" width="16" height="70" rx="6" fill={h.pantalon} />
        <rect x="34" y="52" width="16" height="70" rx="6" fill={h.pantalon} />
        <rect x="12" y="118" width="19" height="9" rx="4" fill="#26222a" />
        <rect x="33" y="118" width="19" height="9" rx="4" fill="#26222a" />
      </svg>
    </div>
  );
}

/** Un cuarto en 3D con personas 2D que se mueven; ella camina con joystick. */
export function Vista3D({ escena, hora, gente, vista, foco = null, etiqueta, onTap, hotspots = [], onHotspot, ella, onCerca, mini = false }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const etq = useRef(new Map<string, HTMLElement>());
  const hot = useRef(new Map<string, HTMLElement>());
  const spr = useRef(new Map<string, HTMLElement>());
  const eng = useRef<{
    motor: Motor3D | null;
    cuarto: GPU[];
    clave: string;
    actores: Map<string, Actor>;
    primera: boolean;
    cam: { pos: V3; obj: V3 };
    ancho: number;
    alto: number;
    yo: { x: number; z: number; flip: number; sx: number; mov: boolean };
    ang: number;
    cerca: string | null;
  }>({ motor: null, cuarto: [], clave: '', actores: new Map(), primera: true, cam: { pos: [0, 150, 200], obj: [0, 125, -60] }, ancho: 0, alto: 0, yo: { x: -95, z: 70, flip: 1, sx: 0, mov: false }, ang: 0, cerca: null });
  const props = useRef({ escena, hora, gente, vista, foco, hotspots, ella, onCerca });
  props.current = { escena, hora, gente, vista, foco, hotspots, ella, onCerca };
  const joy = useRef({ x: 0, y: 0 });
  const teclas = useRef(new Set<string>());
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);

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
      const anc = Math.max(120, w.clientWidth);
      const alt = Math.max(120, w.clientHeight);
      if (E.ancho === anc && E.alto === alt) return;
      E.ancho = anc;
      E.alto = alt;
      c.width = Math.round(anc * dpr);
      c.height = Math.round(alt * dpr);
    };

    const alTeclado = (ev: KeyboardEvent, on: boolean) => {
      const k = ev.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        if (on) teclas.current.add(k);
        else teclas.current.delete(k);
      }
    };
    const kd = (ev: KeyboardEvent) => alTeclado(ev, true);
    const ku = (ev: KeyboardEvent) => alTeclado(ev, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const colocar = (el: HTMLElement | undefined, p: V3, alto: number, flip: number, rebote: number, sway: number): [number, number] | null => {
      if (!el) return null;
      const pie = proyectar(motor.vp, p, E.ancho, E.alto);
      const cab = proyectar(motor.vp, [p[0], p[1] + alto, p[2]], E.ancho, E.alto);
      if (!pie || !cab) {
        el.style.opacity = '0';
        return null;
      }
      const s = Math.max(0.05, (pie[1] - cab[1]) / ALTO_SPRITE);
      el.style.transform = `translate(${pie[0]}px, ${pie[1]}px) translate(-50%, -100%) scale(${s})`;
      el.style.zIndex = String(Math.round(1000 + p[2]));
      el.style.opacity = '1';
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) inner.style.transform = `translateY(${-rebote}px) rotate(${sway}deg) scaleX(${flip})`;
      return pie;
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

      const clave = `${P.escena}|${hora4(P.hora)}`;
      if (clave !== E.clave) {
        motor.liberar(E.cuarto);
        E.cuarto = motor.subir(construirCuarto(P.escena, P.hora));
        if (P.escena + '' !== E.clave.split('|')[0]) {
          E.actores.clear();
          E.primera = true;
          E.yo.x = -95;
          E.yo.z = 70;
        }
        E.clave = clave;
      }

      const ids = new Set(P.gente.map((g) => g.id));
      for (const id of [...E.actores.keys()]) if (!ids.has(id)) E.actores.delete(id);
      P.gente.forEach((h, i) => {
        const slot = SLOTS[i % SLOTS.length];
        let a = E.actores.get(h.id);
        if (!a) {
          a = { x: E.primera ? slot[0] : PUERTA[0], z: E.primera ? slot[1] : PUERTA[1], tx: slot[0], tz: slot[1], caminando: false, fase: Math.random() * 6, flip: 1, sx: 0, hab: h };
          E.actores.set(h.id, a);
        }
        a.hab = h;
        a.tx = slot[0];
        a.tz = slot[1];
      });
      E.primera = false;

      // ella: joystick + teclado, relativo a la cámara
      const ella = P.ella;
      const yo = E.yo;
      if (ella) {
        const k = teclas.current;
        let jx = joy.current.x;
        let jy = joy.current.y;
        if (k.has('a') || k.has('arrowleft')) jx -= 1;
        if (k.has('d') || k.has('arrowright')) jx += 1;
        if (k.has('w') || k.has('arrowup')) jy += 1;
        if (k.has('s') || k.has('arrowdown')) jy -= 1;
        const m = Math.hypot(jx, jy);
        if (m > 1) {
          jx /= m;
          jy /= m;
        }
        const a = E.ang;
        const vx = Math.sin(a) * jy + Math.cos(a) * jx;
        const vz = -Math.cos(a) * jy + Math.sin(a) * jx;
        yo.mov = Math.hypot(jx, jy) > 0.12;
        if (yo.mov) {
          yo.x = clamp(yo.x + vx * 88 * paso, LIM.x0, LIM.x1);
          yo.z = clamp(yo.z + vz * 88 * paso, LIM.z0, LIM.z1);
        }
        // persona más cercana
        let mejor: string | null = null;
        let dm = rango;
        for (const a2 of E.actores.values()) {
          if (!a2.hab.tocable) continue;
          const d = Math.hypot(a2.x - yo.x, a2.z - yo.z);
          if (d < dm) {
            dm = d;
            mejor = a2.hab.id;
          }
        }
        if (mejor !== E.cerca) {
          E.cerca = mejor;
          P.onCerca?.(mejor);
        }
      }

      const items: Item[] = [{ g: E.cuarto, m: ident() }];

      // cámara
      let pos: V3;
      let obj: V3;
      if (P.vista === 'pov' && ella) {
        const a = E.ang;
        pos = [clamp(yo.x - Math.sin(a) * 330, -300, 300), 215 + Math.sin(t * 0.9) * 0.8, Math.min(420, yo.z + Math.cos(a) * 330)];
        obj = [yo.x * 0.6, 78, yo.z - 120];
      } else if (P.vista === 'pov') {
        pos = [Math.sin(t * 0.5) * 4, 152, 205];
        obj = [Math.sin(t * 0.3) * 14, 128, -60];
      } else {
        const principal = [...E.actores.values()][0];
        const cx = principal ? principal.x : 0;
        const cz = principal ? principal.z : -40;
        const ang = (Math.sin(t * 0.18) * 28 + 20) * (Math.PI / 180);
        pos = [cx + Math.sin(ang) * 290, 125 + Math.sin(t * 0.4) * 6, cz + Math.cos(ang) * 290 + 20];
        obj = [cx, 88, cz];
      }
      const kc = Math.min(1, paso * 6);
      E.cam.pos = [lerp(E.cam.pos[0], pos[0], kc), lerp(E.cam.pos[1], pos[1], kc), lerp(E.cam.pos[2], pos[2], kc)];
      E.cam.obj = [lerp(E.cam.obj[0], obj[0], kc), lerp(E.cam.obj[1], obj[1], kc), lerp(E.cam.obj[2], obj[2], kc)];
      const cam: Camara = { pos: E.cam.pos, objetivo: E.cam.obj, fov: P.vista === 'pov' ? (P.ella ? 0.85 : 0.95) : 0.8 };
      motor.dibujar(items, cam, ambienteDe(P.escena, P.hora));

      // personas 2D sobre el 3D
      const ancho = E.ancho;
      const alto = E.alto;
      for (const a of E.actores.values()) {
        const dx = a.tx - a.x;
        const dz = a.tz - a.z;
        const d = Math.hypot(dx, dz);
        if (d > 2) {
          const v = Math.min(d, 62 * paso);
          a.x += (dx / d) * v;
          a.z += (dz / d) * v;
          a.caminando = true;
        } else a.caminando = false;
        const rebote = a.caminando ? Math.abs(Math.sin(t * 9 + a.fase)) * 7 : Math.sin(t * 1.9 + a.fase) * 0.9;
        const sway = a.caminando ? Math.sin(t * 9 + a.fase) * 3 : Math.sin(t * 0.8 + a.fase) * 0.7;
        const el = spr.current.get(a.hab.id);
        const pie = colocar(el, [a.x, 0, a.z], ALTO_MUNDO, a.flip, rebote, sway);
        if (pie) {
          if (Math.abs(pie[0] - a.sx) > 0.3 && a.caminando) a.flip = pie[0] > a.sx ? 1 : -1;
          a.sx = pie[0];
        }
        const e2 = etq.current.get(a.hab.id);
        const cab = proyectar(motor.vp, [a.x, ALTO_MUNDO + 8, a.z], ancho, alto);
        if (e2) {
          if (cab) {
            e2.style.transform = `translate(${clamp(cab[0], 60, ancho - 60)}px, ${Math.max(cab[1], 170)}px) translate(-50%, -100%)`;
            e2.style.opacity = '1';
          } else e2.style.opacity = '0';
        }
      }
      if (ella) {
        const rebote = yo.mov ? Math.abs(Math.sin(t * 10)) * 8 : Math.sin(t * 1.8) * 1;
        const sway = yo.mov ? Math.sin(t * 10) * 3.5 : Math.sin(t * 0.9) * 0.8;
        const pie = colocar(spr.current.get('ella'), [yo.x, 0, yo.z], 165, yo.flip, rebote, sway);
        if (pie) {
          if (Math.abs(pie[0] - yo.sx) > 0.3 && yo.mov) yo.flip = pie[0] > yo.sx ? 1 : -1;
          yo.sx = pie[0];
        }
      }
      for (const h of hotspotsDe(P.escena)) {
        const el = hot.current.get(h.id);
        if (!el) continue;
        const s = proyectar(motor.vp, h.pos, ancho, alto);
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
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      motor.liberar(E.cuarto);
      E.cuarto = [];
      E.clave = '';
      E.actores.clear();
      E.primera = true;
      E.motor = null;
      E.ancho = 0;
    };
  }, []);

  // joystick táctil
  const moverJoy = (cx: number, cy: number) => {
    const b = base.current;
    const k = knob.current;
    if (!b || !k) return;
    const r = b.getBoundingClientRect();
    let dx = cx - (r.left + r.width / 2);
    let dy = cy - (r.top + r.height / 2);
    const max = r.width / 2 - 14;
    const m = Math.hypot(dx, dy);
    if (m > max) {
      dx = (dx / m) * max;
      dy = (dy / m) * max;
    }
    k.style.transform = `translate(${dx}px, ${dy}px)`;
    joy.current = { x: dx / max, y: -dy / max };
  };
  const soltarJoy = () => {
    joy.current = { x: 0, y: 0 };
    if (knob.current) knob.current.style.transform = 'translate(0,0)';
  };
  // arrastrar la pantalla gira la cámara
  const arrastre = useRef<number | null>(null);

  const hs = hotspotsDe(escena).filter((h) => hotspots.includes(h.id));
  return (
    <div
      ref={wrap}
      className={styles.wrap}
      onPointerDown={(ev) => {
        if (ella && ev.target === ev.currentTarget.querySelector('canvas')) arrastre.current = ev.clientX;
      }}
      onPointerMove={(ev) => {
        if (arrastre.current !== null) {
          eng.current.ang += (ev.clientX - arrastre.current) * 0.006;
          arrastre.current = ev.clientX;
        }
      }}
      onPointerUp={() => (arrastre.current = null)}
      onPointerLeave={() => (arrastre.current = null)}
    >
      <canvas ref={canvas} className={styles.canvas} />
      {etiqueta && <span className={styles.etq}>{etiqueta}</span>}
      <div className={styles.capa}>
        {gente.map((g) => (
          <div
            key={g.id}
            ref={(el) => {
              if (el) spr.current.set(g.id, el);
              else spr.current.delete(g.id);
            }}
            className={styles.sprite}
          >
            <div className={styles.dentro}>
              <Chico2D h={g} />
            </div>
          </div>
        ))}
        {ella && (
          <div
            ref={(el) => {
              if (el) spr.current.set('ella', el);
              else spr.current.delete('ella');
            }}
            className={styles.sprite}
          >
            <div className={styles.dentro}>
              <Chica g={ella.gesto} size={100} />
            </div>
          </div>
        )}
        {!mini &&
          gente.map((g) => (
            <button
              key={`n-${g.id}`}
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
        {!mini &&
          hs.map((h) => (
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
      {ella && !mini && (
        <div
          ref={base}
          className={styles.joy}
          onPointerDown={(ev) => {
            ev.currentTarget.setPointerCapture(ev.pointerId);
            moverJoy(ev.clientX, ev.clientY);
          }}
          onPointerMove={(ev) => {
            if (ev.buttons || ev.pointerType === 'touch') moverJoy(ev.clientX, ev.clientY);
          }}
          onPointerUp={soltarJoy}
          onPointerCancel={soltarJoy}
        >
          <div ref={knob} className={styles.knob} />
        </div>
      )}
    </div>
  );
}
