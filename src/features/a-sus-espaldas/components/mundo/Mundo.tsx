'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Chica, POSES, ROPA_BIKINI } from './Chica';
import { Vista3D } from './Vista3D';
import type { Habitante } from './Vista3D';
import { ETAPAS, T, ZONAS } from '@/features/a-sus-espaldas/lib/mundo/datos';
import type { Escena, Persona } from '@/features/a-sus-espaldas/lib/mundo/datos';
import { gestoDeEl, gestoPorId } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import {
  avanzar,
  barrasDeEtapa,
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

  useEffect(() => {
    if (!ready || pausa) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setE((s) => tick(s));
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
  const ruta = (z: string) => zonaNombre(z);

  const accionesJSX = (
    <>
      <h2 className={styles.h3}>{enfocado ? `Con ${enfocado.nombre}` : 'Qué haces'}</h2>
      {enfocado ? (
        <>
          <div className={styles.acciones}>
            <button type="button" className={styles.btn} onClick={() => hacer((s) => seducir(s, enfocado, 'conversar'))}>
              Conversar
            </button>
            <button type="button" className={styles.btn} onClick={() => hacer((s) => seducir(s, enfocado, 'indirecta'))}>
              Lanzar indirectas
            </button>
            <button type="button" className={styles.btn} onClick={() => hacer((s) => seducir(s, enfocado, 'mostrarte'))}>
              Mostrar el cuerpo
            </button>
            <button type="button" className={cn(styles.btn, styles.btnRosa)} onClick={() => hacer((s) => proponer(s, enfocado))}>
              Proponerle sexo
            </button>
          </div>
          <p className={styles.dim}>
            Interés {Math.round(e.interes[enfocado.id] ?? 0)} · te diría que sí con {Math.round(chanceDeSi(e, enfocado))}% de probabilidad. Es {enfocado.pista}. {elCerca(e) ? 'Él está cerca: más riesgo, más satisfacción.' : ''}
          </p>
          {e.pendiente === enfocado.id && !lugarAct.privado && <p className={styles.dim}>Aceptó, pero aquí no. Llévalo a un lugar con 🔒.</p>}
        </>
      ) : (
        <p className={styles.dim}>Camina hasta alguien para seducirlo.</p>
      )}
      <div className={styles.acciones} style={{ marginTop: '0.5rem' }}>
        <button type="button" className={styles.btn} disabled={!elAquiAhora} onClick={() => hacer(ternura)}>
          Ser tierna con él
        </button>
        <button type="button" className={styles.btn} disabled={!elAquiAhora} onClick={() => hacer(distante)}>
          Ser fría con él
        </button>
        <button type="button" className={styles.btn} onClick={() => hacer(dejarPista)}>
          Dejar una pista a la vista
        </button>
        <button type="button" className={styles.btn} onClick={() => hacer((s) => avanzar(s, 15))}>
          Esperar 15 min
        </button>
      </div>
      {(e.rastros.sabanas || e.rastros.ropa || e.rastros.olor > 5 || e.rastros.escondido) && (
        <>
          <h2 className={styles.h3} style={{ marginTop: '0.7rem' }}>
            Rastros
          </h2>
          <div className={styles.acciones}>
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
                Bañarte ({Math.round(e.rastros.olor)}% de olor)
              </button>
            )}
            {(e.rastros.sabanas || e.rastros.ropa) && (
              <button type="button" className={styles.btn} onClick={() => hacer((s) => limpiar(s, 'esconder' as Limpieza))}>
                Guardar todo en el sótano
              </button>
            )}
          </div>
          {e.rastros.escondido && <p className={styles.dim}>Hay cosas escondidas en el sótano. Si él baja, podría encontrarlas.</p>}
        </>
      )}
    </>
  );

  const mapaJSX = (
    <>
      <h2 className={styles.h3}>A dónde ir</h2>
      <div className={styles.mapa}>
        {zonas.map((z) => {
          const { el: hay, otros } = quien(z);
          return (
            <button key={z} type="button" className={cn(styles.zona, lugarAct.zona === z && styles.zonaOn)} onClick={() => setZonaAbierta(zonaAbierta === z ? null : z)}>
              <strong>{ruta(z)}</strong>
              <div className={styles.monitos}>
                {lugarAct.zona === z && <Monito color="#f1c7a6" ropa="#e0457b" grande />}
                {hay && <Monito color="#e9bf9b" ropa="#4d6fa8" grande />}
                {otros.map((p) => (
                  <Monito key={p.id} color={p.look.piel} ropa={p.look.ropa} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
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
                {l.privado ? ' 🔒' : ''}
              </button>
            ))}
        </div>
      )}
      <p className={styles.dim}>Rosa: tú. Azul: él. Cambiar de zona cuesta unos 20 minutos.</p>
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

      {/* Él, en una ventanita sobre el mundo */}
      <div className={hud.pip}>
        <Vista3D escena={lugarEl.escena} hora={e.reloj} gente={genteEl} vista="tercera" mini etiqueta="Él" />
        <div className={hud.piensa}>
          {lugarEl.nombre} · {el.hace}
          <i>«{piensa}»</i>
        </div>
      </div>

      {/* Aviso corto de lo último que pasó */}
      <p className={hud.toast} key={e.ultima}>
        {e.ultima}
      </p>
      {enfocado && !panel && (
        <button type="button" className={hud.hablar} onClick={() => setPanel('acciones')}>
          Hablar con {enfocado.nombre}
        </button>
      )}

      {/* Botones abajo a la derecha */}
      <div className={hud.botones}>
        <button type="button" className={cn(hud.boton, panel === 'acciones' && hud.botonOn)} onClick={() => abrir('acciones')}>
          Acciones
        </button>
        <button type="button" className={cn(hud.boton, panel === 'mapa' && hud.botonOn)} onClick={() => abrir('mapa')}>
          Mapa
        </button>
        <button type="button" className={cn(hud.boton, panel === 'memoria' && hud.botonOn)} onClick={() => abrir('memoria')}>
          Memoria
        </button>
        <button type="button" className={cn(hud.boton, panel === 'mas' && hud.botonOn)} onClick={() => abrir('mas')}>
          Más
        </button>
      </div>

      {panel && (
        <div className={hud.hoja}>
          <button type="button" className={hud.cerrar} onClick={() => setPanel(null)} aria-label="Cerrar">
            ✕
          </button>
          {panel === 'acciones' && accionesJSX}
          {panel === 'mapa' && mapaJSX}
          {panel === 'memoria' && memoriaJSX}
          {panel === 'mas' && masJSX}
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
