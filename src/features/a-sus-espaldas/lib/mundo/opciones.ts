import { leerPublico, nubeDisponible } from '@/lib/supabase/rest';

/** Una opción del menú de seducir (viene de la tabla `opciones_accion`). */
export interface OpcionAccion {
  id: string;
  tipo: 'conversar' | 'insinuar';
  menu: string;
  opcion: string;
  frase: string;
  herramienta: string[];
  efecto_persona?: string;
}

/** Menús en el orden que se muestran. `riesgo`: se bloquea o es más arriesgado si hay gente cerca. */
export const MENUS: { id: string; icono: 'chat' | 'fuego' | 'oreja' | 'mascara' | 'rayo' | 'grito'; riesgo: 'libre' | 'riesgo' | 'bloqueado' }[] = [
  { id: 'Conversación normal', icono: 'chat', riesgo: 'libre' },
  { id: 'Insinuaciones', icono: 'fuego', riesgo: 'riesgo' },
  { id: 'Susurrarle al oído', icono: 'oreja', riesgo: 'riesgo' },
  { id: 'Mentirle', icono: 'mascara', riesgo: 'libre' },
  { id: 'Ofenderlo', icono: 'rayo', riesgo: 'bloqueado' },
  { id: 'Gritarle', icono: 'grito', riesgo: 'bloqueado' },
];

/** Por si no hay internet o la tabla está vacía: unas pocas para que el juego nunca quede mudo. */
export const RESPALDO: OpcionAccion[] = [
  { id: 'r1', tipo: 'conversar', menu: 'Conversación normal', opcion: 'Preguntarle cómo está', frase: '¿Cómo has estado? Se te nota algo.', herramienta: ['cerca', 'telefono'] },
  { id: 'r2', tipo: 'conversar', menu: 'Conversación normal', opcion: 'Hablar de su día', frase: '¿Qué hiciste hoy? Cuéntame.', herramienta: ['cerca', 'telefono'] },
  { id: 'r3', tipo: 'insinuar', menu: 'Insinuaciones', opcion: 'Mirarlo un segundo de más', frase: 'Te quedas mirándome, ¿sabes?', herramienta: ['cerca'] },
  { id: 'r4', tipo: 'insinuar', menu: 'Insinuaciones', opcion: 'Rozarle la mano', frase: 'Uy, perdona. Qué manos tan cálidas.', herramienta: ['cerca'] },
  { id: 'r5', tipo: 'conversar', menu: 'Susurrarle al oído', opcion: 'Decirle un secreto', frase: 'Ven, te digo algo que nadie sabe.', herramienta: ['cerca'] },
  { id: 'r6', tipo: 'conversar', menu: 'Mentirle', opcion: 'Una mentira pequeña', frase: 'Yo no dije nada de eso, lo juro.', herramienta: ['cerca', 'telefono'] },
  { id: 'r7', tipo: 'conversar', menu: 'Ofenderlo', opcion: 'Decirle que es aburrido', frase: 'Eres tan predecible.', herramienta: ['cerca'] },
  { id: 'r8', tipo: 'conversar', menu: 'Gritarle', opcion: 'Reclamarle', frase: '¡Ya basta, déjame en paz!', herramienta: ['cerca'] },
];

let memoria: OpcionAccion[] | null = null;

/** Lee las opciones de la base de datos (sin iniciar sesión). Si algo falla, usa el respaldo. */
export async function cargarOpciones(): Promise<OpcionAccion[]> {
  if (memoria) return memoria;
  if (!nubeDisponible) return RESPALDO;
  try {
    const filas = await leerPublico<OpcionAccion>('opciones_accion', 'id,tipo,menu,opcion,frase,herramienta,efecto_persona', 'activo=eq.true&juego=eq.a-sus-espaldas&order=menu,opcion');
    memoria = filas.length ? filas : RESPALDO;
  } catch {
    memoria = RESPALDO;
  }
  return memoria;
}

/** Gestos de cercanía. Nivel 1: abrazos. Nivel 2: abrazo y beso (se abre con más interés). */
export const GESTOS_CERCANIA: { id: string; nombre: string; nivel: 1 | 2; pos: 'lado' | 'frente'; texto: string }[] = [
  { id: 'abrazo-lado', nombre: 'Abrazo de lado', nivel: 1, pos: 'lado', texto: 'Lo abrazas de lado, apoyando la cabeza en su hombro.' },
  { id: 'abrazo-frente', nombre: 'Abrazo de frente', nivel: 1, pos: 'frente', texto: 'Lo abrazas de frente, fuerte y sin prisa.' },
  { id: 'mano', nombre: 'Tomar su mano', nivel: 1, pos: 'lado', texto: 'Le tomas la mano. Él se queda quieto.' },
  { id: 'cabeza', nombre: 'Apoyar la cabeza', nivel: 1, pos: 'lado', texto: 'Apoyas la cabeza en su pecho.' },
  { id: 'beso-mejilla', nombre: 'Beso en la mejilla', nivel: 2, pos: 'lado', texto: 'Le das un beso lento en la mejilla.' },
  { id: 'beso-suave', nombre: 'Beso suave', nivel: 2, pos: 'frente', texto: 'Lo besas despacio, casi sin tocarlo.' },
  { id: 'beso-largo', nombre: 'Beso largo', nivel: 2, pos: 'frente', texto: 'Lo besas largo. Se olvida de dónde está.' },
  { id: 'caricia', nombre: 'Caricia en la cara', nivel: 2, pos: 'frente', texto: 'Le acaricias la cara con el pulgar.' },
];

export const RESPUESTA_RASGO: Record<string, string[]> = {
  timido: ['Eh… sí, claro.', 'Me… me pones nervioso.'],
  ingenuo: ['¡Jaja, qué bueno!', 'No lo había pensado así.'],
  culpa: ['Mejor no hablemos de eso…', 'No deberíamos.'],
  miedo: ['Sí, sí… como digas.', 'Baja la voz, por favor.'],
};
