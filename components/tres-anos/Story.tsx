'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NODES, choose, ending, freshStory, reviveStory } from '@/lib/tres-anos/story';
import type { Bubble, StoryState } from '@/lib/tres-anos/story';
import { cn } from '@/lib/cn';
import { usePersistentState } from '@/lib/use-persistent-state';
import styles from './story.module.css';

const STORAGE_KEY = 'tres-anos-v1';

export function Phone({ chat, fresh }: { chat: readonly Bubble[]; fresh: number }) {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneHead}>
        <strong>Valeria</strong>
        <span>ahora</span>
      </div>
      {chat.map((bubble, i) => (
        <div
          key={`${i}-${bubble.t}`}
          className={cn(styles.bubble, bubble.who === 'in' ? styles.in : styles.out, bubble.who === 'in' && i >= chat.length - fresh && styles.fresh)}
        >
          {bubble.t}
        </div>
      ))}
    </div>
  );
}

export function Ending({ state, onRestart }: { state: StoryState; onRestart: () => void }) {
  const { verdict, meters } = ending(state.m);
  return (
    <>
      <p className={styles.pov}>Fin de la escena 1</p>
      <h2 className={styles.sceneTitle}>Lo que no viste</h2>
      <p className={styles.verdict}>{verdict}</p>
      <ul className={styles.meters}>
        {meters.map((m) => (
          <li key={m.name}>
            <div className={styles.meterRow}>
              <span>{m.name}</span>
              <span>{m.value} / 10</span>
            </div>
            <div className={styles.bar} role="meter" aria-label={m.name} aria-valuemin={0} aria-valuemax={10} aria-valuenow={m.value}>
              <i style={{ width: `${m.value * 10}%` }} />
            </div>
            <p className={styles.meterNote}>{m.note}</p>
          </li>
        ))}
      </ul>
      <h3 className={styles.sub}>Lo que Mariana va a recordar</h3>
      <ul className={styles.memory}>
        {state.log.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className={styles.reaction}>En la siguiente escena, ella actúa según esto.</p>
      <div className={styles.choices}>
        <button type="button" className={cn(styles.choice, styles.go)} onClick={onRestart}>
          Jugar de nuevo con otras decisiones
        </button>
      </div>
    </>
  );
}

export default function Story() {
  const [state, setState, ready] = usePersistentState<StoryState>(STORAGE_KEY, freshStory, reviveStory);
  const [confirmReset, setConfirmReset] = useState(false);

  const node = state.node === 'end' ? null : NODES[state.node];
  const pov = node === null || node.pov === 'ella' ? 'ella' : 'tu';
  const clock = node ? node.time : 'Viernes · 00:02';

  const restart = () => {
    setState(freshStory());
    window.scrollTo(0, 0);
  };

  return (
    <div className={cn(styles.root, !ready && styles.loading)} data-pov={pov}>
      <div className={styles.wrap}>
        <header className={styles.top}>
          <h1 className={styles.gameName}>Tres Años</h1>
          <span className={styles.clock}>{clock}</span>
        </header>

        <main className={styles.scene} aria-live="polite">
          {node === null ? (
            <Ending state={state} onRestart={restart} />
          ) : (
            <>
              <p className={styles.pov}>{node.pov === 'ella' ? 'Desde ella' : 'Desde ti'}</p>
              <h2 className={styles.sceneTitle}>{node.title}</h2>
              {state.reaction && <p className={styles.reaction}>{state.reaction}</p>}
              {node.text(state).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {node.phone && <Phone chat={state.chat} fresh={state.fresh} />}
              <div className={styles.choices}>
                {node.choices.map((choice) => (
                  <button
                    key={choice.label}
                    type="button"
                    className={cn(styles.choice, choice.go && styles.go)}
                    onClick={() => {
                      setState(choose(state, choice));
                      window.scrollTo(0, 0);
                    }}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </main>

        <button
          type="button"
          className={styles.ghost}
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true);
              return;
            }
            setConfirmReset(false);
            restart();
          }}
        >
          {confirmReset ? 'Toca otra vez para confirmar' : 'Empezar de nuevo'}
        </button>
        <Link href="/" className={styles.back}>
          ← Todos los juegos
        </Link>
        <p className={styles.foot}>Escena 1 de una historia de ficción. Todos los personajes son adultos e inventados.</p>
      </div>
    </div>
  );
}
