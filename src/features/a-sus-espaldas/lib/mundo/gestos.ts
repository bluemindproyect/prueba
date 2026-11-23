/**
 * Gestos de las caras. Cada gesto es una combinación de parámetros (cejas, ojos, boca y
 * detalles) que el componente Rostro dibuja. Todos los personajes son adultos e inventados.
 */

export type Quien = 'el' | 'ella' | 'otro';
export type Extra = 'rubor' | 'ruborFuerte' | 'sudor' | 'lagrima' | 'llanto' | 'venas' | 'ojeras' | 'palido' | 'brillo' | 'dientes';

export interface Gesto {
  id: string;
  nombre: string;
  quien: Quien;
  /** inclinación de las cejas: -1 tristes, 0 neutras, 1 enojadas */
  a: number;
  /** altura de las cejas: -1 bajas, 1 altas */
  h: number;
  /** ceja derecha más alta (+) o más baja (-) que la izquierda */
  as: number;
  /** apertura de los ojos: 0 cerrados, 1 normal, 1.5 muy abiertos */
  abre: number;
  /** hacia dónde miran */
  mx: number;
  my: number;
  /** 0 normal, 1 feliz (arco), 2 cerrado (arco hacia abajo), 3 entrecerrados */
  forma: 0 | 1 | 2 | 3;
  /** sonrisa: -1 triste, 0 recta, 1 sonrisa */
  k: number;
  /** boca abierta: 0 cerrada, 1 muy abierta */
  open: number;
  /** ancho de la boca */
  w: number;
  /** comisura derecha más alta (+) o más baja (-) */
  lado: number;
  extras: readonly Extra[];
}

const X: Record<string, Extra> = { r: 'rubor', R: 'ruborFuerte', s: 'sudor', l: 'lagrima', L: 'llanto', v: 'venas', o: 'ojeras', p: 'palido', b: 'brillo', d: 'dientes' };

// id|nombre|a|h|as|abre|mx|my|forma|k|open|w|lado|extras
const SPEC: Record<Quien, string[]> = {
  el: [
    // confianza
    'sereno|Sereno|0|0|0|1|0|0|0|.15|0|1|0|',
    'feliz|Feliz|0|.3|0|1|0|0|1|.9|.3|1.1|0|r',
    'risa|Risa|0|.4|0|1|0|0|1|1|.8|1.2|0|r',
    'ternura|Ternura|-.3|.2|0|1|0|0|0|.6|0|1|0|rb',
    'orgulloso|Orgulloso|.1|.4|0|.9|0|-.3|0|.4|0|.9|.6|',
    'enamorado|Enamorado|-.2|.5|0|1.1|0|0|0|.7|.1|1|0|rb',
    'relajado|Relajado|0|-.2|0|.7|0|.2|3|.3|0|1|0|',
    'bromista|Bromista|.3|.5|.4|1|0|0|0|.7|.2|1.1|.7|',
    // duda
    'curioso|Curioso|0|.5|0|1.1|.3|-.3|0|.1|0|.8|.3|',
    'extrañado|Extrañado|.2|.3|0|1|.2|0|0|-.1|0|.9|-.3|',
    'cejaalzada|Ceja alzada|0|.2|.9|1|0|0|0|0|0|.9|.4|',
    'pensativo|Pensativo|0|.1|0|.8|.4|-.5|0|0|0|.7|.3|',
    'inquieto|Inquieto|-.3|.4|0|1.1|-.3|0|0|-.1|0|.9|0|s',
    'distraido|Distraído|0|0|0|.9|-.6|-.2|0|.05|0|.9|0|',
    'sospechosoleve|Sospecha leve|.3|-.1|.5|.8|.2|0|0|-.15|0|.9|-.2|',
    'confundido|Confundido|-.1|.4|-.5|1.1|0|0|0|-.2|.15|.8|-.3|',
    // celos
    'receloso|Receloso|.5|-.2|0|.7|.3|0|3|-.2|0|.9|-.2|o',
    'miradafija|Mirada fija|.6|-.3|0|.9|0|0|0|-.05|0|.8|0|o',
    'tenso|Tenso|.4|.1|0|1|0|0|0|-.2|0|.8|0|s',
    'mandibula|Mandíbula apretada|.7|-.2|0|.8|0|0|3|-.3|0|.9|0|oR',
    'forzando|Forzando la sonrisa|-.2|.3|0|1|0|0|0|.5|0|1|.5|s',
    'ojeroso|Ojeroso|-.1|0|0|.7|0|.3|0|-.3|0|.9|0|op',
    'ansioso|Ansioso|-.3|.4|0|1.2|-.2|0|0|-.2|.1|.8|0|s',
    'vigilante|Vigilante|.4|0|0|1.1|.4|-.1|0|-.05|0|.8|0|o',
    // rabia
    'furioso|Furioso|1|-.4|0|.8|0|0|3|-.6|.5|1.1|0|Rvd',
    'gruñendo|Gruñendo|.9|-.3|0|.7|0|0|3|-.5|.6|1.2|0|Rd',
    'rojo|Rojo de rabia|.8|-.2|0|.9|0|0|0|-.4|.1|1|0|R',
    'gritando|Gritando|.9|-.1|0|1|0|0|0|-.3|1|1.1|0|Rd',
    'desden|Desdén|.4|0|.6|.7|.5|.2|3|-.3|0|.9|-.6|',
    'ceño|Ceño fruncido|1|-.5|0|.9|0|0|0|-.3|0|.9|0|',
    'venas|Venas marcadas|.8|-.2|0|1|0|0|0|-.4|.2|1|0|Rv',
    'contenido|Rabia contenida|.7|-.1|0|.8|0|.1|3|-.1|0|.8|0|o',
    // tristeza
    'triste|Triste|-.7|.1|0|1|0|.3|0|-.5|0|.9|0|',
    'vidrioso|Ojos vidriosos|-.8|.2|0|1.2|0|.2|0|-.4|0|.9|0|lb',
    'lloriqueo|Lloriqueo|-.9|.2|0|1|0|.4|0|-.7|.2|1|0|l',
    'abatido|Abatido|-.4|-.4|0|.7|0|.6|3|-.4|0|.9|0|o',
    'decepcionado|Decepcionado|-.3|0|0|.9|0|.5|0|-.3|0|.8|-.2|',
    'suplica|Suplicante|-.9|.5|0|1.3|0|0|0|-.4|.1|.8|0|lb',
    'cansado|Cansado|-.2|-.3|0|.6|0|.4|3|-.2|0|.9|0|op',
    'resignado|Resignado|-.4|-.1|0|.8|0|.5|0|-.1|0|.8|0|',
    'vacio|Mirada vacía|0|-.2|0|.9|0|0|0|-.05|0|.8|0|op',
    // quiebre
    'llanto|Llanto|-.8|.1|0|.5|0|.3|2|-.7|.6|1|0|Lr',
    'sollozo|Sollozo|-.9|.2|0|.3|0|.3|2|-.8|.8|1.1|0|Lr',
    'devastado|Devastado|-.7|-.1|0|.5|0|.5|2|-.6|.3|1|0|Lp',
    'ausente|Ausente|0|-.4|0|.5|.5|.6|3|-.2|0|.8|0|opl',
    'rota|Voz rota|-1|.3|0|.7|0|.2|0|-.6|.5|.9|0|L',
    'histerico|Histérico|-.5|.5|0|1.4|0|0|0|-.4|1|1.2|0|LRs',
    'derrumbado|Derrumbado|-.6|-.5|0|.4|0|.7|2|-.5|.2|1|0|Lpo',
    'calmahueca|Calma hueca|0|-.3|0|.8|0|.1|0|.1|0|.9|.3|opl',
    'suplicafinal|Ruega que te quedes|-1|.6|0|1.3|0|0|0|-.6|.4|1|0|Lb',
  ],
  ella: [
    'neutra|Neutra|0|0|0|1|0|0|0|.1|0|1|0|',
    'dulce|Sonrisa dulce|-.2|.3|0|1|0|0|0|.7|0|1|0|r',
    'ternurafingida|Ternura fingida|-.4|.4|0|1.1|0|0|0|.6|0|1|.3|rb',
    'culpaella|Culpa|-.6|.2|0|1|-.3|.2|0|-.2|0|.9|0|r',
    'placersuave|Placer suave|-.3|.1|0|.6|0|0|2|.5|.14|1|0|rb',
    'placerfuerte|Placer fuerte|-.4|.3|0|.3|0|0|2|.2|.5|1.05|0|Rs',
    'labio|Mordiéndose el labio|-.2|.3|0|.95|0|.35|0|.3|0|.7|.2|r',
    'ojoscerrados|Ojos cerrados|-.3|0|0|0|0|0|2|.3|.2|1|0|r',
    'deseoella|Deseo tierno|-.2|.3|0|.95|0|.1|0|.5|.05|.9|0|rb',
    'orgasmo|Orgasmo|-.6|.5|0|.2|0|0|2|.2|1|1.2|0|Rs',
    'risacontenida|Risa contenida|0|.3|0|1|0|0|1|.7|0|.8|.4|r',
    'burla|Pícara|.1|.4|.3|1|.2|0|0|.6|.1|.9|.3|r',
    'nervios|Nervios|-.3|.5|0|1.2|-.3|0|0|-.1|0|.8|0|s',
    'cinica|Pensativa|0|.2|.3|1|.3|-.2|0|.2|0|.9|0|',
    'angustia|Angustia|-.8|.4|0|1.2|0|.1|0|-.4|.2|.9|0|ls',
    'pobrecitoella|Pobrecito (excitada)|-.35|.2|0|.95|0|.2|0|.4|.12|.9|.1|rb',
    'calculadora|Serena|0|.1|0|1|0|0|0|.3|.05|.9|.1|',
    'seduccion|Coqueta|.1|.4|.3|1|.2|0|0|.55|.05|.9|.4|r',
    'sorpresaella|Sorpresa|-.1|.8|0|1.4|0|0|0|0|.4|.7|0|',
    'esfuerzo|Esfuerzo|-.5|.1|0|.55|0|0|3|-.1|.25|1.05|0|Rs',
    'jadeo|Jadeando|-.35|.3|0|.45|0|.1|3|.1|.55|1|0|Rs',
    'sudorosa|Sonrisa sudorosa|-.15|.3|0|.8|0|0|1|.8|.2|1.05|0|rsb',
    'aguanta|Aguantando|-.7|.1|0|.35|0|0|2|-.3|.15|.9|0|Rsd',
    'gemido|Gemido|-.55|.5|0|.25|0|0|2|.15|.65|1|0|Rsb',
    'agotada|Agotada|-.3|-.2|0|.4|0|.3|3|.2|.3|1|0|Rs',
    'entregadaella|Entregada|-.45|.4|0|.3|0|.2|2|.45|.3|1.05|.1|Rsb',
    'sedienta|Con ganas|-.1|.3|0|.7|0|.3|3|.5|.2|1|.2|Rsb',
    'tiemblo|Temblando|-.6|.5|0|.5|0|0|2|-.1|.4|.95|0|Rs',
    'alivio|Alivio feliz|-.2|.3|0|.15|0|0|2|.9|.35|1.1|0|rsb',
    'victoria|Feliz|0|.4|0|1|0|0|1|.9|.3|1|0|r',
  ],
  otro: [
    'timido|Tímido|-.2|.1|0|1|-.2|.4|0|.3|0|.8|0|R',
    'ingenuo|Ingenuo|0|.4|0|1.1|0|0|0|.7|.1|1|0|r',
    'culpaotro|Con culpa|-.6|.1|0|1|-.4|.3|0|-.2|0|.9|0|r',
    'miedo|Con miedo|-.5|.8|0|1.5|0|0|0|-.1|.3|.7|0|s',
    'deseootro|Deseo|-.1|0|0|.8|0|0|3|.4|.15|1|0|R',
    'nervioso|Nervioso|-.3|.4|0|1.2|.3|0|0|.1|0|.8|.2|s',
    'sorprendido|Sorprendido|0|.9|0|1.4|0|0|0|.1|.5|.8|0|',
    'avergonzado|Avergonzado|-.4|.1|0|.8|-.5|.5|0|.1|0|.8|0|R',
    'ansiosootro|Ansioso|-.3|.5|0|1.1|.2|-.2|0|-.1|.1|.8|0|s',
    'embobado|Embobado|-.1|.4|0|1.1|0|0|0|.5|.2|1|0|rb',
    'dudoso|Dudoso|.1|.2|.7|1|.3|0|0|-.1|0|.8|-.3|',
    'rendido|Rendido|-.2|-.1|0|.7|0|.3|3|.3|.1|1|0|R',
  ],
};

const n = (s: string): number => Number(s);

function parse(quien: Quien, row: string): Gesto {
  const [id, nombre, a, h, as, abre, mx, my, forma, k, open, w, lado, ex] = row.split('|');
  return {
    id,
    nombre,
    quien,
    a: n(a),
    h: n(h),
    as: n(as),
    abre: n(abre),
    mx: n(mx),
    my: n(my),
    forma: n(forma) as Gesto['forma'],
    k: n(k),
    open: n(open),
    w: n(w),
    lado: n(lado),
    extras: [...(ex ?? '')].map((c) => X[c]).filter(Boolean),
  };
}

export const GESTOS: readonly Gesto[] = (Object.keys(SPEC) as Quien[]).flatMap((q) => SPEC[q].map((r) => parse(q, r)));

export const gestosDe = (quien: Quien): readonly Gesto[] => GESTOS.filter((g) => g.quien === quien);
export const gestoPorId = (id: string): Gesto | undefined => GESTOS.find((g) => g.id === id);

/** Etapa de él (0 a 5) → gestos que le tocan, en orden de menos a más intenso. */
export const GESTOS_EL_POR_ETAPA: readonly (readonly string[])[] = [
  ['sereno', 'feliz', 'risa', 'ternura', 'orgulloso', 'enamorado', 'relajado', 'bromista'],
  ['curioso', 'extrañado', 'cejaalzada', 'pensativo', 'inquieto', 'distraido', 'sospechosoleve', 'confundido'],
  ['receloso', 'miradafija', 'tenso', 'mandibula', 'forzando', 'ojeroso', 'ansioso', 'vigilante'],
  ['furioso', 'gruñendo', 'rojo', 'gritando', 'desden', 'ceño', 'venas', 'contenido'],
  ['triste', 'vidrioso', 'lloriqueo', 'abatido', 'decepcionado', 'suplica', 'cansado', 'resignado', 'vacio'],
  ['llanto', 'sollozo', 'devastado', 'ausente', 'rota', 'histerico', 'derrumbado', 'calmahueca', 'suplicafinal'],
];

/** Escoge el gesto de él según su etapa y cuánta tensión tiene dentro de ella (0 a 100). */
export function gestoDeEl(etapa: number, tension: number, azar: () => number = Math.random): Gesto {
  const lista = GESTOS_EL_POR_ETAPA[Math.max(0, Math.min(5, etapa))];
  const i = Math.min(lista.length - 1, Math.floor((tension / 101) * lista.length + azar() * 1.5));
  return gestoPorId(lista[i]) ?? GESTOS[0];
}
