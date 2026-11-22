'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cargarContenido } from './contenido';
import type { ContenidoRow } from './contenido';
import {
  cerrarSesion,
  enviarEnlace,
  guardarSesion,
  insertar,
  leerSesionGuardada,
  leerTodo,
  nubeDisponible,
  renovar,
  sesionDesdeEnlace,
} from '@/lib/supabase/rest';
import type { Sesion } from '@/lib/supabase/rest';

export type NubeEstado = 'apagada' | 'sin-sesion' | 'enviando' | 'enviado' | 'cargando' | 'lista' | 'error';

export interface Nube {
  estado: NubeEstado;
  email: string;
  frases: number;
  /** cambia cada vez que se carga contenido nuevo, para volver a pintar */
  version: number;
  mensaje: string;
  enviar: (email: string) => void;
  salir: () => void;
  registrar: (tipo: string, datos: Record<string, unknown>, estado?: Record<string, unknown>) => void;
}

const JUEGO = 'a-sus-espaldas';
const FLUSH_MS = 15000;

interface Evento {
  usuario_id: string;
  sesion_id: string | null;
  juego: string;
  tipo: string;
  datos: Record<string, unknown>;
  estado: Record<string, unknown>;
}

/** Sesión por correo, contenido que llega de la base de datos y registro de lo que juegas. */
export function useNube(): Nube {
  const [estado, setEstado] = useState<NubeEstado>(nubeDisponible ? 'cargando' : 'apagada');
  const [email, setEmail] = useState('');
  const [frases, setFrases] = useState(0);
  const [version, setVersion] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const sesionRef = useRef<Sesion | null>(null);
  const sesionIdRef = useRef<string | null>(null);
  const cola = useRef<Evento[]>([]);

  const vaciar = useCallback((keepalive = false) => {
    const s = sesionRef.current;
    if (!s || cola.current.length === 0) return;
    const lote = cola.current.splice(0, cola.current.length);
    void insertar('eventos_juego', lote, s, { keepalive }).then((r) => {
      if (r === null && !keepalive) {
        // Si falló, no perder lo jugado: se reintenta en el siguiente envío.
        cola.current.unshift(...lote);
      }
    });
  }, []);

  const conectar = useCallback(async (s: Sesion) => {
    sesionRef.current = s;
    guardarSesion(s);
    setEmail(s.email);
    setEstado('cargando');
    try {
      const rows = await leerTodo<ContenidoRow>('contenido', 'tipo,texto,datos,condiciones,peso', 'activo=eq.true', s);
      setFrases(cargarContenido(rows));
      setVersion((v) => v + 1);
      const nueva = await insertar<{ id: string }>(
        'sesiones',
        { usuario_id: s.uid, juego: JUEGO, version_juego: 'web' },
        s,
        { devolver: true },
      );
      sesionIdRef.current = nueva?.[0]?.id ?? null;
      setEstado('lista');
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : 'No se pudo cargar el contenido');
      setEstado('error');
    }
  }, []);

  // Al abrir: enlace del correo, sesión guardada, o nada.
  useEffect(() => {
    if (!nubeDisponible) return;
    let vivo = true;
    (async () => {
      let s = sesionDesdeEnlace() ?? leerSesionGuardada();
      if (s && s.exp - 60 < Date.now() / 1000) s = await renovar(s.refresh);
      if (!vivo) return;
      if (!s) {
        guardarSesion(null);
        setEstado('sin-sesion');
        return;
      }
      await conectar(s);
    })();
    return () => {
      vivo = false;
    };
  }, [conectar]);

  // Enviar lo jugado cada tanto y al salir de la página.
  useEffect(() => {
    if (!nubeDisponible) return;
    const id = window.setInterval(() => vaciar(), FLUSH_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') vaciar(true);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [vaciar]);

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
      .catch((e: unknown) => {
        setMensaje(e instanceof Error ? e.message : 'No se pudo enviar el enlace');
        setEstado('sin-sesion');
      });
  }, []);

  const salir = useCallback(() => {
    const s = sesionRef.current;
    vaciar(true);
    sesionRef.current = null;
    sesionIdRef.current = null;
    guardarSesion(null);
    cargarContenido([]);
    setFrases(0);
    setVersion((v) => v + 1);
    setEstado('sin-sesion');
    if (s) void cerrarSesion(s);
  }, [vaciar]);

  const registrar = useCallback(
    (tipo: string, datos: Record<string, unknown>, est: Record<string, unknown> = {}) => {
      const s = sesionRef.current;
      if (!s) return;
      cola.current.push({ usuario_id: s.uid, sesion_id: sesionIdRef.current, juego: JUEGO, tipo, datos, estado: est });
    },
    [],
  );

  return { estado, email, frases, version, mensaje, enviar, salir, registrar };
}
