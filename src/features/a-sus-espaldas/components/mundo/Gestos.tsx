'use client';

import { useMemo, useState } from 'react';
import { ASPECTO_EL, ASPECTO_ELLA, Rostro } from './Rostro';
import type { Aspecto } from './Rostro';
import { GESTOS, GESTOS_EL_POR_ETAPA, gestoPorId, gestosDe } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import type { Gesto, Quien } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import styles from './gestos.module.css';

const ETAPAS = ['Confianza', 'Duda', 'Celos', 'Rabia', 'Tristeza', 'Quiebre'] as const;
const ASPECTO_OTRO: Aspecto = { piel: '#e3b58e', pelo: '#2a1a12' };

const QUIENES: ReadonlyArray<{ id: 'todos' | Quien; nombre: string }> = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'el', nombre: 'Él' },
  { id: 'ella', nombre: 'Ella' },
  { id: 'otro', nombre: 'Los otros' },
];

function Celda({ g, aspecto, copiado, onCopiar }: { g: Gesto; aspecto: Aspecto; copiado: boolean; onCopiar: (id: string) => void }) {
  return (
    <li>
      <button type="button" className={`${styles.cell} ${copiado ? styles.copiado : ''}`} onClick={() => onCopiar(g.id)} title={`Copiar "${g.id}"`}>
        <Rostro g={g} aspecto={aspecto} size={72} />
        <span>{copiado ? '¡copiado!' : g.nombre}</span>
      </button>
    </li>
  );
}

function Grupo({
  titulo,
  lista,
  aspecto,
  copiado,
  onCopiar,
}: {
  titulo: string;
  lista: readonly Gesto[];
  aspecto: Aspecto;
  copiado: string | null;
  onCopiar: (id: string) => void;
}) {
  if (lista.length === 0) return null;
  return (
    <section className={styles.group}>
      <h2 className={styles.h2}>
        {titulo} <b>{lista.length}</b>
      </h2>
      <ul className={styles.grid}>
        {lista.map((g) => (
          <Celda key={g.id} g={g} aspecto={aspecto} copiado={copiado === g.id} onCopiar={onCopiar} />
        ))}
      </ul>
    </section>
  );
}

const SECCIONES: ReadonlyArray<{ quien: Quien; titulo: string; aspecto: Aspecto }> = [
  { quien: 'ella', titulo: 'Ella', aspecto: ASPECTO_ELLA },
  { quien: 'otro', titulo: 'Los otros', aspecto: ASPECTO_OTRO },
];

export default function Gestos() {
  const [q, setQ] = useState('');
  const [quien, setQuien] = useState<'todos' | Quien>('todos');
  const [etapa, setEtapa] = useState<number | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const busca = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return () => true;
    return (g: Gesto) => g.id.includes(t) || g.nombre.toLowerCase().includes(t);
  }, [q]);

  const filtra = useMemo(() => (g: Gesto) => busca(g) && (quien === 'todos' || g.quien === quien), [busca, quien]);

  const etapas = useMemo(
    () =>
      GESTOS_EL_POR_ETAPA.map((ids, i) => ({
        titulo: `Él · ${ETAPAS[i]}`,
        lista: (etapa === null || etapa === i ? ids : []).map((id) => gestoPorId(id)).filter((g): g is Gesto => !!g).filter(filtra),
      })),
    [etapa, filtra],
  );

  const secciones = useMemo(
    () =>
      SECCIONES.filter((s) => quien === 'todos' || quien === s.quien).map((s) => ({
        ...s,
        lista: gestosDe(s.quien).filter(filtra),
      })),
    [quien, filtra],
  );

  const total = useMemo(
    () => etapas.reduce((n, e) => n + e.lista.length, 0) + secciones.reduce((n, s) => n + s.lista.length, 0),
    [etapas, secciones],
  );

  const copiar = (id: string) => {
    void navigator.clipboard?.writeText(id);
    setCopiado(id);
    window.setTimeout(() => setCopiado((c) => (c === id ? null : c)), 1200);
  };

  const limpiar = () => {
    setQ('');
    setQuien('todos');
    setEtapa(null);
  };

  const filtrado = q !== '' || quien !== 'todos' || etapa !== null;

  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Gestos</h1>
        <p className={styles.lead}>
          {GESTOS.length} gestos: {gestosDe('el').length} de él, {gestosDe('ella').length} de ella y {gestosDe('otro').length} de los otros.
        </p>

        <div className={styles.toolbar}>
          <input
            className={styles.buscador}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre o id…"
            aria-label="Buscar gestos"
          />
          <div className={styles.chips} role="group" aria-label="Filtrar por quién">
            {QUIENES.map((op) => (
              <button
                key={op.id}
                type="button"
                className={`${styles.chip} ${quien === op.id ? styles.activo : ''}`}
                onClick={() => setQuien(op.id)}
                aria-pressed={quien === op.id}
              >
                {op.nombre}
              </button>
            ))}
          </div>
          <div className={styles.chips} role="group" aria-label="Filtrar por etapa">
            <button type="button" className={`${styles.chip} ${etapa === null ? styles.activo : ''}`} onClick={() => setEtapa(null)} aria-pressed={etapa === null}>
              Todas
            </button>
            {ETAPAS.map((nombre, i) => (
              <button key={nombre} type="button" className={`${styles.chip} ${etapa === i ? styles.activo : ''}`} onClick={() => setEtapa(i)} aria-pressed={etapa === i}>
                {nombre}
              </button>
            ))}
          </div>
          <p className={styles.cuenta}>
            {total} {total === 1 ? 'resultado' : 'resultados'}
            {filtrado && (
              <button type="button" className={styles.limpiar} onClick={limpiar}>
                limpiar
              </button>
            )}
          </p>
        </div>

        {total === 0 ? (
          <p className={styles.vacio}>Ningún gesto coincide con «{q}».</p>
        ) : (
          <>
            {etapas.map((e) => (
              <Grupo key={e.titulo} titulo={e.titulo} lista={e.lista} aspecto={ASPECTO_EL} copiado={copiado} onCopiar={copiar} />
            ))}
            {secciones.map((s) => (
              <Grupo key={s.quien} titulo={s.titulo} lista={s.lista} aspecto={s.aspecto} copiado={copiado} onCopiar={copiar} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}