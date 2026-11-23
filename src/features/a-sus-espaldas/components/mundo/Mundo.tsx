'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Chica, POSES, ROPA_BIKINI } from './Chica';
import { Vista3D } from './Vista3D';
import { Icono } from './Iconos';
import type { NombreIcono } from './Iconos';
import type { Habitante } from './Vista3D';
import { ETAPAS, T, ZONAS } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Escena, Persona } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { gestoDeEl, gestoPorId } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import { GESTOS_CERCANIA, MENUS, RESPALDO, RESPUESTA_RASGO, cargarOpciones } from '@/features/a-sus-espaldas/lib/mundo/opciones';
import type { OpcionAccion } from '@/features/a-sus-espaldas/lib/mundo/opciones';
import {
  apuro,
  avanzar,
  barrasDeEtapa,
  cercaniaVista,
  correrChismes,
  notaDeEl,
  chanceDeSi,
  distante,
  dejarPista,
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
  proponer,
  puedeCambiar,
  responder,
  revivir,
  seducir,
  siguientePaso,
  ternura,
  tick,
  tramoEl,
  vidaDeEl,
  zonaDe,
} from '@/features/a-sus-espaldas/lib/mundo/motor';
import type { Estado, Limpieza } from '@/features/a-sus-espaldas/lib/mundo/motor';
import { usePersistentState } from '@/lib/use-persistent-state';
import { cn } from '@/lib/cn';
import styles from './mundo.module.css';
import hud from './hud.module.css';

const FONDO: Record<Escena, string> = {
  cama: 'linear-gradient(#3b2a45 0 62%, #2a1d33 62%)',
  bano: 'linear-gradient(#2a4350 0 62%, #1d303a 62%)',
  sotano: 'linear-gradient(#2e2e2e 0 62%, #1c1c1c 62%)',
  oficina: 'linear-gradient(#34415a 0 62%, #232c3f 62%)',
  archivo: 'linear-gradient(#3b3b3b 0 62%, #262626 62%)',
  gym: 'linear-gradient(#2c4a44 0 62%, #1d332f 62%)',
  vestidor: 'linear-gradient(#3d4a52 0 62%, #29333a 62%)',
  hotel: 'linear-gradient(#4a3040 0 62%, #33202c 62%)',
  bar: 'linear-gradient(#3a2a1f 0 62%, #261a12 62%)',
  coche: 'linear-gradient(#1f2a3a 0 62%, #131b27 62%)',
};

const GESTO_OTRO: Record<Persona['rasgo'], string> = { timido: 'timido', ingenuo: 'embobado', culpa: 'dudoso', miedo: 'ansiosootro' };


function Monito({ color, ropa = '#888', grande = false }: { color: string; ropa?: string; grande?: boolean }) {
  const s = grande ? 18 : 13;
  return (
    <svg width={s} height={s * 1.5} viewBox="0 0 12 18" aria-hidden>
      <circle cx="6" cy="4" r="3.4" fill={color} />
      <rect x="2" y="8" width="8" height="8" rx="3" fill={ropa} />
    </svg>
  );
}

export default function Mundo() {
  const [e, setE, ready] = usePersistentState<Estado>('a-sus-espaldas-mundo-v1', fresco, revivir);
  const [pausa, setPausa] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);
  const [zonaAbierta, setZonaAbierta] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [panel, setPanel] = useState<'acciones' | 'mapa' | 'memoria' | 'mas' | null>(null);
  const [cerca, setCerca] = useState<string | null>(null);
  const [verEl, setVerEl] = useState(false);
  const [vistaAcc, setVistaAcc] = useState<'raiz' | 'hablar' | 'menu' | 'gestos'>('raiz');
  const [menuSel, setMenuSel] = useState<string | null>(null);
  const [herr, setHerr] = useState<'cerca' | 'telefono'>('cerca');
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [opciones, setOpciones] = useState<OpcionAccion[]>(RESPALDO);
  const [burbujas, setBurbujas] = useState<Record<string, string>>({});
  const [contacto, setContacto] = useState<{ id: string; gesto: string; nivel: 1 | 2 } | null>(null);
  const [rescate, setRescate] = useState(false);
  const ultimoGesto = useRef(0);
  const temporizadores = useRef<number[]>([]);

  useEffect(() => {
    let vivo = true;
    cargarOpciones().then((o) => vivo && setOpciones(o));
    return () => {
      vivo = false;
      temporizadores.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (!ready || pausa) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setE((s) => correrChismes(tick(s)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [ready, pausa, setE]);

  const et = etapaDe(e);
  const el = tramoEl(e);
  const aqui = useMemo(() => presentes(e), [e.reloj, e.lugar, e.ciclo, e.quiebre]); // eslint-disable-line react-hooks/exhaustive-deps
  const lugarAct = lugarPorId(e.ciclo, e.lugar);
  const todos = lugares(e.ciclo);
  const zonas = useMemo(() => [...new Set(todos.map((l) => l.zona))], [e.ciclo]); // eslint-disable-line react-hooks/exhaustive-deps
  const elAquiAhora = elAqui(e);
  const enfocado = aqui.find((x) => x.p.id === (foco ?? cerca))?.p ?? null;
  const gestoEl = useMemo(() => gestoDeEl(et, e.sospecha), [et, Math.floor(e.reloj / 20), Math.round(e.sospecha / 12)]); // eslint-disable-line react-hooks/exhaustive-deps
  const piensa = useMemo(() => fmt(T.piensa[et][Math.floor(e.reloj / 45) % T.piensa[et].length], e), [et, e.reloj, e.nombre]); // eslint-disable-line react-hooks/exhaustive-deps
  const barras = barrasDeEtapa(e);
  const vida = vidaDeEl(e);
  const lugarEl = lugarPorId(e.ciclo, el.lugar);
  const PIEL_EL = { piel: '#e9bf9b', pelo: '#2b1d14', ropa: '#5a7da8', pantalon: '#2f3445' };
  const gestoOtro = (p: Persona) => gestoPorId(GESTO_OTRO[p.rasgo]) ?? gestoDeEl(0, 0);
  const habEl = (nota?: string): Habitante => ({ id: 'el', nombre: e.nombre, ...PIEL_EL, gesto: gestoEl, abatido: et >= 4, nota });
  const gentePov: Habitante[] = [
    ...(elAquiAhora ? [habEl(el.hace)] : []),
    ...aqui.map(({ p, hace }) => ({ id: p.id, nombre: p.nombre, piel: p.look.piel, pelo: p.look.pelo, ropa: p.look.ropa, pantalon: p.look.pantalon, gesto: gestoOtro(p), nota: hace, tocable: true })),
  ];
  const genteEl: Habitante[] = [
    habEl(el.hace),
    ...presentes(e, el.lugar).map(({ p, hace }) => ({ id: p.id, nombre: p.nombre, piel: p.look.piel, pelo: p.look.pelo, ropa: p.look.ropa, pantalon: p.look.pantalon, gesto: gestoOtro(p), nota: hace })),
  ];
  const hotspots: ('sabanas' | 'banar' | 'esconder')[] = lugarAct.escena === 'cama' ? ['sabanas'] : lugarAct.escena === 'bano' ? ['banar'] : lugarAct.escena === 'sotano' ? ['esconder'] : [];
  const sc = e.escena;
  const otrosAqui = aqui.length;
  const contexto: 'solas' | 'gente' | 'el' = elAquiAhora ? 'el' : otrosAqui > 1 ? 'gente' : 'solas';
  const seAcerca = !elAquiAhora && tramoEl({ ...e, reloj: e.reloj + 12 }).lugar === e.lugar;

  // Sacarla de apuros: él llega justo después de un gesto
  const antes = useRef(false);
  useEffect(() => {
    if (elAquiAhora && !antes.current && Date.now() - ultimoGesto.current < 30000 && !sc) {
      setRescate(true);
      setContacto(null);
    }
    antes.current = elAquiAhora;
  }, [elAquiAhora]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!rescate) return;
    const t = window.setTimeout(() => {
      setRescate(false);
      setE((s) => apuro(s, 'nada'));
    }, 7000);
    return () => window.clearTimeout(t);
  }, [rescate, setE]);
  const paso = sc ? sc.pasos[sc.paso] : null;
  const personaEscena = sc ? personas(e.ciclo).find((p) => p.id === sc.con) : null;

  const quien = (z: string): { el: boolean; otros: Persona[] } => {
    const lugs = todos.filter((l) => l.zona === z).map((l) => l.id);
    const otros = personas(e.ciclo).filter((p) => {
      const d = p.rutina.find((t) => e.reloj >= t.de && e.reloj < t.a);
      return d && lugs.includes(d.lugar);
    });
    return { el: lugs.includes(el.lugar), otros };
  };
  const zonaNombre = (z: string): string => ZONAS[z] ?? (z.startsWith('casa-') ? `Casa de ${personas(e.ciclo).find((p) => `casa-${p.id}` === z)?.nombre ?? '?'}` : z);

  const hacer = (f: (s: Estado) => Estado) => setE((s) => f(s));

  const abrir = (q: typeof panel) => setPanel(panel === q ? null : q);


  const POS = (i: number): [number, number] => [52 + (i % 3) * 98, 46 + Math.floor(i / 3) * 78];
  const idxZona = (z: string) => Math.max(0, zonas.indexOf(z));
  const yoP = POS(idxZona(lugarAct.zona));
  const elP = POS(idxZona(lugarEl.zona));
  const filas = Math.ceil(zonas.length / 3);
  const altoMapa = filas * 78 + 40;
  const ruta = (z: string) => zonaNombre(z);
  const calle = (a: [number, number], b: [number, number]) => `M${a[0]} ${a[1]} L${b[0]} ${a[1]} L${b[0]} ${b[1]}`;

  const decir = (id: string, txt: string, resp?: string) => {
    temporizadores.current.forEach((t) => window.clearTimeout(t));
    temporizadores.current = [];
    setBurbujas({ ella: txt });
    if (resp) temporizadores.current.push(window.setTimeout(() => setBurbujas({ [id]: resp }), 1700));
    temporizadores.current.push(window.setTimeout(() => setBurbujas({}), resp ? 4200 : 2800));
  };
  const objetivoP: Persona | null = herr === 'telefono' ? (personas(e.ciclo).find((p) => p.id === objetivo) ?? enfocado ?? personas(e.ciclo)[0] ?? null) : enfocado;
  const usarOpcion = (o: OpcionAccion, riesgo: 'libre' | 'riesgo' | 'bloqueado') => {
    const p = objetivoP;
    if (!p) return;
    const r = RESPUESTA_RASGO[p.rasgo] ?? RESPUESTA_RASGO.timido;
    decir(p.id, o.frase, r[Math.floor(Math.random() * r.length)]);
    const visible = herr === 'cerca' && contexto !== 'solas' && riesgo !== 'libre';
    if (visible) ultimoGesto.current = Date.now();
    hacer((s) => {
      let n = seducir(s, p, o.tipo === 'insinuar' ? 'indirecta' : 'conversar');
      if (visible) n = cercaniaVista(n, 1, Math.max(0, otrosAqui - 1), elAquiAhora);
      return n;
    });
    setPanel(null);
    setVistaAcc('raiz');
  };
  const usarGesto = (g: (typeof GESTOS_CERCANIA)[number]) => {
    if (!enfocado) return;
    setContacto({ id: enfocado.id, gesto: g.pos, nivel: g.nivel });
    temporizadores.current.push(window.setTimeout(() => setContacto(null), 6000));
    ultimoGesto.current = Date.now();
    hacer((s) => cercaniaVista(seducir(s, enfocado, g.nivel === 2 ? 'mostrarte' : 'indirecta'), g.nivel, Math.max(0, otrosAqui - 1), elAquiAhora));
    setBurbujas({});
    setPanel(null);
    setVistaAcc('raiz');
  };
  const cuadro = (ic: NombreIcono, etiqueta: string, on: () => void, extra?: ReactNode, off = false) => (
    <button type="button" className={cn(hud.cuadro, off && hud.cuadroOff)} onClick={on} disabled={off} aria-label={etiqueta}>
      {extra ?? <Icono n={ic} size={38} />}
    </button>
  );
  const volver = (a: typeof vistaAcc) => (
    <button type="button" className={hud.atras} onClick={() => setVistaAcc(a)} aria-label="Volver">
      <Icono n="atras" size={22} />
    </button>
  );

  const accionesJSX = (
    <>
      <div className={hud.contexto}>
        <span className={cn(hud.sensor, contexto === 'solas' && hud.sensorOk, contexto === 'gente' && hud.sensorAviso, contexto === 'el' && hud.sensorPeligro)}>
          <Icono n={contexto === 'solas' ? 'candado' : 'ojo'} size={16} /> {contexto === 'solas' ? 'A solas' : contexto === 'gente' ? 'Con gente cerca' : 'Él está aquí'}
        </span>
        {enfocado && <span className={hud.con}>{enfocado.nombre}</span>}
      </div>

      {vistaAcc === 'raiz' && (
        <>
          <div className={hud.cuatro}>
            {cuadro('chat', 'Hablar', () => setVistaAcc('hablar'), undefined, !enfocado && herr === 'cerca' && personas(e.ciclo).length === 0)}
            {cuadro('cara', 'Gestos', () => setVistaAcc('gestos'), undefined, !enfocado)}
            {cuadro(
              'cara',
              'Mostrar',
              () => enfocado && hacer((s) => seducir(s, enfocado, 'mostrarte')),
              <span className={hud.mostrar}>
                <Chica g={gestoPorId('dulce') ?? gestoDeEl(0, 0)} pose={POSES[1] ?? POSES[0]} ropa={ROPA_BIKINI} size={64} />
              </span>,
              !enfocado,
            )}
            {cuadro('corazon', 'Proponer', () => enfocado && hacer((s) => proponer(s, enfocado)), undefined, !enfocado)}
          </div>
          {enfocado && (
            <p className={hud.chance}>
              <Icono n="corazon" size={14} /> {Math.round(chanceDeSi(e, enfocado))}%
            </p>
          )}
          <div className={hud.fila4}>
            <button type="button" className={hud.chico} onClick={() => hacer(ternura)} disabled={!elAquiAhora} aria-label="Ser tierna">
              <Icono n="tierna" size={22} />
            </button>
            <button type="button" className={hud.chico} onClick={() => hacer(distante)} disabled={!elAquiAhora} aria-label="Ser fría">
              <Icono n="fria" size={22} />
            </button>
            <button type="button" className={hud.chico} onClick={() => hacer(dejarPista)} aria-label="Dejar una pista">
              <Icono n="pista" size={22} />
            </button>
            <button type="button" className={hud.chico} onClick={() => hacer((s) => avanzar(s, 15))} aria-label="Esperar">
              <Icono n="espera" size={22} />
            </button>
          </div>
          {(e.rastros.sabanas || e.rastros.ropa || e.rastros.olor > 5 || e.rastros.escondido) && (
            <div className={styles.acciones} style={{ marginTop: '0.6rem' }}>
              {e.rastros.sabanas && (
                <button type="button" className={styles.btn} onClick={() => hacer((s) => limpiar(s, 'sabanas' as Limpieza))}>
                  Cambiar sábanas
                </button>
              )}
              {e.rastros.ropa && (
                <button type="button" className={styles.btn} onClick={() => hacer((s) => limpiar(s, 'ropa' as Limpieza))}>
                  Esconder su ropa
                </button>
              )}
              {e.rastros.olor > 5 && (
                <button type="button" className={styles.btn} onClick={() => hacer((s) => limpiar(s, 'banar' as Limpieza))}>
                  Bañarte
                </button>
              )}
            </div>
          )}
        </>
      )}

      {vistaAcc === 'hablar' && (
        <>
          <div className={hud.barra}>
            {volver('raiz')}
            <button type="button" className={cn(hud.herr, herr === 'cerca' && hud.herrOn)} onClick={() => setHerr('cerca')} aria-label="Cerca de él">
              <Icono n="cerca" size={22} />
            </button>
            <button type="button" className={cn(hud.herr, herr === 'telefono' && hud.herrOn)} onClick={() => setHerr('telefono')} aria-label="Por teléfono">
              <Icono n="telefono" size={22} />
            </button>
          </div>
          {herr === 'telefono' && (
            <div className={hud.gente}>
              {personas(e.ciclo).map((p) => (
                <button key={p.id} type="button" className={cn(hud.persona, objetivoP?.id === p.id && hud.personaOn)} onClick={() => setObjetivo(p.id)}>
                  {p.nombre}
                </button>
              ))}
            </div>
          )}
          {!objetivoP ? (
            <p className={styles.dim}>Camina hasta alguien.</p>
          ) : (
            <div className={hud.menus}>
              {MENUS.map((m) => {
                const bloq = herr === 'cerca' && m.riesgo === 'bloqueado' && contexto !== 'solas';
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={bloq}
                    className={cn(hud.menuBtn, bloq && hud.cuadroOff)}
                    onClick={() => {
                      setMenuSel(m.id);
                      setVistaAcc('menu');
                    }}
                    aria-label={m.id}
                  >
                    <Icono n={m.icono} size={30} />
                    {m.riesgo === 'riesgo' && herr === 'cerca' && contexto !== 'solas' && <i className={hud.punto} />}
                    {bloq && (
                      <i className={hud.candado}>
                        <Icono n="candado" size={13} />
                      </i>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {vistaAcc === 'menu' && menuSel && (
        <>
          <div className={hud.barra}>
            {volver('hablar')}
            <Icono n={MENUS.find((m) => m.id === menuSel)?.icono ?? 'chat'} size={26} />
          </div>
          <div className={hud.lista}>
            {opciones
              .filter((o) => o.menu === menuSel && o.herramienta.includes(herr))
              .map((o) => (
                <button key={o.id} type="button" className={hud.opcion} onClick={() => usarOpcion(o, MENUS.find((m) => m.id === menuSel)?.riesgo ?? 'libre')}>
                  {o.opcion}
                </button>
              ))}
          </div>
        </>
      )}

      {vistaAcc === 'gestos' && (
        <>
          <div className={hud.barra}>{volver('raiz')}</div>
          <div className={hud.gestos}>
            {GESTOS_CERCANIA.map((g) => {
              const bloq = g.nivel === 2 && (!enfocado || (e.interes[enfocado.id] ?? 0) < 40);
              return (
                <button key={g.id} type="button" disabled={bloq} className={cn(hud.gesto, bloq && hud.cuadroOff)} onClick={() => usarGesto(g)}>
                  <Icono n={g.nivel === 2 ? 'fuego' : 'tierna'} size={26} />
                  <span>{g.nombre}</span>
                  {bloq && (
                    <i className={hud.candado}>
                      <Icono n="candado" size={13} />
                    </i>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </>
  );

  const mapaJSX = (
    <>
      <svg viewBox={`0 0 320 ${altoMapa}`} className={hud.ciudad} role="img" aria-label="Mapa de la ciudad">
        <rect width="320" height={altoMapa} fill="#1d2a1f" />
        {Array.from({ length: filas + 1 }).map((_, r) => (
          <rect key={`h${r}`} x="0" y={r * 78 + 6} width="320" height="12" fill="#3a3f48" />
        ))}
        {[0, 1, 2, 3].map((c) => (
          <rect key={`v${c}`} x={c * 98 - 6} y="0" width="12" height={altoMapa} fill="#3a3f48" />
        ))}
        {zonas.map((z, i) => {
          const [x, y] = POS(i);
          const { el: hay, otros } = quien(z);
          const sel = zonaAbierta === z;
          return (
            <g key={z} onClick={() => setZonaAbierta(sel ? null : z)} style={{ cursor: 'pointer' }}>
              <rect x={x - 38} y={y - 26} width="76" height="52" rx="6" fill={lugarAct.zona === z ? '#7a3550' : sel ? '#3d5f7a' : '#2f4a35'} stroke={sel ? '#ffd27a' : '#5b7f62'} strokeWidth={sel ? 2.500 : 1} />
              <text x={x} y={y - 8} textAnchor="middle" fontSize="8.500" fill="#fff">
                {ruta(z).slice(0, 14)}
              </text>
              {hay && <circle cx={x - 12} cy={y + 12} r="5" fill="#5b9bff" stroke="#fff" />}
              {otros.slice(0, 3).map((o, k) => (
                <circle key={o.id} cx={x + 2 + k * 11} cy={y + 12} r="4" fill={o.look.ropa} stroke="#fff" strokeWidth=".8" />
              ))}
            </g>
          );
        })}
        {zonaAbierta && zonaAbierta !== lugarAct.zona && <path d={calle(yoP, POS(idxZona(zonaAbierta)))} fill="none" stroke="#ffd27a" strokeWidth="4" strokeDasharray="7 5" strokeLinecap="round" />}
        <circle cx={yoP[0] + 14} cy={yoP[1] + 12} r="6" fill="#ff5c8a" stroke="#fff" strokeWidth="1.500" />
        <circle cx={elP[0] - 14} cy={elP[1] + 12} r="0" />
      </svg>
      {zonaAbierta && (
        <div className={styles.lugares}>
          {todos
            .filter((l) => l.zona === zonaAbierta)
            .map((l) => (
              <button
                key={l.id}
                type="button"
                className={styles.btn}
                disabled={l.id === e.lugar || !!sc}
                onClick={() => {
                  hacer((s) => ir(s, l.id));
                  setZonaAbierta(null);
                  setFoco(null);
                  setPanel(null);
                }}
              >
                {l.id === e.lugar ? '• ' : ''}
                {l.nombre}
                {l.privado ? ' · privado' : ''}
              </button>
            ))}
        </div>
      )}
    </>
  );

  const memoriaJSX = (
    <>
      <h2 className={styles.h3}>Lo que él sospecha</h2>
      <ul className={styles.log}>{e.sabe.length === 0 ? <li>Nada todavía.</li> : e.sabe.slice(-6).map((t, i) => <li key={`${i}-${t}`}>{t}</li>)}</ul>
      <h2 className={styles.h3} style={{ marginTop: '0.6rem' }}>
        Lo que le dijiste
      </h2>
      <ul className={styles.log}>{e.dicho.length === 0 ? <li>Nada todavía.</li> : e.dicho.slice(-6).map((t, i) => <li key={`${i}-${t}`}>{t}</li>)}</ul>
      <h2 className={styles.h3} style={{ marginTop: '0.6rem' }}>
        Historial
      </h2>
      <ol className={styles.log}>{e.log.length === 0 ? <li>Vacío por ahora.</li> : e.log.slice(-12).map((t, i) => <li key={`${i}-${t}`}>{t}</li>)}</ol>
    </>
  );

  const masJSX = (
    <>
      {puedeCambiar(e) && (
        <>
          <h2 className={styles.h3}>{e.quiebre >= 100 ? 'Está roto' : 'Casi roto'}</h2>
          <p className={styles.dim}>Puedes seguir quebrándolo más, o enamorar a otro y empezar un ciclo nuevo (tu satisfacción se queda contigo).</p>
          <button type="button" className={cn(styles.btn, styles.btnRosa)} onClick={() => (confirmar ? (setConfirmar(false), hacer(nuevoCiclo)) : setConfirmar(true))}>
            {confirmar ? 'Toca otra vez para confirmar' : 'Ciclo nuevo: enamorar a otro'}
          </button>
        </>
      )}
      <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.7rem' }}>
        <Link href="/a-sus-espaldas/palabras" className={styles.link}>
          Tus palabras (frases propias que salen en el juego)
        </Link>
        <Link href="/a-sus-espaldas/gestos" className={styles.link}>
          Galería de gestos
        </Link>
        <Link href="/a-sus-espaldas" className={styles.link}>
          ← A Sus Espaldas (la llamada)
        </Link>
        <button type="button" className={styles.link} style={{ background: 'none', border: 0, textAlign: 'left', padding: 0 }} onClick={() => (window.confirm('¿Borrar todo el mundo y empezar de cero?') ? setE(fresco()) : undefined)}>
          Borrar el mundo y empezar de cero
        </button>
      </div>
      <p className={styles.dim}>Juego de ficción. Todos los personajes son adultos e inventados.</p>
    </>
  );

  return (
    <div className={hud.pantalla}>
      {/* El mundo ocupa toda la pantalla */}
      <div className={hud.mundo}>
        <Vista3D
          escena={lugarAct.escena}
          hora={e.reloj}
          gente={gentePov}
          vista="pov"
          foco={enfocado?.id ?? null}
          ella={{ gesto: gestoPorId(sc ? 'neutra' : cerca ? 'dulce' : 'neutra') ?? gestoDeEl(0, 0) }}
          onCerca={setCerca}
          burbujas={burbujas}
          contacto={contacto}
          onTap={(id) => {
            setFoco(id);
            setPanel('acciones');
          }}
          hotspots={hotspots}
          onHotspot={(h) => {
            if (h === 'sabanas') hacer((s) => limpiar(s, 'sabanas'));
            else if (h === 'banar') hacer((s) => limpiar(s, 'banar'));
            else if (h === 'esconder') hacer((s) => limpiar(s, 'esconder'));
          }}
        />
      </div>

      {/* Arriba: hora, lugar, quiebre */}
      <div className={hud.arriba}>
        <div className={hud.fila}>
          <div>
            <div className={hud.reloj}>{hora(e.reloj)}</div>
            <div className={hud.sub}>
              Día {e.dia} · {lugarAct.nombre}
            </div>
          </div>
          <div className={hud.fichas}>
            <span className={hud.ficha}>
              Satisfacción <b>{Math.round(e.sat)}</b>
            </span>
            <span className={hud.ficha}>Sospecha {Math.round(e.sospecha)}%</span>
            <button type="button" className={hud.ficha} onClick={() => setPausa((x) => !x)}>
              {pausa ? '▶' : '❚❚'}
            </button>
          </div>
        </div>
        <div className={hud.quiebre}>
          <div className={hud.qtxt}>
            Su quiebre · {ETAPAS[et]} · {Math.round(e.quiebre)}%
          </div>
          <div className={styles.big}>
            <div className={styles.bigFill} style={{ width: `${e.quiebre}%` }} />
          </div>
          <div className={hud.etapas}>
            {ETAPAS.map((n, i) => (
              <div key={n} className={cn(hud.etapa, i === et && hud.etapaOn)}>
                <div className={hud.mini}>
                  <div className={hud.miniFill} style={{ width: `${barras[i] * 100}%` }} />
                </div>
                {n}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Su cámara a pantalla completa mientras mantengas apretado el cuadrito */}
      {verEl && (
        <div className={hud.verEl}>
          <Vista3D escena={lugarEl.escena} hora={e.reloj} gente={genteEl} vista="tercera" etiqueta={`Cámara de ${e.nombre}`} />
          <p className={hud.soltar}>Suelta para volver</p>
        </div>
      )}
      <div
        className={cn(hud.pip, verEl && hud.pipOn)}
        onPointerDown={(ev) => {
          ev.currentTarget.setPointerCapture(ev.pointerId);
          setVerEl(true);
        }}
        onPointerUp={() => setVerEl(false)}
        onPointerCancel={() => setVerEl(false)}
        onContextMenu={(ev) => ev.preventDefault()}
        role="button"
        aria-label="Mantén apretado para ver su cámara"
      >
        <Vista3D escena={lugarEl.escena} hora={e.reloj} gente={genteEl} vista="tercera" mini etiqueta="Él" />
        <div className={hud.piensa}>
          {lugarEl.nombre} · {el.hace}
          <i>«{piensa}»</i>
        </div>
      </div>

      {/* Radar tipo GTA */}
      <button type="button" className={hud.radar} onClick={() => abrir('mapa')} aria-label="Mapa">
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <defs>
            <clipPath id="rc">
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>
          <g clipPath="url(#rc)">
            <rect width="100" height="100" fill="#1d2a1f" />
            <g transform={`translate(${50 - yoP[0] * 0.5},${50 - yoP[1] * 0.5})`}>
              {Array.from({ length: filas + 1 }).map((_, r) => (
                <rect key={`h${r}`} x="-60" y={r * 39 + 3} width="260" height="6" fill="#4a505c" />
              ))}
              {[0, 1, 2, 3].map((c) => (
                <rect key={`v${c}`} x={c * 49 - 3} y="-60" width="6" height="260" fill="#4a505c" />
              ))}
              {zonas.map((z, i) => {
                const [x, y] = POS(i);
                return <rect key={z} x={x * 0.5 - 15} y={y * 0.5 - 11} width="30" height="22" rx="3" fill={lugarAct.zona === z ? '#7a3550' : '#2f4a35'} />;
              })}
              <circle cx={elP[0] * 0.5} cy={elP[1] * 0.5} r="4" fill="#5b9bff" stroke="#fff" strokeWidth="1" />
            </g>
          </g>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" />
          <path d="M50 40l6 14-6-3-6 3z" fill="#ff5c8a" stroke="#fff" strokeWidth="1.200" />
        </svg>
      </button>

      {/* Avisos del sensor */}
      <div className={hud.avisos}>
        {seAcerca && <span className={cn(hud.aviso, hud.avisoRojo)}>{e.nombre} se acerca</span>}
        {notaDeEl(e) && <span className={hud.aviso}>{e.nombre} te mira distinto</span>}
        {contexto === 'gente' && <span className={hud.aviso}>Hay gente mirando</span>}
      </div>

      {/* Aviso corto de lo último que pasó */}
      <p className={hud.toast} key={e.ultima}>
        {e.ultima}
      </p>
      {enfocado && !panel && (
        <button type="button" className={hud.hablar} onClick={() => setPanel('acciones')} aria-label={`Hablar con ${enfocado.nombre}`}>
          <Icono n="chat" size={22} /> {enfocado.nombre}
        </button>
      )}

      {/* Botones abajo a la derecha */}
      <div className={hud.botones}>
        {(
          [
            ['acciones', 'chat', 'Acciones'],
            ['mapa', 'mundo', 'Mundo'],
            ['memoria', 'libro', 'Memoria'],
            ['mas', 'puntos', 'Más'],
          ] as const
        ).map(([id, ic, nom]) => (
          <button
            key={id}
            type="button"
            className={cn(hud.boton, panel === id && hud.botonOn)}
            onClick={() => {
              setVistaAcc('raiz');
              abrir(id);
            }}
            aria-label={nom}
          >
            <Icono n={ic} size={28} />
          </button>
        ))}
      </div>

      {panel && (
        <div className={hud.hoja}>
          <button type="button" className={hud.cerrar} onClick={() => setPanel(null)} aria-label="Cerrar">
            <Icono n="cerrar" size={20} />
          </button>
          {panel === 'acciones' && accionesJSX}
          {panel === 'mapa' && mapaJSX}
          {panel === 'memoria' && memoriaJSX}
          {panel === 'mas' && masJSX}
        </div>
      )}

      {rescate && (
        <div className={hud.rescate}>
          <p>{e.nombre} acaba de llegar</p>
          <div>
            {([['disimular', 'Disimular'], ['apartarme', 'Apartarme'], ['tema', 'Cambiar de tema']] as const).map(([id, t]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRescate(false);
                  hacer((s2) => apuro(s2, id));
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <span className={hud.cuenta} />
        </div>
      )}

      {/* Aviso */}
      {e.aviso && !sc && (
        <div className={styles.velo}>
          <div className={styles.modal}>
            <div className={styles.sub}>{e.aviso.tipo === 'descubierto' ? 'Te descubrió' : e.aviso.tipo === 'mensaje' ? 'Mensaje' : e.aviso.tipo === 'busca' ? 'Te busca' : 'Sorpresa'}</div>
            <p className={styles.texto}>{e.aviso.texto}</p>
            <div style={{ display: 'grid', gap: '0.4rem' }}>
              {e.aviso.opciones.map((o) => (
                <button key={o.id} type="button" className={styles.btn} onClick={() => hacer((s) => responder(s, o.id))}>
                  {o.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Escena: ella en 2D, con vida */}
      {sc && paso && personaEscena && (
        <div className={styles.velo}>
          <div className={styles.modal}>
            <div className={styles.sub}>
              Con {personaEscena.nombre} · {lugarPorId(e.ciclo, sc.lugar).nombre} {sc.cerca ? '· él está cerca' : ''}
            </div>
            <div className={hud.escena} key={sc.paso}>
              <div className={hud.respira}>
                <Chica g={gestoPorId(paso.gesto) ?? gestoPorId('neutra')!} pose={POSES.find((p) => p.id === paso.pose) ?? POSES[0]} ropa={ROPA_BIKINI} mojada={paso.mojada} size={150} />
              </div>
            </div>
            <p className={styles.texto}>{paso.texto}</p>
            <button type="button" className={cn(styles.btn, styles.btnRosa)} onClick={() => hacer(siguientePaso)}>
              {sc.paso < sc.pasos.length - 1 ? 'Seguir' : 'Terminar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
