import { displayName, findAct, findTarget, stage } from '@/lib/a-sus-espaldas/engine';
import { isPresent } from '@/lib/a-sus-espaldas/live';
import type { GameState, Mood } from '@/lib/a-sus-espaldas/types';
import { Figure } from './Figure';
import type { FigureFace } from './Figure';
import styles from './game.module.css';

// Cómo se ve él en cada estado (0 Tranquilo … 4 Quebrado).
const HIM_SCALE = [1, 0.97, 0.92, 0.86, 0.78];
const HIM_DROP = [0, 1, 3, 6, 8];

const FACE: Record<Mood, FigureFace> = {
  sereno: 'smile',
  inquieto: 'flat',
  confundido: 'flat',
  desconfiado: 'flat',
  dolido: 'frown',
  resignado: 'frown',
  alterado: 'frown',
};

function Heart({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path className={styles.float} d="M0 4 C-6 -5 -13 2 0 13 C13 2 6 -5 0 4Z" fill="var(--rose)" />
    </g>
  );
}

/** Corazón de él, latiendo al ritmo de su pulso. */
function Pulse({ x, bpm }: { x: number; bpm: number }) {
  return (
    <g transform={`translate(${x},22)`}>
      <g transform="scale(0.5) translate(-12,-12)">
        <path
          className={styles.svgBeat}
          style={{ animationDuration: `${(60 / Math.max(40, bpm)).toFixed(2)}s` }}
          d="M12 21C4 15 1 11 1 7.5A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 11 1.5C23 11 20 15 12 21Z"
          fill="var(--screen)"
        />
      </g>
      <text x={0} y={-8}>{String(bpm)}</text>
    </g>
  );
}

function Label({ x, children }: { x: number; children: string }) {
  return (
    <text x={x} y={123}>
      {children}
    </text>
  );
}

export function Scene({ state }: { state: GameState }) {
  const name = displayName(state);
  const { live } = state;
  const present = isPresent(state);
  const turn = state.last;
  const act = turn ? findAct(turn.aid) : undefined;
  const target = turn ? findTarget(turn.tid) : undefined;
  const st = stage(state.h);

  const mood = {
    scale: HIM_SCALE[st],
    headDrop: HIM_DROP[st],
    slump: st >= 3,
    sweat: st >= 2 || live.mood === 'alterado',
    face: FACE[live.mood],
  };

  let content;
  if (!turn || !act || !target) {
    // Reposo: tú y él, uno junto al otro, o él lejos.
    content = (
      <>
        <Figure x={140} tone="me" face="smile" />
        {present ? (
          <>
            <Figure x={180} tone="him" {...mood} sweat={live.mood === 'alterado'} />
            <Pulse x={180} bpm={live.bpm} />
            <Label x={180}>{name}</Label>
          </>
        ) : (
          <>
            <Figure x={180} tone="him" dashed opacity={0.35} />
            <Label x={180}>no está</Label>
          </>
        )}
        <Label x={140}>tú</Label>
      </>
    );
  } else {
    const himX = act.priv ? (turn.mode === 'frente' ? 210 : 268) : turn.mode === 'frente' ? 222 : 272;
    const marks: Record<string, string> = { alterado: '!', desconfiado: '?', confundido: '?' };

    content = (
      <>
        {act.priv ? (
          <>
            <g className={styles.pop}>
              <rect x={112} y={34} width={56} height={74} rx={3} fill="var(--raised)" stroke="var(--line)" strokeWidth={2} />
              <circle cx={158} cy={74} r={2.5} fill="var(--lamp)" />
            </g>
            <Heart x={128} y={12} scale={0.8} />
            <Heart x={150} y={6} scale={1.1} />
            <Label x={140}>{`tú + ${target.tag}`}</Label>
          </>
        ) : (
          (() => {
            const gap = act.lvl >= 2 ? 13 : 24;
            return (
              <>
                <Figure x={138 - gap} tone="me" face="smile" reach={1} pop />
                <Figure x={138 + gap} tone="other" face="smile" reach={-1} pop />
                <Heart x={138} y={act.lvl >= 6 ? 14 : act.lvl >= 3 ? 22 : 28} scale={act.lvl >= 6 ? 1.4 : act.lvl >= 3 ? 1.2 : act.lvl >= 2 ? 0.9 : 0.6} />
                <Label x={138 - gap - 8}>tú</Label>
                <Label x={138 + gap + 14}>{target.tag}</Label>
              </>
            );
          })()
        )}

        {turn.mode === 'ausente' && (
          <>
            <Figure x={himX} tone="him" dashed opacity={0.35} />
            <Label x={himX}>no está</Label>
          </>
        )}
        {turn.mode === 'cerca' && !turn.seen && (
          <>
            <Figure x={himX} tone="him" />
            <Pulse x={himX} bpm={live.bpm} />
            <Label x={himX}>{`${name} · de espaldas`}</Label>
          </>
        )}
        {turn.mode === 'cerca' && turn.seen && (
          <>
            <Figure x={himX} tone="him" {...mood} mark="?" pop />
            <Pulse x={himX} bpm={live.bpm} />
            <Label x={himX}>{`${name} · vio algo`}</Label>
          </>
        )}
        {turn.mode === 'frente' && (
          <>
            <Figure x={himX} tone="him" {...mood} mark={marks[live.mood] ?? (st >= 3 ? '…' : '!')} pop />
            <Pulse x={himX} bpm={live.bpm} />
            <Label x={himX}>{name}</Label>
          </>
        )}
      </>
    );
  }

  return (
    <svg className={styles.scene} viewBox="0 0 320 130" role="img" aria-label="Escena con los personajes">
      <line x1={12} y1={108} x2={308} y2={108} stroke="var(--line)" strokeWidth={1.5} />
      {content}
    </svg>
  );
}
