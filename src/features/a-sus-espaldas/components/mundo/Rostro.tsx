import { useId } from 'react';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';

export interface Aspecto {
  piel: string;
  pelo: string;
  /** rasgos y peinado femeninos (pelo largo detrás de la cabeza) */
  largo?: boolean;
  estilo?: 'lacio' | 'ondas' | 'bob' | 'coleta';
  /** color del iris */
  ojos?: string;
  labios?: string;
  /** color de la blusa */
  ropa?: string;
  pecas?: boolean;
  pendientes?: boolean;
}

export const ASPECTO_EL: Aspecto = { piel: '#e9bf9b', pelo: '#2b1d14' };
export const ASPECTO_ELLA: Aspecto = { piel: '#f4cfb0', pelo: '#33201a', largo: true, estilo: 'coleta', ojos: '#6b4226', labios: '#c97a74', ropa: '#2f6f6a' };

const oscuro = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.round(v * 0.86));
  return `#${[c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const f = (n: number): string => n.toFixed(1);

/** Cara en un viewBox centrado en la cabeza. Se puede usar a cualquier tamaño. */
export function Rostro({ g, aspecto = ASPECTO_EL, size = 96 }: { g: Gesto; aspecto?: Aspecto; size?: number }) {
  if (aspecto.largo) return <RostroElla g={g} aspecto={aspecto} size={size} />;
  const oreja = oscuro(aspecto.piel);
  const tinta = oscuro(aspecto.pelo);
  const lados = [-1, 1] as const;
  const mira = (s: number) => ({ x: g.mx * 3 * (g.forma === 0 ? 1 : 0.6), y: g.my * 2.4 + (s === 0 ? 0 : 0) });
  const ex = (e: string) => g.extras.includes(e as Gesto['extras'][number]);

  const cejas = lados.map((s) => {
    const alta = g.h * 8 + (s === 1 ? -g.as * 5 : 0);
    const inY = -12 - alta + g.a * 7;
    const outY = -12 - alta - g.a * 6;
    const mid = (inY + outY) / 2 - (g.a < 0 ? 1.5 : 2.5);
    return `M${f(s * 8)} ${f(inY)} Q${f(s * 16)} ${f(mid)} ${f(s * 25)} ${f(outY)}`;
  });

  const ojos = lados.map((s) => {
    const cx = s * 16;
    const m = mira(0);
    const ry = Math.max(0.7, 6 * g.abre);
    if (g.forma === 1) return <path key={s} d={`M${f(cx - 8)} 4 Q${f(cx)} -5 ${f(cx + 8)} 4`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />;
    if (g.forma === 2 || g.abre < 0.15) return <path key={s} d={`M${f(cx - 8)} 3 Q${f(cx)} 8 ${f(cx + 8)} 3`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />;
    const rr = g.forma === 3 ? Math.min(ry, 3.2) : ry;
    return (
      <g key={s}>
        <ellipse cx={cx} cy="3" rx="8.2" ry={f(rr)} fill="#fff" />
        <circle cx={f(cx + m.x)} cy={f(3 + m.y * 0.6)} r={f(Math.min(4.2, rr * 0.9))} fill="#3a2418" />
        {rr > 3.6 && <circle cx={f(cx + m.x + 1.3)} cy={f(3 + m.y * 0.6 - 1.4)} r="1.2" fill="#fff" />}
        {g.forma === 3 && <path d={`M${f(cx - 8)} ${f(3 - rr)} Q${f(cx)} ${f(3 - rr - 2.2)} ${f(cx + 8)} ${f(3 - rr)}`} fill="none" stroke={tinta} strokeWidth="2.2" strokeLinecap="round" />}
      </g>
    );
  });

  const w = 14 * g.w;
  const y0 = 30;
  const cL = y0 - g.k * 3.5 + (g.lado < 0 ? -g.lado * -4 : 0);
  const cR = y0 - g.k * 3.5 - g.lado * 5;
  const mid = y0 + g.k * 21;
  const lowY = mid + g.open * 15 + Math.max(0, g.k) * 4;
  const boca =
    g.open > 0.05 ? (
      <g>
        <path d={`M${f(-w)} ${f(cL)} Q0 ${f(mid)} ${f(w)} ${f(cR)} Q0 ${f(lowY + g.open * 6)} ${f(-w)} ${f(cL)} Z`} fill="#5a1f2a" />
        {ex('dientes') && <path d={`M${f(-w * 0.8)} ${f(cL + 1)} Q0 ${f(mid + 1)} ${f(w * 0.8)} ${f(cR + 1)} L${f(w * 0.7)} ${f(cR + 5)} Q0 ${f(mid + 6)} ${f(-w * 0.7)} ${f(cL + 5)} Z`} fill="#fff" />}
        {g.k > 0.5 && g.open > 0.2 && <path d={`M${f(-w * 0.6)} ${f(mid + g.open * 7)} Q0 ${f(mid + g.open * 11)} ${f(w * 0.6)} ${f(mid + g.open * 7)}`} fill="none" stroke="#b5606a" strokeWidth="2" />}
      </g>
    ) : (
      <path d={`M${f(-w)} ${f(cL)} Q0 ${f(mid)} ${f(w)} ${f(cR)}`} fill="none" stroke="#a3524a" strokeWidth="2.6" strokeLinecap="round" />
    );

  return (
    <svg viewBox="-52 -58 104 108" width={size} height={size * (108 / 104)} role="img" aria-label={g.nombre}>
      {aspecto.largo && <path d="M-40 -8 C-48 24 -44 46 -30 50 L-30 6 Z M40 -8 C48 24 44 46 30 50 L30 6 Z" fill={aspecto.pelo} />}
      <ellipse cx="-36" cy="4" rx="7" ry="10" fill={oreja} />
      <ellipse cx="36" cy="4" rx="7" ry="10" fill={oreja} />
      <ellipse cx="0" cy="0" rx="35" ry="42" fill={aspecto.piel} />
      {ex('palido') && <ellipse cx="0" cy="0" rx="35" ry="42" fill="#fff" fillOpacity="0.16" />}
      <path d="M-36 -2 C-40 -40 -18 -50 2 -50 C24 -50 42 -38 36 -2 C30 -20 20 -28 2 -28 C-16 -28 -28 -20 -36 -2 Z" fill={aspecto.pelo} />
      <path d="M-26 -30 C-14 -44 8 -46 22 -38" fill="none" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />
      {(ex('rubor') || ex('ruborFuerte')) &&
        lados.map((s) => <ellipse key={`r${s}`} cx={s * 24} cy="19" rx={ex('ruborFuerte') ? 9 : 7} ry={ex('ruborFuerte') ? 5.5 : 4} fill="#e0457b" fillOpacity={ex('ruborFuerte') ? 0.38 : 0.22} />)}
      {ex('ojeras') && lados.map((s) => <ellipse key={`o${s}`} cx={s * 16} cy="10" rx="8.4" ry="2.2" fill="#3a2a4d" fillOpacity="0.22" />)}
      {cejas.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={tinta} strokeWidth={Math.abs(g.a) > 0.6 ? 4.2 : 3.4} strokeLinecap="round" />
      ))}
      {ojos}
      {ex('lagrima') && <path d="M-20 10 Q-18 14 -16 10 Q-18 6 -20 10 Z" fill="#86c8ea" fillOpacity="0.9" />}
      {ex('llanto') &&
        lados.map((s) => <path key={`l${s}`} d={`M${f(s * 17)} 9 L${f(s * 19)} 40 L${f(s * 15)} 40 Z`} fill="#86c8ea" fillOpacity="0.8" />)}
      {ex('brillo') && lados.map((s) => <circle key={`b${s}`} cx={s * 16 + 2} cy="1.5" r="1.8" fill="#fff" />)}
      <path d="M0 8 C-2 16 -3 19 1 21" fill="none" stroke={oreja} strokeWidth="2" strokeLinecap="round" />
      {boca}
      {ex('sudor') && <path d="M40 -24 C45 -15 47 -11 43 -6 C39 -11 36 -15 40 -24 Z" fill="#86c8ea" />}
      {ex('venas') && <path d="M-5 -34 L0 -27 L5 -34 M14 -30 L18 -24 L22 -30" fill="none" stroke="#e24b4a" strokeWidth="2" strokeLinecap="round" />}
    </svg>
  );
}

/** Cara de ella: rasgos más finos, ojos con pestañas, labios y varios peinados. */
const claro = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.min(255, Math.round(v + (255 - v) * 0.22));
  return `#${[c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

type Estilo = NonNullable<Aspecto['estilo']>;

function PeinadoAtras({ estilo, color }: { estilo: Estilo; color: string }) {
  if (estilo === 'ondas')
    return <path d="M-34 -8 C-56 14 -52 34 -47 44 C-54 52 -45 63 -37 58 C-35 65 -26 63 -26 54 L-22 10 Z M34 -8 C56 14 52 34 47 44 C54 52 45 63 37 58 C35 65 26 63 26 54 L22 10 Z" fill={color} />;
  if (estilo === 'bob')
    return <path d="M-35 -10 C-45 10 -43 30 -35 40 L-23 35 L-23 8 Z M35 -10 C45 10 43 30 35 40 L23 35 L23 8 Z" fill={color} />;
  if (estilo === 'coleta')
    return <path d="M12 -44 C36 -56 52 -34 50 -4 C48 20 43 38 39 52 C42 32 40 8 28 -12 Z" fill={color} />;
  return <path d="M-34 -6 C-46 20 -44 52 -30 62 L-22 10 Z M34 -6 C46 20 44 52 30 62 L22 10 Z" fill={color} />;
}

function PeinadoAdelante({ estilo, color }: { estilo: Estilo; color: string }) {
  const brillo = <path d="M-20 -41 C-6 -51 10 -51 22 -43 M-8 -31 C0 -37 9 -39 17 -37" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2.4" strokeLinecap="round" />;
  if (estilo === 'ondas')
    return (
      <g>
        <path d="M0 -53 C-26 -55 -40 -34 -34 -6 C-32 14 -37 34 -42 47 C-31 45 -27 30 -27 14 C-27 -8 -18 -26 0 -35 Z" fill={color} />
        <path d="M0 -53 C26 -55 40 -34 34 -6 C32 14 37 34 42 47 C31 45 27 30 27 14 C27 -8 18 -26 0 -35 Z" fill={color} />
        {brillo}
      </g>
    );
  if (estilo === 'bob')
    return (
      <g>
        <path d="M-34 -6 C-40 -46 -8 -56 8 -54 C32 -52 42 -32 34 -6 L34 -15 C14 -12 -14 -12 -34 -15 Z" fill={color} />
        <path d="M-34 -8 C-38 12 -36 30 -30 38 L-23 34 C-27 20 -27 4 -27 -8 Z M34 -8 C38 12 36 30 30 38 L23 34 C27 20 27 4 27 -8 Z" fill={color} />
        {brillo}
      </g>
    );
  if (estilo === 'coleta')
    return (
      <g>
        <path d="M-30 -2 C-36 -46 -8 -56 8 -54 C30 -52 40 -32 30 -2 C24 -20 14 -30 0 -32 C-14 -30 -24 -20 -30 -2 Z" fill={color} />
        <path d="M-30 -2 C-34 12 -33 26 -29 34 C-30 22 -29 8 -27 0 Z M30 -2 C34 12 33 26 29 34 C30 22 29 8 27 0 Z" fill={color} />
        <ellipse cx="15" cy="-45" rx="4.4" ry="3.2" fill="#2f6f6a" />
        {brillo}
      </g>
    );
  return (
    <g>
      <path d="M-30 -4 C-38 -46 -10 -56 8 -53 C30 -50 40 -34 30 -4 C27 -20 22 -30 12 -35 C2 -20 -16 -12 -30 -4 Z" fill={color} />
      <path d="M-31 -4 C-37 16 -38 38 -32 56 C-34 34 -31 14 -26 2 Z M31 -4 C37 16 38 38 32 56 C34 34 31 14 26 2 Z" fill={color} />
      {brillo}
    </g>
  );
}

function Flequillo({ color }: { color: string }) {
  return (
    <g>
      <path d="M-30 -2 C-36 -40 -8 -50 6 -46 C22 -46 36 -36 30 -2 C26 -16 22 -20 16 -18 C12 -14 8 -21 3 -17 C-2 -14 -6 -20 -11 -16 C-16 -12 -22 -16 -26 -8 Z" fill={color} />
      <path d="M-14 -34 C-9 -30 -6 -24 -5 -18 M12 -33 C9 -29 7 -24 7 -20" fill="none" stroke="#fff" strokeOpacity="0.14" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

function RostroElla({ g, aspecto, size }: { g: Gesto; aspecto: Aspecto; size: number }) {
  const uid = useId().replace(/:/g, '');
  const lados = [-1, 1] as const;
  const piel = aspecto.piel;
  const sombra = oscuro(piel);
  const tinta = oscuro(aspecto.pelo);
  const estilo = aspecto.estilo ?? 'lacio';
  const iris = aspecto.ojos ?? '#5a3350';
  const lab = aspecto.labios ?? '#d9567a';
  const lab2 = claro(lab);
  const ex = (e: string) => g.extras.includes(e as Gesto['extras'][number]);

  const cejas = lados.map((s) => {
    const alta = g.h * 7 + (s === 1 ? -g.as * 4 : 0);
    const inY = -15 - alta + g.a * 6;
    const outY = -15.5 - alta - g.a * 5;
    const mid = (inY + outY) / 2 - (g.a < 0 ? 2 : 3.4);
    return `M${f(s * 8)} ${f(inY)} Q${f(s * 14.5)} ${f(mid)} ${f(s * 21)} ${f(outY)}`;
  });

  const ojos = lados.map((s) => {
    const cx = s * 15.5;
    const ry = Math.max(0.7, 8.6 * g.abre);
    const mx = g.mx * 2.6;
    const my = g.my * 2;
    const pestana = null;
    if (g.forma === 1)
      return (
        <g key={s}>
          <path d={`M${f(cx - 9)} 4.5 Q${f(cx)} -5 ${f(cx + 9)} 4.5`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" />
          {pestana}
        </g>
      );
    if (g.forma === 2 || g.abre < 0.15)
      return (
        <g key={s}>
          <path d={`M${f(cx - 9)} 2.5 Q${f(cx)} 9.5 ${f(cx + 9)} 2.5`} fill="none" stroke={tinta} strokeWidth="2.4" strokeLinecap="round" />
          {pestana}
        </g>
      );
    const rr = g.forma === 3 ? Math.min(ry, 3.8) : ry;
    const ix = cx + mx;
    const iy = 3 + my * 0.5;
    const ir = Math.min(7.2, rr * 1.02);
    const clip = `${uid}o${s}`;
    return (
      <g key={s}>
        <clipPath id={clip}>
          <ellipse cx={cx} cy="3" rx="9.2" ry={f(rr)} />
        </clipPath>
        <ellipse cx={cx} cy="3" rx="9.2" ry={f(rr)} fill="#fff" />
        <g clipPath={`url(#${clip})`}>
          <circle cx={f(ix)} cy={f(iy)} r={f(ir)} fill={iris} />
          <ellipse cx={f(ix)} cy={f(iy - ir * 0.55)} rx={f(ir)} ry={f(ir * 0.55)} fill="#2a160c" fillOpacity="0.35" />
          <ellipse cx={f(ix)} cy={f(iy + ir * 0.5)} rx={f(ir * 0.7)} ry={f(ir * 0.38)} fill="#fff" fillOpacity="0.22" />
          <circle cx={f(ix)} cy={f(iy)} r={f(ir * 0.46)} fill="#1a0f18" />
          <circle cx={f(ix + ir * 0.34)} cy={f(iy - ir * 0.36)} r={f(Math.max(1, ir * 0.3))} fill="#fff" />
          <circle cx={f(ix - ir * 0.3)} cy={f(iy + ir * 0.34)} r={f(Math.max(0.6, ir * 0.14))} fill="#fff" fillOpacity="0.85" />
        </g>
        <path d={`M${f(cx - 9.4)} 3.4 Q${f(cx)} ${f(3 - rr * 1.4 - 1)} ${f(cx + 9.4)} 3.4`} fill="none" stroke={tinta} strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  });

  const w = 8.2 * g.w;
  const y0 = 31;
  const cL = y0 - g.k * 3;
  const cR = y0 - g.k * 3 - g.lado * 4.5;
  const mid = y0 + g.k * 8;
  const labioSup = `M${f(-w)} ${f(cL)} C${f(-w * 0.55)} ${f(cL - 3)} -2.6 ${f(mid - 4.6)} 0 ${f(mid - 3)} C2.6 ${f(mid - 4.6)} ${f(w * 0.55)} ${f(cR - 3)} ${f(w)} ${f(cR)}`;
  const boca =
    g.open > 0.08 ? (
      <g>
        <path d={`${labioSup} Q0 ${f(mid + g.open * 15 + 6)} ${f(-w)} ${f(cL)} Z`} fill="#5a1f2a" />
        {ex('dientes') && <path d={`M${f(-w * 0.7)} ${f(cL + 1)} Q0 ${f(mid - 1)} ${f(w * 0.7)} ${f(cR + 1)} L${f(w * 0.6)} ${f(cR + 4.4)} Q0 ${f(mid + 3)} ${f(-w * 0.6)} ${f(cL + 4.4)} Z`} fill="#fff" />}
        {g.open > 0.4 && <ellipse cx="0" cy={f(mid + g.open * 11 + 3)} rx={f(w * 0.45)} ry="2.6" fill="#c4506a" />}
        <path d={`${labioSup} Q0 ${f(mid + g.open * 15 + 6)} ${f(-w)} ${f(cL)} Z`} fill="none" stroke={lab} strokeWidth="1.6" strokeLinejoin="round" />
        
      </g>
    ) : (
      <path d={`M${f(-w)} ${f(cL)} Q0 ${f(mid + 1.6)} ${f(w)} ${f(cR)}`} fill="none" stroke={lab} strokeWidth="2" strokeLinecap="round" />
    );

  const cara = 'M-28 -4 C-28 -32 -15 -42 0 -42 C15 -42 28 -32 28 -4 C28 18 16 42 0 44 C-16 42 -28 18 -28 -4 Z';

  return (
    <svg viewBox="-52 -58 104 124" width={size} height={size * (124 / 104)} role="img" aria-label={g.nombre}>
      <PeinadoAtras estilo={estilo} color={tinta} />
      <path d="M-7.5 34 L-7 50 L7 50 L7.5 34 Z" fill={piel} />
      <path d="M-7.5 34 L-7 50 L-1 50 L-1 34 Z" fill={sombra} fillOpacity="0.2" />
      <path d="M-44 70 C-42 56 -20 49 -8 48 L8 48 C20 49 42 56 44 70 Z" fill={aspecto.ropa ?? '#e0457b'} />
      <path d="M-8 48 Q0 56 8 48" fill={piel} stroke={sombra} strokeOpacity="0.3" strokeWidth="1" />
      <path d={cara} fill={piel} stroke={sombra} strokeOpacity="0.45" strokeWidth="0.9" />
      <path d="M28 -4 C28 18 16 42 0 44 C8 34 19 16 21 -2 Z" fill={sombra} fillOpacity="0.2" />
            {ex('palido') && <path d={cara} fill="#fff" fillOpacity="0.16" />}
      <PeinadoAdelante estilo={estilo} color={aspecto.pelo} />
      {estilo !== 'bob' && <Flequillo color={aspecto.pelo} />}
      <g transform="translate(0,5.5)">
      {aspecto.pecas && <path d="M-14 15 h1 M-10 17 h1 M-16 19 h1 M-8 14 h1 M14 15 h1 M10 17 h1 M16 19 h1 M8 14 h1 M-2 12 h1 M2 13 h1" stroke="#a8643a" strokeWidth="1.6" strokeLinecap="round" />}
      {lados.map((s) => <ellipse key={`r${s}`} cx={s * 20} cy="17" rx={ex('ruborFuerte') ? 9.5 : 8} ry={ex('ruborFuerte') ? 5.8 : 4.6} fill="#e0457b" fillOpacity={ex('ruborFuerte') ? 0.38 : ex('rubor') ? 0.26 : 0.14} />)}
      {cejas.map((d, i) => (
        <g key={i} fill="none" strokeLinecap="round" stroke={aspecto.pelo}>
          <path d={d} strokeWidth="5.6" strokeOpacity="0.14" />
          <path d={d} strokeWidth="3.8" strokeOpacity="0.28" />
          <path d={d} strokeWidth="2.2" strokeOpacity="0.55" />
        </g>
      ))}
      {ojos}
      {ex('lagrima') && <path d="M-21 11 Q-19 15 -17 11 Q-19 7 -21 11 Z" fill="#86c8ea" fillOpacity="0.9" />}
      {ex('llanto') && lados.map((s) => <path key={`l${s}`} d={`M${f(s * 15.5)} 10 L${f(s * 17.5)} 40 L${f(s * 13.5)} 40 Z`} fill="#86c8ea" fillOpacity="0.8" />)}
      {ex('brillo') && lados.map((s) => <circle key={`b${s}`} cx={s * 14.5 + 2.4} cy="1" r="1.6" fill="#fff" />)}
      <path d="M-1.2 17 Q0 18.8 1.2 17" fill="none" stroke={sombra} strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="0" cy="9" rx="1.5" ry="3.4" fill="#fff" fillOpacity="0.2" />
      <ellipse cx="0" cy="38" rx="3" ry="1.2" fill="#fff" fillOpacity="0.14" />
      {boca}
      {ex('sudor') && <path d="M36 -32 C41 -23 43 -19 39 -14 C35 -19 32 -23 36 -32 Z" fill="#86c8ea" />}
      </g>
      {aspecto.pendientes && lados.map((s) => <circle key={`p${s}`} cx={s * 30.5} cy="22" r="2.6" fill="#f0b35a" />)}
    </svg>
  );
}
