import { cn } from '@/lib/cn';
import styles from './game.module.css';

export type FigureTone = 'me' | 'other' | 'him';
export type FigureFace = 'smile' | 'frown' | 'flat';

interface FigureProps {
  x: number;
  tone: FigureTone;
  face?: FigureFace;
  /** 1 estira el brazo a la derecha, -1 a la izquierda, 0 en reposo */
  reach?: 1 | -1 | 0;
  slump?: boolean;
  sweat?: boolean;
  mark?: string;
  pop?: boolean;
  dashed?: boolean;
  opacity?: number;
  scale?: number;
  /** cuánto baja la cabeza (px) */
  headDrop?: number;
}

const TONE_CLASS: Record<FigureTone, string> = {
  me: styles.figMe,
  other: styles.figOther,
  him: styles.figHim,
};

/**
 * Muñequito de palitos. El grupo de afuera lleva la posición (atributo
 * transform); el de adentro lleva la animación, para que el CSS no pise la
 * posición.
 */
export function Figure({
  x,
  tone,
  face,
  reach = 0,
  slump = false,
  sweat = false,
  mark,
  pop = false,
  dashed = false,
  opacity = 1,
  scale = 1,
  headDrop = 0,
}: FigureProps) {
  const hd = headDrop;
  const eyeY = -52 + hd;
  const mouthY = eyeY + 7;

  return (
    <g transform={`translate(${x},108) scale(${scale})`}>
      <g
        className={cn(TONE_CLASS[tone], pop && styles.pop)}
        style={{ opacity }}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={dashed ? '3 4' : undefined}
      >
        <line x1={0} y1={-40 + hd} x2={0} y2={-18} />
        <line x1={0} y1={-18} x2={-8} y2={0} />
        <line x1={0} y1={-18} x2={8} y2={0} />
        {slump ? (
          <>
            <line x1={0} y1={-33 + hd} x2={-5} y2={-15} />
            <line x1={0} y1={-33 + hd} x2={5} y2={-15} />
          </>
        ) : reach !== 0 ? (
          <>
            <line x1={0} y1={-34} x2={15 * reach} y2={-33} />
            <line x1={0} y1={-34} x2={-8 * reach} y2={-21} />
          </>
        ) : (
          <>
            <line x1={0} y1={-34} x2={-9} y2={-20} />
            <line x1={0} y1={-34} x2={9} y2={-20} />
          </>
        )}
        <circle cx={0} cy={-50 + hd} r={10} fill="var(--room)" />
        {face && (
          <>
            <circle cx={-3.5} cy={eyeY} r={1.3} fill="currentColor" stroke="none" />
            <circle cx={3.5} cy={eyeY} r={1.3} fill="currentColor" stroke="none" />
            {face === 'smile' && <path d={`M-4 ${mouthY - 1} Q0 ${mouthY + 3} 4 ${mouthY - 1}`} />}
            {face === 'frown' && <path d={`M-4 ${mouthY + 2} Q0 ${mouthY - 2} 4 ${mouthY + 2}`} />}
            {face === 'flat' && <path d={`M-3.5 ${mouthY} H3.5`} />}
          </>
        )}
        {sweat && <path d={`M14 ${-60 + hd} q3 5 0 7 q-3 -2 0 -7z`} fill="currentColor" stroke="none" />}
        {mark && (
          <text x={0} y={-66 + hd} stroke="none" style={{ fontSize: 13, fill: 'currentColor' }}>
            {mark}
          </text>
        )}
      </g>
    </g>
  );
}
