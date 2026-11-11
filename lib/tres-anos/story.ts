export type NodeId = 'n1' | 'n2' | 'n3' | 'n4' | 'n5';
export type Pov = 'tu' | 'ella';

export interface Meters {
  /** confianza, sospecha y humillación de ella (0 a 10) */
  c: number;
  s: number;
  h: number;
}

export interface Bubble {
  who: 'in' | 'out';
  t: string;
}

export interface Choice {
  label: string;
  d?: Partial<Meters>;
  flag?: string;
  /** mensaje que mandas desde el teléfono */
  out?: string;
  /** lo que ella va a recordar */
  log?: string;
  /** reacción que se muestra en la escena siguiente */
  re?: string;
  /** botón de continuar, en lugar de una decisión */
  go?: boolean;
}

export interface StoryNode {
  pov: Pov;
  time: string;
  title: string;
  phone?: boolean;
  incoming?: readonly string[];
  text: (state: StoryState) => string[];
  choices: readonly Choice[];
  next: NodeId | 'end';
}

export interface StoryState {
  node: NodeId | 'end';
  m: Meters;
  flags: Record<string, boolean>;
  log: string[];
  reaction: string;
  chat: Bubble[];
  /** cuántos mensajes de la lista son nuevos */
  fresh: number;
}

const clamp10 = (n: number): number => Math.max(0, Math.min(10, n));

function apply(m: Meters, d?: Partial<Meters>): void {
  if (!d) return;
  m.c = clamp10(m.c + (d.c ?? 0));
  m.s = clamp10(m.s + (d.s ?? 0));
  m.h = clamp10(m.h + (d.h ?? 0));
}

export const NODES: Record<NodeId, StoryNode> = {
  n1: {
    pov: 'tu',
    time: 'Jueves · 21:40',
    title: 'La cena',
    phone: true,
    text: () => [
      'Llegas cuarenta minutos tarde. El departamento huele a ajo y a vino tinto, y la mesa tiene el mantel que solo sale del cajón un par de veces al año.',
      'Mariana trae puesto un vestido verde. Te sirve sin preguntar por qué llegaste tarde y se sienta frente a ti.',
      'Apenas levantas el tenedor, tu teléfono vibra contra la madera.',
    ],
    choices: [
      {
        label: 'Voltear el teléfono boca abajo y seguir cenando',
        d: { s: 1 },
        log: 'Volteaste el teléfono para que no viera la pantalla.',
        re: 'Lo volteas sin leer. Mariana sigue el movimiento con los ojos, un segundo nada más, y vuelve a su plato.',
      },
      {
        label: 'Contestar ahí mismo, en la mesa',
        d: { s: 2, h: 1 },
        out: 'Ya llegué. Yo también.',
        log: 'Sonreíste al teléfono mientras ella te servía.',
        re: 'Escribes con una mano. No te das cuenta de que estás sonriendo hasta que levantas la vista. Mariana ya está viendo hacia otro lado, con la copa detenida a medio camino.',
      },
      {
        label: 'Decir «es del trabajo» y salir a contestar al balcón',
        d: { s: 1, c: -1, h: 1 },
        out: 'Ya llegué. Yo también.',
        log: 'La dejaste sola en la mesa para contestar afuera.',
        re: 'Cierras la puerta corrediza detrás de ti. Desde afuera la ves a través del vidrio: sentada derecha, sola frente a dos platos, esperando para empezar.',
      },
    ],
    next: 'n2',
  },
  n2: {
    pov: 'tu',
    time: 'Jueves · 21:52',
    title: 'La pregunta',
    text: () => [
      '—¿Quién era? —pregunta Mariana.',
      'No lo dice con reclamo. Lo dice como quien pregunta la hora.',
    ],
    choices: [
      {
        label: 'Mentir: «Rodrigo, por el reporte de mañana»',
        flag: 'lied',
        log: 'Le dijiste que era Rodrigo.',
        re: '—Ah —dice—. Pobre Rodrigo, a estas horas. Te cree. O decide creerte, que desde donde estás sentado se ve igual.',
      },
      {
        label: 'Voltearlo contra ella: «¿Ahora me vas a revisar el teléfono?»',
        d: { h: 2, c: -1 },
        flag: 'mock',
        log: 'Se disculpó contigo por haber preguntado.',
        re: 'Mariana parpadea. —No, perdón. Nada más preguntaba. La que se disculpa es ella. Acomoda su servilleta, que no estaba desacomodada.',
      },
      {
        label: 'Media verdad: «Valeria, de la oficina. Nada importante»',
        d: { s: 2 },
        flag: 'named',
        log: 'Escuchó el nombre de Valeria por primera vez.',
        re: '—Valeria —repite despacio, como si se probara el nombre—. No me habías hablado de ella. —No hay nada que hablar. Asiente. El nombre se queda en la mesa, junto al pan.',
      },
    ],
    next: 'n3',
  },
  n3: {
    pov: 'tu',
    time: 'Jueves · 22:05',
    title: 'La pasta',
    text: () => [
      'Mariana gira su plato un poco hacia ti.',
      '—¿Te acuerdas de esta? Es la pasta del lugar de la calle Sexta. La de la primera vez.',
      'Hace una pausa. —Hoy son tres años.',
    ],
    choices: [
      {
        label: 'Admitirlo: «Se me pasó. Perdón»',
        d: { c: -1, h: 1 },
        log: 'Olvidaste el aniversario y ella te inventó la excusa.',
        re: '—No pasa nada —dice rápido, demasiado rápido—. Tuviste un día pesado. Te inventa la excusa ella sola, para que no tengas que inventarla tú.',
      },
      {
        label: 'Fingir: «Claro que sé. Por eso quise llegar temprano»',
        d: { h: 1, s: 1, c: -1 },
        log: 'Dijiste que llegaste temprano. Ella había visto el reloj.',
        re: 'Llegaste cuarenta minutos tarde y los dos lo saben. Mariana sonríe de todos modos. Es una sonrisa chiquita y bien educada, la que usa con la gente que no conoce.',
      },
      {
        label: 'Decir «está muy rica» sin despegar los ojos de la pantalla',
        d: { h: 2, c: -1 },
        log: 'La felicitaste por la cena sin voltear a verla.',
        re: '—Gracias —dice. Espera un momento a que levantes la cara. No la levantas. Empieza a comer en silencio, con bocados pequeños, como una invitada en su propia mesa.',
      },
    ],
    next: 'n4',
  },
  n4: {
    pov: 'tu',
    time: 'Jueves · 22:20',
    title: 'La pantalla',
    phone: true,
    incoming: ['¿Mañana comemos otra vez? Yo invito 😉'],
    text: () => [
      'El teléfono vuelve a vibrar. Esta vez se desliza unos centímetros sobre el mantel, hacia el lado de Mariana, y la pantalla le queda más cerca a ella que a ti.',
    ],
    choices: [
      {
        label: 'No moverte. Dejar que lo lea',
        d: { h: 2, s: 3 },
        flag: 'saw',
        log: 'Leyó el mensaje de Valeria y te devolvió el teléfono.',
        re: 'No estiras la mano. Mariana baja la vista y la deja ahí lo que se tarda en leer una línea corta. Luego empuja el teléfono hacia ti con dos dedos, con cuidado, como se devuelve algo ajeno. —Te buscan —dice.',
      },
      {
        label: 'Agarrarlo rápido y guardarlo en la bolsa',
        d: { s: 2, h: 1 },
        log: 'Escondiste el teléfono tan rápido que tembló la copa.',
        re: 'Lo alcanzas antes que su mirada, o eso crees. El movimiento te sale más brusco de lo que querías y tu copa tiembla. —Tranquilo —dice Mariana—. No lo iba a tocar.',
      },
      {
        label: 'Contestar que sí, frente a ella',
        d: { h: 3, s: 3, c: -1 },
        flag: 'saw',
        out: 'Sí. Mismo lugar.',
        log: 'Aceptaste la comida con Valeria frente a ella.',
        re: 'Escribes la respuesta con el teléfono todavía sobre la mesa, a la vista. Mariana lee de cabeza; siempre ha sido buena para eso. Dobla su servilleta en cuatro, luego en ocho. —¿Quieres postre? —pregunta—. Hice.',
      },
    ],
    next: 'n5',
  },
  n5: {
    pov: 'ella',
    time: 'Jueves · 23:10',
    title: 'Mariana',
    text: (state) => {
      const { flags: f, m } = state;
      const p = [
        'Lava los platos ella. Tú dijiste que estabas cansado y ella dijo que sí, que claro.',
        'El vestido verde lo compró hace dos semanas. Se lo probó tres veces frente al espejo antes de decidirse. Con las manos en el agua caliente se da cuenta de que no dijiste nada sobre él.',
      ];
      if (f.lied)
        p.push(
          'Rodrigo salió de vacaciones el lunes. Ella misma le dio like a la foto de la playa. No sabe qué le pesa más: que le mientas, o que te parezca tan fácil engañarla.',
        );
      if (f.mock)
        p.push('«Perdón», te dijo. Repasa la palabra y no encuentra de qué se disculpó. Aun así sabe que la próxima vez no va a preguntar.');
      if (f.named) p.push('Valeria. Lo dice sin voz, moviendo apenas la boca. Ahora ya tiene nombre, y eso es peor que no saber.');
      if (f.saw)
        p.push(
          '«Otra vez». El mensaje decía otra vez. Hace la cuenta de las veces que comiste «con el equipo» este mes y deja de contar en la cuarta.',
        );
      else p.push('No alcanzó a leer nada. Lo que sí vio fue tu mano, lo rápido que se movió. Nadie cuida así un mensaje del trabajo.');
      if (m.h >= 7)
        p.push('El postre sigue en el refrigerador, intacto. Mañana lo va a tirar antes de que despiertes, para que nadie tenga que mencionarlo.');
      else if (m.h >= 4) p.push('Guarda el mantel en su cajón, bien doblado. Se tarda más de lo necesario.');
      else p.push('Apaga la luz de la cocina y se queda un momento ahí, a oscuras, decidiendo que seguro no fue nada.');
      return p;
    },
    choices: [{ label: 'Ver lo que dejó la noche', go: true }],
    next: 'end',
  },
};

export function freshStory(): StoryState {
  return {
    node: 'n1',
    m: { c: 8, s: 1, h: 0 },
    flags: {},
    log: [],
    reaction: '',
    chat: [
      { who: 'in', t: '¿Ya llegaste a tu casa?' },
      { who: 'in', t: 'Sigo pensando en lo del elevador.' },
    ],
    fresh: 2,
  };
}

/** Valida y completa lo guardado en localStorage. */
export function reviveStory(raw: unknown): StoryState | null {
  if (!raw || typeof raw !== 'object') return null;
  const saved = raw as Partial<StoryState>;
  if (!saved.node || !saved.m) return null;
  if (saved.node !== 'end' && !(saved.node in NODES)) return null;
  return { ...freshStory(), ...saved };
}

/** Aplica una decisión y devuelve el estado nuevo. */
export function choose(prev: StoryState, choice: Choice): StoryState {
  if (prev.node === 'end') return prev;
  const node = NODES[prev.node];

  const s: StoryState = {
    ...prev,
    m: { ...prev.m },
    flags: { ...prev.flags },
    log: [...prev.log],
    chat: [...prev.chat],
  };
  apply(s.m, choice.d);
  if (choice.flag) s.flags[choice.flag] = true;
  if (choice.log) s.log.push(choice.log);
  if (choice.out) s.chat.push({ who: 'out', t: choice.out });
  s.reaction = choice.re ?? '';
  s.fresh = 0;
  s.node = node.next;

  const next = s.node === 'end' ? null : NODES[s.node];
  if (next?.incoming) {
    next.incoming.forEach((t) => s.chat.push({ who: 'in', t }));
    s.fresh = next.incoming.length;
  }
  // Mentir pesa: al llegar a la escena de ella, el costo se cobra.
  if (s.node === 'n5' && s.flags.lied) apply(s.m, { c: -2, s: 2, h: 1 });
  return s;
}

export interface Ending {
  verdict: string;
  meters: Array<{ name: string; value: number; note: string }>;
}

export function ending(m: Meters): Ending {
  let verdict: string;
  if (m.h >= 7 && m.s >= 7) verdict = 'Mariana ya sabe. Lo que todavía no decide es qué va a hacer con eso.';
  else if (m.s >= 6) verdict = 'Mariana sospecha. Va a empezar a fijarse en cosas que antes dejaba pasar.';
  else if (m.h >= 5) verdict = 'Mariana no sospecha de nadie. Solo se siente más chica que ayer.';
  else verdict = 'Mariana se convenció de que fue un mal día. Por ahora.';

  return {
    verdict,
    meters: [
      {
        name: 'Confianza',
        value: m.c,
        note: m.c >= 7 ? 'Todavía te cree casi todo.' : m.c >= 4 ? 'Te cree, pero ya revisa lo que dices.' : 'Lo que le digas mañana lo va a comparar con lo de hoy.',
      },
      {
        name: 'Sospecha',
        value: m.s,
        note: m.s >= 7 ? 'Ya no se pregunta si pasa algo. Se pregunta desde cuándo.' : m.s >= 4 ? 'Algo no le cuadra y no lo suelta.' : 'Una duda chica, fácil de callar.',
      },
      {
        name: 'Humillación',
        value: m.h,
        note: m.h >= 7 ? 'Se sintió de sobra en su propia cena.' : m.h >= 4 ? 'Se quedó con la sensación de haber hecho el ridículo.' : 'Un piquete que casi no nota.',
      },
    ],
  };
}
