import { Rostro } from '../mundo/Rostro';
import type { Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * Él y los demás en dibujo plano, de cuerpo completo. Mismo sistema de medidas que `Chica`:
 * centro en x = 120 y pies en y ≈ 437. La cara es `Rostro`, con los mismos gestos de siempre.
 *
 * Las piernas también llevan rodilla (`flex`) y los brazos aceptan ángulos hacia adentro
 * (negativos), que es lo que hace falta para alcanzarle la cabeza cuando ella está abajo.
 *
 * Con `desnudo` se le quita la camisa (el torso y los brazos pasan a piel) y se le dibujan
 * pectorales y pezones. Con `pene` se le añade el miembro: `ereccion` (0 a 1) lo levanta,
 * `corrida` (0 a 1) le pone el chorro en la punta y `inc` lo mantiene horizontal aunque el
 * cuerpo esté inclinado.
 */

export interface PoseChico {
  /** brazo de la izquierda de quien mira: [hombro, antebrazo], en grados desde «colgando»; + hacia afuera, - hacia adentro */
  izq: readonly [number, number];
  der: readonly [number, number];
  /** inclinación de la cabeza */
  cab?: number;
  /** inclinación del cuerpo */
  inc?: number;
  /** paso al caminar, de -1 a 1 */
  paso?: number;
  /** flexión de la rodilla: 0 de pie, ~80 arrodillado */
  flex?: number;
  /** separación de los pies */
  sep?: number;
  /** cuánto baja el cuerpo */
  baja?: number;
}

export const CHICO_PARADO: PoseChico = { izq: [7, 3], der: [7, 3] };

const TINTA = '#2a1f2e';
const f = (n: number): string => n.toFixed(1);
const rad = (d: number): number => (d * Math.PI) / 180;

export function Brazo({ s, a1, a2, manga, piel }: { s: 1 | -1; a1: number; a2: number; manga: string; piel: string }) {
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

function Pierna({ lado, giro, pantalon, flex, sep, b }: { lado: 1 | -1; giro: number; pantalon: string; flex: number; sep: number; b: number }) {
  const x0 = 120 + lado * 12;
  const cadera = 286 + b;
  const largo = Math.max(26, 422 - cadera);
  const esc = largo / 136;
  const l1 = 70 * esc;
  const l2 = 66 * esc;
  const s1 = rad(giro + sep * 0.9);
  const kx = x0 + lado * l1 * Math.sin(s1);
  const ky = cadera + l1 * Math.cos(s1);
  const s2 = rad(giro + sep * 0.9 + flex);
  const ax = kx + lado * (l2 * Math.sin(s2) + sep);
  const ay = ky + l2 * Math.cos(s2);
  const d = `M${x0} ${f(cadera)} L${f(kx)} ${f(ky)} L${f(ax)} ${f(ay)}`;
  return (
    <g>
      <path d={d} stroke={TINTA} strokeOpacity="0.3" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={pantalon} strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke="#000" strokeOpacity="0.14" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(4 0)" />
      <ellipse cx={ax} cy={ay + 5} rx="17" ry="7.5" fill="#1d1a22" transform={`rotate(${-flex * 0.5} ${f(ax)} ${f(ay + 5)})`} />
    </g>
  );
}

/** Ancho de la cara dentro del cuerpo (en las medidas de `Rostro`, la cabeza mide 70 de ancho). */
const CARA = 72;
const K = CARA / 104;

/**
 * El miembro. Se dibuja horizontal y se gira en la base: `ereccion` 0 lo deja caer y 1 lo
 * levanta. `inc` compensa la inclinación del cuerpo para que siga apuntando al frente.
 * Lleva sombra en el bajo vientre, surco del glande y raja en la punta.
 */
function Miembro({ piel, ereccion, corrida, inc }: { piel: string; ereccion: number; corrida: number; inc: number }) {
  const e = Math.max(0, Math.min(1, ereccion));
  const c = Math.max(0, Math.min(1, corrida));
  const ang = 8 - 30 * e - inc * 0.85;
  return (
    <g transform={`rotate(${f(ang)} 121 291)`}>
      <ellipse cx="121" cy="291" rx="6.5" ry="8.5" fill="#000" fillOpacity="0.13" />
      <path
        d="M122 286 C131 284 141 283 147 282 C151 281.4 154 283 154 286 C154 289 151 290.6 147 290 C141 289 131 290 122 292 Z"
        fill={piel}
        stroke={TINTA}
        strokeOpacity="0.3"
        strokeWidth="0.9"
      />
      <path d="M146 281.6 Q144.2 286 146 290.4" fill="none" stroke={TINTA} strokeOpacity="0.22" strokeWidth="0.9" strokeLinecap="round" />
      <path d="M124 291 C133 290 143 289.6 148 289.2" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M126 285.4 C134 284 142 283.4 147 282.8" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M153.6 284.4 L153.6 287.6" stroke="#b5715f" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round" />
      {c > 0 && (
        <g>
          <ellipse cx="160" cy="285" rx={2.4 + c * 6} ry={2 + c * 3.4} fill="#fff" opacity={0.55 + c * 0.4} />
          <ellipse cx="169" cy="289" rx={1.6 + c * 4} ry={1.4 + c * 2.4} fill="#fff" opacity={0.4 + c * 0.4} />
          <ellipse cx="177" cy="283" rx={1.1 + c * 2.6} ry={1.1 + c * 1.8} fill="#fff" opacity={c * 0.75} />
        </g>
      )}
    </g>
  );
}

/** Solo los brazos, para poder pintarlos por encima de ella. */
export function BrazosChico({ look, pose, desnudo = false }: { look: Look; pose: PoseChico; desnudo?: boolean }) {
  const piel = look.piel;
  const ropa = desnudo ? piel : look.ropa;
  return (
    <g>
      <Brazo s={-1} a1={pose.izq[0]} a2={pose.izq[1]} manga={ropa} piel={piel} />
      <Brazo s={1} a1={pose.der[0]} a2={pose.der[1]} manga={ropa} piel={piel} />
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
  const flex = pose.flex ?? 0;
  const sep = pose.sep ?? 0;
  const b = pose.baja ?? 0;
  const piel = look.piel;
  // Sin camisa, la manga del brazo y el torso son piel.
  const ropa = desnudo ? piel : look.ropa;
  return (
    <g strokeLinejoin="round" transform={`rotate(${pose.inc ?? 0} 120 300)`}>
      <Pierna lado={-1} giro={paso * 16} pantalon={look.pantalon} flex={flex} sep={sep} b={b} />
      <Pierna lado={1} giro={-paso * 16} pantalon={look.pantalon} flex={flex} sep={sep} b={b} />
      {/* torso */}
      <g transform={`translate(0 ${b})`}>
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
      {pene && <Miembro piel={piel} ereccion={ereccion} corrida={corrida} inc={pose.inc ?? 0} />}
      {/* cuello */}
      <path d="M109 122 L109 152 Q120 162 131 152 L131 122 Z" fill={piel} />
      <path d="M109 126 Q120 142 131 126 L131 122 L109 122 Z" fill="#000" fillOpacity="0.12" />
      <path d="M103 152 L120 167 L137 152" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      </g>
      <Brazo s={-1} a1={pose.izq[0]} a2={pose.izq[1]} manga={ropa} piel={piel} />
      <Brazo s={1} a1={pose.der[0]} a2={pose.der[1]} manga={ropa} piel={piel} />
      {/* cabeza */}
      <g transform={`rotate(${pose.cab ?? 0} 120 140)`}>
        <g transform={`translate(${f(120 - 52 * K)} ${f(102 - 58 * K)})`}>
          <Rostro g={g} aspecto={{ piel, pelo: look.pelo }} size={CARA} />
        </g>
      </g>
    </g>
  );
}