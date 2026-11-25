import { Rostro } from '../mundo/Rostro';
import type { Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * Él y los demás en dibujo plano, de cuerpo completo. Mismo sistema de medidas que `Chica`:
 * centro en x = 120 y pies en y ≈ 437. La cara es `Rostro`, con los mismos gestos de siempre.
 *
 * Con `desnudo` se le quita la camisa (el torso y los brazos pasan a piel) y se le dibujan
 * pectorales y pezones. `Pene` se exporta suelto para poder dibujarlo en una capa por encima de
 * las dos figuras: si va dentro del cuerpo, ella lo tapa con la cabeza cuando se lo está mamando.
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

/**
 * El miembro, suelto. Se dibuja horizontal y se gira en la base: `ereccion` 0 lo deja caer y 1
 * lo levanta. `largo` (0.35 a 1) lo acorta, escalando desde la base, para cuando está metido en
 * la boca. Lleva sombra en el bajo vientre, surco del glande y raja en la punta.
 */
export function Pene({
  piel,
  ereccion = 1,
  corrida = 0,
  largo = 1,
}: {
  piel: string;
  ereccion?: number;
  corrida?: number;
  largo?: number;
}) {
  const e = Math.max(0, Math.min(1, ereccion));
  const c = Math.max(0, Math.min(1, corrida));
  const l = Math.max(0.35, Math.min(1, largo));
  const ang = 10 - 26 * e;
  // La punta se acerca a la base al acortarse, y los chorros la acompañan.
  const p = (d: number): number => 121 + (30 + d) * l;
  return (
    <g transform={`rotate(${f(ang)} 121 291) translate(121 0) scale(${f(l)} 1) translate(-121 0)`}>
      <ellipse cx="121" cy="291" rx="6.5" ry="8.5" fill="#000" fillOpacity="0.13" />
      <path
        d="M122 286 C130 284 138 283 144 282 C148 281.4 151 283 151 286 C151 289 148 290.6 144 290 C138 289 130 290 122 292 Z"
        fill={piel}
        stroke={TINTA}
        strokeOpacity="0.3"
        strokeWidth="0.9"
      />
      <path d="M143 281.6 Q141.4 286 143 290.4" fill="none" stroke={TINTA} strokeOpacity="0.22" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M124 291 C132 290 140 289.6 145 289.2" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M126 285.4 C133 284 139 283.4 144 282.8" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M150.6 284.4 L150.6 287.6" stroke="#b5715f" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round" />
      {c > 0 && (
        <g>
          <ellipse cx={f(p(6))} cy="285" rx={2.4 + c * 6} ry={2 + c * 3.4} fill="#fff" opacity={0.55 + c * 0.4} />
          <ellipse cx={f(p(15))} cy="289" rx={1.6 + c * 4} ry={1.4 + c * 2.4} fill="#fff" opacity={0.4 + c * 0.4} />
          <ellipse cx={f(p(23))} cy="283" rx={1.1 + c * 2.6} ry={1.1 + c * 1.8} fill="#fff" opacity={c * 0.75} />
        </g>
      )}
    </g>
  );
}

export function CuerpoChico({
  look,
  g,
  pose = CHICO_PARADO,
  desnudo = false,
  pene = false,
  ereccion = 1,
  corrida = 0,
}: {
  look: Look;
  g: Gesto;
  pose?: PoseChico;
  desnudo?: boolean;
  pene?: boolean;
  ereccion?: number;
  corrida?: number;
}) {
  const paso = pose.paso ?? 0;
  const piel = look.piel;
  // Sin camisa, la manga del brazo y el torso son piel.
  const ropa = desnudo ? piel : look.ropa;
  return (
    <g strokeLinejoin="round" transform={`rotate(${pose.inc ?? 0} 120 300)`}>
      <Pierna lado={-1} giro={paso * 16} pantalon={look.pantalon} />
      <Pierna lado={1} giro={-paso * 16} pantalon={look.pantalon} />
      {/* torso */}
      <path
        d="M88 156 Q120 144 152 156 L158 178 Q153 238 147 292 L93 292 Q87 238 82 178 Z"
        fill={ropa}
        stroke={TINTA}
        strokeOpacity="0.32"
        strokeWidth="1.2"
      />
      <path d="M147 160 Q153 230 147 292 L139 292 Q144 230 140 158 Z" fill="#000" fillOpacity="0.12" />
      <path d="M93 284 L147 284" stroke="#000" strokeOpacity="0.25" strokeWidth="6" />
      {desnudo && (
        <g>
          <path d="M100 176 Q110 184 120 178 M140 176 Q130 184 120 178" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="105" cy="186" r="2.4" fill="#8f5a44" fillOpacity="0.55" />
          <circle cx="135" cy="186" r="2.4" fill="#8f5a44" fillOpacity="0.55" />
        </g>
      )}
      {pene && <Pene piel={piel} ereccion={ereccion} corrida={corrida} />}
      {/* cuello */}
      <path d="M109 122 L109 152 Q120 162 131 152 L131 122 Z" fill={piel} />
      <path d="M109 126 Q120 142 131 126 L131 122 L109 122 Z" fill="#000" fillOpacity="0.12" />
      <path d="M103 152 L120 167 L137 152" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      <Brazo s={-1} a1={pose.izq[0]} a2={pose.izq[1]} manga={ropa} piel={piel} />
      <Brazo s={1} a1={pose.der[0]} a2={pose.der[1]} manga={ropa} piel={piel} />
      {/* cabeza */}
      <g transform={`rotate(${pose.cab ?? 0} 120 140)`}>
        <g transform={`translate(${f(120 - 52 * K)} ${f(94 - 58 * K)})`}>
          <Rostro g={g} aspecto={{ piel, pelo: look.pelo }} size={CARA} />
        </g>
      </g>
    </g>
  );
}