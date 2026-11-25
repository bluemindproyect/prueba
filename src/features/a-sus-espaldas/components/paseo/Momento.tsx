'use client';

import { useEffect, useRef, useState } from 'react';
import { Cuerpo, POSES, ROPA_BIKINI, ROPA_DESNUDA, PIEL, PIEL_SOMBRA } from '../mundo/Chica';
import type { Pose, Ropa } from '../mundo/Chica';
import { CHICO_PARADO, CuerpoChico } from './Chico';
import type { PoseChico } from './Chico';
import { Cuarto } from './Cuarto';
import { SC, SE, poner } from './Escenario';
import { Llamada } from '../minijuegos/Llamada';
import { nivelDe, resultado } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
import type { Call2, GestoElla, Ritmo } from '@/features/a-sus-espaldas/lib/minijuegos/llamada2';
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
 * El momento a solas: se desnudan poco a poco y la escena se calienta con el termómetro (la
 * cámara se cierra, sudan, se les enciende la piel, a él se le levanta). Pasado el punto medio
 * se ponen de perrito y se mueven, y a ella le chorrea. Si él llega, eliges parar o seguir; si
 * sigues, se queda en la puerta y puedes humillarlo. Puedes ponerlo en altavoz.
 */

type Fase = 'sube' | 'pasos' | 'decide' | 'frente' | 'parando' | 'visto' | 'fin';

const g = (id: string): Gesto => gestoPorId(id) ?? (gestoPorId('neutra') as Gesto);

const ABRAZO: Pose = { ...POSES[0], id: 'abrazo', nombre: 'Abrazo', di: 8, fi: 4, dd: 108, fd: 172, inc: 4, cab: 9 };
const BESO: Pose = { ...ABRAZO, id: 'beso', nombre: 'Beso', inc: 6, cab: 15 };
const CERCA: Pose = POSES.find((p) => p.id === 'timida') ?? POSES[0];
const COMO_SI_NADA: Pose = POSES.find((p) => p.id === 'hombros') ?? POSES[0];
// Él está volteado hacia ella: su brazo «der» es el que la abraza.
const ABRAZO_EL: PoseChico = { izq: [10, 24], der: [56, 100], cab: -9, inc: -4 };
const BESO_EL: PoseChico = { izq: [10, 24], der: [56, 100], cab: -15, inc: -6 };
const DETRAS_EL: PoseChico = { izq: [58, 92], der: [58, 92], cab: -6 };
const ENCIMA_EL: PoseChico = { izq: [46, 74], der: [46, 74], cab: -12, inc: -3 };

/** De perrito: ella doblada hacia el lado contrario a él, él encima de su cadera. */
const PERRO_ELLA: Pose = { ...POSES[0], id: 'perro', nombre: 'De perrito', di: 44, fi: 20, dd: 44, fd: 20, inc: -32, cab: -14, sep: 26, rod: 30, baja: 92, cara: 'ojoscerrados' };
const PERRO_EL: PoseChico = { izq: [56, 78], der: [56, 78], cab: 14, inc: 22 };

/** Posturas explícitas de pie: se van turnando cuando ya están desnudos. */
const FUERTES: readonly Pose[] = [
  POSES.find((p) => p.id === 'arqueada') ?? BESO,
  POSES.find((p) => p.id === 'aguanta') ?? BESO,
  POSES.find((p) => p.id === 'piernas') ?? BESO,
  POSES.find((p) => p.id === 'placer') ?? BESO,
  POSES.find((p) => p.id === 'rendida') ?? BESO,
];

// Se desnudan con la excitación: primero el top, después todo.
const ROPA_TOP_FUERA: Ropa = { ...ROPA_BIKINI, vestido: PIEL, sombra: PIEL_SOMBRA };

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
/** Velocidad del empuje de perrito, en radianes por segundo. */
const EMPUJE: Record<Ritmo, number> = { lento: 4.4, firme: 6.6, rapido: 9.4 };
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
  const [aguante, setAguante] = useState(0);
  const aguanteMax = useRef(20);
  const [usados, setUsados] = useState<GestoElla[]>([]);
  const [empuje, setEmpuje] = useState<{ tipo: GestoElla | 'altavoz'; n: number } | null>(null);
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

  // El reloj de las fases (los pasos, la puerta, esconder al otro) y el aguante de él.
  useEffect(() => {
    const id = window.setInterval(() => {
      setDesde((d) => d + 0.05);
      if (faseRef.current === 'frente') setAguante((a) => Math.max(0, a - 0.05));
    }, 50);
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
    } else if ((f === 'sube' || f === 'pasos' || f === 'frente' || f === 'visto') && c.fase === 'fin') {
      ir('fin');
    }
  };

  /** La llamada se acabó (colgaste, colgó él o llegó el final). */
  const alColgar = (r: CallResult) => {
    const f = faseRef.current;
    if (f === 'parando' || f === 'decide') return;
    terminar(f === 'visto' || f === 'frente' ? 'visto' : 'completo', tRef.current, 0, r);
  };

  const parar = () => {
    ir('parando');
    terminar('parado', tRef.current, 2900, callRef.current ? resultado(callRef.current) : undefined);
  };

  const seguir = () => {
    // Se queda en la puerta: mientras más roto esté, menos aguanta mirando.
    const total = Math.max(9, 22 - etapa * 2);
    aguanteMax.current = total;
    setAguante(total);
    ir('frente');
  };

  const hacerGesto = (tipo: GestoElla) => {
    if (usados.includes(tipo)) return;
    setUsados((u) => [...u, tipo]);
    setEmpuje({ tipo, n: (empuje?.n ?? 0) + 1 });
    navigator.vibrate?.(20);
  };

  const ponerAltavoz = () => setEmpuje({ tipo: 'altavoz', n: (empuje?.n ?? 0) + 1 });

  // Dónde está todo.
  const esc = esconditeDe(escena);
  const escX = Math.round(ancho * esc.x);
  // La cámara se cierra sobre la pareja según sube la excitación.
  const elVisible = fase === 'decide' || fase === 'frente' || fase === 'parando' || fase === 'visto' || (fase === 'fin' && plan.entra && t >= plan.en);
  const ventana = Math.round(430 - Math.min(140, t * 1.4));
  const foco = escX - 130;
  const x0 = Math.max(0, Math.min(ancho - ventana, foco - ventana / 2));
  const centro = x0 + ventana / 2;
  const puertaX = centro - 216;

  const separados = fase === 'parando';
  const ritmo: Ritmo = call?.ritmo ?? 'firme';
  // Pasado el punto medio se ponen de perrito, salvo cuando él entra o ella se aparta.
  const perrito = !separados && fase !== 'decide' && t >= 62;
  // El empuje: va y viene con el ritmo. Mueve al otro hacia ella y a ella un poco.
  const vaiven = perrito ? Math.sin(desde * EMPUJE[ritmo]) : 0;
  const d = separados ? 0 : perrito ? 30 + vaiven * 2.4 : t < 20 ? lerp(76, 40, t / 20) : t < 45 ? lerp(40, 34, (t - 20) / 25) : lerp(34, 28, (t - 45) / 20);
  const ellaX = separados ? centro - 34 : centro - d / 2 - vaiven * 1.6;
  const otroX = separados ? lerp(centro + 34, escX, desde / 0.9) : centro + d / 2 - vaiven * 3.2;
  const otroOculto = separados && desde > 0.9;

  const fase4 = t < 20 ? 0 : t < 45 ? 1 : t < 75 ? 2 : 3;
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
              : perrito
                ? 'ojoscerrados'
                : 'ojoscerrados';
  const caraOtro =
    fase === 'decide' || fase === 'parando' || fase === 'frente'
      ? 'miedo'
      : fase === 'visto'
        ? 'avergonzado'
        : t < 20
          ? 'nervioso'
          : t < 45
            ? 'embobado'
            : perrito
              ? 'rendido'
              : 'rendido';
  const poseElla = separados
    ? COMO_SI_NADA
    : perrito
      ? PERRO_ELLA
      : t < 20
        ? CERCA
        : t < 30
          ? ABRAZO
          : t < 45
            ? BESO
            : FUERTES[(Math.floor(desde / 5) + fase4) % FUERTES.length];
  const poseOtro: PoseChico = separados
    ? { ...CHICO_PARADO, paso: desde < 0.9 ? Math.sin(desde * 18) : 0 }
    : perrito
      ? PERRO_EL
      : t < 20
        ? CHICO_PARADO
        : t < 30
          ? ABRAZO_EL
          : t < 45
            ? BESO_EL
            : Math.floor(desde / 5) % 2 === 0
              ? DETRAS_EL
              : ENCIMA_EL;

  const listaVisto = ROSTROS_VISTO[Math.max(0, Math.min(5, etapa))];
  const caraEl =
    fase === 'decide'
      ? etapa >= 2 ? 'receloso' : 'curioso'
      : fase === 'frente'
        ? aguante > 8 ? (etapa >= 3 ? 'rojo' : 'confundido') : 'vidrioso'
        : fase === 'parando'
          ? sospecha >= 40 || desde > 1.6 ? 'sospechosoleve' : 'extrañado'
          : listaVisto[Math.min(listaVisto.length - 1, Math.floor(desde / 1.4))];

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
  // A él se le va levantando con el termómetro; sin ropa se le ve.
  const desnudoEl = ropa !== 'bikini';
  const ereccion = Math.min(1, 0.3 + t / 90);
  // Él recoge el top del suelo cuando entra.
  const topX = fase === 'frente' || fase === 'visto' ? puertaX + 62 : centro + 92;
  const corrida = t >= 100 || fase === 'fin';
  const sudor = Math.min(7, Math.max(0, Math.floor((t - 45) / 8)));
  // Lo que chorrea: desde que se pone de perrito hasta que él entra o ella se aparta.
  const chorrea = perrito && t >= 66;
  const charco = Math.min(26, Math.max(0, (t - 66) * 1.4));

  // La frase cambia sola cada ~5 s mientras la escena sigue; al final se queda una.
  useEffect(() => {
    if (fase === 'pasos' || fase === 'decide' || fase === 'parando' || fase === 'frente') return;
    if (fase === 'fin') {
      setLinea(climaxDe());
      return;
    }
    setLinea((l) => lineaDe(tramo, ritmo, Math.random, l, escena));
    const id = window.setInterval(() => setLinea((l) => lineaDe(tramo, ritmo, Math.random, l, escena)), 5200);
    return () => window.clearInterval(id);
  }, [tramo, ritmo, fase, escena]);

  // Cuando se le acaba el aguante, ya no puede sostenerlo.
  useEffect(() => {
    if (fase === 'frente' && aguante <= 0) ir('visto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, aguante]);

  const texto =
    fase === 'pasos'
      ? 'Se oyen pasos…'
      : fase === 'decide'
        ? `${nombreEl} abre la puerta.`
        : fase === 'frente'
          ? aguante > 8
            ? `${nombreEl} no se va. Los mira desde la puerta.`
            : 'Se le está quebrando la cara.'
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
        {/* la luz fría del teléfono cuando lo pones en altavoz */}
        {call?.altavoz && (
          <ellipse cx={centro} cy={PISO + 24} rx={ventana * 0.6} ry={96} fill="#86c8ea" opacity="0.13" pointerEvents="none" />
        )}
        {/* la sombra de él, alargada en el suelo desde la puerta */}
        {elVisible && (
          <path
            d={`M${puertaX + 34} ${PISO} L${puertaX + 128} ${PISO - 4} L${puertaX + 158} ${PISO - 174} L${puertaX + 58} ${PISO - 178} Z`}
            fill="#000"
            opacity="0.16"
            pointerEvents="none"
          />
        )}
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
        {/* la ropa tirada en el suelo */}
        {t >= 20 && (
          <g transform={`translate(${topX} ${PISO - 5})`}>
            <path d="M-9 0 L-5 -6 M9 0 L5 -6" stroke={ROPA_BIKINI.vestido} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <ellipse cx="-5.5" cy="0" rx="5" ry="3.4" fill={ROPA_BIKINI.vestido} />
            <ellipse cx="5.5" cy="0" rx="5" ry="3.4" fill={ROPA_BIKINI.vestido} />
          </g>
        )}
        {t >= 45 && (
          <path d={`M${centro - 112} ${PISO - 3} l9 -4 l7 5 l-9 4 z`} fill={ROPA_BIKINI.short} opacity="0.9" />
        )}
        {elVisible && (
          <g className={styles.entra}>
            <g transform={poner(puertaX + 40, 1, SC)}>
              <CuerpoChico look={LOOK_EL} g={g(caraEl)} pose={fase === 'visto' ? { izq: [4, 0], der: [4, 0], cab: 6 } : CHICO_PARADO} />
            </g>
          </g>
        )}
        {/* líneas de velocidad cuando va rápido */}
        {ritmo === 'rapido' && t >= 45 && [0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${centro - 58} ${PISO - 214 + i * 32} h-26`}
            stroke="#fff"
            strokeOpacity="0.22"
            strokeWidth="1.4"
            strokeLinecap="round"
            className={styles.veloz}
            style={{ animationDelay: `${i * 0.14}s` }}
          />
        ))}
        <g className={t >= 96 ? styles.espasmo : undefined}>
          <g className={mecer ? styles.mecer : undefined} style={{ transformOrigin: `${centro}px ${PISO}px`, animationDuration: `${mecer || 3}s` }}>
            <g style={{ opacity: otroOculto ? 0 : 1, transition: 'opacity 0.35s' }}>
              <g transform={poner(otroX, separados ? 1 : -1, SC)}>
                <CuerpoChico
                  look={otro.look}
                  g={g(caraOtro)}
                  pose={poseOtro}
                  desnudo={desnudoEl}
                  pene={desnudoEl}
                  ereccion={ereccion}
                  corrida={corrida ? 1 : 0}
                />
              </g>
            </g>
            <g transform={poner(ellaX, 1, SE)}>
              <Cuerpo g={g(caraElla)} ropa={ropaElla} pose={poseElla} mojada={t >= 78} />
            </g>
          </g>
        </g>
        {/* el calor en la piel */}
        <ellipse cx={centro} cy={PISO - 150} rx={110} ry={200} fill="#ff7a4d" opacity={Math.min(0.32, t * 0.0032)} style={{ mixBlendMode: 'soft-light' }} pointerEvents="none" />
        {/* el sudor que se despega */}
        {Array.from({ length: sudor }, (_, i) => (
          <g key={`s${i}`} transform={`translate(${centro - 26 + ((i * 19) % 52)} ${PISO - 250 + ((i * 31) % 130)})`}>
            <path
              d="M0 0 c1.6 2.6 2.2 4 0 5.4 c-2.2 -1.4 -1.6 -2.8 0 -5.4 Z"
              fill="#8ecbea"
              className={styles.sudor}
              style={{ animationDelay: `${(i * 0.7) % 2.6}s` }}
            />
          </g>
        ))}
        {/* lo que le chorrea por la pierna y el charco que deja */}
        {chorrea && (
          <>
            <ellipse cx={ellaX + 24} cy={PISO - 2} rx={charco} ry={charco * 0.2} fill="#eef3f6" opacity="0.75" pointerEvents="none" />
            <path
              d={`M${ellaX + 22} ${PISO - 150} q3 10 -1 20 q-4 10 1 22`}
              fill="none"
              stroke="#eef3f6"
              strokeOpacity="0.55"
              strokeWidth="2.6"
              strokeLinecap="round"
              pointerEvents="none"
            />
            {[0, 1, 2].map((i) => (
              <g key={`c${i}`} transform={`translate(${ellaX + 20 + i * 5} ${PISO - 120 - i * 8})`}>
                <ellipse rx="2.2" ry="3.6" fill="#fff" opacity="0.9" className={styles.sudor} style={{ animationDelay: `${i * 0.55}s` }} />
              </g>
            ))}
          </>
        )}
        {/* la mancha y el goteo del final */}
        {corrida && (
          <>
            <ellipse className={styles.mancha} cx={centro - 44} cy={PISO - 2} rx="24" ry="5" fill="#efe7dc" pointerEvents="none" />
            {[0, 1, 2, 3].map((i) => (
              <g key={`g${i}`} transform={`translate(${centro - 14 + ((i * 11) % 26)} ${PISO - 108 - ((i * 13) % 20)})`}>
                <ellipse rx="1.7" ry="2.6" fill="#fff" opacity="0.9" className={styles.sudor} style={{ animationDelay: `${i * 0.4}s` }} />
              </g>
            ))}
          </>
        )}
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
      {call && !call.altavoz && fase !== 'fin' && (
        <button type="button" className={styles.altavoz} onClick={ponerAltavoz}>
          🔊 Ponerlo en altavoz
        </button>
      )}
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
      {fase === 'frente' && (
        <>
          <div className={cn(styles.decide, styles.frente)}>
            <button type="button" className={styles.gesto} disabled={usados.includes('mira')} onClick={() => hacerGesto('mira')}>
              <span>👁</span>Sostenerle la mirada
              <small>que le duela</small>
            </button>
            <button type="button" className={styles.gesto} disabled={usados.includes('tapa')} onClick={() => hacerGesto('tapa')}>
              <span>🫣</span>Taparte la boca
              <small>que no te oiga</small>
            </button>
            <button type="button" className={styles.gesto} disabled={usados.includes('acerca')} onClick={() => hacerGesto('acerca')}>
              <span>🛏</span>Que se acerque
              <small>a la cama</small>
            </button>
            <button type="button" className={styles.gesto} disabled={usados.includes('nombre')} onClick={() => hacerGesto('nombre')}>
              <span>🗣</span>Decir su nombre
              <small>en voz alta</small>
            </button>
          </div>
          <div className={styles.aguante} role="meter" aria-label={`${nombreEl} aguanta`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((aguante / aguanteMax.current) * 100)}>
            <i style={{ width: `${(aguante / aguanteMax.current) * 100}%` }} />
          </div>
        </>
      )}
      </div>

      {/* El teléfono: su propio espacio, nada lo tapa */}
      <div className={styles.momentoTelefono}>
        <Llamada name={nombreEl} incrustada largo pausada={fase === 'decide' || fase === 'parando'} acelera={fase === 'visto' || fase === 'frente' ? 2 : 1} onProgreso={alProgreso} onFinish={alColgar} empuje={empuje ?? undefined} />
      </div>
    </div>
  );
}