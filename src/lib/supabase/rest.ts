/**
 * Cliente mínimo de Supabase por HTTP (sin dependencias). Solo habla con el proyecto del juego:
 * si la URL no es la de ese proyecto, queda apagado y el juego funciona sin nube.
 */

const PROJECT = 'lglsdegcdtcnnbcfgpnf';
const URL_BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const AUTH_KEY = 'a-sus-espaldas-auth';

export const nubeDisponible = URL_BASE.includes(PROJECT) && KEY.length > 0;

export interface Sesion {
  access: string;
  refresh: string;
  /** segundos desde 1970 en que caduca el acceso */
  exp: number;
  uid: string;
  email: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user?: { id?: string; email?: string };
}

const headers = (token?: string, extra?: Record<string, string>): Record<string, string> => ({
  apikey: KEY,
  Authorization: `Bearer ${token ?? KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});

function decodeJwt(token: string): { sub?: string; email?: string; exp?: number } {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
  } catch {
    return {};
  }
}

function toSesion(t: TokenResponse): Sesion | null {
  const claims = decodeJwt(t.access_token);
  if (!claims.sub) return null;
  return {
    access: t.access_token,
    refresh: t.refresh_token,
    exp: claims.exp ?? Math.floor(Date.now() / 1000) + (t.expires_in ?? 3600),
    uid: claims.sub,
    email: t.user?.email ?? claims.email ?? '',
  };
}

export function leerSesionGuardada(): Sesion | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(s: Sesion | null): void {
  try {
    if (s) window.localStorage.setItem(AUTH_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
    /* sin almacenamiento: la sesión dura lo que dure la pestaña */
  }
}

/** Si vienes de abrir el enlace del correo, los datos de sesión llegan en el hash de la URL. */
export function sesionDesdeEnlace(): Sesion | null {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.includes('access_token=')) return null;
  const p = new URLSearchParams(hash);
  const access = p.get('access_token');
  const refresh = p.get('refresh_token');
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  if (!access || !refresh) return null;
  return toSesion({ access_token: access, refresh_token: refresh, expires_in: Number(p.get('expires_in')) || 3600 });
}

export async function renovar(refresh: string): Promise<Sesion | null> {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  return toSesion((await res.json()) as TokenResponse);
}

export async function enviarEnlace(email: string, redirectTo: string): Promise<void> {
  const res = await fetch(`${URL_BASE}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!res.ok) throw new Error(`No se pudo enviar el enlace (${res.status})`);
}

export async function cerrarSesion(s: Sesion): Promise<void> {
  try {
    await fetch(`${URL_BASE}/auth/v1/logout`, { method: 'POST', headers: headers(s.access) });
  } catch {
    /* ya se borró local */
  }
}

/** Lee todas las filas de una tabla, de mil en mil. */
export async function leerTodo<T>(tabla: string, select: string, filtro: string, s: Sesion): Promise<T[]> {
  const out: T[] = [];
  const PAGE = 1000;
  for (let offset = 0; offset < 20000; offset += PAGE) {
    const res = await fetch(`${URL_BASE}/rest/v1/${tabla}?select=${select}&${filtro}&limit=${PAGE}&offset=${offset}`, {
      headers: headers(s.access),
    });
    if (!res.ok) throw new Error(`Lectura de ${tabla} falló (${res.status})`);
    const page = (await res.json()) as T[];
    out.push(...page);
    if (page.length < PAGE) break;
  }
  return out;
}

/** Lectura sin sesión (tablas con lectura pública). */
export async function leerPublico<T>(tabla: string, select: string, filtro: string): Promise<T[]> {
  const res = await fetch(`${URL_BASE}/rest/v1/${tabla}?select=${select}&${filtro}&limit=1000`, { headers: headers() });
  if (!res.ok) throw new Error(`Lectura de ${tabla} falló (${res.status})`);
  return (await res.json()) as T[];
}

export async function insertar<T = unknown>(
  tabla: string,
  filas: unknown,
  s: Sesion,
  opts: { devolver?: boolean; keepalive?: boolean } = {},
): Promise<T[] | null> {
  const res = await fetch(`${URL_BASE}/rest/v1/${tabla}`, {
    method: 'POST',
    headers: headers(s.access, { Prefer: opts.devolver ? 'return=representation' : 'return=minimal' }),
    body: JSON.stringify(filas),
    keepalive: opts.keepalive,
  });
  if (!res.ok) return null;
  return opts.devolver ? ((await res.json()) as T[]) : null;
}
