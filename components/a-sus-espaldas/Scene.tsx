import { displayName, findAct, findTarget, stage } from '@/lib/a-sus-espaldas/engine';
import type { GameState } from '@/lib/a-sus-espaldas/types';
import { Figure } from './Figure';
import styles from './game.module.css';

// Cómo se ve él en cada estado (0 Tranquilo … 4 Quebrado).
const HIM_SCALE = [1, 0.97, 0.92, 0.86, 0.78];
const HIM_DROP = [0, 1, 3, 6, 8];

function Heart({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path className={styles.float} d="M0 4 C-6 -5 -13 2 0 13 C13 2 6 -5 0 4Z" fill="var(--rose)" />
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
  const turn = state.last;
  const act = turn ? findAct(turn.aid) : undefined;
  const target = turn ? findTarget(turn.tid) : undefined;

  let content;
  if (!turn || !act || !target) {
    // Reposo: tú y él, uno junto al otro.
    const st = stage(state.h);
    content = (
      <>
        <Figure x={140} tone="me" face="smile" />
        <Figure
          x={180}
          tone="him"
          face={st < 1 ? 'smile' : st < 3 ? 'flat' : 'frown'}
          scale={HIM_SCALE[st]}
          headDrop={HIM_DROP[st]}
          slump={st >= 3}
        />
        <Label x={140}>tú</Label>
        <Label x={180}>{name}</Label>
      </>
    );
  } else {
    const st = turn.stage;
    const mood = {
      scale: HIM_SCALE[st],
      headDrop: HIM_DROP[st],
      slump: st >= 3,
      sweat: st >= 2,
      face: (st < 1 ? 'flat' : 'frown') as 'flat' | 'frown',
    };
    const himX = act.priv ? (turn.mode === 'frente' ? 210 : 268) : turn.mode === 'frente' ? 222 : 272;

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
                <Heart x={138} y={act.lvl >= 2 ? 22 : 28} scale={act.lvl >= 3 ? 1.2 : act.lvl >= 2 ? 0.9 : 0.6} />
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
            <Label x={himX}>{`${name} · de espaldas`}</Label>
          </>
        )}
        {turn.mode === 'cerca' && turn.seen && (
          <>
            <Figure x={himX} tone="him" {...mood} mark="?" pop />
            <Label x={himX}>{`${name} · vio algo`}</Label>
          </>
        )}
        {turn.mode === 'frente' && (
          <>
            <Figure x={himX} tone="him" {...mood} mark={st >= 3 ? '…' : '!'} pop />
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
