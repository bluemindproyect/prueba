'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cambiarModo, nivelDe, resultadoM, startMamada, tickMamada, zoomDe } from './mamada';
import type { Estado, Modo, ResultadoM } from './mamada';
import { EscenaMamada, EscenaPerrito } from './escenas';
import { cn } from '@/lib/cn';
import styles from './mamada.module.css';

const PASO = 90;

interface Props {
  onProgreso?: (s: Estado) => void;
  onOrgasm?: (r: ResultadoM) => void;
  onFinish?: (r: ResultadoM) => void;
  pausada?: boolean;
  modoInicial?: Modo;
}

export function Mamada({
  onProgreso,
  onOrgasm,
  onFinish,
  pausada = false,
  modoInicial = 'mamada',
}: Props) {
  const [s, setS] = useState<Estado>(() => startMamada(modoInicial));
  const [aprietaUI, setAprietaUI] = useState(false);
  const sRef = useRef(s);
  const aprieta = useRef(false);
  const quieto = useRef(pausada);
  const visto = useRef(0);
  const cbs = useRef({ onProgreso, onOrgasm, onFinish });
  cbs.current = { onProgreso, onOrgasm, onFinish };

  useEffect(() => {
    quieto.current = pausada;
  }, [pausada]);

  useEffect(() => {
    let prev = performance.now();
    const id = window.setInterval(() => {
      const ahora = performance.now();
      const dt = Math.min(0.3, (ahora - prev) / 1000);
      prev = ahora;
      if (document.hidden || quieto.current) return;
      setS((p) => {
        const n = tickMamada(p, aprieta.current, dt);
        sRef.current = n;
        return n;
      });
    }, PASO);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    cbs.current.onProgreso?.(s);
  }, [s]);

  useEffect(() => {
    if (s.orgasmos <= visto.current) return;
    visto.current = s.orgasmos;
    const r = resultadoM(sRef.current);
    cbs.current.onOrgasm?.(r);
    cbs.current.onFinish?.(r);
  }, [s.orgasmos]);

  const bajar = useCallback(() => {
    aprieta.current = true;
    setAprietaUI(true);
  }, []);

  const subir = useCallback(() => {
    aprieta.current = false;
    setAprietaUI(false);
  }, []);

  const cambiar = useCallback(
    (modo: Modo) => {
      aprieta.current = false;
      setAprietaUI(false);
      setS((p) => {
        const n = cambiarModo(p, modo);
        sRef.current = n;
        return n;
      });
    },
    [],
  );

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (!e.repeat) bajar();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        cambiar(sRef.current.modo === 'mamada' ? 'perrito' : 'mamada');
      }
    };
    const ku = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowRight') subir();
    };
    const fuera = () => subir();

    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', fuera);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', fuera);
    };
  }, [bajar, subir, cambiar]);

  const nivel = nivelDe(s);
  const z = zoomDe(s);
  const corrida = s.fase === 'corrida';
  const esPerrito = s.modo === 'perrito';
  const color = corrida ? '#e0457b' : nivel > 70 ? '#e88fb0' : '#86c8ea';

  return (
    <div className={styles.panel} role="dialog" aria-label="La mamada">
      <div className={styles.tabs}>
        <button
          type="button"
          className={cn(styles.tab, !esPerrito && styles.tabOn)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => cambiar('mamada')}
        >
          Mamar
        </button>
        <button
          type="button"
          className={cn(styles.tab, esPerrito && styles.tabOn)}
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => cambiar('perrito')}
        >
          Perrito
        </button>
      </div>

      <div
        className={styles.marco}
        style={{
          transform: `scale(${1 + z})`,
          transformOrigin: esPerrito ? '58% 66%' : '60% 58%',
        }}
      >
        {esPerrito ? (
          <EscenaPerrito nivel={nivel} fase={s.fase} orgasmos={s.orgasmos} />
        ) : (
          <EscenaMamada nivel={nivel} fase={s.fase} orgasmos={s.orgasmos} />
        )}
      </div>

      <p className={styles.kick}>
        {corrida ? 'Se está viniendo' : esPerrito ? 'Aprieta para empujar' : 'Aprieta para mamarla'}
      </p>

      <div
        className={styles.barra}
        role="meter"
        aria-label="Lo cerca que está"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(nivel)}
      >
        <i style={{ height: `${nivel}%`, background: `linear-gradient(0deg, #86c8ea, ${color})` }} />
        <b style={{ bottom: '100%' }} />
        <em style={{ bottom: '78%' }} />
      </div>

      <p className={styles.chorros} aria-live="polite">
        {Math.floor(s.chorros)} chorros · {s.orgasmos} {s.orgasmos === 1 ? 'vez' : 'veces'}
      </p>

      <button
        type="button"
        draggable={false}
        className={cn(styles.boton, aprietaUI && styles.botonOn, corrida && styles.botonCorrida)}
        onPointerDown={(e) => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          bajar();
        }}
        onPointerUp={subir}
        onPointerCancel={subir}
        onLostPointerCapture={subir}
        onContextMenu={(e) => e.preventDefault()}
      >
        {corrida ? 'Sigue, no pares' : esPerrito ? 'Empujar' : 'Mamar'}
        <small>{corrida ? 'suelta para acabar' : 'mantén apretado'}</small>
      </button>

      <p className={styles.zoom} aria-hidden>
        {z > 0 ? `zoom ${Math.round(z * 100)}%` : ''}
      </p>
    </div>
  );
}