# Juegos de ficción

Dos juegos de ficción interactiva para adultos, hechos con Next.js (App Router), React y TypeScript. Todos los personajes y las historias son inventados.

- **A Sus Espaldas** (`/a-sus-espaldas`): 100 acciones en 10 niveles, combos, récords y muñequitos, con él vivo en tiempo real: pulso, ánimo, pensamientos, lo que no le cuadra y lo que hace por su cuenta.
- **Tres Años** (`/tres-anos`): historia con decisiones y un final que depende de lo que elegiste.

La partida se guarda solo en el navegador (`localStorage`). No hay servidor ni base de datos.

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
      lib/
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

## Agregar contenido

- **Una acción nueva**: agrega una fila a su nivel en `src/features/a-sus-espaldas/lib/data.ts` con `[id, botón, frase, lo que pasó, { p, e, clue }]`. `p` es puerta cerrada, `e` es que él participa sin saber, `clue` es lo que le queda sin cuadrar. La satisfacción y el riesgo salen del nivel y de la posición dentro de él.
- **Una persona nueva**: agrega un objeto a `TARGETS` en el mismo archivo.
- **Un nivel nuevo**: agrega el mínimo de satisfacción a `LEVELS`, valores en `BASE_SAT` y `BASE_RISK`, y un `level(n, [...])` en `RAW_ACTS`. La pestaña sale sola (en `components/game.module.css` ajusta las columnas de `.tabs`).
- **Una escena nueva de Tres Años**: agrega un nodo a `NODES` en `src/features/tres-anos/lib/story.ts` y apunta el `next` del anterior.
