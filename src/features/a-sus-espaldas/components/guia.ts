'use client';

import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import styles from './guia.module.css';

/**
 * Guías con Driver.js: señalan cada opción en pantalla y dicen para qué sirve.
 * Lo que ya se vio se guarda en el navegador para no repetirlo.
 */

const CLAVE = 'a-sus-espaldas-guia-v1';

export interface PasoGuia {
  /** selector del elemento a señalar; sin él, sale al centro */
  el?: string;
  titulo: string;
  texto: string;
  lado?: 'top' | 'bottom' | 'left' | 'right' | 'over';
}

function leer(): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function yaVista(id: string): boolean {
  if (typeof window === 'undefined') return true;
  return !!leer()[id];
}

export function marcarVista(id: string): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify({ ...leer(), [id]: true }));
  } catch {
    /* sin almacenamiento: se puede repetir */
  }
}

let activa: ReturnType<typeof driver> | null = null;

export const guiaAbierta = (): boolean => !!activa && activa.isActive();

/** Muestra una guía. Solo incluye los pasos cuyo elemento está en pantalla. */
export function mostrarGuia(pasos: readonly PasoGuia[], opts: { id?: string; alTerminar?: () => void } = {}): boolean {
  if (typeof window === 'undefined' || guiaAbierta()) return false;
  const steps = pasos
    .filter((p) => !p.el || document.querySelector(p.el))
    .map((p): DriveStep => ({
      element: p.el,
      popover: { title: p.titulo, description: p.texto, side: p.lado, align: 'center' },
    }));
  if (steps.length === 0) return false;
  if (opts.id) marcarVista(opts.id);
  activa = driver({
    steps,
    showProgress: steps.length > 1,
    progressText: '{{current}} de {{total}}',
    nextBtnText: '→',
    prevBtnText: '←',
    doneBtnText: 'Listo',
    popoverClass: styles.pop,
    overlayOpacity: 0.62,
    stagePadding: 6,
    stageRadius: 14,
    smoothScroll: false,
    allowClose: true,
    onDestroyed: () => {
      activa = null;
      opts.alTerminar?.();
    },
  });
  activa.drive();
  return true;
}
