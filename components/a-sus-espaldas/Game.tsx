'use client';

import Link from 'next/link';
import { useState } from 'react';
import { freshState, play, reviveState, setMode, setName, setTab, setTarget } from '@/lib/a-sus-espaldas/engine';
import type { GameState } from '@/lib/a-sus-espaldas/types';
import { cn } from '@/lib/cn';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Deck } from './Deck';
import { Scene } from './Scene';
import { StatusPanel } from './StatusPanel';
import { TurnResult } from './TurnResult';
import styles from './game.module.css';

const STORAGE_KEY = 'a-sus-espaldas-v1';

export default function Game() {
  const [state, setState, ready] = usePersistentState<GameState>(STORAGE_KEY, freshState, reviveState);
  const [confirmReset, setConfirmReset] = useState(false);

  const onPlay = (actId: string, chained: boolean) => {
    setState(play(state, actId, chained));
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
          <h1 className={styles.title}>A Sus Espaldas</h1>
          <span className={cn(styles.label, styles.num)}>Día {state.turn}</span>
        </header>

        <section className={styles.stage} aria-label="Escena">
          <Scene state={state} />
          <TurnResult state={state} onPlay={(id) => onPlay(id, true)} />
        </section>

        <StatusPanel state={state} onName={(name) => setState(setName(state, name))} />

        <Deck
          state={state}
          onMode={(mode) => setState(setMode(state, mode))}
          onTarget={(id) => setState(setTarget(state, id))}
          onTab={(tab) => setState(setTab(state, tab))}
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
