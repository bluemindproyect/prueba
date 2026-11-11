# Juegos de ficción

Dos juegos de ficción interactiva para adultos, hechos con Next.js (App Router), React y TypeScript. Todos los personajes y las historias son inventados.

- **A Sus Espaldas** (`/a-sus-espaldas`): juego por turnos con niveles, combos, récords y muñequitos.
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
app/                       rutas (home, /a-sus-espaldas, /tres-anos)
components/
  a-sus-espaldas/          interfaz del juego principal
    Game.tsx               contenedor: estado y guardado
    Scene.tsx, Figure.tsx  escena con los muñequitos (SVG)
    TurnResult.tsx         lo que pasó y el combo
    StatusPanel.tsx        marcadores
    Deck.tsx               modo, persona, pestañas por nivel y acciones
  tres-anos/               interfaz de la historia
lib/
  a-sus-espaldas/
    data.ts                acciones, personas, textos y niveles (aquí se agrega contenido)
    engine.ts              reglas del juego, funciones puras sin React
    types.ts
  tres-anos/story.ts       escenas, decisiones y final
  use-persistent-state.ts  estado guardado en localStorage
juegos/                    versión original en HTML de un solo archivo
```

## Agregar contenido

- **Una acción nueva**: agrega un objeto a `RAW_ACTS` en `lib/a-sus-espaldas/data.ts`. Se ordena sola por nivel.
- **Una persona nueva**: agrega un objeto a `TARGETS` en el mismo archivo.
- **Un nivel nuevo**: agrega el mínimo de satisfacción a `LEVELS` y, en `Deck.tsx`, ya sale la pestaña sola.
- **Una escena nueva de Tres Años**: agrega un nodo a `NODES` en `lib/tres-anos/story.ts` y apunta el `next` del anterior.
