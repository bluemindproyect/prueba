import { cn } from '@/lib/cn';
import { displayName, findAct, risk } from '@/lib/a-sus-espaldas/engine';
import type { ChipTone, GameState } from '@/lib/a-sus-espaldas/types';
import styles from './game.module.css';

const CHIP_TONE: Record<ChipTone, string | undefined> = {
  '': undefined,
  up: styles.chipUp,
  him: styles.chipHim,
  bad: styles.chipBad,
};

interface TurnResultProps {
  state: GameState;
  onPlay: (actId: string) => void;
}

/** Lo que pasó en la última jugada y las opciones para seguir el combo. */
export function TurnResult({ state, onPlay }: TurnResultProps) {
  const turn = state.last;

  if (!turn) {
    return (
      <div className={styles.what}>
        <p>Todavía no has hecho nada. {displayName(state)} confía en ti por completo.</p>
        <p className={styles.label}>Elige dónde está él, con quién, y toca una acción.</p>
      </div>
    );
  }

  return (
    <div className={styles.what} aria-live="polite">
      <p>{turn.line}</p>
      <p className={styles.thought}>{turn.thought}</p>
      <div className={styles.chips}>
        {turn.chips.map((chip) => (
          <span key={chip.text} className={cn(styles.chip, CHIP_TONE[chip.tone])}>
            {chip.text}
          </span>
        ))}
      </div>
      {turn.notes.map((note) => (
        <p key={note} className={styles.note}>
          {note}
        </p>
      ))}
      {turn.follow.length > 0 && (
        <div className={styles.follow}>
          <span className={styles.label}>Y luego… (combo ×{state.combo + 2})</span>
          <div className={styles.followRow}>
            {turn.follow.map((id) => {
              const act = findAct(id);
              if (!act) return null;
              return (
                <button key={id} type="button" className={styles.fbtn} onClick={() => onPlay(id)}>
                  {act.label}
                  {state.pick.mode === 'cerca' && (
                    <small className={styles.num}>{risk(act, state.s, state.combo + 1)}%</small>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
