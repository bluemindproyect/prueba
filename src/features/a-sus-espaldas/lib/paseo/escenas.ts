import type { Ritmo } from '../minijuegos/llamada2';

/**
 * Lo que se ve y se dice en la intimidad. Sube con la excitación del teléfono (tramo 0 a 3) y
 * cambia con el ritmo que eliges. Frases cortas, en segunda persona, desde ella.
 */

export type Rng = () => number;
export type Tramo = 0 | 1 | 2 | 3;

const LINEAS: Record<Tramo, Record<Ritmo, readonly string[]>> = {
  0: {
    lento: [
      'Cierras la puerta y te le pegas sin decir nada.',
      'Le bajas la camisa por los hombros, besando lo que va quedando al aire.',
      'Le tomas la cara con las dos manos y lo besas largo, sin prisa.',
      'Le desabrochas el pantalón con los dedos torpes.',
      'Él te desata el top y se queda mirando, como si no le alcanzara.',
    ],
    firme: [
      'Cierras la puerta. Se besan sin hablar.',
      'Le quitas la camisa y la tiras a un lado.',
      'Te empuja contra la pared y te levanta una pierna.',
      'Le muerdes el cuello; él suelta un gemido bajo.',
      'Te quita el top y te aprieta contra su pecho.',
    ],
    rapido: [
      'Cierras la puerta y ya están encima el uno del otro.',
      'Se arrancan la ropa a tirones.',
      'Te sienta en el borde de la cama y te besa el vientre.',
      'Te desnuda rápido, sin cuidado, respirando fuerte.',
      'Le bajas el pantalón de un tirón.',
    ],
  },
  1: {
    lento: [
      'Ya sin ropa, se recorren despacio, piel contra piel.',
      'Él te besa el pecho y te sostiene la espalda para que no te vayas.',
      'Le pasas la mano por todo el torso, midiéndolo.',
      'Se acuesta y te sube encima, con calma.',
      'Entra despacio y los dos se quedan quietos un segundo.',
    ],
    firme: [
      'Le quitas el pantalón y él te quita lo último que te queda.',
      'Se tocan sin ropa, sin disimulo.',
      'Te abre las piernas con la rodilla y se acomoda encima.',
      'Entra de una vez y tú arqueas la espalda.',
      'Cada embestida te saca un suspiro.',
    ],
    rapido: [
      'Ya no queda ropa en el suelo y no se dan tiempo de nada.',
      'Te voltea y te toma de la cadera.',
      'Entra hondo desde el primer empujón.',
      'La cama golpea la pared.',
      'Se oyen los dos, sin cuidarse.',
    ],
  },
  2: {
    lento: [
      'Se mueven despacio pero hondo, mirándose.',
      'Él te sostiene la mirada cada vez que empuja.',
      'Te dice algo al oído y tú cierras los ojos.',
      'Le clavas las uñas en la espalda y él no se queja.',
      'Se detiene dentro un momento, respirando en tu cuello.',
    ],
    firme: [
      'El ritmo ya no es amable: la cama se queja.',
      'Le pides más y él te toma con las dos manos de la cadera.',
      'Te da fuerte, con la frente pegada a la tuya.',
      'Ya no besas, solo respiras en su boca.',
      'Se turnan: él arriba, tú buscando su boca.',
    ],
    rapido: [
      'Ya solo se oye piel y respiración cortada.',
      'Le empujas tú también, buscando el ritmo.',
      'Él te levanta de la cintura y no afloja.',
      'Se te escapa un gemido largo y no lo tapas.',
      'Los dos están sudados y no quieren parar.',
    ],
  },
  3: {
    lento: [
      'Nadie afloja. Los dos saben cómo va a terminar.',
      'Le tiemblan las piernas; no se detiene.',
      'Te quedas sin aire y él lo nota.',
      'Se miran como si se debieran algo.',
      'Un último empujón lento y todo se aprieta.',
    ],
    firme: [
      'Estás a punto y él lo siente en tu cuerpo.',
      'Te aferras a sus hombros, ya sin uñas.',
      'Te lo pide al oído: «ya».',
      'Se le rompe el ritmo y los dos se apuran.',
      'Empuja más hondo, dos, tres veces.',
    ],
    rapido: [
      'Ya casi, y los dos lo saben.',
      'El ritmo se vuelve irregular y desesperado.',
      'Se te corta la voz en mitad de un gemido.',
      'Él aguanta la respiración.',
      'Un último empujón y los dos se quiebran.',
    ],
  },
};

/** Cuando él anda cerca (la misma casa, el mismo hotel) y no se entera. */
const CERCA: readonly string[] = [
  'A unos metros, él sigue con el teléfono en la oreja.',
  'Él está cerca. Te tapas la boca para no oírte.',
  'Se oye su voz del otro lado. Eso te enciende más.',
  'Si abriera esa puerta ahora mismo…',
];

/** El final: llega solo cuando el termómetro se llena. */
export const CLIMAX: readonly string[] = [
  'Se quedan abrazados, sin aire.',
  'Nadie dice nada. Solo se oyen las respiraciones.',
  'Se quedan así, pegados, sin soltarse.',
  'Los dos tiemblan y se ríen bajito.',
];

const pick = <T,>(l: readonly T[], rng: Rng): T => l[Math.floor(rng() * l.length) % l.length];

/** Una línea del tramo y el ritmo actuales. `evitar` es la que ya está en pantalla. */
// `_escena` queda para variar las líneas según el lugar.
export function lineaDe(tramo: Tramo, ritmo: Ritmo, rng: Rng = Math.random, evitar = '', _escena?: unknown): string {
  if (rng() < 0.22) {
    const cerca = pick(CERCA, rng);
    if (cerca !== evitar) return cerca;
  }
  const lista = LINEAS[tramo][ritmo];
  let t = pick(lista, rng);
  if (t === evitar) t = pick(lista, rng);
  return t;
}

export const climaxDe = (rng: Rng = Math.random): string => pick(CLIMAX, rng);

/** Cuánta ropa queda: se va sola con la excitación. */
export type RopaEscena = 'bikini' | 'topFuera' | 'desnuda';
export const ropaDe = (tramo: Tramo): RopaEscena => (tramo === 0 ? 'bikini' : tramo === 1 ? 'topFuera' : 'desnuda');