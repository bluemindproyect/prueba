import { memo, useId } from 'react';
import type { ReactNode } from 'react';
import type { Escena } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { ALTO, PISO } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import type { Destino } from '@/features/a-sus-espaldas/lib/paseo/cuartos';

/** Los cuartos dibujados de lado: pared, piso, muebles, puertas y la luz según la hora. */

const COLORES: Record<Escena, { pared: string; piso: string }> = {
  cama: { pared: '#3b2a45', piso: '#2a1d33' },
  bano: { pared: '#2a4350', piso: '#1d303a' },
  sotano: { pared: '#2e2e2e', piso: '#1c1c1c' },
  oficina: { pared: '#34415a', piso: '#232c3f' },
  archivo: { pared: '#3b3b3b', piso: '#262626' },
  gym: { pared: '#2c4a44', piso: '#1d332f' },
  vestidor: { pared: '#3d4a52', piso: '#29333a' },
  hotel: { pared: '#4a3040', piso: '#33202c' },
  bar: { pared: '#3a2a1f', piso: '#261a12' },
  coche: { pared: '#1f2a3a', piso: '#131b27' },
};

const MADERA = '#5e4233';
const MADERA_OSC = '#3e2b22';
const BLANCO = '#e8e1ee';

const CIELO = ['#9ccbe9', '#e9a37b', '#151c35'] as const;

function Ventana({ x, w = 120, h = 110, luz, cortinas = false }: { x: number; w?: number; h?: number; luz: 0 | 1 | 2; cortinas?: boolean }) {
  const y = 64;
  return (
    <g>
      <rect x={x - w / 2 - 6} y={y - 6} width={w + 12} height={h + 12} rx="4" fill={MADERA_OSC} />
      <rect x={x - w / 2} y={y} width={w} height={h} fill={CIELO[luz]} />
      {luz === 2 && <circle cx={x + w * 0.22} cy={y + 28} r="11" fill="#f4efd8" opacity="0.9" />}
      {luz === 1 && <circle cx={x - w * 0.15} cy={y + h * 0.78} r="18" fill="#ffcf7a" opacity="0.85" />}
      <path d={`M${x} ${y} V${y + h} M${x - w / 2} ${y + h / 2} H${x + w / 2}`} stroke={MADERA_OSC} strokeWidth="5" />
      {cortinas && (
        <g fill="#8a3f5c">
          <path d={`M${x - w / 2 - 30} ${y - 18} H${x - w / 2 + 16} C${x - w / 2 + 6} ${y + 120} ${x - w / 2 + 22} ${PISO - 60} ${x - w / 2 + 10} ${PISO - 4} H${x - w / 2 - 34} Z`} />
          <path d={`M${x + w / 2 + 30} ${y - 18} H${x + w / 2 - 16} C${x + w / 2 - 6} ${y + 120} ${x + w / 2 - 22} ${PISO - 60} ${x + w / 2 - 10} ${PISO - 4} H${x + w / 2 + 34} Z`} />
          <rect x={x - w / 2 - 44} y={y - 24} width={w + 88} height="7" rx="3" fill="#c9a86a" />
        </g>
      )}
    </g>
  );
}

function Lampara({ x, luz, alto = 120 }: { x: number; luz: 0 | 1 | 2; alto?: number }) {
  return (
    <g>
      {luz > 0 && <circle cx={x} cy={PISO - alto - 18} r="70" fill="#ffcf7a" opacity={luz === 2 ? 0.16 : 0.08} />}
      <rect x={x - 22} y={PISO - 62} width="44" height="62" rx="4" fill={MADERA} />
      <rect x={x - 2} y={PISO - alto} width="4" height={alto - 62} fill="#9b8a7a" />
      <path d={`M${x - 20} ${PISO - alto - 2} L${x + 20} ${PISO - alto - 2} L${x + 12} ${PISO - alto - 32} L${x - 12} ${PISO - alto - 32} Z`} fill={luz > 0 ? '#ffd98f' : '#e9d9b8'} />
    </g>
  );
}

function Cama({ x, w = 260, color = '#7b4a8c' }: { x: number; w?: number; color?: string }) {
  const iz = x - w / 2;
  return (
    <g>
      <rect x={iz - 18} y={PISO - 150} width="20" height="150" rx="4" fill={MADERA_OSC} />
      <rect x={iz} y={PISO - 56} width={w} height="22" rx="4" fill={MADERA} />
      <rect x={iz + 6} y={PISO - 34} width="10" height="34" fill={MADERA_OSC} />
      <rect x={iz + w - 16} y={PISO - 34} width="10" height="34" fill={MADERA_OSC} />
      <rect x={iz} y={PISO - 92} width={w} height="38" rx="10" fill={BLANCO} />
      <ellipse cx={iz + 42} cy={PISO - 98} rx="36" ry="14" fill="#fff" />
      <path d={`M${iz + 84} ${PISO - 96} H${iz + w + 4} Q${iz + w + 10} ${PISO - 74} ${iz + w + 4} ${PISO - 50} H${iz + 84} Z`} fill={color} />
      <path d={`M${iz + 84} ${PISO - 96} H${iz + w + 4}`} stroke="#fff" strokeOpacity="0.25" strokeWidth="3" />
    </g>
  );
}

function Closet({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 58} y={PISO - 236} width="116" height="236" rx="4" fill={MADERA} />
      <rect x={x - 52} y={PISO - 228} width="50" height="220" rx="3" fill="#6b4c3b" />
      <rect x={x + 2} y={PISO - 228} width="50" height="220" rx="3" fill="#6b4c3b" />
      <circle cx={x - 8} cy={PISO - 118} r="3.5" fill="#c9a86a" />
      <circle cx={x + 8} cy={PISO - 118} r="3.5" fill="#c9a86a" />
    </g>
  );
}

function Cuadro({ x, y = 96, color = '#c9a86a' }: { x: number; y?: number; color?: string }) {
  return (
    <g>
      <rect x={x - 36} y={y - 26} width="72" height="52" rx="2" fill={color} />
      <rect x={x - 30} y={y - 20} width="60" height="40" fill="#2a2235" />
      <path d={`M${x - 26} ${y + 16} L${x - 8} ${y - 4} L${x + 4} ${y + 8} L${x + 14} ${y - 2} L${x + 26} ${y + 16} Z`} fill="#6f8fb8" opacity="0.8" />
    </g>
  );
}

function Tina({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 130} y={PISO - 74} width="210" height="74" rx="20" fill={BLANCO} />
      <rect x={x - 124} y={PISO - 74} width="198" height="10" rx="5" fill="#cfd8de" />
      <rect x={x - 134} y="44" width="220" height="6" rx="3" fill="#b9c4cc" />
      <path d={`M${x - 130} 50 Q${x - 118} 140 ${x - 128} ${PISO - 70} H${x - 36} Q${x - 46} 140 ${x - 34} 50 Z`} fill="#7fb0b8" opacity="0.92" />
      <path d={`M${x - 112} 54 V${PISO - 76} M${x - 90} 54 V${PISO - 76} M${x - 66} 54 V${PISO - 76}`} stroke="#fff" strokeOpacity="0.18" strokeWidth="3" />
    </g>
  );
}

function Lavabo({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 40} y={PISO - 250} width="80" height="96" rx="6" fill="#a9c4cf" opacity="0.6" stroke="#d7e3e8" strokeWidth="3" />
      <rect x={x - 46} y={PISO - 120} width="92" height="22" rx="8" fill={BLANCO} />
      <rect x={x - 12} y={PISO - 98} width="24" height="98" fill="#d7dde2" />
      <path d={`M${x} ${PISO - 120} V${PISO - 134} H${x + 14}`} stroke="#b9c4cc" strokeWidth="4" fill="none" />
    </g>
  );
}

function Azulejos({ ancho }: { ancho: number }) {
  return (
    <g stroke="#fff" strokeOpacity="0.05">
      {Array.from({ length: Math.ceil(ancho / 40) }, (_, i) => (
        <path key={i} d={`M${i * 40} ${PISO - 150} V${PISO}`} />
      ))}
      {[0, 1, 2, 3].map((j) => (
        <path key={`h${j}`} d={`M0 ${PISO - 150 + j * 40} H${ancho}`} />
      ))}
    </g>
  );
}

function Estante({ x, cajas = true }: { x: number; cajas?: boolean }) {
  return (
    <g>
      <rect x={x - 70} y={PISO - 220} width="8" height="220" fill="#555" />
      <rect x={x + 62} y={PISO - 220} width="8" height="220" fill="#555" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x - 70} y={PISO - 214 + i * 66} width="140" height="6" fill="#666" />
      ))}
      {cajas &&
        [
          [-56, 0, 46, 40],
          [-4, 0, 54, 46],
          [-50, 1, 60, 50],
          [16, 1, 40, 34],
          [-60, 2, 44, 36],
          [-10, 2, 66, 54],
        ].map(([dx, fila, w, h]) => (
          <rect key={`${dx}-${fila}`} x={x + dx} y={PISO - 214 + fila * 66 + 66 - h} width={w} height={h} rx="2" fill="#a17c52" stroke="#6e5236" />
        ))}
    </g>
  );
}

function Foco({ x, luz }: { x: number; luz: 0 | 1 | 2 }) {
  return (
    <g>
      <path d={`M${x} 0 V48`} stroke="#222" strokeWidth="2" />
      <circle cx={x} cy="54" r="80" fill="#ffd98f" opacity={luz === 2 ? 0.1 : 0.06} />
      <circle cx={x} cy="56" r="9" fill="#ffe7a8" />
    </g>
  );
}

function Escritorio({ x, monitor = true }: { x: number; monitor?: boolean }) {
  return (
    <g>
      <rect x={x - 80} y={PISO - 100} width="160" height="12" rx="3" fill="#8b8f9a" />
      <rect x={x - 74} y={PISO - 88} width="8" height="88" fill="#5b5f6a" />
      <rect x={x + 66} y={PISO - 88} width="8" height="88" fill="#5b5f6a" />
      <rect x={x + 20} y={PISO - 88} width="46" height="60" fill="#6b707b" />
      {monitor && (
        <g>
          <rect x={x - 40} y={PISO - 164} width="76" height="52" rx="4" fill="#1b2230" stroke="#9aa3b5" strokeWidth="3" />
          <rect x={x - 34} y={PISO - 158} width="64" height="40" fill="#3d6d9e" opacity="0.7" />
          <rect x={x - 6} y={PISO - 112} width="10" height="12" fill="#9aa3b5" />
        </g>
      )}
    </g>
  );
}

function Archivero({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 44} y={PISO - 170} width="88" height="170" rx="3" fill="#7c828e" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={x - 38} y={PISO - 164 + i * 41} width="76" height="35" rx="2" fill="#8d94a1" />
          <rect x={x - 12} y={PISO - 150 + i * 41} width="24" height="5" rx="2" fill="#5b616c" />
        </g>
      ))}
    </g>
  );
}

function Persiana({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 70} y="58" width="140" height="120" fill="#c9d6e6" opacity="0.55" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={x - 72} y={60 + i * 12} width="144" height="6" fill="#e8edf3" opacity="0.8" />
      ))}
    </g>
  );
}

function Rack({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 70} y={PISO - 200} width="10" height="200" fill="#444" />
      <rect x={x + 60} y={PISO - 200} width="10" height="200" fill="#444" />
      <rect x={x - 90} y={PISO - 150} width="180" height="6" fill="#b8b8b8" />
      <rect x={x - 100} y={PISO - 172} width="14" height="50" rx="4" fill="#222" />
      <rect x={x + 86} y={PISO - 172} width="14" height="50" rx="4" fill="#222" />
      <rect x={x - 48} y={PISO - 60} width="96" height="16" rx="4" fill="#2a2a2a" />
      <rect x={x - 6} y={PISO - 44} width="12" height="44" fill="#555" />
    </g>
  );
}

function Espejo({ x, w = 220 }: { x: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y="40" width={w} height={PISO - 90} fill="#9fc3c8" opacity="0.28" stroke="#cfe3e6" strokeOpacity="0.4" strokeWidth="3" />
      <path d={`M${x - w / 2 + 30} 60 L${x - w / 2 + 90} 140 M${x - w / 2 + 60} 60 L${x - w / 2 + 120} 140`} stroke="#fff" strokeOpacity="0.15" strokeWidth="6" />
    </g>
  );
}

function Casilleros({ x, n = 5 }: { x: number; n?: number }) {
  const w = 44;
  const iz = x - (n * w) / 2;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i}>
          <rect x={iz + i * w} y={PISO - 220} width={w - 3} height="220" rx="2" fill="#5f7d8f" />
          <path d={`M${iz + i * w + 10} ${PISO - 200} h20 M${iz + i * w + 10} ${PISO - 192} h20 M${iz + i * w + 10} ${PISO - 184} h20`} stroke="#3e5563" strokeWidth="3" />
          <rect x={iz + i * w + 30} y={PISO - 120} width="5" height="16" rx="2" fill="#cfd8de" />
        </g>
      ))}
    </g>
  );
}

function Banca({ x, w = 150 }: { x: number; w?: number }) {
  return (
    <g>
      <rect x={x - w / 2} y={PISO - 52} width={w} height="12" rx="4" fill={MADERA} />
      <rect x={x - w / 2 + 10} y={PISO - 40} width="8" height="40" fill={MADERA_OSC} />
      <rect x={x + w / 2 - 18} y={PISO - 40} width="8" height="40" fill={MADERA_OSC} />
    </g>
  );
}

function Barra({ x, w = 420, luz }: { x: number; w?: number; luz: 0 | 1 | 2 }) {
  const iz = x - w / 2;
  return (
    <g>
      <rect x={iz} y="70" width={w} height="10" fill={MADERA_OSC} />
      <rect x={iz} y="140" width={w} height="10" fill={MADERA_OSC} />
      {Array.from({ length: Math.floor(w / 26) }, (_, i) => (
        <g key={i}>
          <rect x={iz + 8 + i * 26} y={i % 3 === 0 ? 30 : 38} width="12" height={i % 3 === 0 ? 40 : 32} rx="3" fill={['#5d8f4f', '#8f3f3f', '#c9a86a', '#3f5f8f'][i % 4]} opacity="0.85" />
          <rect x={iz + 10 + i * 26} y="104" width="8" height="36" rx="3" fill={['#c9a86a', '#5d8f4f', '#8f3f3f'][i % 3]} opacity="0.85" />
        </g>
      ))}
      {[0.2, 0.5, 0.8].map((k) => (
        <g key={k}>
          <path d={`M${iz + w * k} 0 V170`} stroke="#222" strokeWidth="2" />
          {luz > 0 && <circle cx={iz + w * k} cy="180" r="46" fill="#ffcf7a" opacity="0.14" />}
          <path d={`M${iz + w * k - 16} 184 L${iz + w * k + 16} 184 L${iz + w * k + 8} 168 L${iz + w * k - 8} 168 Z`} fill="#c98f3f" />
        </g>
      ))}
      <rect x={iz - 10} y={PISO - 112} width={w + 20} height="16" rx="5" fill="#7a4e31" />
      <rect x={iz} y={PISO - 96} width={w} height="96" fill="#5a3a26" />
      <path d={`M${iz} ${PISO - 60} H${iz + w}`} stroke="#c9a86a" strokeOpacity="0.4" strokeWidth="3" />
      {Array.from({ length: Math.floor(w / 90) }, (_, i) => (
        <g key={`b${i}`}>
          <rect x={iz + 30 + i * 90} y={PISO - 76} width="40" height="10" rx="5" fill="#2a2a2a" />
          <rect x={iz + 46 + i * 90} y={PISO - 66} width="8" height="66" fill="#444" />
        </g>
      ))}
    </g>
  );
}

function Coche({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 220} ${PISO - 40} Q${x - 220} ${PISO - 110} ${x - 150} ${PISO - 116} L${x - 90} ${PISO - 190} Q${x - 70} ${PISO - 206} ${x + 40} ${PISO - 204} Q${x + 110} ${PISO - 200} ${x + 150} ${PISO - 120} Q${x + 220} ${PISO - 112} ${x + 222} ${PISO - 60} L${x + 222} ${PISO - 34} H${x - 220} Z`} fill="#3a4a66" />
      <path d={`M${x - 140} ${PISO - 120} L${x - 86} ${PISO - 184} H${x - 10} V${PISO - 120} Z`} fill="#9cc3dc" opacity="0.55" />
      <path d={`M${x} ${PISO - 120} V${PISO - 186} H${x + 36} Q${x + 96} ${PISO - 186} ${x + 132} ${PISO - 120} Z`} fill="#9cc3dc" opacity="0.55" />
      <path d={`M${x - 4} ${PISO - 120} V${PISO - 44}`} stroke="#2a364d" strokeWidth="4" />
      <circle cx={x - 140} cy={PISO - 34} r="34" fill="#1a1a1a" />
      <circle cx={x - 140} cy={PISO - 34} r="14" fill="#8b8f9a" />
      <circle cx={x + 140} cy={PISO - 34} r="34" fill="#1a1a1a" />
      <circle cx={x + 140} cy={PISO - 34} r="14" fill="#8b8f9a" />
      <rect x={x + 206} y={PISO - 92} width="14" height="12" rx="3" fill="#ffe7a8" />
    </g>
  );
}

function Muebles({ escena, ancho, luz }: { escena: Escena; ancho: number; luz: 0 | 1 | 2 }) {
  const w = (k: number) => Math.round(ancho * k);
  const piezas: Record<Escena, ReactNode> = {
    cama: (
      <>
        <Ventana x={w(0.24)} luz={luz} />
        <Cuadro x={w(0.5)} />
        <Cama x={w(0.55)} />
        <Lampara x={w(0.71)} luz={luz} />
        <Closet x={w(0.86)} />
      </>
    ),
    hotel: (
      <>
        <Cuadro x={w(0.3)} color="#d8c08a" />
        <Cama x={w(0.47)} w={290} color="#c9a86a" />
        <Lampara x={w(0.66)} luz={luz} />
        <Ventana x={w(0.86)} w={96} luz={luz} cortinas />
      </>
    ),
    bano: (
      <>
        <Azulejos ancho={ancho} />
        <Tina x={w(0.36)} />
        <Lavabo x={w(0.68)} />
        <rect x={w(0.82)} y={PISO - 190} width="60" height="6" rx="3" fill="#cfd8de" />
        <rect x={w(0.82) + 6} y={PISO - 184} width="44" height="70" rx="4" fill="#e88fb0" opacity="0.8" />
      </>
    ),
    sotano: (
      <>
        <Foco x={w(0.4)} luz={luz} />
        <Foco x={w(0.72)} luz={luz} />
        <rect x={w(0.22) - 50} y={PISO - 110} width="100" height="110" rx="6" fill="#d7dde2" />
        <circle cx={w(0.22)} cy={PISO - 58} r="30" fill="#9aa3b5" stroke="#5b616c" strokeWidth="5" />
        <Estante x={w(0.52)} />
        <Estante x={w(0.8)} />
      </>
    ),
    oficina: (
      <>
        <Persiana x={w(0.22)} />
        <Persiana x={w(0.62)} />
        <Escritorio x={w(0.34)} />
        <Escritorio x={w(0.6)} />
        <Escritorio x={w(0.86)} monitor={false} />
        <rect x={w(0.46) - 14} y={PISO - 120} width="28" height="120" rx="6" fill="#cfe3e6" opacity="0.7" />
      </>
    ),
    archivo: (
      <>
        <Foco x={w(0.5)} luz={luz} />
        <Archivero x={w(0.28)} />
        <Estante x={w(0.55)} />
        <Archivero x={w(0.8)} />
      </>
    ),
    gym: (
      <>
        <Espejo x={w(0.5)} w={w(0.5)} />
        <Rack x={w(0.3)} />
        <Banca x={w(0.62)} w={120} />
        <Rack x={w(0.86)} />
      </>
    ),
    vestidor: (
      <>
        <Azulejos ancho={ancho} />
        <Casilleros x={w(0.3)} n={4} />
        <Banca x={w(0.56)} w={180} />
        <Casilleros x={w(0.82)} n={4} />
      </>
    ),
    bar: <Barra x={w(0.5)} w={w(0.62)} luz={luz} />,
    coche: (
      <>
        <rect x="0" y={PISO - 12} width={ancho} height="12" fill="#2b3547" />
        {Array.from({ length: Math.ceil(ancho / 140) }, (_, i) => (
          <rect key={i} x={i * 140 + 60} y={PISO + 14} width="70" height="5" fill="#e8e1ee" opacity="0.35" />
        ))}
        <Coche x={w(0.55)} />
      </>
    ),
  };
  return <g>{piezas[escena]}</g>;
}

function Puerta({ x, destino, lado }: { x: number; destino: Destino; lado: 'izq' | 'der' }) {
  const salida = destino.tipo === 'salida';
  const texto = salida ? 'Salir' : destino.nombre;
  const flecha = lado === 'izq' ? '←' : '→';
  const etiqueta = lado === 'izq' ? `${flecha} ${texto}` : `${texto} ${flecha}`;
  return (
    <g>
      <rect x={x} y={PISO - 168} width="62" height="168" rx="3" fill="#2a2030" />
      <rect x={x + 5} y={PISO - 162} width="52" height="162" rx="2" fill={salida ? '#4f3b55' : '#6b5240'} />
      <circle cx={lado === 'izq' ? x + 48 : x + 14} cy={PISO - 82} r="4" fill="#c9a86a" />
      <text x={x + 31} y={PISO - 180} textAnchor={lado === 'izq' ? 'start' : 'end'} dx={lado === 'izq' ? -27 : 27} fontSize="13" fill="#d9cfe6" style={{ fontFamily: 'var(--util)' }}>
        {etiqueta}
      </text>
    </g>
  );
}

interface CuartoProps {
  escena: Escena;
  ancho: number;
  luz: 0 | 1 | 2;
  /** puertas a los lados; sin puertas en la escena del momento */
  puertas?: { izq: Destino; der: Destino };
}

export const Cuarto = memo(function Cuarto({ escena, ancho, luz, puertas }: CuartoProps) {
  const id = useId().replace(/:/g, '');
  const c = COLORES[escena];
  return (
    <g>
      <defs>
        <linearGradient id={`pared${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.pared} />
          <stop offset="1" stopColor={c.piso} />
        </linearGradient>
      </defs>
      <rect x={-600} y={0} width={ancho + 1200} height={ALTO} fill="#0d0a12" />
      <rect x={0} y={0} width={ancho} height={PISO} fill={`url(#pared${id})`} />
      {Array.from({ length: Math.floor(ancho / 90) }, (_, i) => (
        <rect key={i} x={i * 90 + 45} y="16" width="2" height={PISO - 30} fill="#fff" opacity="0.03" />
      ))}
      <rect x={0} y={PISO - 8} width={ancho} height="8" fill="#000" opacity="0.22" />
      <rect x={0} y={PISO} width={ancho} height={ALTO - PISO} fill={c.piso} />
      <path d={`M0 ${PISO + 14} H${ancho} M0 ${PISO + 32} H${ancho}`} stroke="#fff" strokeOpacity="0.04" strokeWidth="2" />
      <Muebles escena={escena} ancho={ancho} luz={luz} />
      {puertas && <Puerta x={6} destino={puertas.izq} lado="izq" />}
      {puertas && <Puerta x={ancho - 68} destino={puertas.der} lado="der" />}
      {luz === 2 && <rect x={0} y={0} width={ancho} height={ALTO} fill="#05030a" opacity="0.26" pointerEvents="none" />}
      {luz === 1 && <rect x={0} y={0} width={ancho} height={ALTO} fill="#3a1a10" opacity="0.1" pointerEvents="none" />}
    </g>
  );
});
