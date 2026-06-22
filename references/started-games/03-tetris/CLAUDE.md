# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ejecutar el juego

Sin dependencias ni build. Dos opciones:

```bash
# Abrir directamente
open index.html

# Servidor local
python3 -m http.server 8000
# → http://localhost:8000
```

## Arquitectura

Tres archivos, sin frameworks ni bundler:

- **`index.html`** — DOM: `<canvas id="board">` (300×600 px) + panel lateral (score/lines/level/next) + overlay pause/game-over.
- **`style.css`** — dark/retro theme con flexbox y backdrop-filter.
- **`game.js`** — toda la lógica (~300 líneas, ES6+ vanilla).

## Lógica en game.js

| Concepto    | Implementación                                                           |
| ----------- | ------------------------------------------------------------------------ |
| Tablero     | Matriz `ROWS×COLS`; `0` = vacío, `1–7` = índice de color                 |
| Rotación    | Transposición + reverso de filas (`rotateCW`)                            |
| Wall kicks  | `tryRotate` desplaza ±1 y ±2 columnas antes de descartar                 |
| Game loop   | `requestAnimationFrame`; baja la pieza cuando `dt ≥ dropInterval`        |
| Limpieza    | `clearLines` recorre de abajo a arriba; inserta fila vacía en cima       |
| Ghost piece | `ghostY` proyecta posición final; dibuja con `globalAlpha = 0.2`         |
| Velocidad   | `max(100, 1000 − (level − 1) × 90)` ms; sube nivel cada 10 líneas        |
| Puntuación  | `[0, 100, 300, 500, 800] × nivel`; hard drop +2/celda, soft drop +1/fila |

## Constantes tuneables (game.js)

`COLS` (10), `ROWS` (20), `BLOCK` (30 px), `COLORS`, `LINE_SCORES`, `dropInterval`.  
Si cambias `COLS`/`ROWS`/`BLOCK`, ajustar también `width`/`height` del canvas en `index.html`.
