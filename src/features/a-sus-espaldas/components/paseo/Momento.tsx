'use client';

import { useEffect, useRef, useState } from 'react';
import { Cuerpo, POSES, ROPA_BIKINI } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO, CuerpoChico } from './Chico';
import type { PoseChico } from './Chico';
import { Cuarto } from './Cuarto';
import { SC, SE, poner } from './Escenario';
import { mostrarGuia, yaVista } from '../guia';
import { LOOK_EL } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Escena, Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { gestoPorId } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import { ALTO, PISO, esconditeDe } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import type { Final, Plan } from '@/features/a-sus-espaldas/lib/paseo/momento';
import { cn } from '@/lib/cn';
import styles from './paseo.module.css';


/**
 * El momento a solas: abrazados y con ropa (ella en bikini), se mecen y se besan. Sus caras
 * cambian poco a poco y la intensidad sube sola, sin botones. Si él llega, tú decides.
 */

type Fase = 'sube' | 'pasos' | 'decide' | 'parando' | 'visto' | 'fin';

const g = (id: string): Gesto => gestoPorId(id) ?? (gestoPorId('neutra') as Gesto);

const ABRAZO: Pose = { ...POSES[0], id: 'abrazo', nombre: 'Abrazo', di: 8, fi: 4, dd: 108, fd: 172, inc: 4, cab: 9 };
const BESO: Pose = { ...ABRAZO, id: 'beso', nombre: 'Beso', inc: 6, cab: 15 };
const CERCA: Pose = POSES.find((p) => p.id === 'timida') ?? POSES[0];
const COMO_SI_NADA: Pose = POSES.find((p) => p.id === 'hombros') ?? POSES[0];
// Él está volteado hacia ella: su brazo «der» es el que la abraza.
const ABRAZO_EL: PoseChico = { izq: [10, 24], der: [56, 100], cab: -9, inc: -4 };
const BESO_EL: PoseChico = { izq: [10, 24], der: [56, 100], cab: -15, inc: -6 };

const ROSTROS_VISTO: readonly (readonly string[])[] = [
  ['confundido', 'vidrioso', 'lloriqueo', 'llanto'],
  ['confundido', 'vidrioso', 'lloriqueo', 'llanto'],
  ['receloso', 'mandibula', 'vidrioso', 'llanto'],
  ['rojo', 'contenido', 'vidrioso', 'llanto'],
  ['vacio', 'devastado', 'llanto', 'derrumbado'],
  ['vacio', 'devastado', 'llanto', 'derrumbado'],
];

const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.max(0, Math.min(1, k));

interface Props {
  escena: Escena;
  ancho: number;
  luz: 0 | 1 | 2;
  lugar: string;
  otro: { nombre: string; look: Look };
  nombreEl: string;
  etapa: number;
  sospecha: number;
  plan: Plan;
  onFin: (final: Final, alcanzado: number) => void;
}

export function Momento({ escena, ancho, luz, lugar, otro, nombreEl, etapa, sospecha, plan, onFin }: Props) {
  const [t, setT] = useState(0);
  const [fase, setFase] = useState<Fase>('sube');
  const [desde, setDesde] = useState(0); // segundos desde que cambió la fase
  const tRef = useRef(0);
  const faseRef = useRef<Fase>('sube');
  const fin = useRef(false);
  const alFin = useRef(onFin);
  alFin.current = onFin;

  const ir = (f: Fase) => {
    faseRef.current = f;
    setFase(f);
    setDesde(0);
  };

  const terminar = (final: Final, alcanzado: number, espera: number) => {
    if (fin.current) return;
    fin.current = true;
    window.setTimeout(() => alFin.current(final, alcanzado), espera);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const f = faseRef.current;
      setDesde((d) => d + 0.05);
      if (f === 'decide' || f === 'fin' || f === 'parando') return;
      const rate = f === 'visto' ? 5 : 3;
      tRef.current = Math.min(100, tRef.current + rate * 0.05);
      setT(tRef.current);
      if (f === 'sube' && plan.entra && tRef.current >= plan.en - 10) {
        ir('pasos');
        navigator.vibrate?.(40);
      } else if (f === 'pasos' && tRef.current >= plan.en) {
        ir('decide');
        navigator.vibrate?.([30, 60, 30]);
      } else if (tRef.current >= 100 && (f === 'sube' || f === 'visto')) {
        ir('fin');
        terminar(f === 'visto' ? 'visto' : 'completo', 100, 1700);
      }
    }, 50);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La primera vez que él entra: explicar las dos opciones.
  useEffect(() => {
    if (fase !== 'decide' || yaVista('paseo-decidir')) return;
    const id = window.setTimeout(
      () =>
        mostrarGuia(
          [
            { el: '[data-tour="parar"]', titulo: 'Parar', texto: 'Escondes al otro rápido. Él sospecha, pero no ve nada.' },
            { el: '[data-tour="seguir"]', titulo: 'Seguir', texto: 'No se detienen y él los ve. Ganas más, pero a él lo rompe.' },
          ],
          { id: 'paseo-decidir' },
        ),
      350,
    );
    return () => window.clearTimeout(id);
  }, [fase]);

  const parar = () => {
    ir('parando');
    terminar('parado', tRef.current, 2900);
  };
  const seguir = () => ir('visto');

  // Dónde está todo.
  const esc = esconditeDe(escena);
  const escX = Math.round(ancho * esc.x);
  const ventana = 430;
  const x0 = Math.max(0, Math.min(ancho - ventana, escX - ventana + 70));
  const centro = x0 + 230;
  const puertaX = x0 + 14;

  const separados = fase === 'parando';
  const d = separados ? 0 : t < 20 ? lerp(76, 40, t / 20) : t < 45 ? lerp(40, 34, (t - 20) / 25) : lerp(34, 28, (t - 45) / 20);
  const ellaX = separados ? centro - 34 : centro - d / 2;
  const otroX = separados ? lerp(centro + 34, escX, desde / 0.9) : centro + d / 2;
  const otroOculto = separados && desde > 0.9;

  const besando = t >= 45;
  const caraElla =
    fase === 'decide'
      ? 'sorpresaella'
      : fase === 'parando'
        ? desde > 1.2
          ? 'dulce'
          : 'nervios'
        : fase === 'visto' && desde < 1.5
          ? 'burla'
          : t < 20
            ? 'nervios'
            : t < 45
              ? 'deseoella'
              : 'ojoscerrados';
  const caraOtro = fase === 'decide' || fase === 'parando' ? 'miedo' : fase === 'visto' ? 'avergonzado' : t < 20 ? 'nervioso' : t < 45 ? 'embobado' : 'rendido';
  const poseElla = fase === 'parando' ? COMO_SI_NADA : t < 20 ? CERCA : besando ? BESO : ABRAZO;
  const poseOtro: PoseChico = separados ? { ...CHICO_PARADO, paso: desde < 0.9 ? Math.sin(desde * 18) : 0 } : t < 20 ? CHICO_PARADO : besando ? BESO_EL : ABRAZO_EL;

  const elVisible = fase === 'decide' || fase === 'parando' || fase === 'visto' || (fase === 'fin' && plan.entra);
  const listaVisto = ROSTROS_VISTO[Math.max(0, Math.min(5, etapa))];
  const caraEl =
    fase === 'decide'
      ? etapa >= 2 ? 'receloso' : 'curioso'
      : fase === 'parando'
        ? sospecha >= 40 || desde > 1.6 ? 'sospechosoleve' : 'extrañado'
        : listaVisto[Math.min(listaVisto.length - 1, Math.floor(desde / 1.4))];

  const fase4 = t < 20 ? 0 : t < 45 ? 1 : t < 75 ? 2 : 3;
  const mecer = separados || fase === 'decide' ? 0 : [3.4, 3, 2.6, 2.2][fase4];
  const corazones = separados || fase === 'decide' ? 0 : [0, 3, 6, 9][fase4];
  const oscuro = 0.06 + t * 0.0034;
  const bpm = Math.round(76 + t * 0.7);

  const texto =
    fase === 'pasos'
      ? 'Se oyen pasos…'
      : fase === 'decide'
        ? `${nombreEl} abre la puerta.`
        : fase === 'parando'
          ? otroOculto
            ? `Lo escondes en ${esc.nombre}.`
            : 'Rápido…'
          : fase === 'visto'
            ? 'No se detienen.'
            : fase === 'fin'
              ? 'Se quedan abrazados.'
              : ['Cierras la puerta.', 'Se abrazan.', 'Un beso.', 'Se olvidan de todo.'][fase4];

  return (
    <div className={styles.momento} role="dialog" aria-label="El momento">
      <svg className={styles.svg} viewBox={`${x0} 0 ${ventana} ${ALTO}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={texto}>
        <Cuarto escena={escena} ancho={ancho} luz={luz} />
        {/* la puerta por la que puede entrar él */}
        <g>
          <rect x={puertaX} y={PISO - 172} width="66" height="172" rx="3" fill="#1b1420" />
          {fase === 'pasos' && <rect x={puertaX + 4} y={PISO - 6} width="58" height="6" className={styles.rendija} />}
          <rect
            x={puertaX + 4}
            y={PISO - 166}
            width={elVisible ? 14 : 58}
            height="166"
            rx="2"
            fill="#6b5240"
            className={fase === 'pasos' ? styles.tiembla : undefined}
          />
          {!elVisible && <circle cx={puertaX + 50} cy={PISO - 84} r="4" fill="#c9a86a" />}
        </g>
        {elVisible && (
          <g className={styles.entra}>
            <g transform={poner(puertaX + 40, 1, SC)}>
              <CuerpoChico look={LOOK_EL} g={g(caraEl)} pose={fase === 'visto' ? { izq: [4, 0], der: [4, 0], cab: 6 } : CHICO_PARADO} />
            </g>
          </g>
        )}
        <g className={mecer ? styles.mecer : undefined} style={{ transformOrigin: `${centro}px ${PISO}px`, animationDuration: `${mecer || 3}s` }}>
          <g style={{ opacity: otroOculto ? 0 : 1, transition: 'opacity 0.35s' }}>
            <g transform={poner(otroX, separados ? 1 : -1, SC)}>
              <CuerpoChico look={otro.look} g={g(caraOtro)} pose={poseOtro} />
            </g>
          </g>
          <g transform={poner(ellaX, 1, SE)}>
            <Cuerpo g={g(caraElla)} ropa={ROPA_BIKINI} pose={poseElla} />
          </g>
        </g>
        {Array.from({ length: corazones }, (_, i) => (
          <path
            key={i}
            d="M0 4 C-6 -5 -13 2 0 13 C13 2 6 -5 0 4Z"
            className={styles.corazonSube}
            style={{ animationDelay: `${(i * 0.37) % 2.4}s` }}
            transform={`translate(${centro - 40 + ((i * 37) % 80)} ${PISO - 200 - ((i * 23) % 40)})`}
          />
        ))}
        <rect x={x0} y={0} width={ventana} height={ALTO} fill="#0a0410" opacity={oscuro} pointerEvents="none" />
      </svg>

      <p className={styles.lugarMomento}>🔒 {lugar}</p>
      <div className={styles.intensidad} aria-label={`Intensidad ${Math.round(t)}`}>
        <span className={styles.latido} style={{ animationDuration: `${(60 / bpm).toFixed(2)}s` }}>
          ♥
        </span>
        <div className={styles.tubo}>
          <i style={{ height: `${t}%` }} />
        </div>
      </div>
      {fase === 'pasos' && <p className={styles.pasos}>👣 👣 👣</p>}
      <p key={texto} className={cn(styles.texto, fase === 'pasos' && styles.textoAlerta)}>
        {texto}
      </p>
      {fase === 'decide' && (
        <div className={styles.decide}>
          <button type="button" className={styles.parar} onClick={parar} data-tour="parar">
            <span>✋</span>Parar
          </button>
          <button type="button" className={styles.seguir} onClick={seguir} data-tour="seguir">
            <span>💗</span>Seguir
          </button>
        </div>
      )}
    </div>
  );
}
