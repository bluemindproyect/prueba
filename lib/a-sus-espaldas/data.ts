import type { Act, Mode, Target } from './types';

/** Satisfacción mínima para cada nivel (el índice + 1 es el nivel). */
export const LEVELS: readonly number[] = [0, 30, 80, 160, 280, 450, 700];

export const MODES: readonly Mode[] = [
  { id: 'ausente', label: 'No está', sub: 'sin riesgo' },
  { id: 'cerca', label: 'Está cerca', sub: 'puede verte' },
  { id: 'frente', label: 'Frente a él', sub: 'lo ve todo' },
];

export const TARGETS: readonly Target[] = [
  { id: 'desc', label: 'Un desconocido', tag: 'desconocido', t: 'un desconocido', ms: 1, mh: 1 },
  { id: 'vecino', label: 'El vecino', tag: 'vecino', t: 'el vecino', ms: 1.1, mh: 1.2 },
  {
    id: 'ex',
    label: 'Tu ex',
    tag: 'tu ex',
    t: 'tu ex',
    ms: 1.2,
    mh: 1.3,
    th: ['Con mi ex. El único nombre que me pidió no volver a mencionar.'],
  },
  { id: 'comp', label: 'Su compañero', tag: 'compañero', t: 'su compañero de trabajo', ms: 1.15, mh: 1.2 },
  { id: 'jefe', label: 'Su jefe', tag: 'su jefe', t: 'su jefe', ms: 1.3, mh: 1.4 },
  {
    id: 'amigo',
    label: 'Su mejor amigo',
    tag: 'mejor amigo',
    t: 'su mejor amigo',
    ms: 1.4,
    mh: 1.6,
    th: ['Su mejor amigo. El mismo que le dice que confíe en mí.'],
  },
  {
    id: 'hermano',
    label: 'Su hermano',
    tag: 'su hermano',
    t: 'su hermano',
    ms: 1.6,
    mh: 1.8,
    th: ['Su propio hermano. Y el domingo hay comida familiar.'],
  },
];

const RAW_ACTS: readonly Act[] = [
  { id: 'msg', lvl: 1, label: 'Mandarle mensajes', txt: 'Le mandas mensajes a {t}', sat: 3, hum: 2, risk: 5,
    det: 'Empiezan con un «hola» y terminan con cosas que borras antes de dormir.' },
  { id: 'coq', lvl: 1, label: 'Coquetear', txt: 'Coqueteas con {t}', sat: 4, hum: 3, risk: 5,
    det: 'Te ríes de más, le tocas el brazo, dejas que se acerque. Los dos saben a dónde va eso.' },
  { id: 'mano', lvl: 1, label: 'Tomarle la mano bajo la mesa', txt: 'Le tomas la mano a {t} por debajo de la mesa', sat: 5, hum: 4, risk: 10,
    det: 'Entrelazan los dedos y arriba de la mesa nadie cambia la cara.' },
  { id: 'bail', lvl: 2, label: 'Bailar muy cerca', txt: 'Bailas muy cerca de {t}', sat: 7, hum: 6, risk: 15,
    det: 'La canción dura cuatro minutos y sus manos no se quedan en tu cintura.' },
  { id: 'fotos', lvl: 2, label: 'Mandarle fotos tuyas', txt: 'Le mandas fotos tuyas a {t}', sat: 8, hum: 7, risk: 15,
    det: 'No son fotos que le enseñarías a nadie más. Te contesta en diez segundos.' },
  { id: 'beso', lvl: 2, label: 'Besar', txt: 'Besas a {t}', sat: 9, hum: 8, risk: 20,
    det: 'Empieza corto. No termina corto.' },
  { id: 'cuello', lvl: 2, label: 'Dejar que te bese el cuello', txt: 'Dejas que {t} te bese el cuello', sat: 10, hum: 9, risk: 25,
    det: 'Te deja una marca chiquita que mañana vas a tener que tapar.' },
  { id: 'besol', lvl: 3, label: 'Besar largo, sin prisa', txt: 'Besas a {t} largo, sin prisa', sat: 12, hum: 11, risk: 30,
    det: 'Cuando se separan te falta el aire y tienes su sabor en la boca.' },
  { id: 'cuarto', lvl: 3, label: 'Encerrarte en otro cuarto', txt: 'Te encierras con {t} en otro cuarto', sat: 14, hum: 13, risk: 35, priv: true,
    det: 'Ponen el seguro. Sales veinte minutos después, acomodándote la ropa y el pelo.' },
  { id: 'carro', lvl: 3, label: 'Escaparte a su carro', txt: 'Te escapas al carro de {t}', sat: 15, hum: 14, risk: 35, priv: true,
    det: 'Los vidrios se empañan. Regresas con la ropa mal abotonada.' },
  { id: 'acost', lvl: 3, label: 'Acostarte con el otro', txt: 'Te acuestas con {t}', sat: 16, hum: 15, risk: 40, priv: true,
    det: 'Pasa todo lo que tenía que pasar. Te vistes despacio, sin culpa.' },
  { id: 'perf', lvl: 4, label: 'Volver con su perfume encima', txt: 'Vuelves a casa con el perfume de {t} encima', sat: 15, hum: 12, risk: 40,
    det: 'No te bañas antes de llegar. El olor de otra persona entra contigo a la casa.' },
  { id: 'noche', lvl: 4, label: 'Pasar la noche fuera', txt: 'Pasas la noche con {t}', sat: 18, hum: 16, risk: 45, priv: true,
    det: 'No duermen mucho. Regresas en la mañana con la misma ropa de ayer.' },
  { id: 'sucarro', lvl: 4, label: 'Usar el carro de tu pareja', txt: 'Te llevas a {t} en el carro de {n}', sat: 19, hum: 18, risk: 45, priv: true,
    det: 'Dejas el asiento echado para atrás y no lo regresas a su lugar.' },
  { id: 'cama', lvl: 4, label: 'Hacerlo en la cama de ustedes', txt: 'Llevas a {t} a la cama que compartes con {n}', sat: 20, hum: 19, risk: 50, priv: true,
    det: 'Después tiendes la cama igual que siempre. Esa noche {n} duerme de ese lado.' },
  { id: 'cita', lvl: 5, label: 'Presentarlo como tu cita', txt: 'Presentas a {t} como tu cita', sat: 22, hum: 20, risk: 60,
    det: 'Lo traes del brazo toda la noche y a nadie le queda duda de con quién te vas a ir.' },
  { id: 'llamada', lvl: 5, label: 'Contestarle estando con el otro', txt: 'Le contestas la llamada a {n} mientras estás con {t}', sat: 24, hum: 21, risk: 60, priv: true,
    det: 'Le dices «te quiero» con la respiración todavía agitada y una mano ajena en la cintura.' },
  { id: 'espera', lvl: 5, label: 'Irte y pedirle que espere', txt: 'Te vas con {t} y le pides a {n} que te espere', sat: 25, hum: 22, risk: 65, priv: true,
    det: 'Vuelves dos horas después, con el pelo revuelto y sin dar explicaciones.' },
  { id: 'finde', lvl: 5, label: 'Irte de fin de semana', txt: 'Te vas de fin de semana con {t}', sat: 26, hum: 23, risk: 65, priv: true,
    det: 'Dos noches de hotel. Apagas el teléfono desde el viernes y casi no salen del cuarto.' },
  { id: 'voz', lvl: 5, label: 'Hacerlo sin bajar la voz', txt: 'Te encierras con {t} y no te molestas en ser discreta', sat: 28, hum: 26, risk: 75, priv: true,
    det: 'Se escucha todo lo que se tiene que escuchar.' },
  { id: 'dos', lvl: 6, label: 'Estar con dos la misma noche', txt: 'Pasas la noche con {t} y con alguien más', sat: 32, hum: 28, risk: 75, priv: true,
    det: 'No preguntas el nombre del segundo. Amaneces sin saber de quién es la camisa que traes puesta.' },
  { id: 'chofer', lvl: 6, label: 'Que él te lleve y te recoja', txt: 'Le pides a {n} que te lleve con {t} y pase por ti después', sat: 34, hum: 32, risk: 80, priv: true,
    det: 'Espera en el carro con el motor apagado. Sales una hora más tarde, sin prisa.' },
  { id: 'contar', lvl: 6, label: 'Contárselo todo, con detalles', txt: 'Le cuentas a {n} todo lo que hiciste con {t}', sat: 36, hum: 34, risk: 85,
    det: 'Con quién, dónde y cuántas veces. No lo dejas voltear la cara mientras escucha.' },
  { id: 'cuartoprep', lvl: 7, label: 'Que él les prepare el cuarto', txt: 'Le pides a {n} que les prepare el cuarto a ti y a {t}', sat: 42, hum: 40, risk: 90, priv: true,
    det: 'Cambia las sábanas y cierra la puerta al salir. Tú le pones el seguro.' },
  { id: 'mudar', lvl: 7, label: 'Meter al otro a vivir a la casa', txt: 'Metes a {t} a vivir a la casa', sat: 46, hum: 44, risk: 90, priv: true,
    det: 'Ahora {n} duerme en el sillón. Desde ahí se escucha todo, todas las noches.' },
];

/** Ordenadas por nivel y, dentro del nivel, por satisfacción. */
export const ACTS: readonly Act[] = [...RAW_ACTS].sort((a, b) => a.lvl - b.lvl || a.sat - b.sat);

export const STATES: readonly string[] = ['Tranquilo', 'Incómodo', 'Inseguro', 'Disminuido', 'Quebrado'];

/** Reacciones de él cuando está presente, según su estado (0 a 4). */
export const REACT: readonly (readonly string[])[] = [
  [
    '{n} se ríe, seguro de que es una broma. La risa le dura menos que a los demás.',
    '{n} frunce el ceño. —¿Qué fue eso? —pregunta, todavía convencido de que hay una explicación.',
  ],
  [
    '{n} se pone de pie y luego no sabe qué hacer con las manos. Se vuelve a sentar.',
    '—Ya estuvo, ¿no? —dice {n}, intentando sonar firme. La voz le sale más baja de lo que quería.',
  ],
  [
    '{n} mira alrededor para ver quién más lo vio. Todos lo vieron. Baja la cabeza y finge revisar su teléfono.',
    '{n} abre la boca para decir algo y la cierra. Se le ponen rojas las orejas.',
  ],
  [
    '{n} ya no pregunta. Se queda donde está, con los hombros caídos, esperando a que termines.',
    '{n} te sostiene la mirada dos segundos. El que la baja primero es él.',
  ],
  [
    '{n} se hace a un lado para dejarles espacio. Nadie se lo pidió.',
    '—¿Necesitas algo? —pregunta {n} en voz baja cuando terminas. Ya ni intenta parecer molesto.',
  ],
];

export type ThoughtKind = 'ausente' | 'ok' | 'visto' | 'frente' | 'combo';

export const THOUGHTS: Record<ThoughtKind, readonly string[]> = {
  ausente: [
    'Dios, si supiera…',
    'Y él ahorita creyendo que estoy pensando en él.',
    'Al rato le contesto «te extraño» como si nada.',
    'Qué fácil es.',
  ],
  ok: [
    'Tan cerca y no ve nada.',
    'Si voltea ahorita, se acaba todo. No voltea.',
    'Otra vez me salí con la mía.',
    'Está a tres metros. Tres.',
  ],
  visto: [
    'Vio algo. Mejor, que se quede con la duda.',
    'A ver qué se atreve a preguntar.',
    'Que piense lo que quiera. No tiene pruebas.',
  ],
  frente: [
    'Míralo. No va a hacer nada.',
    'Quería ver su cara. Valió la pena.',
    'Cada vez aguanta más. O cada vez puede menos.',
    'Y todavía me va a llevar a la casa.',
  ],
  combo: ['Y todavía quiero más.', 'No pienso parar aquí.', 'Una más. Nadie me está contando.'],
};
