/**
 * El mundo: lugares, personas y la rutina de él.
 * Todos los personajes son adultos e inventados.
 */

export type Escena = 'cama' | 'bano' | 'sotano' | 'oficina' | 'archivo' | 'gym' | 'vestidor' | 'hotel' | 'bar' | 'coche';

export interface Lugar {
  id: string;
  zona: string;
  nombre: string;
  /** se puede cerrar la puerta */
  privado: boolean;
  escena: Escena;
}

export type Rol = 'hermano' | 'amigo' | 'companero' | 'tuamigo' | 'ex' | 'desconocido';
export type Rasgo = 'timido' | 'ingenuo' | 'culpa' | 'miedo';

/** Un tramo del día: de qué minuto a qué minuto está en qué lugar. */
export interface Tramo {
  de: number;
  a: number;
  lugar: string;
  hace: string;
}

export interface Persona {
  id: string;
  nombre: string;
  rol: Rol;
  /** cómo lo ves antes de conocerlo */
  pista: string;
  rasgo: Rasgo;
  /** cuánto lo quiere o lo respeta él (0 a 1) */
  aprecio: number;
  /** interés que necesita para decirte que sí */
  umbral: number;
  /** tiene casa a la que puedes ir */
  casa: boolean;
  rutina: readonly Tramo[];
  look: Look;
}

export interface Look {
  piel: string;
  pelo: string;
  ropa: string;
  pantalon: string;
  largo?: boolean;
}

export const ZONAS: Record<string, string> = {
  casa: 'Tu casa',
  trabajo: 'Su trabajo',
  gym: 'El gimnasio',
  hotel: 'El hotel',
  coche: 'Tu coche',
};

export const LUGARES_BASE: readonly Lugar[] = [
  { id: 'casa-habitacion', zona: 'casa', nombre: 'Tu habitación', privado: true, escena: 'cama' },
  { id: 'casa-bano', zona: 'casa', nombre: 'Tu baño', privado: true, escena: 'bano' },
  { id: 'casa-sotano', zona: 'casa', nombre: 'El sótano', privado: true, escena: 'sotano' },
  { id: 'trabajo-oficina', zona: 'trabajo', nombre: 'Su oficina', privado: false, escena: 'oficina' },
  { id: 'trabajo-archivo', zona: 'trabajo', nombre: 'El cuarto de archivo', privado: true, escena: 'archivo' },
  { id: 'gym-sala', zona: 'gym', nombre: 'La sala de pesas', privado: false, escena: 'gym' },
  { id: 'gym-vestidor', zona: 'gym', nombre: 'Los vestidores', privado: true, escena: 'vestidor' },
  { id: 'hotel-bar', zona: 'hotel', nombre: 'El bar del hotel', privado: false, escena: 'bar' },
  { id: 'hotel-cuarto', zona: 'hotel', nombre: 'Un cuarto de hotel', privado: true, escena: 'hotel' },
  { id: 'coche', zona: 'coche', nombre: 'Tu coche', privado: true, escena: 'coche' },
];

/** Las casas de los demás: solo el dormitorio y el baño. */
export function lugaresDeCasa(p: Pick<Persona, 'id' | 'nombre'>): Lugar[] {
  return [
    { id: `${p.id}-dormitorio`, zona: `casa-${p.id}`, nombre: `Dormitorio de ${p.nombre}`, privado: true, escena: 'cama' },
    { id: `${p.id}-bano`, zona: `casa-${p.id}`, nombre: `Baño de ${p.nombre}`, privado: true, escena: 'bano' },
  ];
}

/* ---------- personas ---------- */

const look = (piel: string, pelo: string, ropa: string, pantalon: string): Look => ({ piel, pelo, ropa, pantalon });

export const ROL_LABEL: Record<Rol, string> = {
  hermano: 'su hermano',
  amigo: 'su mejor amigo',
  companero: 'su compañero',
  tuamigo: 'tu mejor amigo',
  ex: 'tu ex',
  desconocido: 'desconocido',
};

/** Nombres para él y su círculo; cambian en cada ciclo. */
export const NOMBRES_EL = ['Daniel', 'Tomás', 'Emilio', 'Julián', 'Sergio', 'Pablo', 'Óscar', 'Diego'];
export const NOMBRES_HERMANO = ['Iván', 'Rodrigo', 'Hugo', 'Esteban', 'Lalo', 'Ramiro'];
export const NOMBRES_AMIGO = ['Marco', 'Beto', 'César', 'Kevin', 'Lucas', 'Gabo'];
export const NOMBRES_COMPANERO = ['Rubén', 'Alonso', 'Mauricio', 'Ernesto', 'Iker', 'Samuel'];

/** Su círculo: depende del ciclo porque cada novio trae su gente. */
export function circuloDe(ciclo: number): Persona[] {
  const n = (lista: readonly string[]) => lista[ciclo % lista.length];
  const hermano = n(NOMBRES_HERMANO);
  const amigo = n(NOMBRES_AMIGO);
  return [
    {
      id: 'hermano',
      nombre: hermano,
      rol: 'hermano',
      pista: 'su hermano',
      rasgo: 'culpa',
      aprecio: 0.95,
      umbral: 68,
      casa: true,
      rutina: [
        { de: 0, a: 470, lugar: 'hermano-dormitorio', hace: 'dormido' },
        { de: 1110, a: 1440, lugar: 'hermano-dormitorio', hace: 'solo en su cuarto, con el celular' },
      ],
      look: look('#e3b58e', '#2a1a12', '#3f6f8f', '#2d2d3a'),
    },
    {
      id: 'amigo',
      nombre: amigo,
      rol: 'amigo',
      pista: 'su mejor amigo',
      rasgo: 'miedo',
      aprecio: 0.9,
      umbral: 58,
      casa: true,
      rutina: [
        { de: 0, a: 430, lugar: 'amigo-dormitorio', hace: 'dormido' },
        { de: 1050, a: 1140, lugar: 'gym-sala', hace: 'entrenando con {n}' },
        { de: 1140, a: 1170, lugar: 'gym-vestidor', hace: 'en los vestidores, sin camisa' },
        { de: 1200, a: 1440, lugar: 'amigo-dormitorio', hace: 'en su casa, aburrido' },
      ],
      look: look('#c98f68', '#111', '#8f3f3f', '#22303f'),
    },
    {
      id: 'companero',
      nombre: n(NOMBRES_COMPANERO),
      rol: 'companero',
      pista: 'su compañero de trabajo',
      rasgo: 'timido',
      aprecio: 0.6,
      umbral: 44,
      casa: false,
      rutina: [{ de: 510, a: 1020, lugar: 'trabajo-oficina', hace: 'en su escritorio, junto a {n}' }],
      look: look('#f0c9a5', '#6b4a2b', '#d8d4cc', '#38384a'),
    },
  ];
}

/** Tu gente: no cambia entre ciclos. */
export const TU_GENTE: readonly Persona[] = [
  {
    id: 'tuamigo',
    nombre: 'Leo',
    rol: 'tuamigo',
    pista: 'tu mejor amigo',
    rasgo: 'ingenuo',
    aprecio: 0.45,
    umbral: 36,
    casa: true,
    rutina: [{ de: 600, a: 1440, lugar: 'tuamigo-dormitorio', hace: 'en su casa, jugando videojuegos' }],
    look: look('#f2cfae', '#c9a04a', '#4f8f5f', '#2c2c3c'),
  },
  {
    id: 'ex',
    nombre: 'Andrés',
    rol: 'ex',
    pista: 'tu ex',
    rasgo: 'miedo',
    aprecio: 0.2,
    umbral: 24,
    casa: true,
    rutina: [
      { de: 720, a: 1200, lugar: 'ex-dormitorio', hace: 'en su casa' },
      { de: 1200, a: 1380, lugar: 'hotel-bar', hace: 'tomando algo en la barra' },
    ],
    look: look('#b57a52', '#1c1c1c', '#222', '#1d2a3a'),
  },
];

const D = (id: string, nombre: string, pista: string, rasgo: Rasgo, umbral: number, rutina: Tramo[], l: Look): Persona => ({
  id,
  nombre,
  rol: 'desconocido',
  pista,
  rasgo,
  aprecio: 0,
  umbral,
  casa: false,
  rutina,
  look: l,
});

export const DESCONOCIDOS: readonly Persona[] = [
  D('d1', 'Bruno', 'un chico en la caminadora', 'timido', 30, [{ de: 420, a: 600, lugar: 'gym-sala', hace: 'corriendo en la caminadora' }], look('#e8c09a', '#3a2a1a', '#2f5f8f', '#222')),
  D('d2', 'Saúl', 'un tipo grande en las pesas', 'ingenuo', 26, [{ de: 1050, a: 1260, lugar: 'gym-sala', hace: 'levantando pesas, sudado' }], look('#a8714c', '#111', '#555', '#333')),
  D('d3', 'Nico', 'un chico solo en la barra', 'timido', 34, [{ de: 1140, a: 1440, lugar: 'hotel-bar', hace: 'solo en la barra, mirando su vaso' }], look('#f0d0b0', '#8a5a2a', '#6a3f8f', '#2a2a2a')),
  D('d4', 'Joel', 'un huésped con corbata floja', 'culpa', 40, [{ de: 1200, a: 1440, lugar: 'hotel-bar', hace: 'con la corbata floja y el anillo puesto' }], look('#d9a882', '#444', '#e8e8e8', '#1a1a2a')),
  D('d5', 'Fer', 'el nuevo de la oficina', 'timido', 38, [{ de: 510, a: 1020, lugar: 'trabajo-oficina', hace: 'en el escritorio de enfrente' }], look('#f3d3b3', '#222', '#9fb8d8', '#333')),
  D('d6', 'Raúl', 'un señor que entrena temprano', 'ingenuo', 22, [{ de: 600, a: 780, lugar: 'gym-sala', hace: 'haciendo abdominales' }], look('#c08a62', '#888', '#3f3f3f', '#222')),
  D('d7', 'Mateo', 'un huésped que espera', 'miedo', 36, [{ de: 780, a: 1020, lugar: 'hotel-bar', hace: 'esperando su habitación' }], look('#e0b088', '#5a3a1a', '#8f6f3f', '#2a2a3a')),
  D('d8', 'Tobías', 'el de sistemas', 'timido', 42, [{ de: 540, a: 900, lugar: 'trabajo-archivo', hace: 'ordenando cables en el archivo' }], look('#f5d5b5', '#a05a2a', '#2f4f2f', '#333')),
  D('d9', 'Gael', 'un chico de tatuajes', 'ingenuo', 28, [{ de: 1140, a: 1380, lugar: 'gym-sala', hace: 'estirando junto al espejo' }], look('#b8805a', '#0d0d0d', '#111', '#3a3a3a')),
  D('d10', 'Adrián', 'un viajero con maleta', 'culpa', 32, [{ de: 600, a: 900, lugar: 'hotel-bar', hace: 'tomando café con su maleta al lado' }], look('#e8b890', '#4a2a1a', '#5f7f9f', '#2a2a2a')),
];

export const LOOK_ELLA: Look = { piel: '#f1c7a6', pelo: '#3b1f2b', ropa: '#e0457b', pantalon: '#e0457b', largo: true };
export const LOOK_EL: Look = { piel: '#e9bf9b', pelo: '#2b1d14', ropa: '#4d6fa8', pantalon: '#2a2f3f' };

/* ---------- rutina de él ---------- */

/** Su día normal. `etapa` lo va cambiando: mientras más quebrado, más se le rompe la rutina. */
export function rutinaEl(etapa: number, dia: number): Tramo[] {
  const r: Tramo[] = [
    { de: 0, a: 420, lugar: 'casa-habitacion', hace: 'duerme abrazado a tu almohada' },
    { de: 420, a: 460, lugar: 'casa-bano', hace: 'se baña cantando' },
    { de: 460, a: 500, lugar: 'casa-habitacion', hace: 'se viste y te deja un beso en la frente' },
  ];
  // trabajo
  if (etapa >= 5) {
    r.push({ de: 500, a: 1080, lugar: 'casa-habitacion', hace: 'no fue a trabajar; está acostado mirando el techo' });
  } else {
    const salida = etapa >= 3 ? 900 : 1020;
    r.push({ de: 510, a: salida, lugar: 'trabajo-oficina', hace: etapa >= 3 ? 'trabaja sin ganas, revisa el celular cada minuto' : 'trabaja en su escritorio' });
    if (etapa >= 3) r.push({ de: salida + 20, a: 1080, lugar: 'casa-habitacion', hace: 'salió temprano del trabajo; está en casa, solo' });
  }
  // tarde
  const saltaGym = etapa >= 2 || dia % 4 === 3;
  if (!saltaGym) {
    r.push({ de: 1050, a: 1140, lugar: 'gym-sala', hace: 'entrena con {amigo}' });
    r.push({ de: 1140, a: 1170, lugar: 'gym-vestidor', hace: 'se ducha en los vestidores' });
  } else if (etapa < 3) {
    r.push({ de: 1040, a: 1180, lugar: 'casa-habitacion', hace: 'se saltó el gym; llegó temprano a casa' });
  }
  // noche
  if (dia % 3 === 2 && etapa < 4) {
    r.push({ de: 1200, a: 1290, lugar: 'hotel-bar', hace: 'toma una cerveza con {amigo} en el bar del hotel' });
    r.push({ de: 1310, a: 1440, lugar: 'casa-habitacion', hace: 've series en la cama, esperándote' });
  } else if (etapa >= 4) {
    r.push({ de: 1180, a: 1320, lugar: 'casa-habitacion', hace: 'acostado con la luz apagada, despierto' });
    r.push({ de: 1320, a: 1440, lugar: 'casa-sotano', hace: 'no puede dormir; bajó al sótano a revolver cajas' });
  } else {
    r.push({ de: 1190, a: 1215, lugar: 'casa-sotano', hace: 'baja al sótano a buscar algo' });
    r.push({ de: 1215, a: 1440, lugar: 'casa-habitacion', hace: 've series en la cama, esperándote' });
  }
  return r.sort((a, b) => a.de - b.de);
}

export const ETAPAS = ['Confianza', 'Duda', 'Celos', 'Rabia', 'Tristeza', 'Quiebre'] as const;
export const ETAPA_DESDE = [0, 15, 32, 50, 68, 85] as const;

/* ---------- textos ---------- */

export const T = {
  /** lo que piensa él, por etapa */
  piensa: [
    ['Qué suerte tengo, güey. Con ella todo está chido.', 'Hoy le compro algo. Un chocolate, lo que sea.', 'Me la paso pensando en llegar y abrazarla.', 'Apenas salí y ya la extraño. Qué ridículo.'],
    ['Contestó bien raro… ¿o soy yo?', 'Tardó un chingo en escribir. Seguro anda ocupada.', 'No quiero ser de los celosos, pero algo no me cuadra.', 'Seguro anda cansada. Ya ni le busco.'],
    ['¿Con quién andará ahorita, cabrón?', 'Volví a revisar su última conexión. Otra vez.', 'Me siento bien pendejo, pero no puedo parar.', 'Antes me contaba todo, hasta lo pendejo.'],
    ['No soy tonto. Algo me está escondiendo.', 'Si me miente en esto, ¿en qué no?', 'Quiero putear y no sé a quién.', 'Le di un putazo a la mesa y ni cuenta me di.'],
    ['Ya no me ve como antes. Neta.', 'Me metí al baño del jale a llorar, bien machito.', 'Me hago chiquito para que no se vaya.', 'Solo quiero que me abrace y ya.'],
    ['No sé ni pa’ qué me levanto.', 'Si se va, no queda nada de mí. Nada.', 'Haré lo que sea, lo que sea, con tal de que se quede.', 'Ya ni hambre tengo.'],
  ] as readonly (readonly string[])[],
  /** cuando tú estás haciendo algo a unos metros */
  ironia: [
    'Qué tranquila está la casa. Se oye hasta el refri.',
    'Se oye algo… ¿la lavadora? Seguro la lavadora.',
    'Dijo que estaba cansada. Mejor no la friego.',
    'Le voy a llevar un té. Y unos cacahuates.',
    'Me gusta saber que está cerca, aunque no hablemos.',
  ],
  /** cuando está con alguien que ya estuvo contigo */
  conElOtro: [
    '{p} anda bien raro hoy, ni a los ojos me ve.',
    'Qué chido tener a {p} aquí, es como de la familia.',
    '{p} me preguntó por ella. Bien atento el cabrón.',
    'Le dije a {p} que la amo. Se quedó callado, el muy…',
  ],
  /** lo que pasa delante de él con ese otro (humillación secreta) */
  escenaOtro: [
    '{p} le da una palmada en la espalda. Si supiera dónde estuvo esa mano, güey.',
    '{p} le sonríe y le pregunta por ti. {n} le cuenta lo feliz que es. Bien pendejo.',
    '{n} le pasa su toalla a {p}. Él la agarra sin verlo.',
    '{n} le dice a {p} que eres la mujer de su vida. {p} tose y todo.',
  ],
  tierno: [
    'Me abrazó como antes. Todo chido otra vez.',
    'Soy un pendejo por dudar de ella.',
    'Me ama. Neta que sí. Lo sentí.',
  ],
  pobrecito: [
    'Pobrecito… se cree todo.',
    'Pobrecito, si supiera dónde y cómo estuve.',
    'Me ve con esos ojitos… pobrecito.',
    'Lo beso y todavía traigo otro sabor en la boca.',
    'Qué tierno es. Qué pendejo es.',
  ],
  /** problemas de él, que llegan solos */
  problemas: [
    'Su jefe lo cagó frente a todos.',
    'Se peleó con {amigo} por una tontería.',
    'Le dolió la cabeza todo el santo día.',
    'Su mamá le preguntó si está bien; dijo que sí, el muy machito.',
    'Se le olvidó comer. Otra vez.',
    'No pegó el ojo en toda la noche.',
  ],
  sorpresa: [
    'Te trajo flores sin motivo. Bien cursi el cabrón.',
    'Llegó con tu postre favorito, todo orgulloso.',
    'Apareció sin avisar porque te extrañaba.',
    'Te trajo un collar. Dice que lo vio y pensó en ti.',
  ],
  mensaje: [
    '¿Dónde andas, amor?',
    '¿Qué haces? Te extraño un chingo.',
    '¿Ya vienes o qué?',
    'No contestas… ¿todo bien?',
    '¿Con quién andas?',
  ],
};

/** Reacciones de ellos cuando los seduces, según cómo son. */
export const SEDUCE = {
  conversar: {
    timido: ['Se ríe nervioso y se le traba todo.', 'Te contesta mirándose los tenis.'],
    ingenuo: ['Te cuenta su vida entera sin cachar nada.', 'Cree que nomás eres amable. Sonríe como bobo.'],
    culpa: ['Te habla bonito, pero mete a {n} cada dos frases.', 'Se te acerca y luego se echa para atrás, culo cobarde.'],
    miedo: ['Voltea a todos lados mientras te habla.', 'Baja la voz como si lo estuvieran grabando.'],
  },
  indirecta: {
    timido: ['Le dices que hace calor y te abanicas el escote. Se pone rojo hasta las orejas.', 'Le preguntas si tiene novia. Se atraganta con su propio aire.'],
    ingenuo: ['Le dices que le queda bien la camisa. Tarda como diez segundos en entender.', 'Le dices que a veces te sientes bien sola. Te ofrece compañía, todo inocente.'],
    culpa: ['Le dices que {n} nunca tiene tiempo para ti. Traga saliva y se le nota.', 'Le rozas el brazo. Se queda quieto, sin quitarlo, como estatua.'],
    miedo: ['Le dices al oído que nadie se va a enterar. Le tiembla la mano.', 'Le pides su número «por si acaso». Te lo da sin pensar.'],
  },
  mostrarte: {
    timido: ['Te inclinas para que te vea bien. No sabe ni a dónde mirar.', 'Te acomodas el tirante despacio. El güey deja de respirar.'],
    ingenuo: ['Te estiras enfrente de él. Se queda con la boca abierta, literal.', 'Te subes la falda al sentarte. Se le cae el celular.'],
    culpa: ['Le dejas ver más de la cuenta. Cierra los ojos un segundo y los vuelve a abrir.', 'Te mira las piernas y luego su pantalla, donde está la foto de {n}.'],
    miedo: ['Le enseñas nomás tantito. Le da miedo y aun así no se va.', 'Te muerdes el labio mirándolo. Se pone blanco y rojo al mismo tiempo.'],
  },
  si: {
    timido: ['Asiente sin poder hablar, bien pinche nervioso.', 'Dice que sí con un hilo de voz.'],
    ingenuo: ['«¿En serio? ¿Yo?» Dice que sí antes de pensarlo.', 'Dice que sí con una sonrisa de oreja a oreja.'],
    culpa: ['«{n} es como mi hermano…» Te mira la boca. Y dice que sí.', '«Esto está mal.» Y ya te agarró de la cintura.'],
    miedo: ['«¿Y si se entera?» Pero ya te tomó de la mano.', 'Dice que sí, temblando como perro en año nuevo.'],
  },
  no: {
    timido: ['Se pone tan nervioso que se va, casi corriendo.', 'Dice que no puede, y se le nota en la cara que quiere.'],
    ingenuo: ['Cree que le estás jugando y se ríe.', 'No cacha. Te ofrece llevarte a tu casa.'],
    culpa: ['«No puedo hacerle eso a {n}…» Pero no te suelta la mirada ni de broma.', 'Se aleja, rojo de culpa, con la cola entre las patas.'],
    miedo: ['«Aquí no, güey. Cualquiera nos ve.»', 'Le da un pinche pánico y se inventa algo para irse.'],
  },
} as const;

/** Lo que pasa cuando te acuestas con alguien. Explícito y coloquial. */
export const ENCUENTRO = {
  inicio: [
    'Cierras la puerta. {p} no sabe ni por dónde empezar, así que empiezas tú.',
    'Le bajas la camisa y se la quitas. Le tiemblan las manos como gelatina.',
    'Lo avientas contra la pared y lo besas. Se le olvida hasta su nombre.',
    'Le metes la mano por debajo de la playera y él suelta un jadeo.',
  ],
  cerca: [
    '{n} está a unos metros. Te tapas la boca para no gemir tan fuerte.',
    'Oyes la voz de {n} del otro lado y se te aprieta todo. Cabrón.',
    '{n} está tan cerca que podrías decirle algo. No le dices ni madres.',
    'Sabes que {n} anda ahí. Por eso te mojas más.',
  ],
  tierno: [
    'Todavía traes su «te amo» en la pantalla del teléfono.',
    'Llevas puesta la ropa que él te regaló hoy. Y te la está quitando otro.',
  ],
  aprecio: [
    'Es {r}. Eso lo hace mil veces mejor.',
    'Piensas en la cara de {n} si supiera que es {r}.',
  ],
  fin: [
    'Acabas temblando, con la frente pegada a su pecho.',
    'Te quedas sin aire. {p} no puede creer lo que acaba de pasar.',
    'Terminas mordiéndote el labio para no gritar su nombre.',
    'Acabas con las piernas temblando y él todavía adentro.',
  ],
};

export const RASTROS = {
  sabanas: 'Las sábanas huelen a otro. A culo y a güey',
  ropa: 'Su ropa interior quedó tirada en el piso',
  olor: 'Hueles a otro perfume',
};