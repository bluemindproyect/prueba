/** Iconos del mundo: dibujos propios, sin emojis ni texto. */
const base = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

export type NombreIcono = 'chat' | 'mundo' | 'libro' | 'puntos' | 'cara' | 'corazon' | 'fuego' | 'oreja' | 'mascara' | 'rayo' | 'grito' | 'tierna' | 'fria' | 'pista' | 'espera' | 'telefono' | 'cerca' | 'atras' | 'cerrar' | 'ojo' | 'candado';

export function Icono({ n, size = 26 }: { n: NombreIcono; size?: number }) {
  const p = { ...base, width: size, height: size };
  switch (n) {
    case 'chat':
      return (
        <svg {...p}>
          <path d="M4 5h16v11H9l-5 4z" />
          <path d="M8 9.500h8M8 12.500h5" />
        </svg>
      );
    case 'mundo':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c3 3.500 3 14.500 0 18M12 3c-3 3.500-3 14.500 0 18" />
        </svg>
      );
    case 'libro':
      return (
        <svg {...p}>
          <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
          <path d="M8 4v13M11 8h4" />
        </svg>
      );
    case 'puntos':
      return (
        <svg {...p}>
          <circle cx="5" cy="12" r="1.600" fill="currentColor" />
          <circle cx="12" cy="12" r="1.600" fill="currentColor" />
          <circle cx="19" cy="12" r="1.600" fill="currentColor" />
        </svg>
      );
    case 'cara':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.500 14.500c1 1.600 2 2.200 3.500 2.200s2.500-.6 3.500-2.200" />
          <circle cx="9" cy="10" r=".8" fill="currentColor" />
          <circle cx="15" cy="10" r=".8" fill="currentColor" />
        </svg>
      );
    case 'corazon':
      return (
        <svg {...p}>
          <path d="M12 20s-7.500-4.800-7.500-10.200A4.200 4.200 0 0 1 12 7.300a4.200 4.200 0 0 1 7.500 2.500C19.500 15.200 12 20 12 20z" />
        </svg>
      );
    case 'fuego':
      return (
        <svg {...p}>
          <path d="M12 3c1 4 5 5.500 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .2 1.500 1 2 1.500 2C10 8 11 5 12 3z" />
        </svg>
      );
    case 'oreja':
      return (
        <svg {...p}>
          <path d="M8 10a4 4 0 0 1 8 0c0 3-2 3.500-2 6a2.500 2.500 0 0 1-5 0" />
          <path d="M11 10a1 1 0 0 1 2 0" />
        </svg>
      );
    case 'mascara':
      return (
        <svg {...p}>
          <path d="M4 6c5 2 11 2 16 0v6c0 4-3.500 7-8 7s-8-3-8-7z" />
          <path d="M8 11h2M14 11h2M9 15c2 1 4 1 6 0" />
        </svg>
      );
    case 'rayo':
      return (
        <svg {...p}>
          <path d="M13 3L5 13h6l-1 8 8-10h-6z" />
        </svg>
      );
    case 'grito':
      return (
        <svg {...p}>
          <path d="M4 10v4h3l5 4V6L7 10z" />
          <path d="M16 9c1.500 1.500 1.500 4.500 0 6M19 6.500c3 3 3 8 0 11" />
        </svg>
      );
    case 'tierna':
      return (
        <svg {...p}>
          <path d="M12 20s-7.500-4.800-7.500-10.200A4.200 4.200 0 0 1 12 7.300a4.200 4.200 0 0 1 7.500 2.500C19.500 15.200 12 20 12 20z" fill="currentColor" fillOpacity=".25" />
        </svg>
      );
    case 'fria':
      return (
        <svg {...p}>
          <path d="M12 3v18M4.500 7.500l15 9M19.500 7.500l-15 9" />
        </svg>
      );
    case 'pista':
      return (
        <svg {...p}>
          <path d="M4 20l5-5M9 15a5 5 0 1 1 6-6 5 5 0 0 1-6 6z" />
        </svg>
      );
    case 'espera':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'telefono':
      return (
        <svg {...p}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 18h2" />
        </svg>
      );
    case 'cerca':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="2.500" />
          <circle cx="16" cy="8" r="2.500" />
          <path d="M3.500 19c0-3 2-5 4.500-5s4.500 2 4.500 5M11.500 19c0-3 2-5 4.500-5s4.500 2 4.500 5" />
        </svg>
      );
    case 'atras':
      return (
        <svg {...p}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      );
    case 'cerrar':
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'ojo':
      return (
        <svg {...p}>
          <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
          <circle cx="12" cy="12" r="2.800" />
        </svg>
      );
    case 'candado':
      return (
        <svg {...p}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
  }
}
