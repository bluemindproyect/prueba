'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  cerrarSesion,
  enviarEnlace,
  guardarFila,
  guardarSesion,
  insertar,
  leerSesionGuardada,
  leerTodo,
  nubeDisponible,
  renovar,
  sesionDesdeEnlace,
} from '@/lib/supabase/rest';
import type { Sesion } from '@/lib/supabase/rest';
import { revivir } from '../mundo/motor';
import type { Estado } from '../mundo/motor';

/**
 * Guarda la partida del mundo en Supabase (tabla `partidas`) cuando hay sesión, y registra
 * lo que pasa en `eventos_juego`. Sin sesión, todo sigue guardándose en el navegador.
 */

export const JUEGO_MUNDO = 'a-sus-espaldas-mundo';
const CADA_MS = 20000;

export type EstadoNube = 'apagada' | 'sin-sesion' | 'enviando' | 'enviado' | 'cargando' | 'lista' | 'error';

export interface Guardado {
  estado: EstadoNube;
  email: string;
  mensaje: string;
  /** cuándo se guardó por última vez en la nube */
  guardadoEn: number | null;
  enviar: (correo: string) => void;
  salir: () => void;
  registrar: (tipo: string, datos: Record<string, unknown>) => void;
  guardarYa: (estado?: Estado) => void;
}

/** Qué tan avanzada va una partida: la que lleva más tiempo de juego es la más nueva. */
const avance = (e: Estado): number => ((e.ciclo ?? 0) * 100000 + e.dia) * 1440 + e.reloj;

export function useGuardado(e: Estado, setE: Dispatch<SetStateAction<Estado>>, listo: boolean): Guardado {
  const [estado, setEstado] = useState<EstadoNube>(nubeDisponible ? 'cargando' : 'apagada');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardadoEn, setGuardadoEn] = useState<number | null>(null);
  const sesion = useRef<Sesion | null>(null);
  const actual = useRef(e);
  actual.current = e;
  const sucio = useRef(false);
  const cargado = useRef(false);
  const iniciado = useRef(false);

  useEffect(() => {
    if (cargado.current) sucio.current = true;
  }, [e]);

  const vigente = useCallback(async (): Promise<Sesion | null> => {
    let s = sesion.current;
    if (!s) return null;
    if (s.exp - 60 < Date.now() / 1000) {
      const nueva = await renovar(s.refresh);
      if (!nueva) {
        sesion.current = null;
        guardarSesion(null);
        setEstado('sin-sesion');
        return null;
      }
      s = nueva;
      sesion.current = s;
      guardarSesion(s);
    }
    return s;
  }, []);

  const subir = useCallback(
    async (est: Estado, keepalive = false) => {
      const s = await vigente();
      if (!s) return;
      const ok = await guardarFila(
        'partidas',
        { usuario_id: s.uid, juego: JUEGO_MUNDO, estado: est, version: est.v, actualizado_en: new Date().toISOString() },
        'usuario_id,juego',
        s,
        { keepalive },
      );
      if (ok) {
        sucio.current = false;
        setGuardadoEn(Date.now());
        setMensaje('');
      } else if (!keepalive) {
        setMensaje('No se pudo guardar en la nube. Se vuelve a intentar solo.');
      }
    },
    [vigente],
  );

  const conectar = useCallback(
    async (s: Sesion) => {
      sesion.current = s;
      guardarSesion(s);
      setEmail(s.email);
      setEstado('cargando');
      try {
        const filas = await leerTodo<{ estado: unknown }>('partidas', 'estado', `juego=eq.${JUEGO_MUNDO}`, s);
        const deNube = filas[0] ? revivir(filas[0].estado) : null;
        if (deNube && avance(deNube) > avance(actual.current)) {
          setE({ ...deNube, ultimo: Date.now() });
          setMensaje('Se cargó tu partida guardada en la nube.');
          sucio.current = false;
        } else {
          sucio.current = true;
        }
        cargado.current = true;
        setEstado('lista');
        if (sucio.current) void subir(actual.current);
      } catch (err) {
        cargado.current = true;
        setMensaje(err instanceof Error ? err.message : 'No se pudo leer la nube.');
        setEstado('error');
      }
    },
    [setE, subir],
  );

  // Al abrir (ya con lo guardado en el navegador): enlace del correo, sesión guardada o nada.
  useEffect(() => {
    if (!nubeDisponible || !listo || iniciado.current) return;
    iniciado.current = true;
    (async () => {
      let s = sesionDesdeEnlace() ?? leerSesionGuardada();
      if (s && s.exp - 60 < Date.now() / 1000) s = await renovar(s.refresh);
      if (!s) {
        guardarSesion(null);
        cargado.current = true;
        setEstado('sin-sesion');
        return;
      }
      await conectar(s);
    })();
  }, [listo, conectar]);

  // Guardar cada tanto y al salir de la página.
  useEffect(() => {
    if (!nubeDisponible) return;
    const id = window.setInterval(() => {
      if (sesion.current && cargado.current && sucio.current) void subir(actual.current);
    }, CADA_MS);
    const alOcultar = () => {
      if (document.visibilityState === 'hidden' && sesion.current && cargado.current && sucio.current) void subir(actual.current, true);
    };
    document.addEventListener('visibilitychange', alOcultar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', alOcultar);
    };
  }, [subir]);

  const enviar = useCallback((correo: string) => {
    const limpio = correo.trim();
    if (!limpio.includes('@')) {
      setMensaje('Escribe un correo válido.');
      return;
    }
    setEstado('enviando');
    setMensaje('');
    enviarEnlace(limpio, `${window.location.origin}${window.location.pathname}`)
      .then(() => {
        setEmail(limpio);
        setEstado('enviado');
      })
      .catch((err: unknown) => {
        setMensaje(err instanceof Error ? err.message : 'No se pudo enviar el enlace.');
        setEstado('sin-sesion');
      });
  }, []);

  const salir = useCallback(() => {
    const s = sesion.current;
    if (s && sucio.current) void subir(actual.current, true);
    sesion.current = null;
    guardarSesion(null);
    setEstado('sin-sesion');
    setGuardadoEn(null);
    if (s) void cerrarSesion(s);
  }, [subir]);

  const registrar = useCallback(
    (tipo: string, datos: Record<string, unknown>) => {
      const a = actual.current;
      void vigente().then((s) => {
        if (!s) return;
        void insertar(
          'eventos_juego',
          [
            {
              usuario_id: s.uid,
              sesion_id: null,
              juego: 'a-sus-espaldas-paseo',
              tipo,
              datos,
              estado: { sat: Math.round(a.sat), sospecha: Math.round(a.sospecha), quiebre: Math.round(a.quiebre), dia: a.dia },
            },
          ],
          s,
        );
      });
    },
    [vigente],
  );

  const guardarYa = useCallback(
    (est?: Estado) => {
      if (sesion.current && cargado.current) void subir(est ?? actual.current);
    },
    [subir],
  );

  return { estado, email, mensaje, guardadoEn, enviar, salir, registrar, guardarYa };
}
