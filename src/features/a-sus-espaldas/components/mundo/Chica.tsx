import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

/**
 * Ella en dibujo plano 2D: cuerpo completo, delgada, pelo largo lacio con raya de lado y
 * cara sencilla. La cara usa los mismos gestos que el resto del juego.
 */

export interface Ropa {
  tipo?: 'vestido' | 'short' | 'bikini' | 'desnuda';
  short?: string;
  vestido: string;
  sombra: string;
  zapatos: string;
}

/** Ropa de escena: short y top. */
export const ROPA_ESCENA: Ropa = { tipo: 'short', vestido: '#ecbccb', sombra: '#cf93a3', short: '#6f8fb8', zapatos: '#f4efe6' };

/** Bikini (escenas de agua / piscina). */
export const ROPA_BIKINI: Ropa = { tipo: 'bikini', vestido: '#e8667a', sombra: '#c24a5f', short: '#e8667a', zapatos: '#f4efe6' };

export const ROPA_CASUAL: Ropa = { vestido: '#d4748a', sombra: '#b95a72', zapatos: '#f4efe6' };

/** Postura del cuerpo: ángulos (grados desde "colgando"; + = hacia afuera, >90 = hacia arriba) de brazo y antebrazo. */
export interface Pose {
  id: string;
  nombre: string;
  di: number; // brazo izquierdo (el de la izquierda de quien mira)
  fi: number;
  dd: number; // brazo derecho
  fd: number;
  inc: number; // inclinación del cuerpo
  cab: number; // inclinación de la cabeza
  cara: string; // gesto de cara que acompaña
  sep?: number; // separación de las piernas (px por lado)
  rod?: number; // rodillas hacia afuera (+) o adentro (-)
  baja?: number; // cuánto baja el cuerpo (flexión)
}

export const POSES: readonly Pose[] = [
  { id: 'parada', nombre: 'Parada', di: 6, fi: 3, dd: 6, fd: 3, inc: 0, cab: 0, cara: 'neutra' },
  { id: 'saluda', nombre: 'Saludando', di: 6, fi: 3, dd: 50, fd: 165, inc: 0, cab: 5, cara: 'victoria' },
  { id: 'espalda', nombre: 'Manos atrás', di: 8, fi: -28, dd: 8, fd: -28, inc: 0, cab: 6, cara: 'dulce' },
  { id: 'timida', nombre: 'Manos al pecho', di: 16, fi: -135, dd: 16, fd: -135, inc: 0, cab: 7, cara: 'culpaella' },
  { id: 'cruzada', nombre: 'Brazos cruzados', di: 22, fi: -108, dd: 22, fd: -108, inc: 0, cab: -4, cara: 'burla' },
  { id: 'cadera', nombre: 'Mano en la cadera', di: 6, fi: 3, dd: 38, fd: -55, inc: -3, cab: -6, cara: 'seduccion' },
  { id: 'mejilla', nombre: 'Mano en la mejilla', di: 6, fi: 3, dd: 92, fd: -140, inc: 2, cab: 9, cara: 'risacontenida' },
  { id: 'abraza', nombre: 'Abrazándose', di: 14, fi: -102, dd: 14, fd: -102, inc: 0, cab: 8, cara: 'angustia' },
  { id: 'pelo', nombre: 'Tocándose el pelo', di: 6, fi: 3, dd: 76, fd: -165, inc: 3, cab: -7, cara: 'labio' },
  { id: 'abierta', nombre: 'Brazos abiertos', di: 52, fi: 66, dd: 52, fd: 66, inc: 0, cab: 0, cara: 'dulce' },
  { id: 'hombros', nombre: 'Encogida de hombros', di: 16, fi: 108, dd: 16, fd: 108, inc: 0, cab: 7, cara: 'nervios' },
  { id: 'senala', nombre: 'Señalando', di: 6, fi: 3, dd: 72, fd: 82, inc: 0, cab: 3, cara: 'calculadora' },
  { id: 'juntas', nombre: 'Manos juntas', di: 10, fi: -46, dd: 10, fd: -46, inc: 0, cab: 5, cara: 'ternurafingida' },
  { id: 'deseo', nombre: 'Insinuándose', di: 38, fi: -55, dd: 76, fd: -165, inc: -4, cab: -8, cara: 'deseoella' },
  { id: 'placer', nombre: 'Entregada', di: 30, fi: 50, dd: 30, fd: 50, inc: 4, cab: 12, cara: 'placerfuerte' },
  { id: 'piernas', nombre: 'Piernas separadas', di: 12, fi: 6, dd: 12, fd: 6, inc: 0, cab: 4, cara: 'sedienta', sep: 17 },
  { id: 'sentadilla', nombre: 'Sentadilla', di: 62, fi: 70, dd: 62, fd: 70, inc: 0, cab: 0, cara: 'esfuerzo', sep: 28, rod: 20, baja: 54 },
  { id: 'agitada', nombre: 'Agitada, manos en la cintura', di: 38, fi: -55, dd: 38, fd: -55, inc: 2, cab: 6, cara: 'jadeo', sep: 9 },
  { id: 'apoyada', nombre: 'Apoyada, jadeando', di: 22, fi: 6, dd: 22, fd: 6, inc: 7, cab: 12, cara: 'agotada', sep: 18, rod: 10, baja: 24 },
  { id: 'arqueada', nombre: 'Arqueada', di: 150, fi: 172, dd: 150, fd: 172, inc: -7, cab: -10, cara: 'gemido', sep: 13 },
  { id: 'aguanta', nombre: 'Aguantando', di: 18, fi: -118, dd: 18, fd: -118, inc: 0, cab: 8, cara: 'aguanta', sep: 8, rod: -9, baja: 10 },
  { id: 'tiembla', nombre: 'Temblando', di: 20, fi: -120, dd: 20, fd: -120, inc: 2, cab: 10, cara: 'tiemblo', sep: 11, rod: -12, baja: 14 },
  { id: 'rendida', nombre: 'Rendida', di: 40, fi: 25, dd: 40, fd: 25, inc: 9, cab: 18, cara: 'entregadaella', sep: 15, rod: 8, baja: 18 },
  { id: 'estira', nombre: 'Estirándose', di: 140, fi: 176, dd: 140, fd: 176, inc: 0, cab: -4, cara: 'alivio', sep: 10 },
  { id: 'victoria', nombre: 'Victoria', di: 140, fi: 160, dd: 140, fd: 160, inc: 0, cab: 0, cara: 'victoria' },
  { id: 'caminando', nombre: 'Caminando con las piernas abiertas', di: 15, fi: 11, dd: 15, fd: 11, inc: 1.5, cab: 5, cara: 'agotada', sep: 14, rod: 7, baja: 5 },
];

export const PIEL = '#f4cfb0';
export const PIEL_SOMBRA = '#e6b794';
const PELO = '#2b1d22';
const PELO_LUZ = '#4a3a58';
const TINTA = '#4a3038';
const BOCA = '#b8605a';

/** Desnuda: sin ropa, con pecho y pubis dibujados. */
export const ROPA_DESNUDA: Ropa = { tipo: 'desnuda', vestido: PIEL, sombra: PIEL_SOMBRA, short: PIEL, zapatos: '#f4efe6' };

/** Silueta de seno en coordenadas locales (centrada en 0,0) para poder escalarla. */
const SENO = 'M-8.5 -13 Q1.5 -15 10.5 -7 Q10.5 7 3.5 13 Q-5.5 15 -10.5 5 Q-13.5 -5 -8.5 -13 Z';

const f = (n: number): string => n.toFixed(1);

function Cara({ g }: { g: Gesto }) {
  const ex = (e: string) => g.extras.includes(e as Gesto['extras'][number]);
  const lados = [-1, 1] as const;

  const cejas = lados.map((s) => {
    const base = 86 - g.h * 5 - (s === 1 ? g.as * 3 : 0);
    const inY = base + g.a * 3.2;
    const outY = base - g.a * 2.4;
    const mid = (inY + outY) / 2 - 1.4;
    return <path key={s} d={`M${f(120 + s * 7)} ${f(inY)} Q${f(120 + s * 14)} ${f(mid)} ${f(120 + s * 21)} ${f(outY)}`} fill="none" stroke={PELO} strokeOpacity="0.8" strokeWidth="1.9" strokeLinecap="round" />;
  });

  const ojos = lados.map((s) => {
    const cx = 120 + s * 14;
    if (g.forma === 1) return <path key={s} d={`M${f(cx - 5.5)} 100 Q${f(cx)} 91.5 ${f(cx + 5.5)} 100`} fill="none" stroke={TINTA} strokeWidth="2.2" strokeLinecap="round" />;
    if (g.forma === 2 || g.abre < 0.15) return <path key={s} d={`M${f(cx - 5.5)} 96.5 Q${f(cx)} 102 ${f(cx + 5.5)} 96.5`} fill="none" stroke={TINTA} strokeWidth="2.2" strokeLinecap="round" />;
    const ry = g.forma === 3 ? Math.max(4.4, Math.min(5, 7 * g.abre)) : Math.max(3.6, 6 * g.abre);
    const ox = cx + g.mx * 1.6;
    const oy = 98 + g.my * 1.2;
    return (
      <g key={s}>
        <ellipse cx={f(ox)} cy={f(oy)} rx={f(Math.min(5.2, ry + 0.9))} ry={f(ry)} fill="#3a2418" />
        <circle cx={f(ox + 1.5)} cy={f(oy - Math.min(1.8, ry * 0.4))} r="1.4" fill="#fff" />
        {g.forma === 3 && <path d={`M${f(cx - 4.8)} ${f(oy - ry * 0.55)} Q${f(cx)} ${f(oy - ry * 1.05)} ${f(cx + 4.8)} ${f(oy - ry * 0.55)}`} fill="none" stroke={TINTA} strokeWidth="1.6" strokeLinecap="round" />}
        <circle cx={f(ox - 1.6)} cy={f(oy + ry * 0.45)} r="0.8" fill="#fff" fillOpacity="0.8" />
      </g>
    );
  });

  const w = 7 * g.w;
  const y0 = 119;
  const cL = y0 - g.k * 2.2;
  const cR = y0 - g.k * 2.2 - g.lado * 3;
  const mid = y0 + g.k * 6;
  const boca =
    g.open > 0.08 ? (
      <g>
        <path d={`M${f(120 - w)} ${f(cL)} Q120 ${f(mid)} ${f(120 + w)} ${f(cR)} Q120 ${f(mid + g.open * 12 + 3)} ${f(120 - w)} ${f(cL)} Z`} fill="#6a2530" stroke={BOCA} strokeWidth="1.2" strokeLinejoin="round" />
        {ex('dientes') && <path d={`M${f(120 - w * 0.7)} ${f(cL + 0.6)} Q120 ${f(mid)} ${f(120 + w * 0.7)} ${f(cR + 0.6)} L${f(120 + w * 0.6)} ${f(cR + 3.4)} Q120 ${f(mid + 3)} ${f(120 - w * 0.6)} ${f(cL + 3.4)} Z`} fill="#fff" />}
        {g.open > 0.35 && <ellipse cx="120" cy={f(mid + g.open * 9 + 2)} rx={f(w * 0.45)} ry="2.2" fill="#d9707a" />}
      </g>
    ) : (
      <path d={`M${f(120 - w)} ${f(cL)} Q120 ${f(mid + 1.4)} ${f(120 + w)} ${f(cR)}`} fill="none" stroke={BOCA} strokeWidth="1.9" strokeLinecap="round" />
    );

  return (
    <g>
      {lados.map((s) => (
        <ellipse key={`r${s}`} cx={120 + s * 22} cy="110" rx={ex('ruborFuerte') ? 9 : 7.5} ry={ex('ruborFuerte') ? 5.4 : 4.4} fill="#ee7f86" fillOpacity={ex('ruborFuerte') ? 0.55 : ex('rubor') ? 0.42 : 0.28} />
      ))}
      {cejas}
      {ojos}
      {ex('lagrima') && <path d="M104 104 Q106 109 108 104 Q106 100 104 104 Z" fill="#86c8ea" />}
      {ex('llanto') && lados.map((s) => <path key={`l${s}`} d={`M${f(120 + s * 14)} 102 L${f(120 + s * 15.5)} 128 L${f(120 + s * 12.5)} 128 Z`} fill="#86c8ea" fillOpacity="0.8" />)}
      {ex('brillo') && lados.map((s) => <circle key={`b${s}`} cx={120 + s * 14 + 2} cy="96.5" r="1.1" fill="#fff" />)}
      <path d="M119 105 Q120.4 108.4 122 106.4" fill="none" stroke={PIEL_SOMBRA} strokeWidth="1.5" strokeLinecap="round" />
      {boca}
      {ex('sudor') && (
        <g fill="#86c8ea">
          <path d="M152 84 C156 91 158 94 155 98 C151 94 149 91 152 84 Z" />
          <path d="M92 90 C95 95 96 98 93.5 101 C90.5 98 90 95 92 90 Z" />
          <path d="M126 80 C128 83 129 85 127 87 C125 85 124.4 83 126 80 Z" fillOpacity="0.8" />
          <path d="M141 122 C143 125 144 127 142 129 C140 127 139.4 125 141 122 Z" fillOpacity="0.8" />
        </g>
      )}
    </g>
  );
}

/** Solo cabeza y hombros (para retratos pequeños). */
export function CaritaElla({ g, size = 96, ropa = ROPA_CASUAL }: { g: Gesto; size?: number; ropa?: Ropa }) {
  return (
    <svg viewBox="60 22 120 148" width={size} height={size * (148 / 120)} role="img" aria-label={g.nombre}>
      <Cuerpo g={g} ropa={ropa} pose={POSES[0]} />
    </svg>
  );
}

/**
 * Cuerpo completo; `pose` cambia brazos e inclinación.
 * `despeinada` = pelo revuelto y labial corrido (después del sexo).
 * `caminando` = piernas abiertas, rodillas hacia afuera y paso inseguro.
 * `pecho` = multiplicador del tamaño del busto (1 = normal).
 * `hinchada` = vulva inflamada, pata de camello marcada.
 */
export function Chica({
  g,
  size = 220,
  ropa,
  pose = POSES[0],
  mojada = false,
  despeinada = false,
  caminando = false,
  pecho = 1,
  hinchada = false,
}: {
  g: Gesto;
  size?: number;
  ropa?: Ropa;
  pose?: Pose;
  mojada?: boolean;
  despeinada?: boolean;
  caminando?: boolean;
  pecho?: number;
  hinchada?: boolean;
}) {
  const r = ropa ?? (pose.sep !== undefined ? ROPA_ESCENA : ROPA_CASUAL);
  return (
    <svg viewBox="22 18 196 440" width={size} height={size * (440 / 196)} role="img" aria-label={`${pose.nombre}: ${g.nombre}`}>
      <ellipse cx="120" cy="443" rx="50" ry="6" fill="#000" fillOpacity="0.13" />
      <Cuerpo g={g} ropa={r} pose={pose} mojada={mojada} despeinada={despeinada} caminando={caminando} pecho={pecho} hinchada={hinchada} />
    </svg>
  );
}

const rad = (d: number): number => (d * Math.PI) / 180;

function Brazo({ s, a1, a2 }: { s: 1 | -1; a1: number; a2: number }) {
  const sx = 120 + s * 22;
  const sy = 156;
  const ex = sx + s * 48 * Math.sin(rad(a1));
  const ey = sy + 48 * Math.cos(rad(a1));
  const hx = ex + s * 44 * Math.sin(rad(a2));
  const hy = ey + 44 * Math.cos(rad(a2));
  const ruta = `M${f(sx)} ${f(sy)} L${f(ex)} ${f(ey)} L${f(hx)} ${f(hy)}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={ruta} stroke={TINTA} strokeOpacity="0.35" strokeWidth="10.6" />
      <path d={ruta} stroke={PIEL} strokeWidth="9" />
      <path d={ruta} stroke={PIEL_SOMBRA} strokeOpacity="0.5" strokeWidth="3" transform={`translate(${s * 2.4} 1)`} />
      <path d={ruta} stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" transform={`translate(${-s * 1.8} -0.5)`} />
      <circle cx={f(hx)} cy={f(hy)} r="6.2" fill={PIEL} stroke={TINTA} strokeOpacity="0.35" strokeWidth="0.9" />
    </g>
  );
}

export function Cuerpo({
  g,
  ropa,
  pose,
  mojada = false,
  despeinada = false,
  caminando = false,
  pecho = 1,
  hinchada = false,
}: {
  g: Gesto;
  ropa: Ropa;
  pose: Pose;
  mojada?: boolean;
  despeinada?: boolean;
  caminando?: boolean;
  pecho?: number;
  hinchada?: boolean;
}) {
  const pelo = mojada ? '#1b1220' : PELO;
  const cabeza = `rotate(${pose.cab} 120 136) translate(120 136) scale(1 0.84) translate(-120 -136)`;
  const sep = (pose.sep ?? 0) * 0.5 + (caminando ? 6 : 0);
  const rod = (pose.rod ?? 0) + (caminando ? 7 : 0);
  const b = (pose.baja ?? 0) + (caminando ? 6 : 0);
  const sudor = g.extras.includes('sudor');
  const bikini = ropa.tipo === 'bikini';
  const desnuda = ropa.tipo === 'desnuda';
  /** Bikini con el color del top igual a la piel: queda el pecho al aire y la braga puesta. */
  const sinSujetador = bikini && ropa.vestido === PIEL;
  const muslo = (lado: 1 | -1): string => {
    const x0 = 120 + lado * 8;
    const yy = (bikini ? 284 : 296) + b;
    const cx = x0 + lado * (sep * 0.4 + rod);
    const cy = (yy + 430) / 2;
    const px = x0 + lado * sep;
    const t = 0.3;
    const x = (1 - t) ** 2 * x0 + 2 * t * (1 - t) * cx + t * t * px;
    const y = (1 - t) ** 2 * yy + 2 * t * (1 - t) * cy + t * t * 430;
    return `M${120 + lado * 12} 268 L${x.toFixed(1)} ${(y - b).toFixed(1)}`;
  };
  const corto = ropa.tipo === 'short' || bikini;
  const y0 = desnuda ? 288 : bikini ? 284 : corto ? 296 : 340;
  return (
    <g strokeLinejoin="round" transform={`rotate(${pose.inc} 120 300)`}>
      {/* piernas delgadas */}
      <g stroke={PIEL} strokeWidth="17" strokeLinecap="round" fill="none">
        <path d={`M112 ${y0 + b} Q${112 - sep * 0.4 - rod} ${(y0 + b + 430) / 2} ${112 - sep} 430`} />
        <path d={`M128 ${y0 + b} Q${128 + sep * 0.4 + rod} ${(y0 + b + 430) / 2} ${128 + sep} 430`} />
      </g>
      <g strokeLinecap="round" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.32" strokeWidth="5" transform="translate(5.5 0)">
        <path d={`M112 ${y0 + b + 34} Q${112 - sep * 0.4 - rod} ${(y0 + b + 430) / 2} ${112 - sep} 424`} />
        <path d={`M128 ${y0 + b + 34} Q${128 + sep * 0.4 + rod} ${(y0 + b + 430) / 2} ${128 + sep} 424`} />
      </g>
      <ellipse cx={112 - sep} cy="437" rx="15" ry="6.5" fill={ropa.zapatos} stroke={TINTA} strokeOpacity="0.4" strokeWidth="0.8" />
      <ellipse cx={128 + sep} cy="437" rx="15" ry="6.5" fill={ropa.zapatos} stroke={TINTA} strokeOpacity="0.4" strokeWidth="0.8" />
      <g transform={`translate(0 ${b})`}>
      {/* pelo largo detrás */}
      <g transform={cabeza}>
        <path d="M86 84 C80 40 100 28 122 28 C146 28 164 46 158 86 C162 126 170 170 160 214 L148 210 C150 170 146 130 146 104 L94 104 C94 130 90 170 92 210 L80 214 C72 170 82 126 86 84 Z" fill={pelo} />
        {despeinada && (
          <g fill={pelo}>
            {/* mechones parados y pelo revuelto */}
            <path d="M92 62 C84 52 82 40 88 30 C90 40 95 48 100 54 Z" />
            <path d="M150 64 C158 52 161 40 155 30 C152 41 147 50 143 56 Z" />
            <path d="M104 40 C98 30 92 24 85 22 C91 30 94 37 97 44 Z" />
            <path d="M138 42 C146 32 153 27 160 27 C153 34 148 41 145 48 Z" />
            <path d="M160 96 C168 116 172 146 168 176 C166 158 162 132 156 112 Z" />
            <path d="M80 96 C72 118 70 148 74 178 C76 158 80 132 86 112 Z" />
            <path d="M150 190 C158 200 162 210 160 220 C156 210 151 202 145 196 Z" />
            <path d="M90 192 C82 202 78 212 80 222 C84 212 89 204 95 198 Z" />
          </g>
        )}
      </g>
      {/* hombros y pecho (piel) */}
      <path d={"M100 152 Q120 144 140 152 C145 166 145 184 142 196 C138 207 135 216 135 226 C135 240 146 254 153 270 L87 270 C96 254 105 240 105 226 C105 216 102 207 98 196 C95 184 95 166 100 152 Z"} fill={PIEL} />
      <g fill={PIEL_SOMBRA} fillOpacity="0.4">
        <path d="M142 196 C138 207 135 216 135 226 C135 240 146 254 153 270 L146 270 C140 256 131 242 131 226 C131 216 135 208 138 198 Z" />
        <path d="M105 226 C105 216 102 207 98 196 L101 196 C104 206 108 216 109 226 Z" fillOpacity="0.2" />
        <path d="M112 214 Q120 222 128 214 Q120 232 112 214 Z" fillOpacity="0.22" />
        <path d="M116 152 Q120 170 124 152 Z" fillOpacity="0.35" />
      </g>
      {desnuda ? (
        <g stroke={TINTA} strokeOpacity="0.18" strokeWidth="0.7">
          {/* pecho desnudo (escala con `pecho`) */}
          {([-1, 1] as const).map((s) => {
            const cx = 120 + s * 12.5;
            const cy = 186 + (pecho - 1) * 7;
            const nx = cx - s * 1.6 * pecho;
            return (
              <g key={s}>
                <path d={SENO} fill={PIEL} transform={`translate(${f(cx)} ${f(cy)}) scale(${f(s * pecho)} ${f(pecho)})`} />
                <path d={SENO} fill={PIEL_SOMBRA} fillOpacity="0.28" stroke="none" transform={`translate(${f(cx + s * 1.4)} ${f(cy + 1.6)}) scale(${f(s * pecho)} ${f(pecho)})`} />
                <ellipse cx={f(nx)} cy={f(cy)} rx={f(4.6 * pecho)} ry={f(4.4 * pecho)} fill={PIEL_SOMBRA} fillOpacity="0.6" stroke="none" />
                <ellipse cx={f(nx)} cy={f(cy)} rx={f(1.8 * pecho)} ry={f(1.7 * pecho)} fill="#b5715f" stroke="none" />
                <path d={`M${f(cx - s * 6 * pecho)} ${f(cy - 6 * pecho)} Q${f(cx + s * 2 * pecho)} ${f(cy - 11 * pecho)} ${f(cx + s * 7 * pecho)} ${f(cy - 5 * pecho)}`} fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1.6" />
                {pecho > 1.12 && (
                  <path d={`M${f(cx - s * 8 * pecho)} ${f(cy + 9 * pecho)} Q${f(cx)} ${f(cy + 15 * pecho)} ${f(cx + s * 8 * pecho)} ${f(cy + 9 * pecho)}`} fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.5" strokeWidth="1.4" />
                )}
              </g>
            );
          })}
          {/* pubis: hinchado (pata de camello) o normal */}
          {hinchada ? (
            <g>
              <path d="M107 262 Q120 257 133 262 Q137 275 130 285 Q125 292 120 296 Q115 292 110 285 Q103 275 107 262 Z" fill={PIEL_SOMBRA} fillOpacity="0.6" stroke="none" />
              <path d="M113 264 Q111 276 116 286 Q118 291 120 295" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.75" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M127 264 Q129 276 124 286 Q122 291 120 295" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.75" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M120 266 L120 295" stroke="#b5715f" strokeOpacity="0.75" strokeWidth="1.7" strokeLinecap="round" fill="none" />
              <path d="M112 266 Q113 279 118 287" fill="none" stroke="#fff" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M128 266 Q127 279 122 287" fill="none" stroke="#fff" strokeOpacity="0.24" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M112 260 Q120 255 128 260" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.55" strokeWidth="1.2" />
              <path d="M108 273 Q106 282 110 290 M132 273 Q134 282 130 290" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0.4" strokeWidth="1" strokeLinecap="round" />
            </g>
          ) : (
            <g>
              <path d="M113 268 Q120 273 127 268 Q126 281 120 288 Q114 281 113 268 Z" fill={PIEL_SOMBRA} fillOpacity="0.5" stroke="none" />
              <path d="M120 277 L120 289" stroke={PIEL_SOMBRA} strokeWidth="1.4" strokeLinecap="round" fill="none" />
            </g>
          )}
        </g>
      ) : bikini ? (
        <g stroke={TINTA} strokeOpacity="0.3" strokeWidth="0.8">
          <circle cx="120" cy="238" r="1.2" fill={PIEL_SOMBRA} stroke="none" />
          <path d="M111 152 L106 184 M129 152 L134 184" fill="none" stroke={ropa.vestido} strokeWidth="1.8" strokeLinecap="round" strokeOpacity="1" />
          <path d="M100 177 Q110 175 119 183 Q119 197 112 203 Q103 205 98 195 Q95 185 100 177 Z" fill={ropa.vestido} />
          <path d="M140 177 Q130 175 121 183 Q121 197 128 203 Q137 205 142 195 Q145 185 140 177 Z" fill={ropa.vestido} />
          {sinSujetador && (
            <g stroke="none">
              <circle cx="107" cy="190" r="4.4" fill={PIEL_SOMBRA} fillOpacity="0.5" />
              <circle cx="133" cy="190" r="4.4" fill={PIEL_SOMBRA} fillOpacity="0.5" />
              <circle cx="107" cy="190" r="1.6" fill="#b5715f" />
              <circle cx="133" cy="190" r="1.6" fill="#b5715f" />
            </g>
          )}
          <path d="M100 204 Q108 209 118 203 Q108 213 100 204 Z M140 204 Q132 209 122 203 Q132 213 140 204 Z" fill={PIEL_SOMBRA} fillOpacity="0.45" stroke="none" />
          <ellipse cx="106" cy="183" rx="3.4" ry="1.7" fill="#fff" fillOpacity="0.4" stroke="none" transform="rotate(-25 106 183)" />
          <ellipse cx="134" cy="183" rx="3.4" ry="1.7" fill="#fff" fillOpacity="0.4" stroke="none" transform="rotate(25 134 183)" />
          <path d="M122 190 Q128 200 129 204 M118 190 Q112 200 111 204" fill="none" stroke={ropa.sombra} strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M97 190 L90 188 M143 190 L150 188" fill="none" stroke={ropa.vestido} strokeWidth="1.6" strokeLinecap="round" strokeOpacity="1" />
          <path d={muslo(-1)} fill="none" stroke={PIEL} strokeOpacity="1" strokeWidth="22" strokeLinecap="round" />
          <path d={muslo(1)} fill="none" stroke={PIEL} strokeOpacity="1" strokeWidth="22" strokeLinecap="round" />
          <path d="M96 261 C109 267 131 267 144 261 C141 274 130 286 120 295 C110 286 99 274 96 261 Z" fill={ropa.short} />
          <path d="M120 295 L120 282" fill="none" stroke={ropa.sombra} strokeOpacity="0.75" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M97 262 L90 259 M143 262 L150 259" fill="none" stroke={ropa.short} strokeWidth="1.8" strokeLinecap="round" strokeOpacity="1" />
        </g>
      ) : corto ? (
        <g stroke={TINTA} strokeOpacity="0.35" strokeWidth="0.8">
          <path d="M106 204 C106 216 105 226 105 232 C103 244 96 256 94 268 L146 268 C144 256 137 244 135 232 C135 226 134 216 134 204 Z" fill={PIEL} stroke="none" />
          <path d="M97 238 Q120 246 143 238" fill="none" stroke={PIEL_SOMBRA} strokeOpacity="0" />
          <circle cx="120" cy="238" r="1.2" fill={PIEL_SOMBRA} stroke="none" />
          <path d="M102 150 C99 166 94 182 98 196 C101 200 104 203 106 204 Q120 210 134 204 C139 200 142 198 142 194 C145 180 141 168 138 150 L132 150 Q120 176 108 150 Z" fill={ropa.vestido} />
          <path d="M99 196 Q108 204 118 196 M141 196 Q132 204 122 196" fill="none" stroke={ropa.sombra} strokeWidth="1.1" strokeOpacity="0.7" />
          <path d="M94 256 C106 262 134 262 146 256 C150 274 151 292 151 308 L123 308 L120 292 L117 308 L89 308 C89 292 90 274 94 256 Z" fill={ropa.short} />
          <path d="M94 258 C106 264 134 264 146 258" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.6" />
          <path d="M120 270 L120 292" fill="none" strokeOpacity="0.5" />
        </g>
      ) : (
        <>
      {/* vestido con figura: busto, cintura marcada, cadera y vuelo */}
      <path
        d="M102 150 C99 166 94 182 98 196 C102 206 105 214 105 226 C103 244 96 258 94 272 C90 300 82 332 78 352 C100 358 140 358 162 352 C158 332 150 300 146 272 C144 258 137 244 135 226 C135 214 138 207 142 196 C146 182 141 166 138 150 L132 150 Q120 176 108 150 Z"
        fill={ropa.vestido}
        stroke={TINTA}
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />
      <path d="M105 226 Q120 232 135 226" fill="none" stroke={ropa.sombra} strokeWidth="2.4" />
      <path d="M99 196 Q108 204 118 196 M141 196 Q132 204 122 196" fill="none" stroke={ropa.sombra} strokeWidth="1.1" strokeOpacity="0.7" />
      <path d="M94 272 C100 300 98 330 96 354 M146 272 C140 300 142 330 144 354 M120 232 L120 350" fill="none" stroke={ropa.sombra} strokeWidth="1" strokeOpacity="0.4" />
        </>
      )}
      {/* cuello */}
      <path d="M112 130 L112 152 C114 160 118 166 120 168 C122 166 126 160 128 152 L128 130 Z" fill={PIEL} />
      <path d="M112 134 Q120 148 128 134 L128 130 L112 130 Z" fill={PIEL_SOMBRA} />
      <path d="M112 152 Q120 160 128 152 Q120 170 112 152 Z" fill={PIEL_SOMBRA} fillOpacity="0.35" />
      {/* brazos */}
      <Brazo s={-1} a1={pose.di} a2={pose.fi} />
      <Brazo s={1} a1={pose.dd} a2={pose.fd} />
      {/* cabeza */}
      <g transform={cabeza}>
        <path d="M89 92 C89 62 102 52 120 52 C138 52 151 62 151 92 C151 114 138 134 120 135 C102 134 89 114 89 92 Z" fill={PIEL} />
        <path d="M151 92 C151 114 138 134 120 135 C130 126 142 112 144 92 Z" fill={PIEL_SOMBRA} fillOpacity="0.5" />
        {/* flequillo más bajo: frente pequeña */}
        <path d="M86 102 C80 56 100 38 122 38 C148 38 162 58 154 102 C152 90 148 82 140 80 C128 74 112 78 102 86 C96 90 90 96 86 102 Z" fill={pelo} />
        <path d="M146 60 C150 80 150 104 146 126 M94 120 C92 150 92 180 94 205" fill="none" stroke={PELO_LUZ} strokeWidth="1.6" strokeOpacity="0.6" strokeLinecap="round" />
        <path d="M118 42 C112 54 104 66 96 78" fill="none" stroke={PELO_LUZ} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M104 40 C116 34 130 36 140 44" fill="none" stroke={PELO_LUZ} strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.8" />
        {mojada && (
          <g>
            <path d="M96 100 C94 112 96 124 100 134 M144 100 C146 112 144 124 140 134 M110 80 C108 90 110 98 112 104" fill="none" stroke="#6b5a86" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" />
            <ellipse cx="100" cy="64" rx="7" ry="2" fill="#fff" fillOpacity="0.35" transform="rotate(-25 100 64)" />
            <g fill="#7cc3ea" fillOpacity="0.85">
              <path d="M128 70 c1.6 2.4 2.2 3.8 0 5.2 c-2.2 -1.4 -1.6 -2.8 0 -5.2 Z" />
              <path d="M104 118 c1.6 2.4 2.2 3.8 0 5.2 c-2.2 -1.4 -1.6 -2.8 0 -5.2 Z" />
              <path d="M138 106 c1.6 2.4 2.2 3.8 0 5.2 c-2.2 -1.4 -1.6 -2.8 0 -5.2 Z" />
            </g>
          </g>
        )}
        <Cara g={g} />
        {despeinada && (
          <g fill="none" stroke={pelo} strokeLinecap="round">
            {/* mechones encima de la cara y labial corrido */}
            <path d="M95 72 C104 86 107 100 103 118" strokeWidth="2.4" strokeOpacity="0.92" />
            <path d="M143 76 C136 90 137 104 142 122" strokeWidth="2.1" strokeOpacity="0.9" />
            <path d="M110 64 C117 72 122 77 127 79" strokeWidth="1.7" strokeOpacity="0.7" />
            <path d="M101 116 C107 121 114 124 121 125" strokeWidth="1.5" strokeOpacity="0.6" />
            <path d="M129 129 C134 131 139 131 143 128" strokeWidth="1.3" strokeOpacity="0.5" />
            <path d="M118 46 C112 56 108 64 106 70" strokeWidth="1.5" strokeOpacity="0.55" />
          </g>
        )}
        {despeinada && (
          <path d="M124 130 Q131 134 137 130 Q133 137 127 135 Z" fill={BOCA} fillOpacity="0.35" />
        )}
      </g>
      {sudor && (
        <g fill="#86c8ea" fillOpacity="0.85">
          <path d="M112 158 c2 3 3 5 0 7 c-3 -2 -2 -4 0 -7 Z" />
          <path d="M129 168 c2 3 3 5 0 7 c-3 -2 -2 -4 0 -7 Z" />
          <path d="M120 178 c2 3 3 5 0 7 c-3 -2 -2 -4 0 -7 Z" />
          <ellipse cx="108" cy="190" rx="3" ry="1.4" fillOpacity="0.5" fill="#fff" />
          <ellipse cx="133" cy="193" rx="3" ry="1.4" fillOpacity="0.5" fill="#fff" />
        </g>
      )}
      {despeinada && (
        <g fill="#86c8ea" fillOpacity="0.8">
          <path d="M105 150 c1.8 2.8 2.4 4.4 0 6.2 c-2.4 -1.8 -1.8 -3.4 0 -6.2 Z" />
          <path d="M137 156 c1.8 2.8 2.4 4.4 0 6.2 c-2.4 -1.8 -1.8 -3.4 0 -6.2 Z" />
          <path d="M120 200 c1.6 2.6 2.2 4 0 5.6 c-2.2 -1.6 -1.6 -3 0 -5.6 Z" />
        </g>
      )}
      {mojada && (
        <g>
          <g fill="#fff" fillOpacity="0.55">
            <ellipse cx="104" cy="158" rx="5" ry="1.8" transform="rotate(-20 104 158)" />
            <ellipse cx="136" cy="158" rx="5" ry="1.8" transform="rotate(20 136 158)" />
            <ellipse cx="108" cy="190" rx="2.6" ry="1.2" />
            <ellipse cx="132" cy="190" rx="2.6" ry="1.2" />
            <ellipse cx="112" cy="244" rx="2" ry="4" transform="rotate(8 112 244)" />
            <ellipse cx="128" cy="244" rx="2" ry="4" transform="rotate(-8 128 244)" />
            <ellipse cx="103" cy="300" rx="2" ry="8" />
            <ellipse cx="137" cy="300" rx="2" ry="8" />
          </g>
          <g fill="#7cc3ea" fillOpacity="0.85">
            {[[104, 168], [136, 170], [120, 206], [110, 224], [131, 226], [100, 262], [142, 266], [118, 250], [90, 214], [150, 214], [93, 250], [148, 248], [104, 300], [136, 304], [106, 320], [134, 324]].map(([x, y]) => (
              <path key={`${x}-${y}`} d={`M${x} ${y} c1.8 2.6 2.6 4.2 0 5.8 c-2.6 -1.6 -1.8 -3.2 0 -5.8 Z`} />
            ))}
          </g>
          <path d="M92 200 C90 214 91 226 92 232 M148 200 C150 214 149 226 148 232" fill="none" stroke="#7cc3ea" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      </g>
    </g>
  );
}