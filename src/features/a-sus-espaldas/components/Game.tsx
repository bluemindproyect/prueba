'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  displayName,
  findAct,
  freshState,
  opensMini,
  play,
  playCall,
  playable,
  reviveState,
  setMode,
  setName,
  setTab,
  setTarget,
  tick,
} from '@/features/a-sus-espaldas/lib/engine';
import type { CallResult } from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import type { GameState } from '@/features/a-sus-espaldas/lib/types';
import { cn } from '@/lib/cn';
import { useNube } from '@/features/a-sus-espaldas/lib/use-nube';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Deck } from './Deck';
import { Llamada } from './minijuegos/Llamada';
import { LiveBar, LivePanel } from './LivePanel';
import { NubePanel } from './NubePanel';
import { Scene } from './Scene';
import { StatusPanel } from './StatusPanel';
import { TurnResult } from './TurnResult';
import styles from './game.module.css';

const STORAGE_KEY = 'a-sus-espaldas-v1';

export default function Game() {
  const [state, setState, ready] = usePersistentState<GameState>(STORAGE_KEY, freshState, reviveState);
  const [confirmReset, setConfirmReset] = useState(false);
  const [paused, setPaused] = useState(false);
  // Minijuego en curso: la acción que lo abrió y si venía de un combo.
  const [call, setCall] = useState<{ actId: string; chained: boolean } | null>(null);
  const nube = useNube();
  const snap = (s: GameState) => ({ sat: s.sat, c: s.c, s: s.s, h: s.h, turn: s.turn });

  // Tiempo real: un segundo a la vez. Se detiene si pausas o si cambias de pestaña.
  useEffect(() => {
    if (!ready || paused || call) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState((s) => tick(s));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ready, paused, call, setState]);

  // Todas las jugadas usan la forma funcional para no pisar los segundos que corren.
  const onPlay = (actId: string, chained: boolean) => {
    const act = findAct(actId);
    // Algunas acciones se resuelven jugando un minijuego en vez de al instante.
    if (act && opensMini(act, state.pick.mode) && playable(act, state.pick.mode, state.sat)) {
      setCall({ actId, chained });
      return;
    }
    nube.registrar('jugada', { acto: actId, encadenada: chained, modo: state.pick.mode, objetivo: state.pick.target }, snap(state));
    setState((s) => play(s, actId, chained));
    window.scrollTo(0, 0);
  };

  const onCallEnd = (result: CallResult) => {
    if (!call) return;
    const { actId, chained } = call;
    setCall(null);
    nube.registrar('llamada', { acto: actId, ...result }, snap(state));
    setState((s) => playCall(s, actId, result, chained));
    window.scrollTo(0, 0);
  };

  const onReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    setState(freshState());
    window.scrollTo(0, 0);
  };

  return (
    <div className={cn(styles.root, !ready && styles.loading)}>
      <div className={styles.wrap}>
        <header className={styles.top}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>A Sus Espaldas</h1>
            <span className={cn(styles.label, styles.num)}>Día {state.turn}</span>
          </div>
          <LiveBar state={state} />
        </header>

        <section className={styles.stage} aria-label="Escena">
          <Scene state={state} />
          <TurnResult state={state} onPlay={(id) => onPlay(id, true)} />
        </section>

        <LivePanel state={state} paused={paused} onTogglePause={() => setPaused((p) => !p)} />

        <NubePanel nube={nube} />

        <StatusPanel state={state} onName={(name) => setState((s) => setName(s, name))} />

        <Deck
          state={state}
          onMode={(mode) => setState((s) => setMode(s, mode))}
          onTarget={(id) => setState((s) => setTarget(s, id))}
          onTab={(tab) => setState((s) => setTab(s, tab))}
          onPlay={(id) => onPlay(id, false)}
        />

        <details className={styles.history}>
          <summary className={styles.label}>Historial</summary>
          <ol className={styles.log}>
            {state.log.length === 0 ? <li>Vacío por ahora.</li> : state.log.map((line, i) => <li key={`${i}-${line}`}>{line}</li>)}
          </ol>
        </details>

        <button type="button" className={styles.ghost} onClick={onReset}>
          {confirmReset ? 'Toca otra vez para confirmar' : 'Borrar todo y empezar de cero'}
        </button>
        <Link href="/a-sus-espaldas/mundo" className={styles.back}>
          Entrar al mundo (tiempo real, mapa, personajes) →
        </Link>
        <Link href="/a-sus-espaldas/palabras" className={styles.back}>
          Tus palabras (agregar frases propias)
        </Link>
        <Link href="/" className={styles.back}>
          ← Todos los juegos
        </Link>
        <p className={styles.foot}>Juego de ficción. Todos los personajes son adultos e inventados.</p>
      </div>
      {call && <Llamada name={displayName(state)} onFinish={onCallEnd} />}
    </div>
  );
}
