# Juegos de ficción

Dos juegos de ficción interactiva para adultos, hechos con Next.js (App Router), React y TypeScript. Todos los personajes y las historias son inventados.

- **A Sus Espaldas** (`/a-sus-espaldas`): 100 acciones en 10 niveles, combos, récords y muñequitos, con él vivo en tiempo real: pulso, ánimo, pensamientos, lo que no le cuadra y lo que hace por su cuenta.
- **Tres Años** (`/tres-anos`): historia con decisiones y un final que depende de lo que elegiste.

La partida se guarda en el navegador (`localStorage`). La base de datos de Supabase ya está lista para guardar partidas en la nube, récords, logros y estadísticas de minijuegos (ver «Base de datos»), pero el juego todavía no se conecta a ella.

## Correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # revisa los tipos
npm run build && npm start
```

Necesita Node 18.18 o más nuevo. Las fuentes (Instrument Serif, Literata, DM Mono) se descargan de Google Fonts al hacer `build`.

## Estructura

```
src/
  app/                       rutas (home, /a-sus-espaldas, /tres-anos)
  features/
    a-sus-espaldas/
      components/            interfaz del juego principal
        Game.tsx             contenedor: estado y guardado
        Scene.tsx, Figure.tsx  escena con los muñequitos (SVG)
        LivePanel.tsx        pulso, ánimo, confusión y pensamientos en vivo
        Sparkline.tsx        gráfica del pulso
        TurnResult.tsx       lo que pasó y el combo
        StatusPanel.tsx      marcadores
        Deck.tsx             modo, persona, pestañas por nivel y acciones
      components/minijuegos/ interfaz de los minijuegos (Llamada.tsx)
      lib/
        minijuegos/llamada.ts  lógica pura de la llamada: aguja, hablar y lo que él oye
        data.ts              acciones, personas, textos y niveles (aquí se agrega contenido)
        engine.ts            reglas de cada jugada, funciones puras sin React
        live.ts              tiempo real: pulso, tensión, pensamientos y movimientos de él
        stage.ts, types.ts
    tres-anos/
      components/Story.tsx   interfaz de la historia
      lib/story.ts           escenas, decisiones y final
  lib/
    cn.ts                    utilidad para clases
    use-persistent-state.ts  estado guardado en localStorage
```

El alias `@/` apunta a `src/`.

## Tiempo real

`Game.tsx` llama a `tick()` cada segundo (se detiene si pausas o cambias de pestaña). Dentro de él corre:

- **Pulso**: sube con la tensión y vuelve solo a su pulso en reposo, que depende de su sospecha y de cuánto lo han humillado.
- **Ánimo**: sereno, inquieto, confundido, desconfiado, dolido, resignado o alterado.
- **Pensamientos y movimientos**: salen solos cada pocos segundos, más seguido cuanto más tensión tiene.
- **Confusión**: las acciones con `clue` le dejan cosas que no le cuadran. Si desconfía, revisa tus cosas y puede encontrar algo.
- **Si no está** ("No está"), nada de lo que hagas lo afecta: sigue confiando.
- Las acciones marcadas `withHim` lo involucran sin que sepa lo que pasa, así que no se juegan con "No está".

## Base de datos

Supabase (proyecto `lglsdegcdtcnnbcfgpnf`). Copia `.env.example` a `.env.local` y pon la llave pública. Todas las tablas tienen RLS: cada jugador solo ve y escribe lo suyo.

- `perfiles`: apodo del jugador.
- `partidas`: partida guardada por juego (`estado` JSON, `version`).
- `records`: mejores marcas por juego y métrica; todos los jugadores con sesión pueden leerlos (tabla de posiciones).
- `logros_usuario`: logros desbloqueados.
- `minijuego_intentos`: resultado de cada minijuego (veredicto, exposición, cortes, segundos), para afinar la dificultad.

Los tipos están en `src/lib/supabase/database.types.ts`.

## Minijuegos

Algunas acciones se resuelven jugando un minijuego en vez de al instante. Todo gira alrededor de él: el resultado decide cuánto oyó, su sospecha, su confianza y cuánto lo humillaste. La satisfacción no depende del minijuego.

- **Llamada** (acción `llamada`, solo cuando él no está en el cuarto): él llama mientras estás con el otro. Con el botón derecho mantienes apretado para hablar y contestar sus frases completas; con el izquierdo nivelas una aguja que sube sola con el ritmo. Si la aguja se va (o te pasas de más), se nota, y más si estás hablando. Termina en `limpio` (te creyó), `dudas` (le queda algo sin cuadrar) o `sabe` (lo oyó todo). En teclado: ← nivelar, → hablar.

**Intención.** Antes de cada minijuego eliges qué quieres lograr:
- *Que no se note* (`ocultar`): mantener la aguja en el centro.
- *Que lo sienta* (`herir`): dejar que la aguja suba a la franja rosa mientras hablas, para que él oiga tu voz temblar. Cuanto más y más tiempo, más le duele (humillación, confianza, tensión y sospecha de él) y **más satisfacción ganas, hasta el doble**. Si te pasas, lo entiende todo.

El mismo esquema (`MiniIntent`) se usará en los demás minijuegos.

Para ligar otro minijuego a una acción: agrega `mini: 'id'` a sus marcas en `data.ts`, el id a `MiniId` en `types.ts`, su lógica en `lib/minijuegos/`, su interfaz en `components/minijuegos/`, y su resolución en `engine.ts` (como `playCall`).

## Contenido desde la base de datos

La tabla `contenido` guarda frases y acciones que el juego suma a las que ya trae. Al entrar con tu correo (enlace por correo), el juego las descarga y las mezcla:

- `accion`: acciones nuevas por nivel (1 a 10). Aparecen en la pestaña de su nivel.
- `minijuego` (llamada): diálogos de apertura, medio y cierre, frases de cuando él oye algo y de cuando te quedas callada.
- `pensamiento`, `escena` y `sentimiento`: lo que piensa, lo que pasa y cómo queda él al terminar la llamada.

Cada llamada arma un guion distinto: una apertura, dos del medio y un cierre. Sin sesión, el juego usa solo su contenido incluido.

Lo que juegas (jugadas y llamadas) se guarda en `eventos_juego` para que luego se pueda «procesar» y crear contenido nuevo.

Para que el enlace del correo funcione, en Supabase → Authentication → URL Configuration pon la URL del sitio y agrégala a las URLs de redirección permitidas.

## Agregar contenido

- **Una acción nueva**: agrega una fila a su nivel en `src/features/a-sus-espaldas/lib/data.ts` con `[id, botón, frase, lo que pasó, { p, e, clue }]`. `p` es puerta cerrada, `e` es que él participa sin saber, `clue` es lo que le queda sin cuadrar. La satisfacción y el riesgo salen del nivel y de la posición dentro de él.
- **Una persona nueva**: agrega un objeto a `TARGETS` en el mismo archivo.
- **Un nivel nuevo**: agrega el mínimo de satisfacción a `LEVELS`, valores en `BASE_SAT` y `BASE_RISK`, y un `level(n, [...])` en `RAW_ACTS`. La pestaña sale sola (en `components/game.module.css` ajusta las columnas de `.tabs`).
- **Una escena nueva de Tres Años**: agrega un nodo a `NODES` en `src/features/tres-anos/lib/story.ts` y apunta el `next` del anterior.
