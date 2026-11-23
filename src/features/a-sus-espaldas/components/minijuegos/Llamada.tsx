'use client';

import { useEffect, useRef, useState } from 'react';
import {
  animoDe,
  colgar,
  comentar,
  nivelDe,
  pulsoDe,
  resultado,
  responder,
  setRitmo,
  startCall2,
  tick2,
} from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { Call2, Ritmo } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { CallResult } from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import type { Tono } from '@/features/a-sus-espaldas/lib/contenido';
import { cn } from '@/lib/cn';
import styles from './llamada.module.css';

interface LlamadaProps {
  /** cómo se llama él */
  name: string;
  onFinish: (result: CallResult) => void;
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

export function Llamada({ name, onFinish }: LlamadaProps) {
  const [s, setS] = useState<Call2>(() => startCall2());
  const sRef = useRef(s);
  const logEnd = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const apply = (f: (prev: Call2) => Call2) => {
    sRef.current = f(sRef.current);
    setS(sRef.current);
  };

  // El tiempo: cada décima de segundo sube la excitación y avanza la conversación.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) apply((prev) => tick2(prev, 0.1));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (s.fase !== 'fin') return;
    const id = window.setTimeout(() => finishRef.current(resultado(sRef.current)), 2400);
    return () => window.clearTimeout(id);
  }, [s.fase]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [s.log.length]);

  const nivel = nivelDe(s);
  const animo = animoDe(s.sosp, s.dano);
  const bpm = pulsoDe(s);
  const preguntando = (s.fase === 'pregunta' || s.fase === 'quefue') && s.pregunta;
  const rapido = s.ritmo === 'rapido';

  return (
    <div className={styles.overlay} role="dialog" aria-label="Llamada">
      <div className={cn(styles.sheet, rapido && styles.shake)}>
        <header className={styles.head}>
          <div>
            <p className={styles.kicker}>Llamada entrante</p>
            <h2 className={styles.who}>{name}</h2>
          </div>
          <div className={styles.pulse} aria-label={`Pulso ${bpm}`}>
            <span className={styles.beat} style={{ animationDuration: `${(60 / bpm).toFixed(2)}s` }}>
              ♥
            </span>
            <span>{bpm}</span>
            <span className={styles.mood}>{ANIMO_LABEL[animo]}</span>
          </div>
        </header>

        <section className={styles.him} aria-label="Lo que pasa dentro de él">
          <p className={styles.thinks}>«{fill(s.piensa || '…', name)}»</p>
          <p className={styles.does}>{fill(s.hace, name)}</p>
          <p className={styles.imagines}>{fill(s.imagina, name)}</p>
          <div className={styles.meters}>
            <Meter label="Lo que sospecha" value={s.sosp} tone="warn" />
            <Meter label="Cuánto le duele" value={s.dano} tone="hurt" />
          </div>
        </section>

        <section className={styles.log} aria-live="polite">
          {s.log.slice(-8).map((l, i) => (
            <p
              key={`${s.log.length - 8 + i}-${l.text}`}
              className={cn(
                styles.line,
                l.who === 'el' && styles.lineHim,
                l.who === 'el' && l.tono === 'oyo' && styles.lineHeard,
                l.who === 'ella' && styles.lineYou,
                l.who === 'ella' && l.tono === 'oyo' && styles.lineLoud,
                l.who === 'ritmo' && styles.lineRhythm,
                l.who === 'nota' && styles.lineNote,
              )}
            >
              {fill(l.text, name)}
            </p>
          ))}
          <div ref={logEnd} />
        </section>

        <section className={styles.her} aria-label="Tu lado">
          <div className={styles.excit} role="meter" aria-valuemin={1} aria-valuemax={8} aria-valuenow={nivel} aria-label="Excitación">
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className={cn(styles.seg, i < nivel && styles.segOn, i === nivel - 1 && styles.segTop)} />
            ))}
            <span className={styles.excitNum}>{nivel}/8</span>
          </div>
          <p className={cn(styles.narra, rapido && styles.narraHot)}>{s.narra}</p>
          <div className={styles.rhythm} role="group" aria-label="Qué hace el otro">
            {RITMOS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={cn(styles.rbtn, s.ritmo === r.id && styles.rbtnOn)}
                aria-pressed={s.ritmo === r.id}
                disabled={s.fase === 'fin' || s.fase === 'comenta'}
                onClick={() => apply((p) => setRitmo(p, r.id))}
              >
                {r.label}
              </button>
            ))}
          </div>
          {s.dano >= 20 && <p className={styles.pobre}>{s.pobre}</p>}
        </section>

        <section className={styles.actions}>
          {preguntando && s.pregunta && (
            <div className={styles.opts}>
              {s.pregunta.opciones.map((o, i) => (
                <button key={`${i}-${o.texto}`} type="button" className={styles.opt} onClick={() => apply((p) => responder(p, i))}>
                  <small className={styles.tag}>{TONO_TAG[o.tono]}</small>
                  <span>{fill(o.texto, name)}</span>
                </button>
              ))}
            </div>
          )}
          {s.fase === 'comenta' && s.prompt && (
            <div className={styles.prompt}>
              <p className={styles.promptKick}>{s.prompt.nivel >= 8 ? 'Ya viene, ya no te aguantas' : `Nivel ${s.prompt.nivel}: se te escapa`}</p>
              <p className={styles.promptText}>«{s.prompt.texto}»</p>
              <div className={styles.row}>
                <button type="button" className={cn(styles.big, styles.bigHot)} onClick={() => apply((p) => comentar(p, true))}>
                  {s.prompt.nivel >= 8 ? 'Que se oiga' : 'Decirlo'}
                </button>
                <button type="button" className={styles.big} onClick={() => apply((p) => comentar(p, false))}>
                  {s.prompt.nivel >= 8 ? 'Tragártelo' : 'Callarlo'}
                </button>
              </div>
            </div>
          )}
          {s.fase === 'cuelga' && (
            <div className={styles.prompt}>
              <p className={styles.promptKick}>Se acaba la llamada</p>
              <div className={styles.row}>
                <button type="button" className={styles.big} onClick={() => apply((p) => colgar(p, 'ella'))}>
                  Cuelgo yo
                </button>
                <button type="button" className={styles.big} onClick={() => apply((p) => colgar(p, 'el'))}>
                  Lo dejo colgar
                </button>
              </div>
            </div>
          )}
          {s.fase === 'reaccion' && <p className={styles.wait}>Te escucha…</p>}
          {s.fase === 'fin' && <p className={styles.wait}>{s.colgo === 'el' ? 'Cuelga.' : 'Cuelgas.'}</p>}
        </section>
      </div>
    </div>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone: 'warn' | 'hurt' }) {
  return (
    <div className={styles.meter}>
      <span className={styles.meterLabel}>{label}</span>
      <div className={styles.track}>
        <div className={cn(styles.fill, tone === 'hurt' && styles.fillHurt)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}
