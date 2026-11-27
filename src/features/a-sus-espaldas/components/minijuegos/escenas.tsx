'use client';

import styles from './mamada.module.css';

interface EscenaProps {
  nivel: number;
  fase: 'activo' | 'corrida';
  orgasmos: number;
}

function Gotas({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const dx = 6 + (i % 3) * 13 + (i % 2) * 5;
        const dy = 6 + Math.floor(i / 3) * 12 + (i % 2) * 4;
        return (
          <ellipse
            key={i}
            className={styles.gota}
            cx={x - dx}
            cy={y + dy}
            rx={2.4 + (i % 3) * 0.9}
            ry={3.4 + (i % 3) * 1.1}
            style={{ animationDelay: `${i * 0.09}s` }}
          />
        );
      })}
    </g>
  );
}

export function EscenaMamada({ nivel, fase, orgasmos }: EscenaProps) {
  const hondo = (nivel / 100) * 16;
  const bocaX = 214 - hondo;
  const puntaX = bocaX - 15;
  const corrida = fase === 'corrida';
  const cabeza = `translate(${-hondo} 0)`;

  return (
    <svg viewBox="0 0 320 200" className={styles.escena} role="img" aria-label="Boca mamando la verga">
      <rect width="320" height="200" fill="var(--fondo)" />

      <g transform={cabeza}>
        <path
          d="M 244 22 C 288 10, 322 38, 318 98 L 318 200 C 292 204, 262 192, 246 176 C 288 146, 292 76, 250 46 Z"
          fill="var(--pelo)"
        />
        <path d="M 258 140 L 306 200 L 216 200 Z" fill="var(--pielSombra)" />
        <path
          d="M 248 34 C 230 38, 216 52, 210 66 C 204 74, 194 80, 190 86 C 186 90, 190 95, 197 95 L 198 99 C 190 101, 185 106, 185 113 L 184 124 C 184 133, 191 140, 201 144 C 216 150, 236 154, 252 154 C 284 154, 304 140, 308 108 L 308 36 Z"
          fill="var(--piel)"
        />
        <path
          d="M 250 32 C 242 44, 234 56, 230 66 C 242 56, 260 54, 274 62 C 268 48, 262 38, 250 32 Z"
          fill="var(--peloLuz)"
        />
        <path d="M 230 68 C 238 62, 248 62, 255 66" stroke="var(--pelo)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {corrida ? (
          <path d="M 229 79 C 237 86, 248 86, 254 78" stroke="var(--pelo)" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <ellipse cx={241} cy={78} rx={4} ry={3.6} fill="var(--pelo)" />
            <path d="M 254 76 L 259 73 M 254 79 L 260 79" stroke="var(--pelo)" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}
        <ellipse cx={250} cy={101} rx={13} ry={8} fill="var(--labio)" opacity={0.45} />
      </g>

      <ellipse cx={bocaX - 17} cy={118} rx={20} ry={15} fill="var(--boca)" />

      <path
        d={`M -30 101 L ${puntaX} 101 Q ${bocaX + 3} 118 ${puntaX} 135 L -30 135 Z`}
        fill="var(--pene)"
      />
      <ellipse cx={puntaX - 2} cy={118} rx={16} ry={17} fill="var(--glande)" />
      <path d={`M ${puntaX - 2} 101 Q ${puntaX - 18} 118 ${puntaX - 2} 135`} stroke="var(--boca)" strokeWidth="2" fill="none" opacity={0.5} />

      <g transform={cabeza}>
        <path
          d="M 176 106 C 180 95, 196 91, 212 93 C 221 94, 225 100, 222 107 C 216 100, 196 98, 176 106 Z"
          fill="var(--labio)"
        />
        <path
          d="M 176 128 C 182 139, 198 143, 214 139 C 223 137, 225 132, 222 126 C 214 133, 194 133, 176 128 Z"
          fill="var(--labio)"
        />
        <path d="M 180 108 C 190 106, 206 106, 216 108" stroke="var(--boca)" strokeWidth="1.4" fill="none" opacity={0.4} />
        {corrida && <Gotas n={Math.min(10, 4 + orgasmos * 2)} x={178} y={134} />}
      </g>
    </svg>
  );
}

export function EscenaPerrito({ nivel, fase, orgasmos }: EscenaProps) {
  const empuje = (nivel / 100) * 12;
  const tx = 204 - empuje;
  const ty = 138;
  const corrida = fase === 'corrida';
  const cuerpo = `translate(${-empuje} 0)`;

  return (
    <svg viewBox="0 0 320 200" className={styles.escena} role="img" aria-label="Follando a perrito">
      <rect width="320" height="200" fill="var(--fondo)" />
      <rect y="176" width="320" height="24" fill="var(--pelo)" opacity="0.55" />

      <g transform={cuerpo}>
        <ellipse cx={168} cy={176} rx={34} ry={26} fill="var(--pielSombra)" />
        <ellipse cx={236} cy={178} rx={32} ry={24} fill="var(--pielSombra)" />
        <path d="M 176 96 C 150 72, 118 64, 96 76 L 88 94 C 116 84, 146 92, 170 114 Z" fill="var(--piel)" />
        <ellipse cx={62} cy={104} rx={26} ry={27} fill="var(--piel)" />
        <path
          d="M 40 96 C 42 76, 66 68, 84 80 C 92 86, 92 100, 84 108 C 74 96, 54 92, 40 96 Z"
          fill="var(--pelo)"
        />
        <path d="M 80 112 C 64 128, 54 150, 52 172" stroke="var(--piel)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <path d="M 88 120 C 80 140, 74 158, 74 176" stroke="var(--pielSombra)" strokeWidth="9" strokeLinecap="round" fill="none" />

        <ellipse cx={184} cy={124} rx={42} ry={44} fill="var(--piel)" />
        <ellipse cx={226} cy={126} rx={40} ry={42} fill="var(--piel)" />
        <ellipse cx={184} cy={100} rx={34} ry={20} fill="var(--pielSombra)" opacity={0.5} />
        <path d="M 205 92 C 199 112, 199 142, 207 164" stroke="var(--pielSombra)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      <path
        d={`M 311 181 L ${tx + 8} 127 Q ${tx - 16} ${ty - 9} ${tx - 8} ${ty + 11} L 285 219 Q 318 214 311 181 Z`}
        fill="var(--pene)"
      />
      <ellipse cx={tx - 2} cy={ty} rx={13} ry={11} fill="var(--glande)" />
      <path d={`M ${tx + 8} 127 Q ${tx - 2} ${ty - 2} ${tx - 8} ${ty + 11}`} stroke="var(--boca)" strokeWidth="2" fill="none" opacity={0.45} />

      {corrida && <Gotas n={Math.min(10, 4 + orgasmos * 2)} x={206} y={148} />}
    </svg>
  );
}