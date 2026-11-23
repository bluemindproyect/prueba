'use client';

import { ASPECTO_EL, ASPECTO_ELLA, Rostro } from './Rostro';
import type { Aspecto } from './Rostro';
import { GESTOS, GESTOS_EL_POR_ETAPA, gestoPorId, gestosDe } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import type { Gesto, Quien } from '@/features/a-sus-espaldas/lib/mundo/gestos';
import styles from './gestos.module.css';

const ETAPAS = ['Confianza', 'Duda', 'Celos', 'Rabia', 'Tristeza', 'Quiebre'] as const;
const ASPECTO_OTRO: Aspecto = { piel: '#e3b58e', pelo: '#2a1a12' };

function Celda({ g, aspecto }: { g: Gesto; aspecto: Aspecto }) {
  return (
    <li className={styles.cell}>
      <Rostro g={g} aspecto={aspecto} size={72} />
      <span>{g.nombre}</span>
    </li>
  );
}

function Grupo({ titulo, lista, aspecto }: { titulo: string; lista: readonly Gesto[]; aspecto: Aspecto }) {
  return (
    <section className={styles.group}>
      <h2 className={styles.h2}>
        {titulo} <b>{lista.length}</b>
      </h2>
      <ul className={styles.grid}>{lista.map((g) => <Celda key={g.id} g={g} aspecto={aspecto} />)}</ul>
    </section>
  );
}

const SECCIONES: ReadonlyArray<{ quien: Quien; titulo: string; aspecto: Aspecto }> = [
  { quien: 'ella', titulo: 'Ella', aspecto: ASPECTO_ELLA },
  { quien: 'otro', titulo: 'Los otros', aspecto: ASPECTO_OTRO },
];

export default function Gestos() {
  return (
    <div className={styles.root}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>Gestos</h1>
        <p className={styles.lead}>
          {GESTOS.length} gestos: {gestosDe('el').length} de él, {gestosDe('ella').length} de ella y {gestosDe('otro').length} de los otros.
        </p>
        {GESTOS_EL_POR_ETAPA.map((ids, i) => (
          <Grupo key={ETAPAS[i]} titulo={`Él · ${ETAPAS[i]}`} lista={ids.map((id) => gestoPorId(id)).filter((g): g is Gesto => !!g)} aspecto={ASPECTO_EL} />
        ))}
        {SECCIONES.map((s) => (
          <Grupo key={s.quien} titulo={s.titulo} lista={gestosDe(s.quien)} aspecto={s.aspecto} />
        ))}
      </div>
    </div>
  );
}
