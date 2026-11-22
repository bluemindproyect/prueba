'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  CALL_SCRIPT,
  HEAR_AT,
  HIM_SECS,
  LOUD,
  SAFE,
  WINDOW_SECS,
  callResult,
  drive,
  fillName,
  replyLength,
  startCall,
  stepCall,
} from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import type { CallResult } from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import { cn } from '@/lib/cn';
import styles from './llamada.module.css';

interface LlamadaProps {
  /** cómo se llama él */
  name: string;
  onFinish: (result: CallResult) => void;
}

const MAX_ANGLE = 70;
const CX = 100;
const CY = 100;
const R = 78;

const point = (deg: number): [number, number] => [CX + R * Math.sin((deg * Math.PI) / 180), CY - R * Math.cos((deg * Math.PI) / 180)];

function arc(a: number, b: number): string {
  const [x1, y1] = point(a);
  const [x2, y2] = point(b);
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 ${b > a ? 1 : 0} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

const SAFE_DEG = SAFE * MAX_ANGLE;
const LOUD_DEG = LOUD * MAX_ANGLE;

const END_TEXT = {
  limpio: 'Cuelga tranquilo.',
  dudas: 'Cuelga callado. Algo se le quedó.',
  sabe: 'Cuelga sin decir nada más.',
} as const;

/** Botón que solo cuenta mientras lo mantienes apretado. */
function HoldButton(props: {
  label: string;
  hint: string;
  side: 'left' | 'right';
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  const { label, hint, side, on, onChange } = props;
  const down = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(true);
  };
  const up = () => onChange(false);
  return (
    <button
      type="button"
      className={cn(styles.hold, styles[side], on && styles.holdOn)}
      aria-pressed={on}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onLostPointerCapture={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <strong>{label}</strong>
      <small>{hint}</small>
    </button>
  );
}

export function Llamada({ name, onFinish }: LlamadaProps) {
  const [s, setS] = useState(() => startCall());
  const [talk, setTalk] = useState(false);
  const [press, setPress] = useState(false);

  // El bucle lee los botones desde refs para no reiniciarse en cada toque.
  const talkRef = useRef(false);
  const pressRef = useRef(false);
  const reduceRef = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const sRef = useRef(s);
  sRef.current = s;

  const setTalking = (on: boolean) => {
    talkRef.current = on;
    setTalk(on);
  };
  const setPressing = (on: boolean) => {
    pressRef.current = on;
    setPress(on);
  };

  useEffect(() => {
    reduceRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setS((prev) => stepCall(prev, { talk: talkRef.current, press: pressRef.current }, dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Teclado, para probarlo en la computadora: ← nivelar, → hablar.
  useEffect(() => {
    const map = (e: KeyboardEvent): 'talk' | 'press' | null =>
      e.key === 'ArrowRight' || e.key === 'd' ? 'talk' : e.key === 'ArrowLeft' || e.key === 'a' ? 'press' : null;
    const onKey = (down: boolean) => (e: KeyboardEvent) => {
      const k = map(e);
      if (!k) return;
      e.preventDefault();
      if (k === 'talk') {
        talkRef.current = down;
        setTalk(down);
      } else {
        pressRef.current = down;
        setPress(down);
      }
    };
    const kd = onKey(true);
    const ku = onKey(false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  // Al terminar, un momento para ver cómo cuelga y se entrega el resultado.
  const done = s.phase === 'done';
  useEffect(() => {
    if (!done) return;
    talkRef.current = false;
    pressRef.current = false;
    const id = window.setTimeout(() => finishRef.current(callResult(sRef.current)), 2000);
    return () => window.clearTimeout(id);
  }, [done]);

  const line = CALL_SCRIPT[Math.min(s.idx, CALL_SCRIPT.length - 1)];
  const len = replyLength(s);
  const d = drive(s.t, s.phi);
  const sway = (s.needle * 4 + Math.sin(s.t * 6) * d * 1.2) * (reduceRef.current ? 0.25 : 1);
  const angle = s.needle * MAX_ANGLE;
  const bpm = Math.round(66 + s.exposure * 0.9);
  const hold = s.phase === 'you' ? Math.max(0, 1 - s.phaseT / WINDOW_SECS) : 0;
  const himText = fillName(line.him, name);
  const himShown = himText.slice(0, Math.floor(himText.length * Math.min(1, (s.phaseT / HIM_SECS) * 1.3)));
  const said = Math.floor(s.chars);
  const verdict = callResult(s).verdict;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={`Llamada de ${name}`}>
      <div className={styles.sway} style={{ transform: `rotate(${sway.toFixed(2)}deg)` }}>
        <header className={styles.head}>
          <div>
            <p className={styles.kicker}>Llamada entrante</p>
            <h2 className={styles.who}>{name}</h2>
          </div>
          <div className={styles.pulse} aria-label={`Pulso de ${name}: ${bpm}`}>
            <span className={styles.beat} style={{ animationDuration: `${(60 / bpm).toFixed(2)}s` }} aria-hidden="true">
              ♥
            </span>
            <span>{bpm}</span>
          </div>
        </header>

        <div className={styles.meter} aria-label="Lo que él oye">
          <span className={styles.meterLabel}>Lo que él oye</span>
          <div className={styles.track}>
            <div className={cn(styles.fill, s.exposure >= HEAR_AT[1] && styles.fillHot)} style={{ width: `${s.exposure}%` }} />
            {HEAR_AT.map((at) => (
              <i key={at} className={styles.tick} style={{ left: `${at}%` }} />
            ))}
          </div>
        </div>

        <div className={styles.chat} aria-live="polite">
          {s.log.slice(-4).map((l, i) => (
            <p key={`${s.log.length}-${i}`} className={cn(styles.line, l.who === 'him' ? styles.him : styles.you, l.heard && styles.heard, l.cut && styles.cut)}>
              <span>{l.who === 'him' ? name : 'Tú'}</span>
              {fillName(l.text, name)}
            </p>
          ))}
          {s.phase === 'him' && (
            <p className={cn(styles.line, styles.him, styles.now)}>
              <span>{name}</span>
              {himShown}
            </p>
          )}
          {s.phase === 'you' && (
            <div className={cn(styles.line, styles.you, styles.now)}>
              <span>Tú · mantén «Hablar»</span>
              <p className={styles.reply}>
                <em>{line.you.slice(0, said)}</em>
                {line.you.slice(said, len)}
              </p>
              <div className={styles.window}>
                <i style={{ width: `${hold * 100}%` }} />
              </div>
            </div>
          )}
          {done && <p className={cn(styles.line, styles.end)}>{END_TEXT[verdict]}</p>}
        </div>

        <svg className={styles.dial} viewBox="0 0 200 112" role="img" aria-label="Aguja de nivel">
          <path d={arc(-MAX_ANGLE, -LOUD_DEG)} className={styles.zLoud} />
          <path d={arc(-LOUD_DEG, -SAFE_DEG)} className={styles.zWarn} />
          <path d={arc(-SAFE_DEG, SAFE_DEG)} className={styles.zSafe} />
          <path d={arc(SAFE_DEG, LOUD_DEG)} className={styles.zWarn} />
          <path d={arc(LOUD_DEG, MAX_ANGLE)} className={styles.zLoud} />
          <g transform={`rotate(${angle.toFixed(1)} ${CX} ${CY})`}>
            <line x1={CX} y1={CY} x2={CX} y2={CY - R + 8} className={styles.needle} />
          </g>
          <circle cx={CX} cy={CY} r={6} className={styles.hub} />
        </svg>

        <div className={styles.controls}>
          <HoldButton side="left" label="Nivelar" hint="mantén para bajar la aguja" on={press} onChange={setPressing} />
          <HoldButton side="right" label="Hablar" hint="mantén para contestar" on={talk} onChange={setTalking} />
        </div>
        <p className={styles.keys}>Teclado: ← nivelar · → hablar</p>
      </div>
    </div>
  );
}
