'use client';

import { useState } from 'react';
import type { Nube } from '@/features/a-sus-espaldas/lib/use-nube';
import styles from './game.module.css';

/** Entrar con correo y ver cuánto contenido llegó de la base de datos. */
export function NubePanel({ nube }: { nube: Nube }) {
  const [correo, setCorreo] = useState('');
  if (nube.estado === 'apagada') return null;

  return (
    <section className={styles.nube} aria-label="Nube">
      {nube.estado === 'lista' ? (
        <div className={styles.nubeRow}>
          <span className={styles.label}>
            Conectado · {nube.frases} frases nuevas
          </span>
          <button type="button" className={styles.nubeBtn} onClick={nube.salir}>
            Salir
          </button>
        </div>
      ) : nube.estado === 'enviado' ? (
        <p className={styles.nubeMsg}>Te mandé un enlace a {nube.email}. Ábrelo desde este mismo teléfono.</p>
      ) : nube.estado === 'cargando' ? (
        <p className={styles.nubeMsg}>Cargando…</p>
      ) : (
        <form
          className={styles.nubeRow}
          onSubmit={(e) => {
            e.preventDefault();
            nube.enviar(correo);
          }}
        >
          <input
            className={styles.nubeInput}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="tu correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            aria-label="Correo"
          />
          <button type="submit" className={styles.nubeBtn} disabled={nube.estado === 'enviando'}>
            {nube.estado === 'enviando' ? '…' : 'Entrar'}
          </button>
        </form>
      )}
      {nube.mensaje && <p className={styles.nubeMsg}>{nube.mensaje}</p>}
    </section>
  );
}
