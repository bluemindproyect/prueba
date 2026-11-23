'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CATEGORIAS, PALABRAS_KEY, contarLineas, guardadoVacio, reviveGuardado } from '@/features/a-sus-espaldas/lib/palabras';
import type { Guardado } from '@/features/a-sus-espaldas/lib/palabras';
import { cn } from '@/lib/cn';
import { usePersistentState } from '@/lib/use-persistent-state';
import styles from './palabras.module.css';

export default function Palabras() {
  const [datos, setDatos, ready] = usePersistentState<Guardado>(PALABRAS_KEY, guardadoVacio, reviveGuardado);
  const [abierta, setAbierta] = useState<string | null>(CATEGORIAS[0].id);
  const total = CATEGORIAS.reduce((n, c) => n + contarLineas(datos[c.id]), 0);

  const exportar = () => {
    const texto = CATEGORIAS.map((c) => `## ${c.titulo}\n${datos[c.id] ?? ''}`).join('\n\n');
    void navigator.clipboard?.writeText(texto);
  };

  return (
    <div className={cn(styles.root, !ready && styles.loading)}>
      <div className={styles.wrap}>
        <header>
          <h1 className={styles.title}>Tus palabras</h1>
          <p className={styles.lead}>
            Escribe aquí tus propias frases. Una por línea. Se guardan solo en este navegador y el juego las mezcla con las suyas.
            Puedes usar <b>{'{n}'}</b> para el nombre de él y <b>{'{p}'}</b> para el de la otra persona.
          </p>
          <p className={styles.total}>{total} frases tuyas</p>
        </header>

        <ul className={styles.list}>
          {CATEGORIAS.map((c) => {
            const n = contarLineas(datos[c.id]);
            const open = abierta === c.id;
            return (
              <li key={c.id} className={cn(styles.item, open && styles.open)}>
                <button type="button" className={styles.head} aria-expanded={open} onClick={() => setAbierta(open ? null : c.id)}>
                  <span className={styles.name}>{c.titulo}</span>
                  <span className={styles.meta}>
                    <span className={cn(styles.badge, c.donde === 'llamada' ? styles.badgeOn : styles.badgeSoon)}>
                      {c.donde === 'llamada' ? 'ya sale en la llamada' : 'saldrá en el mundo'}
                    </span>
                    <b className={styles.count}>{n}</b>
                  </span>
                </button>
                {open && (
                  <div className={styles.body}>
                    <p className={styles.sirve}>{c.sirve}</p>
                    <p className={styles.ejemplo}>
                      <small>Ejemplo</small>
                      {c.ejemplo}
                    </p>
                    <label className={styles.label} htmlFor={`t-${c.id}`}>
                      Tu lista, una por línea
                    </label>
                    <textarea
                      id={`t-${c.id}`}
                      className={styles.area}
                      rows={8}
                      value={datos[c.id] ?? ''}
                      placeholder={c.ejemplo}
                      onChange={(e) => setDatos((d) => ({ ...d, [c.id]: e.target.value }))}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <button type="button" className={styles.copy} onClick={exportar}>
          Copiar todo mi texto
        </button>
        <Link href="/a-sus-espaldas" className={styles.back}>
          ← Volver al juego
        </Link>
        <p className={styles.foot}>Juego de ficción. Todos los personajes son adultos e inventados.</p>
      </div>
    </div>
  );
}
