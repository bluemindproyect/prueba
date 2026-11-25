import { SEDUCE } from '../../lib/mundo/datos';
import type { Persona } from '../../lib/mundo/datos';
import { avanzar, chanceDeSi, elAqui, elCerca, etapaDe, fmt, lugarPorId, personas, tramoEl } from '../../lib/mundo/motor';
import type { Estado } from '../../lib/mundo/motor';
import type { CallResult } from '../../lib/minijuegos/llamada';

export type Rng = () => number;

const clamp = (v: number, a = 0, b = 100): number => Math.max(a, Math.min(b, v));
const pick = <T,>(l: readonly T[], rng: Rng): T => l[Math.floor(rng() * l.length)];
const log = (e: Estado, t: string): string[] => [t, ...e.log].slice(0, 40);

/** Quién te está siguiendo ahora, si alguien aceptó tu invitación. */
export function seguidor(e: Estado): Persona | null {
  if (!e.pendiente) return null;
  return personas(e.ciclo).find((p) => p.id === e.pendiente) ?? null;
}

/** Qué tan probable es que diga que sí, de 0 a 5 corazones. */
export function corazones(e: Estado, p: Persona): number {
  return Math.round((chanceDeSi(e, p) / 100) * 5);
}

/** Lo invitas a ir contigo. Si dice que sí, te sigue a donde vayas. */
export function invitar(e: Estado, p: Persona, rng: Rng = Math.random): Estado {
  if (e.escena) return e;
  const dijoSi = rng() * 100 < chanceDeSi(e, p);
  if (!dijoSi) {
    const t = fmt(pick(SEDUCE.no[p.rasgo], rng), e, { p });
    const s = avanzar({ ...e, interes: { ...e.interes, [p.id]: clamp((e.interes[p.id] ?? 0) - 4, 0, 130) } }, 4);
    return { ...s, ultima: t, log: log(s, `${p.nombre} dijo que no. ${t}`) };
  }
  const t = `${fmt(pick(SEDUCE.si[p.rasgo], rng), e, { p })} Ahora te sigue.`;
  const s = avanzar(e, 2);
  return { ...s, pendiente: p.id, ultima: t, log: log(s, `${p.nombre} aceptó tu invitación y te sigue.`) };
}

/** Ya no te sigue. */
export function soltar(e: Estado): Estado {
  if (!e.pendiente) return e;
  const p = seguidor(e);
  const t = p ? `${p.nombre} se despide con la mirada y se va.` : 'Se va.';
  return { ...e, pendiente: null, ultima: t, log: log(e, t) };
}

/** Se puede cerrar la puerta: alguien te sigue, el lugar es privado y él no está aquí. */
export function puedeCerrar(e: Estado): boolean {
  return !!seguidor(e) && lugarPorId(e.ciclo, e.lugar).privado && !elAqui(e) && !e.escena;
}

/** ¿Su rutina lo trae a este mismo cuarto en los próximos `min` minutos? */
export function vieneEnMinutos(e: Estado, min: number): boolean {
  for (let k = 5; k <= min; k += 5) {
    const total = e.reloj + k;
    const futuro: Estado = { ...e, reloj: total % 1440, dia: e.dia + Math.floor(total / 1440) };
    if (tramoEl(futuro).lugar === e.lugar) return true;
  }
  return false;
}

/** Lo que va a pasar en el momento: si él va a entrar y a qué intensidad (0 a 100). */
export interface Plan {
  entra: boolean;
  en: number;
  /** él estaba en el mismo lugar (la misma casa, el mismo hotel…) */
  cerca: boolean;
}

export function planear(e: Estado, rng: Rng = Math.random): Plan {
  const cerca = elCerca(e);
  const viene = vieneEnMinutos(e, 40);
  const prob = viene ? 0.85 : cerca ? 0.45 + e.sospecha / 250 : 0.03 + e.sospecha / 1000;
  return { entra: rng() < prob, en: 38 + Math.floor(rng() * 42), cerca };
}

/** Cómo terminó: sin que él entrara, parando a tiempo, o siguiendo frente a él. */
export type Final = 'completo' | 'parado' | 'visto';

export interface Resultado {
  estado: Estado;
  ganado: number;
  /** de dónde salió la satisfacción, para mostrarlo con iconos */
  motivos: { icono: string; texto: string }[];
  final: Final;
  /** lo que pasa con él, en una línea */
  frase: string;
}

/** Termina el momento: lo que ganas tú y lo que le pasa a él. No modifica el estado anterior. */
export function terminarMomento(e: Estado, p: Persona, plan: Plan, final: Final, alcanzado: number, rng: Rng = Math.random, llamada?: CallResult): Resultado {
  const lugar = lugarPorId(e.ciclo, e.lugar);
  const motivos: { icono: string; texto: string }[] = [];
  let sat = 8;
  if (plan.cerca) {
    sat += 10;
    motivos.push({ icono: '👀', texto: 'Él estaba cerca' });
  }
  if (p.aprecio > 0.4) {
    sat += Math.round(p.aprecio * 14);
    motivos.push({ icono: '🤝', texto: `Es ${p.pista}` });
  }
  if (e.tierno > 20) {
    sat += 8;
    motivos.push({ icono: '🤍', texto: 'Él estaba tierno contigo' });
  }
  // Que él siga confiando solo cuenta si no se enteró de nada.
  if (final === 'completo' && e.sospecha < 20) {
    sat += 6;
    motivos.push({ icono: '😇', texto: 'No sospecha nada' });
  } else if (final === 'completo' && e.sospecha < 50) {
    sat += 3;
  }
  if ((e.veces[p.id] ?? 0) === 0) {
    sat += 5;
    motivos.push({ icono: '✨', texto: 'Primera vez' });
  }
  // La llamada que él te hizo mientras tanto: cuánto duró, si lo hiciste sentir y si se oyó algo.
  if (llamada) {
    const min = llamada.seconds / 60;
    if (min >= 1) {
      sat += Math.min(10, Math.round(min * 2));
      motivos.push({ icono: '⏱', texto: `Duró ${Math.floor(min)} min por teléfono` });
    }
    if (llamada.hurt >= 25) {
      sat += Math.round(llamada.hurt * 0.12);
      motivos.push({ icono: '📞', texto: 'Se lo hiciste sentir por teléfono' });
    }
    if (llamada.climax === 'oyo') {
      sat += 6;
      motivos.push({ icono: '🔊', texto: 'Se oyó todo al final' });
    }
  }
  if (final === 'parado') sat *= Math.max(0.3, alcanzado / 100);
  if (final === 'visto') {
    sat += 15;
    motivos.push({ icono: '💔', texto: 'Frente a él' });
  }
  const ganado = Math.max(1, Math.round(sat));

  let s: Estado = {
    ...e,
    escena: null,
    pendiente: null,
    sat: e.sat + ganado,
    satCiclo: e.satCiclo + ganado,
    veces: { ...e.veces, [p.id]: (e.veces[p.id] ?? 0) + 1 },
    interes: { ...e.interes, [p.id]: clamp((e.interes[p.id] ?? 0) - 25, 0, 130) },
    rastros: {
      ...e.rastros,
      sabanas: e.rastros.sabanas || lugar.escena === 'cama' || lugar.escena === 'hotel',
      ropa: e.rastros.ropa || rng() < 0.4,
      olor: 70,
    },
  };

  const n = e.nombre;
  let frase: string;
  if (final === 'visto') {
    s.quiebre = clamp(s.quiebre + 12);
    s.sospecha = Math.max(s.sospecha, 85);
    s.tierno = 0;
    s.sabe = [...s.sabe, `Te vio con ${p.nombre}`].slice(-12);
    frase = etapaDe(s) >= 4 ? `${n} no dice nada. Se queda en la puerta hasta que terminan.` : `${n} lo vio todo. Se le quebró la cara.`;
  } else if (final === 'parado') {
    s.sospecha = clamp(s.sospecha + 10 + alcanzado * 0.1);
    s.quiebre = clamp(s.quiebre + 2);
    s.tierno = clamp(s.tierno - 10);
    s.sabe = [...s.sabe, 'Te encontró con la puerta cerrada'].slice(-12);
    frase = `${n} mira el cuarto. Algo no le cuadra, pero no ve a nadie.`;
    if (rng() < 0.35) {
      s.sospecha = clamp(s.sospecha + 8);
      s.sabe = [...s.sabe, 'Creyó ver a alguien escondido'].slice(-12);
      frase = `${n} se queda mirando hacia donde está escondido. No dice nada.`;
    }
  } else {
    frase = plan.cerca ? `${n} estaba a unos metros y no se enteró.` : `${n} no se enteró de nada.`;
    if (rng() < 0.28) {
      s.sospecha = clamp(s.sospecha + 4);
      s.sabe = [...s.sabe, 'Llegaste distinta'].slice(-12);
      frase += ' Pero luego te nota algo distinto.';
    }
  }

  if (llamada) {
    // Lo que él oyó por teléfono pesa aunque no los haya visto.
    if (llamada.verdict === 'sabe') {
      s.sospecha = clamp(s.sospecha + 25);
      s.quiebre = clamp(s.quiebre + 5);
      s.sabe = [...s.sabe, 'Oyó algo raro por teléfono'].slice(-12);
      frase += ` Por teléfono ${n} oyó más de lo que debía.`;
    } else if (llamada.verdict === 'dudas') {
      s.sospecha = clamp(s.sospecha + 8);
      frase += ` Por teléfono le quedó algo sin cuadrar.`;
    }
    s.quiebre = clamp(s.quiebre + llamada.hurt * 0.05);
  }

  s = avanzar(s, final === 'parado' ? 12 : 38);
  const nota = `+${ganado} de satisfacción con ${p.nombre}. ${frase}`;
  s = { ...s, ultima: nota, log: log(s, nota) };
  return { estado: s, ganado, motivos, final, frase };
}
