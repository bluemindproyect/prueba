import { LEVELS, STATES } from '@/features/a-sus-espaldas/lib/data';
import { level, stage } from '@/features/a-sus-espaldas/lib/engine';
import type { GameState } from '@/features/a-sus-espaldas/lib/types';
import { cn } from '@/lib/cn';
import styles from './game.module.css';

interface StatusPanelProps {
  state: GameState;
  onName: (name: string) => void;
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <>
      <span className={styles.label}>{label}</span>
      <div className={styles.bar} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <i style={{ width: `${value}%` }} />
      </div>
    </>
  );
}

export function StatusPanel({ state, onName }: StatusPanelProps) {
  const lv = level(state.sat);
  const next = LEVELS[lv];
  const prev = LEVELS[lv - 1];
  const progress = next ? Math.round(((state.sat - prev) / (next - prev)) * 100) : 100;
  const records: Array<[string, number]> = [
    ['engaños', state.cheat],
    ['impunes', state.away],
    ['racha', state.best],
    ['combo', state.bestCombo],
    ['te vio', state.seen],
  ];

  return (
    <section className={styles.status} aria-label="Marcadores">
      <div className={styles.me}>
        <div className={styles.row}>
          <span className={styles.label}>Satisfacción</span>
          <span className={cn(styles.lvl, styles.num)}>Nv {lv}</span>
        </div>
        <div className={styles.bar} role="meter" aria-label="Satisfacción" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <i style={{ width: `${progress}%` }} />
        </div>
        <span className={cn(styles.label, styles.num, styles.plain)}>
          {next ? `${state.sat} / ${next} para nivel ${lv + 1}` : `${state.sat} · nivel máximo`}
        </span>
        <p className={cn(styles.recs, styles.num)}>
          {records.map(([name, value]) => (
            <span key={name}>
              <b>{value}</b> {name}
            </span>
          ))}
        </p>
      </div>

      <div className={styles.his}>
        <div className={styles.row}>
          <input
            id="hisName"
            type="text"
            maxLength={14}
            autoComplete="off"
            aria-label="Nombre de él"
            value={state.name}
            onChange={(e) => onName(e.target.value)}
          />
          <span className={styles.state}>{STATES[stage(state.h)]}</span>
        </div>
        <div className={styles.mini}>
          <Meter label="Conf" value={state.c} />
          <Meter label="Sosp" value={state.s} />
          <Meter label="Humi" value={state.h} />
        </div>
      </div>
    </section>
  );
}
