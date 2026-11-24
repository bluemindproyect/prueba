'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Escenario } from './Escenario';
import type { Burbuja, Figura } from './Escenario';
import { Momento } from './Momento';
import { mostrarGuia, yaVista } from '../guia';
import type { PasoGuia } from '../guia';
import { ETAPAS, LOOK_EL, T, ZONAS } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Persona } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { gestoDeEl, gestoPorId } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import type { Gesto } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import {
  avanzar,
  dejarPista,
  distante,
  elAqui,
  elCerca,
  etapaDe,
  fmt,
  fresco,
  hora,
  ir,
  limpiar,
  lugarPorId,
  lugares,
  nuevoCiclo,
  personas,
  presentes,
  puedeCambiar,
  responder,
  revivir,
  seducir,
  siguientePaso,
  ternura,
  tick,
  tramoEl,
  zonaDe,
} from '@/features/a-sus-espaldas/lib/mundo/motor';
import type { Aviso, Estado, Limpieza } from '@/features/a-sus-espaldas/lib/mundo/motor';
import { anchoDe, luzDe, posiciones, puertasDe } from '@/features/a-sus-espaldas/lib/paseo/cuartos';
import { corazones, invitar, planear, puedeCerrar, seguidor, soltar, terminarMomento } from '@/features/a-sus-espaldas/lib/paseo/momento';
import type { Final, Plan, Resultado } from '@/features/a-sus-espaldas/lib/paseo/momento';
import { useGuardado } from '@/features/a-sus-espaldas/lib/paseo/use-guardado';
import { usePersistentState } from '@/lib/use-persistent-state';
import { cn } from '@/lib/cn';
import styles from './paseo.module.css';

/**
 * El paseo: la pantalla principal. Ella camina con el dedo por los cuartos vistos de lado y
 * abajo dice quién está cerca y qué puedes hacer. Une el escenario, la invitación, el momento
 * a solas, el resultado, el mapa, los avisos de él, el menú, la guía y el guardado en la nube.
 * Usa la misma partida que «El mundo»: se sigue donde te quedaste.
 */

const CLAVE = 'a-sus-espaldas-mundo-v1';

/** Cara de cada quien según cómo es. */
const GESTO_OTRO: Record<Persona['rasgo'], string> = { timido: 'timido', ingenuo: 'embobado', culpa: 'dudoso', miedo: 'ansiosootro' };

const TITULO_AVISO: Record<Aviso['tipo'], string> = {
  mensaje: '📱 Te escribe',
  busca: '👣 Te está buscando',
  sorpresa: '🎁 Una sorpresa',
  descubierto: '💔 Te descubrió',
  nota: '📝 Nota',
};

const TITULO_FINAL: Record<Final, string> = { completo: 'Nadie se enteró', parado: 'Por poco', visto: 'Te vio' };

/** Cuartos donde te puedes cambiar de ropa. */
const ESCENAS_ROPA = new Set<string>(['cama', 'bano', 'vestidor', 'hotel']);

const GUIA_INICIO: readonly PasoGuia[] = [
  {
    el: '[data-tour="escena"]',
    titulo: 'Camina con el dedo',
    texto: 'Toca la pantalla o deja el dedo donde quieras ir, y ella camina hacia allá. En las orillas están las puertas.',
  },
  {
    el: '[data-tour="quien"]',
    titulo: 'Quién está cerca',
    texto: 'Cuando llegas junto a alguien, aquí sale su nombre. Los corazones sobre su cabeza dicen qué tan fácil te diría que sí.',
  },
  {
    el: '[data-tour="acciones"]',
    titulo: 'Qué puedes hacer',
    texto: 'Platica, coquetea o invítalo a ir contigo. Si te sigue, llévalo a un lugar con 🔒 donde él no esté.',
  },
  {
    el: '[data-tour="reloj"]',
    titulo: 'El reloj',
    texto: 'Cada segundo es un minuto del juego. Él sigue su rutina: a ciertas horas está en casa, en el trabajo o en el gym.',
  },
  {
    el: '[data-tour="menu"]',
    titulo: 'Menú',
    texto: 'Aquí ves dónde está él, el mapa, cómo guardar tu partida y esta guía otra vez.',
  },
];

type Acc = 'conversar' | 'indirecta' | 'mostrarte';

interface Accion {
  id: string;
  ico: string;
  texto: string;
  hacer: () => void;
  rosa?: boolean;
  sola?: boolean;
  off?: boolean;
  tour?: string;
}

/** El momento que está pasando: con quién y lo que se decidió al cerrar la puerta. */
interface EnCurso {
  con: Persona;
  plan: Plan;
  etapa: number;
  sospecha: number;
}

const gesto = (id: string): Gesto => gestoPorId(id) ?? (gestoPorId('neutra') as Gesto);

/** Lo que cabe en un globo: frases completas hasta unas 96 letras. */
function paraGlobo(t: string, max = 96): string {
  const limpio = t.trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const fin = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('? '), corte.lastIndexOf('! '), corte.lastIndexOf('» '));
  if (fin > 24) return corte.slice(0, fin + 1).trim();
  return `${corte.slice(0, max - 1).trimEnd()}…`;
}

function zonaNombre(z: string, ciclo: number): string {
  if (ZONAS[z]) return ZONAS[z];
  if (z.startsWith('casa-')) {
    const p = personas(ciclo).find((x) => `casa-${x.id}` === z);
    return p ? `Casa de ${p.nombre}` : 'Otra casa';
  }
  return z;
}

export default function Paseo() {
  const [e, setE, listo] = usePersistentState<Estado>(CLAVE, fresco, revivir);
  const eRef = useRef(e);
  eRef.current = e;
  const guardado = useGuardado(e, setE, listo);

  const [entrada, setEntrada] = useState<'izq' | 'der' | 'centro'>('centro');
  const [cerca, setCerca] = useState<string | null>(null);
  const [ropa, setRopa] = useState<'normal' | 'bikini'>('normal');
  const [ropaN, setRopaN] = useState(0);
  const [burbuja, setBurbuja] = useState<Burbuja | null>(null);
  const burbujaN = useRef(0);
  const [desde, setDesde] = useState<number | null>(null);
  const [mapa, setMapa] = useState(false);
  const [menu, setMenu] = useState(false);
  const [pausa, setPausa] = useState(false);
  const [enCurso, setEnCurso] = useState<EnCurso | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [correo, setCorreo] = useState('');
  const [confirmarCiclo, setConfirmarCiclo] = useState(false);

  /** Aplica una jugada sobre el estado más reciente y devuelve cómo quedó. */
  const hacer = (f: (s: Estado) => Estado): Estado => {
    const s = f(eRef.current);
    eRef.current = s;
    setE(s);
    return s;
  };

  // Si quedó a medias una escena de «El mundo», se termina sola para poder seguir aquí.
  useEffect(() => {
    if (!listo || !e.escena) return;
    setE((s) => {
      let x = s;
      for (let i = 0; x.escena && i < 30; i++) x = siguientePaso(x);
      return x;
    });
  }, [listo, e.escena, setE]);

  // El reloj: un segundo real es un minuto del juego. Se detiene en pausa, en el momento y en el resultado.
  const quieto = pausa || !!enCurso || !!resultado;
  useEffect(() => {
    if (!listo || quieto) return;
    setE((s) => ({ ...s, ultimo: Date.now() }));
    const id = window.setInterval(() => {
      if (!document.hidden) setE((s) => tick(s));
    }, 1000);
    const alVolver = () => {
      if (!document.hidden) setE((s) => ({ ...s, ultimo: Date.now() }));
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [listo, quieto, setE]);

  // Los globos se van solos.
  useEffect(() => {
    if (!burbuja) return;
    const id = window.setTimeout(() => setBurbuja(null), 4800);
    return () => window.clearTimeout(id);
  }, [burbuja]);

  const decir = (id: string, texto: string) => {
    burbujaN.current += 1;
    setBurbuja({ id, texto: paraGlobo(texto), n: burbujaN.current });
  };

  /* ---------- lo que hay en pantalla ---------- */

  const et = etapaDe(e);
  const el = tramoEl(e);
  const todos = useMemo(() => lugares(e.ciclo), [e.ciclo]);
  const zonas = useMemo(() => [...new Set(todos.map((l) => l.zona))], [todos]);
  const lugarAct = lugarPorId(e.ciclo, e.lugar);
  const lugarEl = lugarPorId(e.ciclo, el.lugar);
  const ancho = anchoDe(lugarAct.escena);
  const luz = luzDe(e.reloj);
  const puertas = puertasDe(todos, lugarAct);
  const aquiEl = elAqui(e);
  const sigue = seguidor(e);
  const aqui = presentes(e).filter(({ p }) => p.id !== e.pendiente);
  const xs = posiciones(
    aqui.map(({ p }) => p.id),
    ancho,
    aquiEl,
  );
  // Su cara cambia cada 20 minutos del juego. El azar sale del reloj para que el servidor y el
  // teléfono dibujen la misma cara al abrir la página.
  const tramo20 = Math.floor(e.reloj / 20) + e.dia * 72;
  const gestoEl = useMemo(() => gestoDeEl(et, e.sospecha, () => ((tramo20 * 9301 + 49297) % 233280) / 233280), [et, tramo20, Math.round(e.sospecha / 12)]); // eslint-disable-line react-hooks/exhaustive-deps
  const piensa = fmt(T.piensa[et][Math.floor(e.reloj / 45) % T.piensa[et].length], e);
  const puedeCerrarAhora = puedeCerrar(e);
  const personaCerca = cerca && cerca !== 'el' ? (aqui.find(({ p }) => p.id === cerca) ?? null) : null;
  const juntoAEl = cerca === 'el' && aquiEl;
  const bloqueado = mapa || menu || !!e.aviso || !!enCurso || !!resultado;

  const gente: Figura[] = aqui.map(({ p }) => {
    const n = corazones(e, p);
    return { id: p.id, nombre: p.nombre, x: xs[p.id], look: p.look, g: gesto(n >= 4 ? 'embobado' : GESTO_OTRO[p.rasgo]), corazones: n };
  });
  if (aquiEl) gente.unshift({ id: 'el', nombre: e.nombre, x: xs.el, look: LOOK_EL, g: gestoEl, corazones: null, esEl: true });

  const caraElla = juntoAEl
    ? 'dulce'
    : personaCerca
      ? corazones(e, personaCerca.p) >= 3
        ? 'seduccion'
        : 'calculadora'
      : sigue
        ? 'burla'
        : 'neutra';

  /* ---------- guías ---------- */

  useEffect(() => {
    if (!listo || yaVista('paseo-inicio')) return;
    const id = window.setTimeout(() => mostrarGuia(GUIA_INICIO, { id: 'paseo-inicio' }), 700);
    return () => window.clearTimeout(id);
  }, [listo]);

  const sigueId = sigue?.id ?? null;
  useEffect(() => {
    if (!sigueId || puedeCerrarAhora || yaVista('paseo-sigue')) return;
    const nombre = seguidor(eRef.current)?.nombre ?? 'Él';
    const id = window.setTimeout(
      () =>
        mostrarGuia(
          [
            {
              el: '[data-tour="quien"]',
              titulo: 'Te sigue',
              texto: `${nombre} va contigo a donde camines. Llévalo a un lugar con 🔒 donde él no esté y ahí cierras la puerta.`,
            },
          ],
          { id: 'paseo-sigue' },
        ),
      900,
    );
    return () => window.clearTimeout(id);
  }, [sigueId, puedeCerrarAhora]);

  useEffect(() => {
    if (!puedeCerrarAhora || enCurso || yaVista('paseo-cerrar')) return;
    const id = window.setTimeout(
      () =>
        mostrarGuia(
          [
            {
              el: '[data-tour="cerrar"]',
              titulo: 'Cierra la puerta',
              texto: 'Aquí nadie los ve y él no está. Tócalo para quedarte a solas. Si él llega, tú decides qué pasa.',
            },
          ],
          { id: 'paseo-cerrar' },
        ),
      500,
    );
    return () => window.clearTimeout(id);
  }, [puedeCerrarAhora, enCurso]);

  const verGuia = () => {
    setMenu(false);
    window.setTimeout(() => mostrarGuia(GUIA_INICIO), 250);
  };

  /* ---------- jugadas ---------- */

  const hablar = (p: Persona, acc: Acc) => {
    const s = hacer((x) => seducir(x, p, acc));
    decir(p.id, s.ultima);
  };

  const invitarA = (p: Persona) => {
    const x0 = xs[p.id] ?? null;
    const s = hacer((x) => invitar(x, p));
    const si = s.pendiente === p.id;
    if (si) setDesde(x0);
    decir(si ? 'sigue' : p.id, s.ultima);
    guardado.registrar('invitar', { con: p.id, si, lugar: s.lugar });
  };

  const despedir = () => {
    hacer(soltar);
    setDesde(null);
  };

  const serTierna = () => {
    const s = hacer(ternura);
    decir('el', s.ultima.split(' (')[0]);
  };

  const serFria = () => {
    hacer(distante);
    decir('ella', 'Estoy cansada.');
  };

  const limpiarYa = (que: Limpieza) => {
    hacer((s) => limpiar(s, que));
  };

  const cambiarRopa = () => {
    setRopa((r) => (r === 'bikini' ? 'normal' : 'bikini'));
    setRopaN((n) => n + 1);
  };

  /** Ella llegó a una orilla: pasa al cuarto de al lado o sale a la calle (el mapa). */
  const alPuerta = (lado: 'izq' | 'der') => {
    const s = eRef.current;
    const pu = puertasDe(lugares(s.ciclo), lugarPorId(s.ciclo, s.lugar));
    const d = lado === 'izq' ? pu.izq : pu.der;
    setBurbuja(null);
    if (d.tipo === 'salida') {
      setMapa(true);
      return;
    }
    setEntrada(lado === 'izq' ? 'der' : 'izq');
    setDesde(null);
    hacer((x) => ir(x, d.id));
  };

  /** Ir a un lugar desde el mapa. */
  const irA = (id: string) => {
    const s = eRef.current;
    const pu = puertasDe(lugares(s.ciclo), lugarPorId(s.ciclo, id));
    setEntrada(pu.izq.tipo === 'salida' ? 'izq' : 'centro');
    if (zonaDe(s, id) !== zonaDe(s, s.lugar)) setRopa('normal');
    setDesde(null);
    setBurbuja(null);
    setMapa(false);
    hacer((x) => ir(x, id));
  };

  const cerrarPuerta = () => {
    const s = eRef.current;
    const p = seguidor(s);
    if (!p || !puedeCerrar(s)) return;
    const plan = planear(s);
    setBurbuja(null);
    setEnCurso({ con: p, plan, etapa: etapaDe(s), sospecha: s.sospecha });
    guardado.registrar('cerrar', { con: p.id, lugar: s.lugar, entra: plan.entra, cerca: plan.cerca });
  };

  const alTerminar = (final: Final, alcanzado: number) => {
    const m = enCurso;
    if (!m) return;
    const r = terminarMomento(eRef.current, m.con, m.plan, final, alcanzado);
    const s: Estado = { ...r.estado, ultimo: Date.now() };
    eRef.current = s;
    setE(s);
    setEnCurso(null);
    setResultado(r);
    setRopa('normal');
    setDesde(null);
    guardado.registrar('momento', { con: m.con.id, final, alcanzado: Math.round(alcanzado), ganado: r.ganado, lugar: s.lugar });
    guardado.guardarYa(s);
  };

  const contestar = (id: string) => {
    const tipo = eRef.current.aviso?.tipo;
    hacer((s) => responder(s, id));
    if (tipo) guardado.registrar('aviso', { tipo, opcion: id });
  };

  const cicloNuevo = () => {
    if (!confirmarCiclo) {
      setConfirmarCiclo(true);
      return;
    }
    setConfirmarCiclo(false);
    setMenu(false);
    setEntrada('centro');
    setDesde(null);
    hacer(nuevoCiclo);
  };

  const empezarDeCero = () => {
    if (!window.confirm('¿Borrar la partida y empezar de cero?')) return;
    setMenu(false);
    setEntrada('centro');
    setDesde(null);
    setResultado(null);
    hacer(() => fresco());
  };

  /* ---------- botones de abajo ---------- */

  const acciones: Accion[] = [];
  if (puedeCerrarAhora && sigue) {
    acciones.push({ id: 'cerrar', ico: '🔒', texto: `Cerrar la puerta con ${sigue.nombre}`, hacer: cerrarPuerta, rosa: true, sola: true, tour: 'cerrar' });
  }
  if (personaCerca) {
    const p = personaCerca.p;
    acciones.push({ id: 'platicar', ico: '💬', texto: 'Platicar', hacer: () => hablar(p, 'conversar') });
    acciones.push({ id: 'indirecta', ico: '😏', texto: 'Lanzar una indirecta', hacer: () => hablar(p, 'indirecta') });
    acciones.push({ id: 'lucirte', ico: '💃', texto: 'Lucirte', hacer: () => hablar(p, 'mostrarte') });
    if (sigue) acciones.push({ id: 'ocupada', ico: '💗', texto: `Ya te sigue ${sigue.nombre}`, hacer: () => undefined, off: true });
    else acciones.push({ id: 'invitar', ico: '💗', texto: `Invitar a ${p.nombre}`, hacer: () => invitarA(p), rosa: true });
  } else if (juntoAEl) {
    acciones.push({ id: 'tierna', ico: '🤍', texto: 'Ser tierna con él', hacer: serTierna });
    acciones.push({ id: 'fria', ico: '🧊', texto: 'Ser fría con él', hacer: serFria });
  } else {
    const r = e.rastros;
    if (lugarAct.id === 'casa-habitacion' && r.sabanas) acciones.push({ id: 'sabanas', ico: '🧺', texto: 'Cambiar las sábanas', hacer: () => limpiarYa('sabanas') });
    if ((lugarAct.escena === 'bano' || lugarAct.escena === 'vestidor') && r.olor > 5) acciones.push({ id: 'banar', ico: '🚿', texto: 'Bañarte', hacer: () => limpiarYa('banar') });
    if (lugarAct.zona === 'casa' && r.ropa) acciones.push({ id: 'ropa-tirada', ico: '👕', texto: 'Esconder su ropa', hacer: () => limpiarYa('ropa') });
    if (lugarAct.escena === 'sotano' && (r.sabanas || r.ropa)) acciones.push({ id: 'caja', ico: '📦', texto: 'Guardar todo en una caja', hacer: () => limpiarYa('esconder') });
    if (ESCENAS_ROPA.has(lugarAct.escena) && lugarAct.privado && !sigue) {
      acciones.push({ id: 'ropa', ico: ropa === 'bikini' ? '👗' : '👙', texto: ropa === 'bikini' ? 'Vestirte' : 'Ponerte el bikini', hacer: cambiarRopa });
    }
  }
  if (sigue && !personaCerca) acciones.push({ id: 'soltar', ico: '👋', texto: `Que ${sigue.nombre} se vaya`, hacer: despedir });
  if (!personaCerca && !juntoAEl) {
    acciones.push({ id: 'mapa', ico: '🗺', texto: 'Ir a otro lugar', hacer: () => setMapa(true) });
    acciones.push({ id: 'esperar', ico: '⏳', texto: 'Esperar 15 min', hacer: () => hacer((s) => avanzar(s, 15)) });
  }

  /* ---------- quién está cerca ---------- */

  let quien: ReactNode;
  if (personaCerca) {
    quien = (
      <>
        <b>{personaCerca.p.nombre}</b>
        <span>
          {personaCerca.p.pista} · {personaCerca.hace}
        </span>
      </>
    );
  } else if (juntoAEl) {
    quien = (
      <>
        <b>♥ {e.nombre}</b>
        <span>«{piensa}»</span>
      </>
    );
  } else if (sigue) {
    const pista = puedeCerrarAhora ? 'aquí pueden quedarse a solas' : aquiEl ? `${e.nombre} está aquí` : !lugarAct.privado ? 'busca un lugar con 🔒' : 'aquí él podría verlos';
    quien = (
      <>
        <b>♥ {sigue.nombre} te sigue</b>
        <span>{pista}</span>
      </>
    );
  } else if (aquiEl) {
    quien = (
      <span>
        {e.nombre} está aquí: {el.hace}.
      </span>
    );
  } else {
    quien = (
      <span>
        Él está en {lugarEl.nombre.toLowerCase()}: {el.hace}.{elCerca(e) ? ' Muy cerca de ti.' : ''}
      </span>
    );
  }

  const rastros: string[] = [];
  if (e.rastros.sabanas) rastros.push('Las sábanas huelen a otro: cámbialas en tu habitación.');
  if (e.rastros.ropa) rastros.push('Quedó ropa tirada: escóndela en tu casa.');
  if (e.rastros.olor > 5) rastros.push(`Hueles a otro perfume (${Math.round(e.rastros.olor)}%): báñate.`);
  if (e.rastros.escondido) rastros.push('Hay una caja escondida en el sótano. Si él baja, puede encontrarla.');

  return (
    <div className={styles.root}>
      <header className={styles.top}>
        <span className={styles.topLugar}>
          {lugarAct.nombre}
          {lugarAct.privado ? ' 🔒' : ''}
        </span>
        <span className={styles.topChip} data-tour="reloj">
          {pausa ? '❚❚ ' : '🕐 '}
          <b>{hora(e.reloj)}</b>
        </span>
        <span className={styles.topChip} aria-label="Tu satisfacción">
          💗 <b>{Math.round(e.sat)}</b>
        </span>
        <button type="button" className={styles.menuBtn} onClick={() => setMenu(true)} aria-label="Menú" data-tour="menu">
          ☰
        </button>
      </header>

      <Escenario
        clave={e.lugar}
        escena={lugarAct.escena}
        ancho={ancho}
        luz={luz}
        puertas={puertas}
        gente={gente}
        ropa={ropa}
        ropaN={ropaN}
        gestoElla={gesto(caraElla)}
        seguidor={sigue ? { look: sigue.look, g: gesto('embobado'), nombre: sigue.nombre } : null}
        seguidorDesde={desde}
        entrada={entrada}
        bloqueado={bloqueado}
        burbuja={burbuja}
        onCerca={setCerca}
        onPuerta={alPuerta}
      />

      <div className={styles.barra}>
        <p key={e.ultima} className={styles.nota}>
          {e.ultima}
        </p>
        <div className={styles.quien} data-tour="quien">
          {quien}
          <button type="button" className={styles.ayuda} onClick={verGuia} aria-label="Cómo se juega">
            ?
          </button>
        </div>
        <div className={styles.acciones} data-tour="acciones">
          {acciones.map((a) => (
            <button
              key={a.id}
              type="button"
              className={cn(styles.accion, a.rosa && styles.accionRosa, a.sola && styles.accionSola)}
              onClick={a.hacer}
              disabled={a.off || bloqueado}
              data-tour={a.tour}
            >
              <span className={styles.accionIco} aria-hidden>
                {a.ico}
              </span>
              {a.texto}
            </button>
          ))}
        </div>
      </div>

      {/* Mapa: a dónde vas al salir a la calle */}
      {mapa && (
        <div className={styles.veloAbajo} onClick={() => setMapa(false)}>
          <div className={styles.hoja} role="dialog" aria-label="A dónde vas" onClick={(ev) => ev.stopPropagation()}>
            <h2 className={styles.hojaH}>¿A dónde vas?</h2>
            <p className={styles.menuSub}>Ir a otro lugar toma unos 20 minutos; a un cuarto del mismo lugar, 4.</p>
            {zonas.map((z) => (
              <section key={z} className={styles.zona}>
                <h3 className={styles.zonaH}>{zonaNombre(z, e.ciclo)}</h3>
                {todos
                  .filter((l) => l.zona === z)
                  .map((l) => {
                    const hay = presentes(e, l.id).map(({ p }) => p.nombre);
                    const estaEl = el.lugar === l.id;
                    return (
                      <button key={l.id} type="button" className={styles.lugarBtn} disabled={l.id === e.lugar} onClick={() => irA(l.id)}>
                        <span>
                          {l.nombre}
                          {l.privado ? ' 🔒' : ''}
                          {l.id === e.lugar ? ' · estás aquí' : ''}
                        </span>
                        {(estaEl || hay.length > 0) && (
                          <span className={styles.lugarGente}>
                            {estaEl && <span className={styles.lugarEl}>♥ {e.nombre}</span>}
                            {estaEl && hay.length > 0 ? ' · ' : ''}
                            {hay.join(', ')}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </section>
            ))}
            <button type="button" className={styles.cerrarHoja} onClick={() => setMapa(false)}>
              Quedarme aquí
            </button>
          </div>
        </div>
      )}

      {/* Avisos de él: mensajes, sorpresas, que te busca */}
      {e.aviso && !enCurso && !resultado && (
        <div className={styles.veloAbajo}>
          <div className={styles.hoja} role="dialog" aria-label="Aviso">
            <p className={styles.zonaH}>{TITULO_AVISO[e.aviso.tipo]}</p>
            <p className={styles.avisoTexto}>{e.aviso.texto}</p>
            <div className={styles.avisoOpciones}>
              {e.aviso.opciones.map((o) => (
                <button key={o.id} type="button" className={styles.accion} onClick={() => contestar(o.id)}>
                  {o.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menú */}
      {menu && (
        <div className={styles.velo} onClick={() => setMenu(false)}>
          <nav className={styles.menu} aria-label="Menú" onClick={(ev) => ev.stopPropagation()}>
            <h2 className={styles.menuH}>El paseo</h2>
            <p className={styles.menuSub}>
              Ciclo {e.ciclo + 1} · Día {e.dia} · {hora(e.reloj)}
            </p>
            <div className={styles.menuEl}>
              <p>
                <b>♥ {e.nombre}</b> · {ETAPAS[et]}
              </p>
              <p>
                Está en {lugarEl.nombre.toLowerCase()}: {el.hace}.
              </p>
              <p>
                Sospecha {Math.round(e.sospecha)}% · Quiebre {Math.round(e.quiebre)}%
              </p>
            </div>
            {rastros.length > 0 && (
              <div className={styles.menuEl}>
                <p>
                  <b>Rastros</b>
                </p>
                {rastros.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles.menuBtn2}
              onClick={() => {
                setMenu(false);
                setMapa(true);
              }}
            >
              🗺 Ir a otro lugar
            </button>
            <button type="button" className={styles.menuBtn2} onClick={verGuia}>
              ❓ Cómo se juega
            </button>
            <button type="button" className={styles.menuBtn2} onClick={() => setPausa((x) => !x)}>
              {pausa ? '▶ Seguir el tiempo' : '❚❚ Pausar el tiempo'}
            </button>
            <button
              type="button"
              className={styles.menuBtn2}
              onClick={() => {
                hacer(dejarPista);
                setMenu(false);
              }}
            >
              🔎 Dejar una pista a la vista
            </button>
            {puedeCambiar(e) && (
              <button type="button" className={styles.menuBtn2} onClick={cicloNuevo}>
                {confirmarCiclo ? 'Toca otra vez para confirmar' : '💔 Ciclo nuevo: enamorar a otro'}
              </button>
            )}

            {guardado.estado !== 'apagada' && (
              <div className={styles.nubeEstado}>
                {guardado.estado === 'lista' ? (
                  <p>
                    ☁️ Tu partida se guarda sola{guardado.email ? ` (${guardado.email})` : ''}.{' '}
                    <button type="button" className={styles.linkBtn} onClick={guardado.salir}>
                      Salir
                    </button>
                  </p>
                ) : guardado.estado === 'enviado' ? (
                  <p>Te llegó un enlace a {guardado.email}. Ábrelo en este mismo teléfono.</p>
                ) : guardado.estado === 'enviando' || guardado.estado === 'cargando' ? (
                  <p>{guardado.estado === 'enviando' ? 'Enviando…' : 'Buscando tu partida…'}</p>
                ) : (
                  <form
                    className={styles.nubeForm}
                    onSubmit={(ev) => {
                      ev.preventDefault();
                      guardado.enviar(correo);
                    }}
                  >
                    <p>Para no perder tu partida, escribe tu correo y te llega un enlace para entrar.</p>
                    <input
                      className={styles.nubeIn}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={correo}
                      onChange={(ev) => setCorreo(ev.target.value)}
                    />
                    <button type="submit" className={styles.menuBtn2}>
                      Mandar enlace
                    </button>
                  </form>
                )}
                {guardado.mensaje && <p>{guardado.mensaje}</p>}
              </div>
            )}

            <Link href="/a-sus-espaldas/mundo" className={styles.menuBtn2}>
              El mundo (vista 3D)
            </Link>
            <Link href="/a-sus-espaldas" className={styles.menuBtn2}>
              La llamada (por turnos)
            </Link>
            <Link href="/a-sus-espaldas/palabras" className={styles.menuBtn2}>
              Tus palabras
            </Link>
            <button type="button" className={styles.menuBtn2} onClick={empezarDeCero}>
              Empezar de cero
            </button>
            <p className={styles.menuSub}>Juego de ficción. Todos los personajes son adultos e inventados.</p>
          </nav>
        </div>
      )}

      {/* El momento a solas */}
      {enCurso && (
        <Momento
          escena={lugarAct.escena}
          ancho={ancho}
          luz={luz}
          lugar={lugarAct.nombre}
          otro={{ nombre: enCurso.con.nombre, look: enCurso.con.look }}
          nombreEl={e.nombre}
          etapa={enCurso.etapa}
          sospecha={enCurso.sospecha}
          plan={enCurso.plan}
          onFin={alTerminar}
        />
      )}

      {/* Cómo terminó */}
      {resultado && (
        <div className={styles.final} role="dialog" aria-label="Cómo terminó">
          <h2 className={styles.finalTit}>{TITULO_FINAL[resultado.final]}</h2>
          <p className={styles.finalGanado}>
            +{resultado.ganado} <b>de satisfacción</b>
          </p>
          {resultado.motivos.length > 0 && (
            <ul className={styles.finalMotivos}>
              {resultado.motivos.map((m) => (
                <li key={m.texto}>
                  <span aria-hidden>{m.icono}</span>
                  {m.texto}
                </li>
              ))}
            </ul>
          )}
          <p className={styles.finalFrase}>{resultado.frase}</p>
          <button type="button" className={styles.finalOk} onClick={() => setResultado(null)}>
            Seguir jugando
          </button>
        </div>
      )}
    </div>
  );
}
