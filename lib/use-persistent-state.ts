'use client';

import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Estado que se guarda en localStorage.
 * El primer render usa `initial` (igual en servidor y cliente) y, ya montado,
 * se carga lo guardado. `ready` indica que esa carga ya ocurrió.
 * Todo acceso a localStorage va en try/catch: puede estar bloqueado.
 */
export function usePersistentState<T>(
  key: string,
  initial: () => T,
  revive: (raw: unknown) => T | null,
): readonly [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = revive(JSON.parse(raw));
        if (saved) setState(saved);
      }
    } catch {
      /* sin almacenamiento: se juega sin guardar */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignorar */
    }
  }, [key, ready, state]);

  return [state, setState, ready] as const;
}
