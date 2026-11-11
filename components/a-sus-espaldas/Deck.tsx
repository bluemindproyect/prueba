import { ACTS, LEVELS, MODES, TARGETS } from '@/lib/a-sus-espaldas/data';
import { findTarget, gainPreview, level, playable, risk } from '@/lib/a-sus-espaldas/engine';
import type { GameState, ModeId } from '@/lib/a-sus-espaldas/types';
import styles from './game.module.css';

interface DeckProps {
  state: GameState;
  onMode: (mode: ModeId) => void;
  onTarget: (id: string) => void;
  onTab: (tab: number) => void;
  onPlay: (actId: string) => void;
}

/** Panel de jugada: dónde está él, con quién, pestañas por nivel y acciones. */
export function Deck({ state, onMode, onTarget, onTab, onPlay }: DeckProps) {
  const lv = level(state.sat);
  const tab = Math.min(state.tab || lv, lv);
  const target = findTarget(state.pick.target) ?? TARGETS[0];

  return (
    <section className={styles.deck} aria-label="Tu jugada">
      <div className={styles.seg}>
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            aria-pressed={state.pick.mode === mode.id}
            onClick={() => onMode(mode.id)}
          >
            {mode.label}
            <small>{mode.sub}</small>
          </button>
        ))}
      </div>

      <div className={styles.who}>
        {TARGETS.map((t) => (
          <button key={t.id} type="button" aria-pressed={state.pick.target === t.id} onClick={() => onTarget(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.tabs}>
        {LEVELS.map((_, i) => {
          const n = i + 1;
          return (
            <button
              key={n}
              type="button"
              className={styles.num}
              disabled={n > lv}
              aria-pressed={tab === n}
              aria-label={`Acciones de nivel ${n}${n > lv ? ' (bloqueado)' : ''}`}
              onClick={() => onTab(n)}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className={styles.acts}>
        {ACTS.filter((a) => a.lvl === tab).map((act) => {
          const ok = playable(act, state.pick.mode, state.sat);
          const tag = !ok
            ? 'necesita que esté cerca'
            : act.lvl < lv - 1
              ? 'ya no te llena'
              : state.pick.mode === 'cerca'
                ? `riesgo ${risk(act, state.s, 0)}%`
                : `+${gainPreview(act, target, state.pick.mode)}`;
          return (
            <button key={act.id} type="button" className={styles.act} disabled={!ok} onClick={() => onPlay(act.id)}>
              <span>{act.label}</span>
              <small className={styles.num}>{tag}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
