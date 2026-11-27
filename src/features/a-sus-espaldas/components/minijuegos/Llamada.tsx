'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animoDe,
  colgar,
  altavoz,
  comentar,
  gestoElla,
  nivelDe,
  pulsoDe,
  resultado,
  responder,
  setRitmo,
  startCall2,
  tick2,
} from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { Call2, GestoElla, Ritmo } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { CallResult } from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import type { Tono } from '@/features/a-sus-espaldas/lib/contenido';
import { cn } from '@/lib/cn';
import styles from './llamada.module.css';

interface LlamadaProps {
  /** cómo se llama él */
  name: string;
  onFinish: (result: CallResult) => void;
  /** dentro del paseo: el teléfono se acomoda en su propio espacio en vez de tapar la pantalla */
  incrustada?: boolean;
  /** llamada larga (hasta 10 minutos); el ritmo que eliges decide cuánto tarda */
  largo?: boolean;
  /** el tiempo se detiene (por ejemplo, mientras él abre la puerta) */
  pausada?: boolean;
  /** qué tan rápido pasa el tiempo (1 normal, 2 al doble) */
  acelera?: number;
  /** avisa cada vez que cambia algo en la llamada */
  onProgreso?: (s: Call2) => void;
  /** un gesto o el altavoz que se pide desde afuera; `n` cambia en cada uso */
  empuje?: { tipo: GestoElla | 'altavoz'; n: number };
}

const RITMOS: ReadonlyArray<{ id: Ritmo; label: string }> = [
  { id: 'lento', label: 'Despacio' },
  { id: 'firme', label: 'Firme' },
  { id: 'rapido', label: 'Rápido' },
];

const TONO_TAG: Record<Tono, string> = {
  calma: 'con calma',
  evade: 'evadir',
  tiembla: 'voz temblorosa',
  verdad: 'media verdad',
  choca: 'cambiar la historia',
};

const ANIMO_LABEL = {
  tranquilo: 'tranquilo',
  inquieto: 'inquieto',
  desconfiado: 'desconfiado',
  herido: 'herido',
} as const;

const fill = (text: string, name: string): string => text.replace(/\{n\}/g, name);

export function Llamada({ name, onFinish, incrustada = false, largo = false, pausada = false, acelera = 1, onProgreso, empuje }: LlamadaProps) {
  const [s, setS] = useState<Call2>(() => startCall2(Math.random, { largo }));
  const sRef = useRef(s);
  const logEnd = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const progresoRef = useRef(onProgreso);
  progresoRef.current = onProgreso;
  const quietoRef = useRef(pausada);
  quietoRef.current = pausada;
  const aceleraRef = useRef(acelera);
  aceleraRef.current = acelera;

  const apply = (f: (prev: Call2) => Call2) => {
    sRef.current = f(sRef.current);
    setS(sRef.current);
  };

  // El tiempo: cada décima de segundo sube la excitación y avanza la conversación.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden && !quietoRef.current) apply((prev) => tick2(prev, 0.1 * aceleraRef.current));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const nEmpuje = empuje?.n ?? 0;
  useEffect(() => {
    if (!empuje || nEmpuje === 0) return;
    apply((prev) => (empuje.tipo === 'altavoz' ? altavoz(prev) : gestoElla(prev, empuje.tipo)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nEmpuje]);

  useEffect(() => {
    progresoRef.current?.(s);
  }, [s]);

  useEffect(() => {
    if (s.fase !== 'fin') return;
    const id = window.setTimeout(() => finishRef.current(resultado(sRef.current)), 2400);
    return () => window.clearTimeout(id);
  }, [s.fase]);

  useEffect(() => {
    // Solo se mueve la lista de mensajes, no toda la página.
    const caja = logEnd.current?.parentElement;
    if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: 'smooth' });
  }, [s.log.length]);

  const nivel = nivelDe(s);
  const animo = animoDe(s.sosp, s.dano);
  const bpm = pulsoDe(s);
  const preguntando = (s.fase === 'pregunta' || s.fase === 'quefue') && s.pregunta;
  const rapido = s.ritmo === 'rapido';
  const mm = String(Math.floor(s.t / 60)).padStart(2, '0');
  const ss = String(Math.floor(s.t % 60)).padStart(2, '0');
  const heat = Math.max(s.sosp, s.dano * 0.9);
  const ring = heat < 25 ? '#6fd3a0' : heat < 50 ? '#f0b24a' : heat < 75 ? '#ef7b6a' : '#e0457b';

  return (
    <div className={incrustada ? styles.panel : styles.overlay} role="dialog" aria-label="Llamada">
      {!incrustada && <p className={styles.gameTag}>Minijuego · La llamada</p>}
      <div className={cn(styles.device, rapido && styles.shake)}>
        <span className={styles.notch} aria-hidden="true" />
        <div className={styles.phone}>
        <div className={styles.statusBar}>
          <span className={styles.rec}>
            <i className={styles.recDot} /> en llamada {mm}:{ss}
          </span>
          <span className={styles.bars} aria-hidden="true">
            <i /> <i /> <i /> <i />
          </span>
        </div>

        <header className={styles.contact}>
          <Avatar name={name} color={ring} bpm={bpm} />
          <div className={styles.contactText}>
            <h2 className={styles.who}>{name}</h2>
            <p className={styles.mood}>{ANIMO_LABEL[animo]} · {bpm} lpm</p>
          </div>
          <div className={styles.gauges}>
            <Gauge label="Sospecha" value={s.sosp} color="#f0b24a" />
            <Gauge label="Dolor" value={s.dano} color="#e0457b" />
          </div>
        </header>

        <div className={styles.thought}>
          <p className={styles.thinks}>«{fill(s.piensa || '…', name)}»</p>
          <p className={styles.imagines}>{fill(s.imagina, name)}</p>
          <p className={styles.does}>{fill(s.hace, name)}</p>
        </div>

        <section className={styles.chat} aria-live="polite">
          <p className={styles.day}>Hoy</p>
          {s.log.slice(-9).map((l, i) =>
            l.who === 'ritmo' || l.who === 'nota' ? (
              <p key={`${s.log.length - 9 + i}-${l.text}`} className={cn(styles.sys, l.who === 'ritmo' && styles.sysHot)}>
                {fill(l.text, name)}
              </p>
            ) : (
              <div
                key={`${s.log.length - 9 + i}-${l.text}`}
                className={cn(styles.bubble, l.who === 'ella' ? styles.out : styles.in, l.tono === 'oyo' && (l.who === 'ella' ? styles.outLoud : styles.inHeard))}
              >
                <span>{fill(l.text, name)}</span>
                {l.who === 'ella' && <small className={styles.ticks}>✓✓</small>}
              </div>
            ),
          )}
          <div ref={logEnd} />
        </section>

        <section className={styles.controls} aria-label="Tu lado">
          <div className={styles.dots} role="meter" aria-valuemin={1} aria-valuemax={8} aria-valuenow={nivel} aria-label="Excitación">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className={cn(styles.dot, i < nivel && styles.dotOn, i === nivel - 1 && styles.dotTop)} />
            ))}
            <b className={styles.dotNum}>{nivel}</b>
          </div>
          <p className={cn(styles.narra, rapido && styles.narraHot)}>{s.narra}</p>
          <div className={styles.round} role="group" aria-label="Qué hace el otro">
            {RITMOS.map((r, i) => (
              <button
                key={r.id}
                type="button"
                className={cn(styles.rbtn, s.ritmo === r.id && styles.rbtnOn)}
                aria-pressed={s.ritmo === r.id}
                aria-label={r.label}
                disabled={s.fase === 'fin' || s.fase === 'comenta'}
                onClick={() => apply((p) => setRitmo(p, r.id))}
              >
                <span className={styles.chev} aria-hidden="true">{'›'.repeat(i + 1)}</span>
                <small>{r.label}</small>
              </button>
            ))}
            <button
              type="button"
              className={cn(styles.rbtn, styles.hang)}
              aria-label="Colgar"
              disabled={s.fase !== 'cuelga'}
              onClick={() => apply((p) => colgar(p, 'ella'))}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path fill="currentColor" d="M12 9c-3.2 0-6.2.8-8.6 2.4-.5.3-.6 1-.2 1.5l1.7 2c.3.4.9.5 1.3.2l2.4-1.4c.3-.2.5-.5.5-.9V11.6c1.5-.4 3.1-.4 4.6 0v1.2c0 .4.2.7.5.9l2.4 1.4c.4.3 1 .2 1.3-.2l1.7-2c.4-.5.3-1.2-.2-1.5C18.2 9.8 15.2 9 12 9Z" />
              </svg>
              <small>Colgar</small>
            </button>
          </div>
          {s.dano >= 20 && <p className={styles.pobre}>{s.pobre}</p>}
        </section>

        {preguntando && s.pregunta && (
          <div className={styles.sheet} role="group" aria-label="Qué contestas">
            <span className={styles.grab} aria-hidden="true" />
            <div className={styles.chips}>
              {s.pregunta.opciones.map((o, i) => (
                <button key={`${i}-${o.texto}`} type="button" className={styles.chip} onClick={() => apply((p) => responder(p, i))}>
                  <small className={cn(styles.tag, styles[`tag_${o.tono}`])}>{TONO_TAG[o.tono]}</small>
                  <span>{fill(o.texto, name)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {s.fase === 'comenta' && s.prompt && (
          <div className={styles.modal} role="alertdialog" aria-label="Se te escapa">
            <div className={styles.card}>
              <p className={styles.promptKick}>{s.prompt.nivel >= 8 ? 'Ya no aguantas más' : `Nivel ${s.prompt.nivel}`}</p>
              <p className={styles.promptText}>«{s.prompt.texto}»</p>
              <button type="button" className={cn(styles.act, styles.actHot)} onClick={() => apply((p) => comentar(p, true))}>
                {s.prompt.nivel >= 8 ? 'Que se oiga' : 'Decirlo'}
              </button>
              <button type="button" className={styles.act} onClick={() => apply((p) => comentar(p, false))}>
                {s.prompt.nivel >= 8 ? 'Tragártelo' : 'Callarlo'}
              </button>
            </div>
          </div>
        )}

        {s.fase === 'cuelga' && (
          <div className={styles.modal} role="alertdialog" aria-label="Se acaba la llamada">
            <div className={styles.card}>
              <p className={styles.promptKick}>Se acaba la llamada</p>
              <button type="button" className={styles.act} onClick={() => apply((p) => colgar(p, 'ella'))}>
                Cuelgo yo
              </button>
              <button type="button" className={styles.act} onClick={() => apply((p) => colgar(p, 'el'))}>
                Lo dejo colgar
              </button>
            </div>
          </div>
        )}

        {s.fase === 'reaccion' && <p className={styles.wait}>Te escucha…</p>}
        {s.fase === 'fin' && <p className={styles.wait}>{s.colgo === 'el' ? 'Cuelga.' : 'Cuelgas.'}</p>}
        </div>
      </div>
    </div>
  );
}

/** Avatar con anillo que late con su pulso y cambia de color según cómo está él. */
function Avatar({ name, color, bpm }: { name: string; color: string; bpm: number }) {
  return (
    <div className={styles.avatar} style={{ ['--ring' as string]: color, ['--beat' as string]: `${(60 / bpm).toFixed(2)}s` }}>
      <span>{name.trim().charAt(0).toUpperCase() || '?'}</span>
    </div>
  );
}

/** Medidor circular de 0 a 100. */
function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  const R = 15;
  const C = 2 * Math.PI * R;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={styles.gauge}>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-label={`${label} ${Math.round(v)}`}>
        <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(C * v) / 100} ${C}`}
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <small>{label}</small>
    </div>
  );
}
