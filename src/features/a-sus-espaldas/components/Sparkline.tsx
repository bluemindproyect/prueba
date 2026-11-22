import styles from './game.module.css';

interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  label: string;
}

const MIN = 50;
const MAX = 180;

/** Gráfica de pulso: escala fija para que se vea cuándo se dispara. */
export function Sparkline({ values, width = 160, height = 34, label }: SparklineProps) {
  const pad = 3;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const y = (v: number) => height - pad - ((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * (height - pad * 2);
  const points = values.map((v, i) => `${(pad + i * step).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values[values.length - 1];

  return (
    <svg className={styles.spark} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} preserveAspectRatio="none">
      <line x1={0} y1={y(100)} x2={width} y2={y(100)} className={styles.sparkGrid} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {values.length > 0 && <circle cx={pad + (values.length - 1) * step} cy={y(last)} r={2.4} fill="currentColor" />}
    </svg>
  );
}
