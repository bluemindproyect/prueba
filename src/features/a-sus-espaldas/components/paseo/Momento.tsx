'use client';

import { useEffect, useRef, useState } from 'react';
import { Cuerpo, POSES, ROPA_BIKINI, PIEL, PIEL_SOMBRA } from '../mundo/Chica';
import type { Pose } from '../mundo/Chica';
import { CHICO_PARADO, CuerpoChico } from './Chico';
import type { PoseChico } from './Chico';
import { Cuarto } from './Cuarto';
import { SC, SE, poner } from './Escenario';
import { Llamada } from '../minijuegos/Llamada';
import { nivelDe, resultado } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { Call2, Ritmo } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { CallResult } from '@/features/a-sus-espaldas/lib/minijuegos/llamada';
import { LOOK_EL } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Escena, Look } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { gestoPorId } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import { ALTO, PISO, esconditeDe } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import type { Final, Plan } from '@/features/a-sus-espaldas/lib/paseo/momento';
import { climaxDe, lineaDe, ropaDe } from '@/features/a-sus-espaldas/lib/paseo/escenas';
import type { Tramo } from '@/features/a-sus-espaldas/lib/paseo/escenas';
import { cn } from '@/lib/cn';
import styles from './paseo.module.css';


/**
 * El momento a solas: se desnudan poco a poco, se mecen y se besan, y lo que se lee sube con
 * la excitación. Mientras tanto él llama por teléfono (la llamada está incrustada abajo o al
 * lado, sin tapar la escena). El ritmo que eliges en el teléfono manda: sube el termómetro,
 * la escena se mece más rápido, cambian las caras y cambia lo que pasa. Puede durar hasta 10
 * minutos reales. Si él llega, tú decides.
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

// Se desnudan con la excitación: primero el top, después todo. El «desnudo» es del color de
// la piel, con la sombra del bikini como guía para que se lea el cuerpo.
const ROPA_TOP_FUERA = { ...ROPA_BIKINI, vestido: PIEL, sombra: PIEL_SOMBRA };
const ROPA_DESNUDA = { ...ROPA_TOP_FUERA, short: PIEL };

const ROSTROS_VISTO: readonly (readonly string[])[] = [
  ['confundido', 'vidrioso', 'lloriqueo', 'llanto'],
  ['confundido', 'vidrioso', 'lloriqueo', 'llanto'],
  ['receloso', 'mandibula', 'vidrioso', 'llanto'],
  ['rojo', 'contenido', 'vidrioso', 'llanto'],
  ['vacio', 'devastado', 'llanto', 'derrumbado'],
  ['vacio', 'devastado', 'llanto', 'derrumbado'],
];

const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.max(0, Math.min(1, k));

/** Cuánto se mece la pareja (segundos por vaivén) según el ritmo que eligió en el teléfono. */
const MECER: Record<Ritmo, number> = { lento: 3.6, firme: 2.6, rapido: 1.7 };
const SUBE_RITMO: Record<Ritmo, string> = { lento: '›', firme: '››', rapido: '›››' };
const NOMBRE_RITMO: Record<Ritmo, string> = { lento: 'Despacio', firme: 'Firme', rapido: 'Rápido' };

/** Intensidad de 0 a 100: es la excitación del teléfono (de 1 a 8) puesta en porcentaje. */
const intensidadDe = (c: Call2 | null): number => {
  if (!c) return 0;
  if (c.fase === 'fin' && c.climax !== 'no') return 100;
  return Math.max(0, Math.min(100, ((c.excit - 1) / 7) * 100));
};
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
  onFin: (final: Final, alcanzado: number, llamada?: CallResult) => void;
}

export function Momento({ escena, ancho, luz, lugar, otro, nombreEl, etapa, sospecha, plan, onFin }: Props) {
  const [call, setCall] = useState<Call2 | null>(null);
  const callRef = useRef<Call2 | null>(null);
  const [fase, setFase] = useState<Fase>('sube');
  const [desde, setDesde] = useState(0); // segundos desde que cambió la fase
  const [linea, setLinea] = useState('Cierras la puerta.');
  const t = intensidadDe(call);
  const tRef = useRef(0);
  tRef.current = t;
  const faseRef = useRef<Fase>('sube');
  const fin = useRef(false);
  const alFin = useRef(onFin);
  alFin.current = onFin;

  const ir = (f: Fase) => {
    faseRef.current = f;
    setFase(f);
    setDesde(0);
  };

  const terminar = (final: Final, alcanzado: number, espera: number, llamada?: CallResult) => {
    if (fin.current) return;
    fin.current = true;
    window.setTimeout(() => alFin.current(final, alcanzado, llamada), espera);
  };

  // El reloj de las fases (los pasos, la puerta, esconder al otro).
  useEffect(() => {
    const id = window.setInterval(() => setDesde((d) => d + 0.05), 50);
    return () => window.clearInterval(id);
  }, []);

  /** Cada cambio del teléfono: de ahí sale la intensidad, y con ella cuándo llegan los pasos y él. */
  const alProgreso = (c: Call2) => {
    callRef.current = c;
    setCall(c);
    const tt = intensidadDe(c);
    const f = faseRef.current;
    if (f === 'sube' && plan.entra && tt >= plan.en - 10) {
      ir('pasos');
      navigator.vibrate?.(40);
    } else if (f === 'pasos' && tt >= plan.en) {
      ir('decide');
      navigator.vibrate?.([30, 60, 30]);
    } else if ((f === 'sube' || f === 'pasos' || f === 'visto') && c.fase === 'fin') {
      ir('fin');
    }
  };

  /** La llamada se acabó (colgaste, colgó él o llegó el final). */
  const alColgar = (r: CallResult) => {
    const f = faseRef.current;
    if (f === 'parando' || f === 'decide') return;
    terminar(f === 'visto' ? 'visto' : 'completo', tRef.current, 0, r);
  };

  const parar = () => {
    ir('parando');
    terminar('parado', tRef.current, 2900, callRef.current ? resultado(callRef.current) : undefined);
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

  const elVisible = fase === 'decide' || fase === 'parando' || fase === 'visto' || (fase === 'fin' && plan.entra && t >= plan.en);
  const listaVisto = ROSTROS_VISTO[Math.max(0, Math.min(5, etapa))];
  const caraEl =
    fase === 'decide'
      ? etapa >= 2 ? 'receloso' : 'curioso'
      : fase === 'parando'
        ? sospecha >= 40 || desde > 1.6 ? 'sospechosoleve' : 'extrañado'
        : listaVisto[Math.min(listaVisto.length - 1, Math.floor(desde / 1.4))];

  const fase4 = t < 20 ? 0 : t < 45 ? 1 : t < 75 ? 2 : 3;
  const ritmo: Ritmo = call?.ritmo ?? 'firme';
  const mecer = separados || fase === 'decide' ? 0 : MECER[ritmo] * [1.25, 1.1, 1, 0.9][fase4];
  const corazones = separados || fase === 'decide' ? 0 : [0, 3, 6, 9][fase4];
  const oscuro = 0.06 + t * 0.0034;
  const bpm = Math.round(76 + t * 0.7 + (ritmo === 'rapido' ? 10 : ritmo === 'lento' ? -4 : 0));
  const nivel = call ? nivelDe(call) : 1;
  const colorTermo = t < 35 ? '#86c8ea' : t < 70 ? '#e88fb0' : '#e0457b';

  // Cuánta ropa queda y qué se lee: sube con el termómetro y cambia con el ritmo.
  const tramo: Tramo = fase4 === 3 ? 3 : fase4 === 2 ? 2 : fase4 === 1 ? 1 : 0;
  const ropa = ropaDe(tramo);
  const ropaElla = ropa === 'bikini' ? ROPA_BIKINI : ropa === 'topFuera' ? ROPA_TOP_FUERA : ROPA_DESNUDA;
  const lookOtro = ropa === 'bikini' ? otro.look : { ...otro.look, ropa: otro.look.piel };

  // La frase cambia sola cada ~5 s mientras la escena sigue; al final se queda una.
  useEffect(() => {
    if (fase === 'pasos' || fase === 'decide' || fase === 'parando') return;
    if (fase === 'fin') {
      setLinea(climaxDe());
      return;
    }
    setLinea((l) => lineaDe(tramo, ritmo, Math.random, l));
    const id = window.setInterval(() => setLinea((l) => lineaDe(tramo, ritmo, Math.random, l)), 5200);
    return () => window.clearInterval(id);
  }, [tramo, ritmo, fase]);

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
            : linea;

  return (
    <div className={styles.momento} role="dialog" aria-label="El momento">
      <div className={styles.momentoEscena}>
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
              <CuerpoChico look={lookOtro} g={g(caraOtro)} pose={poseOtro} />
            </g>
          </g>
          <g transform={poner(ellaX, 1, SE)}>
            <Cuerpo g={g(caraElla)} ropa={ropaElla} pose={poseElla} />
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
      {/* El termómetro de excitación: sube con el ritmo que eliges en el teléfono */}
      <div className={styles.termo} role="meter" aria-label="Excitación" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t)}>
        <small className={styles.termoNivel}>{nivel}/8</small>
        <div className={styles.termoTubo}>
          <i style={{ height: `${t}%`, background: `linear-gradient(0deg, #86c8ea, ${colorTermo})` }} />
          {[1, 2, 3, 4, 5, 6, 7].map((m) => (
            <b key={m} style={{ bottom: `${(m / 8) * 100}%` }} />
          ))}
        </div>
        <span className={styles.termoBulbo} style={{ background: colorTermo, animationDuration: `${(60 / bpm).toFixed(2)}s` }}>
          ♥
        </span>
        <small className={styles.termoRitmo} aria-label={`Ritmo: ${NOMBRE_RITMO[ritmo]}`}>
          {SUBE_RITMO[ritmo]}
        </small>
      </div>
      {fase === 'pasos' && <p className={styles.pasos}>👣 👣 👣</p>}
      <p key={texto} className={cn(styles.texto, fase === 'pasos' && styles.textoAlerta)} aria-live="polite">
        {texto}
      </p>
      {fase === 'decide' && (
        <div className={styles.decide}>
          <button type="button" className={styles.parar} onClick={parar} data-tour="parar">
            <span>✋</span>Parar
            <small>lo escondes</small>
          </button>
          <button type="button" className={styles.seguir} onClick={seguir} data-tour="seguir">
            <span>💗</span>Seguir
            <small>él los ve</small>
          </button>
        </div>
      )}
      </div>

      {/* El teléfono: su propio espacio, nada lo tapa */}
      <div className={styles.momentoTelefono}>
        <Llamada name={nombreEl} incrustada largo pausada={fase === 'decide' || fase === 'parando'} acelera={fase === 'visto' ? 2 : 1} onProgreso={alProgreso} onFinish={alColgar} />
      </div>
    </div>
  );
}