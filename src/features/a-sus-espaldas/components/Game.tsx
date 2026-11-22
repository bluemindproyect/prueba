'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { freshState, play, reviveState, setMode, setName, setTab, setTarget, tick } from '@/features/a-sus-espaldas/lib/engine';
import type { GameState } from '@/features/a-sus-espaldas/lib/types';
import { cn } from '@/lib/cn';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Deck } from './Deck';
import { LiveBar, LivePanel } from './LivePanel';
import { Scene } from './Scene';
import { StatusPanel } from './StatusPanel';
import { TurnResult } from './TurnResult';
import styles from './game.module.css';

const STORAGE_KEY = 'a-sus-espaldas-v1';

export default function Game() {
  const [state, setState, ready] = usePersistentState<GameState>(STORAGE_KEY, freshState, reviveState);
  const [confirmReset, setConfirmReset] = useState(false);
  const [paused, setPaused] = useState(false);

  // Tiempo real: un segundo a la vez. Se detiene si pausas o si cambias de pestaña.
  useEffect(() => {
    if (!ready || paused) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState((s) => tick(s));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ready, paused, setState]);

  // Todas las jugadas usan la forma funcional para no pisar los segundos que corren.
  const onPlay = (actId: string, chained: boolean) => {
    setState((s) => play(s, actId, chained));
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
        <Link href="/" className={styles.back}>
          ← Todos los juegos
        </Link>
        <p className={styles.foot}>Juego de ficción. Todos los personajes son adultos e inventados.</p>
      </div>
    </div>
  );
}
