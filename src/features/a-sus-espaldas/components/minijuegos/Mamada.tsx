'use client';

import { useEffect, useRef, useState } from 'react';
import { resultadoM, startMamada, tickMamada, zoomDe } from './mamada';
import type { Mamada as Estado, ResultadoM } from './mamada';
import { cn } from '@/lib/cn';
import styles from './mamada.module.css';

interface Props {
  onProgreso?: (s: Estado) => void;
  onFinish: (r: ResultadoM) => void;
  pausada?: boolean;
}

export function Mamada({ onProgreso, onFinish, pausada = false }: Props) {
  const [s, setS] = useState<Estado>(() => startMamada());
  const sRef = useRef(s);
  const aprieta = useRef(false);
  const quieto = useRef(pausada);
  quieto.current = pausada;
  const avisa = useRef(onProgreso);
  avisa.current = onProgreso;
  const fin = useRef(onFinish);
  fin.current = onFinish;

  const apply = (f: (p: Estado) => Estado) => {
    sRef.current = f(sRef.current);
    setS(sRef.current);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || quieto.current) return;
      apply((p) => tickMamada(p, aprieta.current, 0.1));
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    avisa.current?.(s);
  }, [s]);

  useEffect(() => {
    if (s.fase !== 'fin') return;
    const id = window.setTimeout(() => fin.current(resultadoM(sRef.current)), 1600);
    return () => window.clearTimeout(id);
  }, [s.fase]);

  const bajar = () => {
    aprieta.current = true;
  };
  const subir = () => {
    aprieta.current = false;
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        bajar();
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') subir();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const z = zoomDe(s);
  const color = s.fase === 'corrida' ? '#e0457b' : s.nivel > 70 ? '#e88fb0' : '#86c8ea';

  return (
    <div className={styles.panel} role="dialog" aria-label="La mamada">
      <p className={styles.kick}>
        {s.fase === 'corrida' ? 'Se está viniendo' : s.fase === 'fin' ? 'Lo sueltas' : 'Aprieta para mamarla'}
      </p>
      <div className={styles.barra} role="meter" aria-label="Lo cerca que está" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(s.nivel)}>
        <i style={{ height: `${s.nivel}%`, background: `linear-gradient(0deg, #86c8ea, ${color})` }} />
        <b style={{ bottom: '100%' }} />
        <em style={{ bottom: '78%' }} />
      </div>
      <p className={styles.chorros}>{Math.floor(s.chorros)} chorros</p>
      <button
        type="button"
        className={cn(styles.boton, aprieta.current && styles.botonOn, s.fase === 'corrida' && styles.botonCorrida)}
        disabled={s.fase === 'fin'}
        onPointerDown={bajar}
        onPointerUp={subir}
        onPointerLeave={subir}
        onPointerCancel={subir}
      >
        {s.fase === 'corrida' ? 'Sigue, no pares' : 'Mamar'}
        <small>{s.fase === 'corrida' ? 'suelta para acabar' : 'mantén apretado'}</small>
      </button>
      <p className={styles.zoom} aria-hidden>{z > 0 ? `zoom ${Math.round(z * 100)}%` : ''}</p>
    </div>
  );
}