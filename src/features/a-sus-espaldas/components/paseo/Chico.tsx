import { Rostro } from '../mundo/Rostro';
import type { Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * Él y los demás en dibujo plano, de cuerpo completo. Mismo sistema de medidas que `Chica`:
 * centro en x = 120 y pies en y ≈ 437. La cara es `Rostro`, con los mismos gestos de siempre.
 */

export interface PoseChico {
  /** brazo de la izquierda de quien mira: [hombro, antebrazo], en grados desde «colgando»; + hacia afuera */
  izq: readonly [number, number];
  der: readonly [number, number];
  /** inclinación de la cabeza */
  cab?: number;
  /** inclinación del cuerpo */
  inc?: number;
  /** paso al caminar, de -1 a 1 */
  paso?: number;
}

export const CHICO_PARADO: PoseChico = { izq: [7, 3], der: [7, 3] };

const TINTA = '#2a1f2e';
const f = (n: number): string => n.toFixed(1);
const rad = (d: number): number => (d * Math.PI) / 180;

function Brazo({ s, a1, a2, manga, piel }: { s: 1 | -1; a1: number; a2: number; manga: string; piel: string }) {
  const sx = 120 + s * 30;
  const sy = 162;
  const ex = sx + s * 50 * Math.sin(rad(a1));
  const ey = sy + 50 * Math.cos(rad(a1));
  const hx = ex + s * 46 * Math.sin(rad(a2));
  const hy = ey + 46 * Math.cos(rad(a2));
  const arriba = `M${sx} ${sy} L${f(ex)} ${f(ey)}`;
  const abajo = `M${f(ex)} ${f(ey)} L${f(hx)} ${f(hy)}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={abajo} stroke={TINTA} strokeOpacity="0.3" strokeWidth="13.5" />
      <path d={abajo} stroke={piel} strokeWidth="11.5" />
      <path d={arriba} stroke={TINTA} strokeOpacity="0.3" strokeWidth="18" />
      <path d={arriba} stroke={manga} strokeWidth="16" />
      <circle cx={f(hx)} cy={f(hy)} r="7.4" fill={piel} stroke={TINTA} strokeOpacity="0.3" strokeWidth="1" />
    </g>
  );
}

function Pierna({ lado, giro, pantalon }: { lado: 1 | -1; giro: number; pantalon: string }) {
  const x0 = 120 + lado * 12;
  return (
    <g transform={`rotate(${f(giro)} ${x0} 286)`}>
      <path d={`M${x0} 286 L${x0 + lado} 422`} stroke={TINTA} strokeOpacity="0.3" strokeWidth="25" strokeLinecap="round" />
      <path d={`M${x0} 286 L${x0 + lado} 422`} stroke={pantalon} strokeWidth="23" strokeLinecap="round" />
      <path d={`M${x0 + 6} 300 L${x0 + 6 + lado} 414`} stroke="#000" strokeOpacity="0.14" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx={x0 + lado * 5} cy="431" rx="17" ry="7.5" fill="#1d1a22" />
    </g>
  );
}

/** Ancho de la cara dentro del cuerpo (en las medidas de `Rostro`, la cabeza mide 70 de ancho). */
const CARA = 90;
const K = CARA / 104;

export function CuerpoChico({ look, g, pose = CHICO_PARADO }: { look: Look; g: Gesto; pose?: PoseChico }) {
  const paso = pose.paso ?? 0;
  const piel = look.piel;
  return (
    <g strokeLinejoin="round" transform={`rotate(${pose.inc ?? 0} 120 300)`}>
      <Pierna lado={-1} giro={paso * 16} pantalon={look.pantalon} />
      <Pierna lado={1} giro={-paso * 16} pantalon={look.pantalon} />
      {/* torso */}
      <path
        d="M88 156 Q120 144 152 156 L158 178 Q153 238 147 292 L93 292 Q87 238 82 178 Z"
        fill={look.ropa}
        stroke={TINTA}
        strokeOpacity="0.32"
        strokeWidth="1.2"
      />
      <path d="M147 160 Q153 230 147 292 L139 292 Q144 230 140 158 Z" fill="#000" fillOpacity="0.12" />
      <path d="M93 284 L147 284" stroke="#000" strokeOpacity="0.25" strokeWidth="6" />
      {/* cuello */}
      <path d="M109 122 L109 152 Q120 162 131 152 L131 122 Z" fill={piel} />
      <path d="M109 126 Q120 142 131 126 L131 122 L109 122 Z" fill="#000" fillOpacity="0.12" />
      <path d="M103 152 L120 167 L137 152" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      <Brazo s={-1} a1={pose.izq[0]} a2={pose.izq[1]} manga={look.ropa} piel={piel} />
      <Brazo s={1} a1={pose.der[0]} a2={pose.der[1]} manga={look.ropa} piel={piel} />
      {/* cabeza */}
      <g transform={`rotate(${pose.cab ?? 0} 120 140)`}>
        <g transform={`translate(${f(120 - 52 * K)} ${f(94 - 58 * K)})`}>
          <Rostro g={g} aspecto={{ piel, pelo: look.pelo }} size={CARA} />
        </g>
      </g>
    </g>
  );
}
