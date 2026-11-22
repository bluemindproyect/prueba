import type { Act, Mood, Mode, Target } from './types';

/** Satisfacción mínima para cada nivel (el índice + 1 es el nivel). */
export const LEVELS: readonly number[] = [0, 30, 80, 160, 280, 450, 700, 1000, 1450, 2000];

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

/* ---------- las 100 acciones ---------- */

const BASE_SAT = [3, 8, 13, 18, 24, 32, 42, 54, 68, 85];
const BASE_RISK = [5, 14, 26, 36, 48, 60, 70, 78, 84, 88];

interface Flags {
  /** puerta cerrada */
  p?: boolean;
  /** él participa sin saber */
  e?: boolean;
  /** lo que le queda sin cuadrar */
  clue?: string;
}

/** [id, nombre del botón, frase de lo que haces, lo que pasó dado a entender, marcas] */
type Item = [id: string, label: string, txt: string, det: string, flags?: Flags];

function level(lvl: number, items: readonly Item[]): Act[] {
  return items.map(([id, label, txt, det, flags], i) => {
    // Dentro de cada nivel, las últimas valen más y arriesgan más.
    const d = items.length > 1 ? (i / (items.length - 1)) * 3 - 1 : 0;
    const base = BASE_SAT[lvl - 1];
    const sat = Math.max(1, Math.round(base + d * Math.max(1, base * 0.12)));
    return {
      id,
      lvl,
      label,
      txt,
      det,
      sat,
      hum: Math.round(sat * 0.9),
      risk: Math.max(3, Math.min(92, Math.round(BASE_RISK[lvl - 1] + d * 3))),
      priv: flags?.p,
      withHim: flags?.e,
      clue: flags?.clue,
    };
  });
}

const RAW_ACTS: readonly Act[] = [
  ...level(1, [
    ['msg', 'Mandarle mensajes', 'Le mandas mensajes a {t}',
      'Empiezan con un «hola» y terminan con cosas que borras antes de dormir.'],
    ['mirar', 'Mirarlo de más', 'Miras a {t} más de lo que deberías',
      'Sostienes la mirada un segundo de más y {t} no la aparta.'],
    ['copa', 'Aceptar que te invite una copa', 'Aceptas que {t} te invite una copa',
      'Brindan por nada en particular y la copa se vuelve dos.'],
    ['num', 'Pedirle su número', 'Le pides su número a {t}',
      'Lo guardas con el nombre de una tienda. Mañana vas a escribirle.'],
    ['coq', 'Coquetear', 'Coqueteas con {t}',
      'Te ríes de más, le tocas el brazo, dejas que se acerque. Los dos saben a dónde va eso.'],
    ['mano', 'Tomarle la mano bajo la mesa', 'Le tomas la mano a {t} por debajo de la mesa',
      'Entrelazan los dedos y arriba de la mesa nadie cambia la cara.'],
  ]),
  ...level(2, [
    ['audios', 'Mandarle audios de noche', 'Le mandas audios de noche a {t}',
      'Susurras con el volumen bajo, en el baño, con la llave del agua abierta.',
      { clue: 'el agua del baño corriendo a las dos de la mañana' }],
    ['excusa', 'Inventar una excusa para verlo a solas', 'Inventas una excusa para ver a {t} a solas',
      'Dices que vas por algo a la tienda. Vuelves una hora después, con la bolsa y la sonrisa.',
      { clue: 'una salida «de un momento» que duró una hora' }],
    ['fotos', 'Mandarle fotos tuyas', 'Le mandas fotos tuyas a {t}',
      'No son fotos que le enseñarías a nadie más. Te contesta en diez segundos.'],
    ['bail', 'Bailar muy cerca', 'Bailas muy cerca de {t}',
      'La canción dura cuatro minutos y sus manos no se quedan en tu cintura.'],
    ['piernas', 'Sentarte en sus piernas', 'Te sientas en las piernas de {t}',
      'Nadie dice nada. Todos fingen que esa silla estaba ocupada.'],
    ['beso', 'Besar', 'Besas a {t}',
      'Empieza corto. No termina corto.'],
    ['cuello', 'Dejar que te bese el cuello', 'Dejas que {t} te bese el cuello',
      'Te deja una marca chiquita que mañana vas a tener que tapar.',
      { clue: 'la marca en el cuello' }],
  ]),
  ...level(3, [
    ['borrar', 'Borrar el chat antes de que lo vea', 'Borras el chat con {t} antes de que {n} lo vea',
      'Lo borras y vuelves a abrir la app para estar seguro. Ya no queda ni el «escribiendo…».',
      { clue: 'un chat que se vació de golpe' }],
    ['atrev', 'Mandarle fotos más atrevidas', 'Le mandas fotos más atrevidas a {t}',
      'Ya no es nada que se pueda explicar. Pones el teléfono boca abajo para no ver la respuesta.',
      { clue: 'el teléfono siempre boca abajo' }],
    ['besol', 'Besar largo, sin prisa', 'Besas a {t} largo, sin prisa',
      'Cuando se separan te falta el aire y tienes su sabor en la boca.'],
    ['bano', 'Besarlo en el baño de la fiesta', 'Besas a {t} en el baño de la fiesta',
      'Alguien toca la puerta dos veces. Se ríen sin hacer ruido y esperan a que se vaya.', { p: true }],
    ['vid', 'Videollamada a escondidas', 'Te conectas por videollamada con {t} a escondidas',
      'Te pones los audífonos y bajas el brillo. Terminas con las mejillas calientes y el teléfono tibio.',
      { p: true, clue: 'los audífonos puestos a media noche' }],
    ['cuarto', 'Encerrarte en otro cuarto', 'Te encierras con {t} en otro cuarto',
      'Ponen el seguro. Sales veinte minutos después, acomodándote la ropa y el pelo.', { p: true }],
    ['carro', 'Escaparte a su carro', 'Te escapas al carro de {t}',
      'Los vidrios se empañan. Regresas con la ropa mal abotonada.', { p: true }],
    ['acost', 'Acostarte con el otro', 'Te acuestas con {t}',
      'Pasa todo lo que tenía que pasar. Te vistes despacio, sin culpa.', { p: true }],
  ]),
  ...level(4, [
    ['marca', 'Llegar con una marca que no puedes tapar', 'Llegas con una marca que no puedes tapar',
      'Te acomodas el cuello de la camisa en el elevador. Sigue ahí, color ciruela.',
      { clue: 'una marca que no se tapa' }],
    ['perf', 'Volver con su perfume encima', 'Vuelves a casa con el perfume de {t} encima',
      'No te bañas antes de llegar. El olor de otra persona entra contigo a la casa.',
      { clue: 'un perfume que no es de ustedes' }],
    ['casa', 'Meter al otro a tu casa mientras él no está', 'Metes a {t} a la casa mientras {n} no está',
      'Le enseñas todos los cuartos y no se quedan en ninguno mucho tiempo. Antes de irse, acomodas los cojines.',
      { p: true, clue: 'los cojines acomodados distinto' }],
    ['oficina', 'Hacerlo en la oficina', 'Te quedas con {t} a solas en la oficina',
      'Las luces del pasillo se apagan solas. Las del escritorio, no.', { p: true }],
    ['familia', 'Hacerlo en la casa de su familia', 'Te escapas con {t} en la casa de la familia de {n}',
      'Hay una comida abajo y ustedes arriba. Bajas con el plato en la mano y cara de que no pasó nada.',
      { p: true, e: true }],
    ['noche', 'Pasar la noche fuera', 'Pasas la noche con {t}',
      'No duermen mucho. Regresas en la mañana con la misma ropa de ayer.',
      { p: true, clue: 'la misma ropa de ayer' }],
    ['sucarro', 'Usar el carro de tu pareja', 'Te llevas a {t} en el carro de {n}',
      'Dejas el asiento echado para atrás y no lo regresas a su lugar.',
      { p: true, clue: 'el asiento del carro movido' }],
    ['cama', 'Hacerlo en la cama de ustedes', 'Llevas a {t} a la cama que compartes con {n}',
      'Después tiendes la cama igual que siempre. Esa noche {n} duerme de ese lado.', { p: true }],
    ['tres', 'Verse tres noches seguidas con el mismo', 'Ves a {t} tres noches seguidas',
      'La tercera ya no inventas excusa. Nadie la pide.',
      { p: true, clue: 'tres noches seguidas sin planes claros' }],
    ['amanecer', 'Quedarte con el otro hasta el amanecer', 'Te quedas con {t} hasta el amanecer',
      'Ves la luz entrar por la cortina. Llegas a casa cuando {n} ya se levantó, con una historia lista.',
      { p: true, clue: 'llegar cuando ya amanecía' }],
  ]),
  ...level(5, [
    ['buenas', 'Mandarle «buenas noches» desde la cama del otro', 'Le mandas «buenas noches» a {n} desde la cama de {t}',
      'Pones un corazón. Él responde con tres.'],
    ['cenar', 'Volver a casa y cenar con él como si nada', 'Vuelves a casa y cenas con {n} como si nada',
      'Te pregunta cómo estuvo tu día. Cuentas la mitad, la mejor.', { e: true }],
    ['cita', 'Presentarlo como tu pareja ante gente que no conoce a él', 'Presentas a {t} como tu pareja ante gente que no conoce a {n}',
      'Lo traes del brazo toda la noche y a nadie le queda duda de con quién te vas a ir.'],
    ['hotel', 'Pagar el hotel con su dinero', 'Pagas el hotel con el dinero de {n}',
      'Aparece en el estado de cuenta como «servicios». Nadie va a preguntar.',
      { p: true, clue: 'un cargo que no reconoce' }],
    ['semana', 'Estar con alguien distinto cada semana', 'Esta semana estás con {t}. La anterior fue otro nombre',
      'Ya no recuerdas quién toma el café sin azúcar. Da igual.', { p: true }],
    ['cumple', 'Hacerlo en su cumpleaños', 'Te acuestas con {t} el día del cumpleaños de {n}',
      'Llegas a la cena con una caja de pastel y una sonrisa. Nadie nota el reloj que miras.', { p: true }],
    ['llamada', 'Contestarle estando con el otro', 'Le contestas la llamada a {n} mientras estás con {t}',
      'Le dices «te quiero» con la respiración todavía agitada y una mano ajena en la cintura.', { p: true }],
    ['espera', 'Irte con el otro y decirle que vuelves en un rato', 'Te vas con {t} y le dices a {n} que vuelves en un rato',
      'Vuelves dos horas después, con el pelo revuelto y sin dar explicaciones.', { p: true, e: true }],
    ['fiesta', 'Hacerlo en la fiesta mientras él está en la sala', 'Te escabulles con {t} mientras {n} sigue en la sala con los invitados',
      'Vuelves con una copa en la mano. Te pregunta dónde andabas. Dices «hablando con gente».',
      { p: true, e: true, clue: 'una desaparición de media hora en la fiesta' }],
    ['lado', 'Hacerlo en el cuarto de al lado mientras él duerme', 'Te acuestas con {t} en el cuarto de al lado mientras {n} duerme',
      'Hablan en voz baja. Cuando vuelves a la cama, la sábana sigue fría de tu lado.',
      { p: true, e: true, clue: 'tu lado de la cama frío' }],
    ['finde', 'Irte de fin de semana', 'Te vas de fin de semana con {t}',
      'Dos noches de hotel. Apagas el teléfono desde el viernes y casi no salen del cuarto.',
      { p: true, clue: 'un fin de semana con el teléfono apagado' }],
    ['voz', 'Hacerlo sin bajar la voz', 'Te encierras con {t} y no te molestas en guardar silencio',
      'Se escucha todo lo que se tiene que escuchar.', { p: true }],
  ]),
  ...level(6, [
    ['extrano', 'Mandarle un «te extraño» desde el hotel', 'Le mandas un «te extraño» a {n} desde el hotel',
      'Lo escribes con el pelo mojado. Él responde con un audio diciendo que ya quiere que llegues.'],
    ['mentira', 'Contarle una mentira tan buena que te lo agradece', 'Le cuentas a {n} una mentira tan buena que te lo agradece',
      'Te da las gracias por tu sinceridad. Tú le sirves más café.', { e: true }],
    ['excusa2', 'Hacer que él mismo te dé la excusa', 'Haces que {n} mismo te dé la excusa para salir',
      'Le dices que tal vez no puedes ir a su cena. «Ve, no te preocupes», dice. Ya habías reservado.', { e: true }],
    ['desayuno', 'Que el otro se quede a desayunar como «compañero de trabajo»', 'Dejas que {t} se quede a desayunar y lo presentas como compañero de trabajo',
      'Él le sirve el café y le pregunta por el trabajo. {t} responde sin mirarte.', { e: true }],
    ['tarde', 'Estar con uno por la tarde y con otro por la noche', 'Ves a {t} por la tarde y a otra persona por la noche',
      'Entre una y otra te das una ducha larga. El agua no se lleva el itinerario.', { p: true }],
    ['puerta', 'Hacerlo con la puerta apenas cerrada mientras él está en la casa', 'Te acuestas con {t} con la puerta apenas cerrada mientras {n} está en la casa',
      'Se escucha la tele al fondo, un volumen más bajo que el de ustedes.',
      { p: true, e: true, clue: 'ruidos que creyó oír' }],
    ['dos', 'Estar con dos la misma noche', 'Pasas la noche con {t} y con alguien más',
      'No preguntas el nombre del segundo. Amaneces sin saber de quién es la camisa que traes puesta.',
      { p: true, clue: 'una camisa que no es tuya' }],
    ['pareja', 'Estar con una pareja que te invitó', 'Pasas la noche con una pareja que te invitó',
      'Brindan antes y después. A la mañana siguiente nadie dice «anoche».', { p: true }],
    ['camadis', 'Llevar a dos a la cama de ustedes', 'Llevas a {t} y a alguien más a la cama de ustedes',
      'Cuando se van, quitas las sábanas antes de que {n} vuelva. No cambias el olor del cuarto.',
      { p: true, clue: 'un olor raro en el cuarto' }],
    ['abajo', 'Estar con dos mientras él te espera abajo', 'Estás con {t} y con alguien más mientras {n} te espera abajo',
      'Tarda el elevador. Cuando bajas, él te abre la puerta del carro y pregunta si cenaron bien.',
      { p: true, e: true }],
    ['chofer', 'Que él te lleve y te recoja sin saber a dónde', 'Le pides a {n} que te lleve con {t} y pase por ti después',
      'Espera en el carro con el motor apagado, convencido de que es una junta. Sales una hora más tarde, sin prisa.',
      { p: true, e: true }],
    ['amigoherm', 'Estar con su mejor amigo y su hermano la misma noche', 'Pasas la noche con su mejor amigo y con su hermano',
      'Esta vez no hay mensajes cruzados. Los dos saben del otro y ninguno dice una palabra.', { p: true }],
    ['finde2', 'Pasar el fin de semana con dos', 'Te vas de fin de semana con {t} y con alguien más',
      'La reserva está a un solo nombre. Las llaves, a tres.',
      { p: true, clue: 'un fin de semana sin saber dónde estabas' }],
  ]),
  ...level(7, [
    ['desayuno2', 'Que le lleve el desayuno al otro pensando que es un invitado', 'Dejas que {n} le lleve el desayuno a {t}',
      'Toca la puerta con la charola, pensando que atiende a un invitado. Le agradecen con voz de no haber dormido.',
      { e: true }],
    ['foto', 'Que les tome una foto juntos', 'Haces que {n} les tome una foto a ti y a {t}',
      'Les pide que se acerquen más para que quepan. Después dice: «Quedaron muy bien».', { e: true }],
    ['puerta2', 'Que le abra la puerta al otro y lo salude', 'Haces que {n} le abra la puerta a {t} y lo salude',
      'Lo recibe con un abrazo. «Pasa, estás en tu casa».', { e: true }],
    ['carro2', 'Que le preste su carro al otro', 'Le pides a {n} que le preste su carro a {t}',
      'Le da las llaves y le explica cómo se atora la palanca. «Cuídalo, ¿sí?»', { e: true }],
    ['cuenta', 'Que pague la cuenta de la noche sin saber de quién es', 'Haces que {n} pague la cuenta de la noche sin saber de quién es',
      'Mira el ticket dos veces. «Mucho vino para dos», dice, y paga.', { e: true }],
    ['presenta', 'Que te presente a alguien sin saber para qué', 'Haces que {n} te presente a un amigo suyo',
      'Le habla bien de ti. Esa misma semana, su amigo ya tiene tu número.', { e: true }],
    ['vecino', 'Que oiga ruidos y crea que es el vecino', 'Dejas que {n} oiga ruidos y crea que es el vecino',
      'Frunce el ceño al techo y baja el volumen de la tele. «Ojalá se calmen», dice.',
      { p: true, e: true, clue: 'ruidos que creyó oír' }],
    ['sabanas', 'Que cambie las sábanas sin preguntar por qué', 'Haces que {n} cambie las sábanas sin preguntar por qué',
      'Las mete a la lavadora sin hacer preguntas. Solo dice: «Qué raro, huelen a otra cosa».',
      { p: true, e: true }],
    ['sala', 'Estar con dos en la sala mientras él trabaja arriba', 'Estás con {t} y con alguien más en la sala mientras {n} trabaja arriba',
      'Arriba suenan sus teclas. Abajo, otra cosa, y el volumen de la tele cubre lo demás.',
      { p: true, e: true }],
    ['prep', 'Que él les prepare el cuarto sin saber para quién', 'Le pides a {n} que prepare el cuarto para ti y para {t}',
      'Cree que es para una amistad que se queda a dormir. Cambia las sábanas, cierra la puerta al salir, y tú le pones el seguro.',
      { p: true, e: true }],
    ['fiesta2', 'Fiesta en su casa: él sirve y tú desapareces con dos', 'Haces una fiesta en la casa y desapareces con {t} y con alguien más mientras {n} sirve',
      'Él lleva bebidas y hielo, y pregunta si necesitas algo. «Nada, ya vuelvo».', { p: true, e: true }],
    ['tres3', 'Estar con tres la misma noche', 'Pasas la noche con {t} y con dos más',
      'Cada quien cree que es la excusa de otro. Nadie pregunta por el reloj.', { p: true }],
    ['vivir', 'Meter al otro a vivir con ustedes como «un amigo sin dónde quedarse»', 'Metes a {t} a vivir en la casa',
      'Le dijiste que es una amistad sin dónde quedarse. Ahora {n} le deja toalla limpia y duerme del otro lado de la pared.',
      { p: true }],
  ]),
  ...level(8, [
    ['dormir', 'Dejar que se duerma esperando tu mensaje', 'Dejas que {n} se duerma esperando tu mensaje',
      'Su último mensaje dice «aquí te espero». Tú lo lees al amanecer.'],
    ['cumple2', 'Cancelar su cumpleaños con una mentira por los otros', 'Cancelas el cumpleaños de {n} con una mentira, por irte con {t}',
      'Le dices que te surgió un viaje. Él te dice que no pasa nada y cancela la comida.'],
    ['redes', 'Presumir a los otros en una cuenta que él no conoce', 'Presumes a {t} en una cuenta que {n} no conoce',
      'Publicas una foto sin cara y con cuatro likes de gente que sabe quién es.'],
    ['mandados', 'Mandarlo de mandados mientras estás con el otro', 'Mandas a {n} de mandados mientras estás con {t}',
      'Le pides cosas de tres tiendas distintas. Tienes dos horas.', { p: true }],
    ['chiste', 'Que se ría de un chiste sobre infieles sin saberlo', 'Dejas que {n} se ría de un chiste sobre infieles',
      'Se ríe con ganas. Tú te ríes un segundo después.', { e: true }],
    ['futuro', 'Que te cuente sus planes a futuro con ustedes dos', 'Dejas que {n} te cuente sus planes a futuro con ustedes dos',
      'Hace listas de nombres, fechas y lugares. Tú asientes y pides más postre.', { e: true }],
    ['vestir', 'Que te ayude a elegir qué ponerte, sin saber para quién', 'Haces que {n} te ayude a elegir qué ponerte para {t}',
      'Escoge la camisa que más te favorece. «Con esa te ves irresistible».', { e: true }],
    ['hotel2', 'Que reserve el hotel sin saber para qué', 'Haces que {n} reserve el hotel para ti y {t}',
      'Lo reserva con descuento, pensando que es una sorpresa para los dos. Luego te manda la confirmación.',
      { e: true }],
    ['defiende', 'Que defienda al otro cuando alguien sospecha', 'Haces que {n} defienda a {t} cuando alguien sospecha',
      'Un conocido deja caer una duda. {n} la corta en seco: «Esas son habladurías».', { e: true }],
    ['limpia', 'Que limpie la casa después, sin saber de qué', 'Haces que {n} limpie la casa después de ti y {t}',
      'Recoge las copas y ventila el cuarto. Dice que anoche hubo mucho movimiento.', { p: true, e: true }],
    ['cuatro', 'Estar con cuatro en una sola noche', 'Pasas la noche con {t} y con tres más',
      'Dejas de contar a las tres de la mañana. Dejas de preocuparte unos minutos antes.', { p: true }],
    ['semana2', 'Una semana con alguien distinto cada noche', 'Pasas una semana con alguien distinto cada noche',
      'El domingo ya no sabes dónde dejaste tu cargador. Ni a quién le prometiste que volvías.',
      { p: true, clue: 'una semana entera de excusas distintas' }],
  ]),
  ...level(9, [
    ['contra', 'Cambiar tus contraseñas para que no vea nada', 'Cambias tus contraseñas para que {n} no vea nada',
      'Ahora tu teléfono tiene tres capas. Él ya no pregunta.',
      { clue: 'todas las contraseñas cambiadas de golpe' }],
    ['perdon', 'Que te pida perdón por haber dudado de ti', 'Haces que {n} te pida perdón por haber dudado de ti',
      'Dice que fue una tontería, que no sabe qué le pasó. Te trae flores al día siguiente.', { e: true }],
    ['paciencia', 'Que te agradezca tu paciencia', 'Haces que {n} te agradezca tu paciencia',
      'Dice que no merece a alguien como tú. Tú le aprietas la mano.', { e: true }],
    ['llaves', 'Que te dé las llaves de todo: cuentas, claves y casa', 'Haces que {n} te dé las llaves de todo: cuentas, claves y casa',
      'No pone ninguna condición. «No tengo nada que esconderte».', { e: true }],
    ['regalo', 'Que le regale algo al otro en su cumpleaños', 'Haces que {n} le regale algo a {t} en su cumpleaños',
      'Pasó una tarde entera eligiendo. «Algo que parezca de parte de los dos».', { e: true }],
    ['enfermo', 'Que cuide al otro cuando está enfermo', 'Haces que {n} cuide a {t} cuando está enfermo',
      'Le lleva sopa y le cambia el paño de la frente. «Pobre, ¿tienes frío?»', { e: true }],
    ['familia2', 'Que defienda tu mentira ante tu propia familia', 'Haces que {n} defienda tu mentira ante tu propia familia',
      'Aclara la fecha, el lugar y el nombre. Todo coincide, con una precisión que tú no habías dado.', { e: true }],
    ['renta', 'Que pague la renta del otro sin saberlo', 'Haces que {n} pague la renta de {t} sin saberlo',
      'Cree que es un préstamo para una amistad tuya. «Ya me pagará cuando pueda».', { e: true }],
    ['aval', 'Que firme de aval del departamento del otro', 'Haces que {n} firme de aval del departamento de {t}',
      'Lee tres líneas y firma. «Si es amistad tuya, es amistad mía».', { e: true }],
    ['todos', 'Estar con todos los que invitaste, en su casa, mientras él viaja', 'Recibes en la casa a {t} y a otras personas mientras {n} está de viaje',
      'Cada habitación tiene una historia. Al amanecer, ninguna se parece a otra.', { p: true }],
  ]),
  ...level(10, [
    ['puertacarro', 'Que le abra la puerta del carro al otro', 'Haces que {n} le abra la puerta del carro a {t}',
      'La sostiene con la mano en el techo, para que no se golpee la cabeza. «Con cuidado».', { e: true }],
    ['aeropuerto', 'Que lleve al otro al aeropuerto para su «viaje de trabajo»', 'Haces que {n} lleve a {t} al aeropuerto',
      'Maneja con la radio baja. En el retrovisor los ve tomarse de la mano al bajar y piensa que es cariño de amistades.',
      { e: true }],
    ['mesa', 'Que lo siente a la mesa de su familia', 'Haces que {n} siente a {t} a la mesa de su familia',
      'Le sirven el mejor plato. La abuela le pregunta si ya tiene a alguien.', { e: true }],
    ['mudanza', 'Que ayude al otro con su mudanza', 'Haces que {n} ayude a {t} con su mudanza',
      'Carga cajas hasta el cuarto piso. En una, con tu letra, dice «no tocar».', { e: true }],
    ['mejor', 'Que te agradezca por «el mejor año de su vida»', 'Haces que {n} te agradezca por «el mejor año de su vida»',
      'Lo dice con los ojos húmedos. Tú también los tienes.', { e: true }],
    ['viaje', 'Que ahorre para un viaje que tú harás con el otro', 'Haces que {n} ahorre para un viaje que harás con {t}',
      'Abre una cuenta con tu nombre. «Para nosotros», escribe.', { e: true }],
    ['coartada', 'Que cancele sus planes para cuidar tu coartada', 'Haces que {n} cancele sus planes para cuidar tu coartada',
      'Se queda en casa «por si preguntan». Llega una llamada y la responde como si la mentira fuera suya.',
      { e: true }],
    ['amigo', 'Que le diga al otro «gracias por ser tan buen amigo»', 'Haces que {n} le diga a {t}: «gracias por ser tan buen amigo»',
      'Se lo dice con el brazo en su hombro. {t} sonríe con la mirada baja.', { e: true }],
    ['matri', 'Que te pida matrimonio', 'Haces que {n} te pida matrimonio',
      'Se arrodilla en la cocina, con el anillo temblando. «Quiero pasar la vida contigo». Tú dices que sí.',
      { e: true }],
  ]),
];

/** Ordenadas por nivel y, dentro del nivel, por satisfacción. */
export const ACTS: readonly Act[] = [...RAW_ACTS].sort((a, b) => a.lvl - b.lvl || a.sat - b.sat);

export const STATES: readonly string[] = ['Tranquilo', 'Incómodo', 'Inseguro', 'Disminuido', 'Quebrado'];

/** Reacciones de él cuando está presente y lo ve, según su estado (0 a 4). */
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

/** Tus pensamientos después de cada jugada. */
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

/* ---------- lo que pasa dentro de él, en tiempo real ---------- */

export const MOOD_LABEL: Record<Mood, string> = {
  sereno: 'Sereno',
  inquieto: 'Inquieto',
  confundido: 'Confundido',
  desconfiado: 'Desconfiado',
  dolido: 'Dolido',
  resignado: 'Resignado',
  alterado: 'Alterado',
};

/** Pensamientos mientras no está contigo: confía por completo. */
export const AWAY_THOUGHTS: readonly string[] = [
  'Ojalá hoy salga temprano para verte.',
  'Le voy a preparar su platillo favorito.',
  'Qué suerte tengo de que me haya tocado alguien como tú.',
  'Me falta comprar el regalo. Tiene que ser perfecto.',
  'Hoy se me hizo largo el día sin ti.',
  'Después de esto, cena en casa y a descansar juntos.',
  'Confío en ti más que en nadie.',
  'Si llegas tarde, te espero despierto.',
];

/** Pensamientos al azar, según su ánimo, cuando está contigo. */
export const MOOD_THOUGHTS: Record<Exclude<Mood, 'confundido'>, readonly string[]> = {
  sereno: [
    'Qué tranquilo se está aquí.',
    'Me gusta cuando estamos así, sin hacer nada.',
    'Todo está bien. Todo está en su lugar.',
    'Debería agradecerte más seguido.',
    'Con tenerte cerca me basta.',
  ],
  inquieto: [
    'Estás medio distante hoy. Pero debe ser el cansancio.',
    'Se me hizo un nudo y no sé por qué.',
    'Algo trae en la cabeza. Mejor no preguntar.',
    'Respira. No pasa nada.',
    '¿Hice algo mal? Seguro no fue nada.',
  ],
  desconfiado: [
    'Algo me ocultas. Lo sé.',
    'Voy a fijarme en cómo contestas la próxima vez.',
    'No me gusta cómo suena eso.',
    'Dime la verdad. Aunque me duela.',
    '¿Quién te escribe a esa hora?',
  ],
  dolido: [
    'Me duele y no sé decir por qué.',
    'Me siento tonto estando aquí.',
    'Pensé que éramos distintos.',
    'Quisiera que me miraras como antes.',
    'Prefiero no saber nada. Saber es peor.',
  ],
  resignado: [
    'Seguro soy yo el que exagera.',
    'No tengo derecho a reclamar nada.',
    'Mientras no me dejes, está bien.',
    'Me acostumbré. Eso es lo triste.',
    'Al menos sigues aquí.',
  ],
  alterado: [
    'No puedo respirar bien.',
    'Esto no puede estar pasando.',
    'Me tiemblan las manos.',
    'Tengo que salir de aquí.',
    'Mírame. Por favor, mírame.',
  ],
};

/** Plantillas cuando algo no le cuadra. {p} es la frase de lo que le extraña. */
export const PUZZLE_THOUGHTS: readonly string[] = [
  'No dejo de pensar en {p}.',
  'Seguro hay una explicación para {p}.',
  'Algo no cuadra con {p}.',
];

export const CAUGHT_THOUGHTS: readonly string[] = [
  '¿Qué fue eso?',
  'No… seguro lo imaginé.',
  'Me pareció ver algo. Mejor no pensar en eso.',
  'Un segundo. ¿Eso fue lo que creo?',
];

/** Cuando te ayuda sin saber lo que haces. */
export const OBLIVIOUS_THOUGHTS: readonly string[] = [
  'Me gusta poder ayudarte.',
  'Qué bueno que confías en mí.',
  'Siempre cuentas conmigo, ¿verdad?',
  'Con tal de que estés bien, lo que sea.',
  'Qué detallista soy. Seguro lo vas a apreciar.',
];

/** Cuando lo ve de frente, por estado (0 a 4). */
export const SHOCK_THOUGHTS: readonly (readonly string[])[] = [
  ['¿Qué haces? Esto tiene que ser una broma.', '¿Por qué haces eso frente a mí?', 'No. No puede ser.'],
  ['Me cuesta respirar.', 'No quiero armar un escándalo.', 'Otra vez. Otra vez frente a mí.'],
  ['¿Por qué no digo nada?', 'Todos están viendo y yo me quedo callado.', 'Quiero desaparecer.'],
  ['Ya ni sé qué esperaba.', 'Me quedo. Siempre me quedo.', 'No me queda nada que decir.'],
  ['Si lo permito, no me pasa nada. Si no, me quedo solo.', 'Estoy bien. Estoy bien. Estoy bien.', 'Ya no duele. Eso es lo que duele.'],
];

export const RELIEF_THOUGHTS: readonly string[] = [
  'Estoy imaginando cosas. Qué vergüenza.',
  'No hay nada. Nunca hay nada.',
  'Soy un paranoico. Perdón por dudar.',
];

export const FOUND_THOUGHTS: readonly string[] = [
  'No… esto no puede ser. Pero algo no cuadra.',
  'Hay algo. Hay algo y no sé qué.',
  'Mejor no preguntar. Todavía no.',
];

/** Lo que hace por su cuenta. */
export interface Move {
  text: string;
  /** revisa tus cosas: encuentra algo si le sobran dudas */
  check?: boolean;
  /** cambio de tensión */
  dt?: number;
  /** cambios en confianza y humillación */
  dc?: number;
  dh?: number;
}

export type MoveKey = Mood | 'away';

export const MOVES: Record<MoveKey, readonly Move[]> = {
  away: [
    { text: 'Te escribe: «¿A qué hora llegas?»', dt: -2 },
    { text: 'Te manda una foto de la cena que está preparando.', dt: -2 },
    { text: 'Le dice a un amigo que eres lo mejor que le ha pasado.', dt: -2 },
    { text: 'Revisa el calendario para planear algo contigo.', dt: -2 },
    { text: 'Compra algo pensando en ti.', dt: -2 },
    { text: 'Pone tu canción favorita mientras trabaja.', dt: -2 },
  ],
  sereno: [
    { text: 'Te acerca algo de tomar.', dt: -3 },
    { text: 'Te pregunta cómo estuvo tu día.', dt: -2 },
    { text: 'Te toma la mano sin motivo.', dt: -3 },
    { text: 'Se ríe de algo en su teléfono y te lo enseña.', dt: -2 },
  ],
  inquieto: [
    { text: 'Te mira un segundo de más.', dt: 2 },
    { text: 'Pregunta: «¿Todo bien?»', dt: 3 },
    { text: 'Revisa la hora dos veces.', dt: 2 },
    { text: 'Da una vuelta por la casa sin motivo.', dt: 1 },
  ],
  confundido: [
    { text: 'Te mira como esperando que digas algo.', dt: 3 },
    { text: 'Pregunta: «¿Dónde estabas ayer?», sin sonar a reclamo.', dt: 4 },
    { text: 'Se queda con el teléfono en la mano, sin abrirlo.', dt: 2 },
    { text: 'Revisa tu teléfono cuando sales del cuarto.', check: true },
  ],
  desconfiado: [
    { text: 'Revisa tu teléfono cuando sales del cuarto.', check: true },
    { text: 'Te hace una pregunta con trampa.', check: true },
    { text: 'Mira el historial del carro.', check: true },
    { text: 'Te observa en silencio mientras contestas un mensaje.', dt: 4 },
  ],
  dolido: [
    { text: 'Se queda mirando la pared.', dt: -2 },
    { text: 'Sale a caminar solo.', dt: -3 },
    { text: 'Se sirve agua y no la toma.', dt: -1 },
    { text: 'Te prepara café sin que se lo pidas.', dt: -2 },
  ],
  resignado: [
    { text: 'Pide perdón por algo que no hizo.', dt: -2, dh: 1 },
    { text: 'Te prepara café sin que se lo pidas.', dt: -2 },
    { text: 'Se queda mirando la pared.', dt: -2 },
    { text: 'Acomoda tus cosas sin decir nada.', dt: -2, dh: 1 },
  ],
  alterado: [
    { text: 'Te pregunta qué pasa, con la voz temblando.', dt: 4 },
    { text: 'Cierra la puerta con fuerza y la vuelve a abrir.', dt: 3 },
    { text: 'Se encierra un rato en el baño.', dt: -4 },
    { text: 'Camina de un lado a otro.', dt: 2 },
  ],
};

/** Qué está haciendo, según su ánimo. */
export const DOING: Record<MoveKey, readonly string[]> = {
  away: ['En el trabajo, contestando correos', 'Volviendo a casa', 'Cocinando para dos', 'Haciendo el súper', 'Haciendo planes para el fin de semana'],
  sereno: ['Viendo la tele a tu lado', 'Leyendo en el sillón', 'Cocinando', 'Mirando su teléfono'],
  inquieto: ['Dando vueltas sin rumbo', 'Mirándote de reojo', 'Fingiendo que lee'],
  confundido: ['Repasando los últimos días', 'Mirando un punto fijo', 'Haciendo cuentas en su cabeza'],
  desconfiado: ['Vigilando tu teléfono', 'Esperando a que te distraigas', 'Observándolo todo'],
  dolido: ['Callado, mirando por la ventana', 'Sentado con la mirada baja', 'Evitando mirarte'],
  resignado: ['Haciendo como si nada', 'Esperando a que se te pase', 'Atendiéndote en silencio'],
  alterado: ['Respirando hondo, con las manos temblando', 'Caminando de un lado a otro', 'Tratando de no llorar'],
};
