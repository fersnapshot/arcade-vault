# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Juego de Arkanoid en HTML/CSS/JS puro, sin dependencias. Implementado y funcional.

## Running the game

Abrir `index.html` en un navegador. Usar servidor estático local para evitar restricciones CORS al cargar el spritesheet (e.g. `npx serve .` o la extensión Live Server de VS Code).

## Arquitectura

- `index.html` — canvas 800×600 + div `#level-select-ui` (select HTML + botón "Jugar") posicionado con CSS absoluto sobre el canvas
- `game.js` — toda la lógica del juego: estado, game loop, colisiones, niveles, explosiones, sonidos, pausa, selección de nivel
- `assets/spritesheet.js` — utilidades de sprites (ver abajo)

## Estado del juego (variables principales en `game.js`)

```js
state = { lives, score, status }  // status: "playing"|"gameover"|"win"
paused                             // boolean
currentLevel                       // 1..10
selectedLevel                      // sincronizado con <select>
explosions[]                       // animaciones activas
muted                              // boolean (tecla M)
```

## Assets disponibles

- `assets/spritesheet-breakout.png` — spritesheet con todos los sprites
- `assets/spritesheet.js` — coordenadas de cada sprite; expone `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, `drawFrame(ctx, frame, x, y, w, h)`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`
- `assets/sounds/ball-bounce.mp3` y `break-sound.mp3`

## Sprites disponibles

| Nombre (`drawSprite`)                                                                                    | Descripción                            |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `paddle`                                                                                                 | Paleta (162×14 px en spritesheet)      |
| `ball`                                                                                                   | Bola (16×16 px)                        |
| `block_red`, `block_cyan`, `block_green`, `block_magenta`, `block_yellow`, `block_hotpink`, `block_gray` | Bloques de colores (32×16 px cada uno) |

Las explosiones se animan con `EXPLOSION_FRAMES[color]` (4 frames × 150 ms = `EXPLOSION_DURATION`).

## Specs implementadas

| # | Archivo | Estado | Descripción |
|---|---------|--------|-------------|
| 01 | `specs/01-arkanoid-mvp.md` | Implementado | MVP: paleta, bola, 60 bloques, score, vidas, overlays |
| 02 | `specs/02-explosion-animation.md` | Implementado | Animación de explosión al romper bloques |
| 03 | `specs/03-sounds.md` | Implementado | Sonidos de rebote y ruptura, tecla M para silenciar |
| 04 | `specs/04-levels.md` | Implementado | 10 niveles con layouts aleatorios y velocidad incremental |
| 05 | `specs/05-pause-level-select.md` | Implementado | Pausa con `P`, selección de nivel desde overlay |
| 06 | `specs/06-select-nivel.md` | Implemented | `<select>` HTML para seleccionar nivel (reemplaza lista canvas) |

## Workflow spec-driven

Este proyecto usa un flujo spec-driven con dos skills:

- `/spec <descripción>` — diseña una nueva spec sección a sección antes de escribir código
- `/spec-impl <NN-nombre>` — implementa una spec aprobada paso a paso (requiere `Estado: Aprobado`)

Las specs viven en `specs/NN-slug.md`. Estados válidos: `Draft` → `Aprobado` → `Implemented`.

## Controles del juego

| Tecla | Acción |
|-------|--------|
| ←→ / ratón | Mover paleta |
| P | Pausar / reanudar |
| M | Silenciar / activar sonido |

## Convenciones

- Vanilla JS, sin frameworks ni bundlers.
- Canvas 2D para rendering.
- El juego corre completamente en el navegador sin backend.
