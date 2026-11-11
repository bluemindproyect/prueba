import { MOOD_LABEL } from '@/lib/a-sus-espaldas/data';
import { displayName } from '@/lib/a-sus-espaldas/engine';
import { isPresent } from '@/lib/a-sus-espaldas/live';
import type { GameState } from '@/lib/a-sus-espaldas/types';
import { cn } from '@/lib/cn';
import { Sparkline } from './Sparkline';
import styles from './game.module.css';

export function HeartIcon({ bpm, className }: { bpm: number; className?: string }) {
  return (
    <svg
      className={cn(styles.beat, className)}
      style={{ animationDuration: `${(60 / Math.max(40, bpm)).toFixed(2)}s` }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 21C4 15 1 11 1 7.5A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 11 1.5C23 11 20 15 12 21Z" fill="currentColor" />
    </svg>
  );
}

function ago(clock: number, at: number): string {
  const s = Math.max(0, clock - at);
  if (s < 4) return 'ahora';
  if (s < 60) return `hace ${s} s`;
  return `hace ${Math.floor(s / 60)} min`;
}

/** Barra fija arriba: su pulso y su ánimo, siempre a la vista. */
export function LiveBar({ state }: { state: GameState }) {
  const { live } = state;
  const present = isPresent(state);
  return (
    <div className={cn(styles.liveBar, live.bpm >= 110 && styles.hot)} aria-label="Pulso en vivo">
      <HeartIcon bpm={live.bpm} />
      <span className={cn(styles.bpmSmall, styles.num)}>{live.bpm}</span>
      <span className={styles.label}>{present ? MOOD_LABEL[live.mood] : 'Lejos'}</span>
    </div>
  );
}

interface LivePanelProps {
  state: GameState;
  paused: boolean;
  onTogglePause: () => void;
}

/** Todo lo que pasa dentro de él: pulso, ánimo, lo que hace, lo que piensa y lo que no le cuadra. */
export function LivePanel({ state, paused, onTogglePause }: LivePanelProps) {
  const { live } = state;
  const present = isPresent(state);
  const name = displayName(state);
  const confusion = Math.round(live.confusion);

  return (
    <section className={styles.live} aria-label={`${name} en vivo`}>
      <div className={cn(styles.liveHead, live.bpm >= 110 && styles.hot)}>
        <div className={styles.pulse}>
          <HeartIcon bpm={live.bpm} />
          <span className={cn(styles.bpm, styles.num)}>{live.bpm}</span>
          <span className={styles.label}>lpm</span>
        </div>
        <Sparkline values={live.hist} label={`Pulso de ${name}: ${live.bpm} latidos por minuto`} />
      </div>

      <p className={styles.doing}>
        <span className={cn(styles.moodTag, present ? styles[`mood_${live.mood}`] : styles.mood_away)}>
          {present ? MOOD_LABEL[live.mood] : 'Lejos'}
        </span>{' '}
        {name}: {live.doing.charAt(0).toLowerCase() + live.doing.slice(1)}
      </p>

      <div className={styles.confusion}>
        <div className={styles.row}>
          <span className={styles.label}>Confusión</span>
          <span className={cn(styles.label, styles.num)}>{confusion} / 100</span>
        </div>
        <div className={styles.bar} role="meter" aria-label="Confusión" aria-valuemin={0} aria-valuemax={100} aria-valuenow={confusion}>
          <i style={{ width: `${confusion}%` }} />
        </div>
        {live.puzzles.length > 0 && (
          <ul className={styles.puzzles}>
            {live.puzzles.map((p) => (
              <li key={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</li>
            ))}
          </ul>
        )}
      </div>

      <ol className={styles.feed} role="log" aria-live="off" aria-label={`Lo que piensa y hace ${name}`}>
        {live.feed.length === 0 && <li className={styles.feedEmpty}>Todavía no piensa en nada raro.</li>}
        {live.feed.map((item) => (
          <li key={item.id} className={cn(styles.feedItem, item.kind === 'move' ? styles.feedMove : styles.feedThought, item.hot && styles.feedHot)}>
            <span className={styles.feedText}>{item.kind === 'move' ? `→ ${item.text}` : `«${item.text}»`}</span>
            <span className={styles.feedTime}>{ago(live.clock, item.at)}</span>
          </li>
        ))}
      </ol>

      <button type="button" className={styles.ghost} onClick={onTogglePause} aria-pressed={paused}>
        {paused ? 'Reanudar tiempo real' : 'Pausar tiempo real'}
      </button>
    </section>
  );
}
