# SPEC 07 — Integración de Tetris como juego jugable

- **Status:** Implementado
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-22
- **Objective:** Integrar TETRIS como juego jugable en Arcade Vault, accesible
  desde `/player/tetris`, con canvas escalado en el `crt-screen`, HUD de score
  - líneas + nivel, preview de siguiente pieza, y leaderboard real en Supabase.

---

## Scope

### In

- `src/components/games/TetrisGame.tsx` — componente canvas del juego
- `src/app/games/tetris/page.tsx` — ficha del juego con leaderboard
- `src/app/player/tetris/page.tsx` — página de juego con HUD y modal
- `src/app/player/tetris/actions.ts` — server action `saveScore`
- Seed SQL — bloque INSERT para la tabla `games` (lo aplica `/spec-impl`)
- Sistema de skins (retro / neon / pastel / pixel) — selector en el HUD
- Selector de nivel inicial (1–10) antes de empezar la partida

### Out of scope

- Controles táctiles / móvil
- Anti-cheat / validación servidor
- Auth / `user_id` real (`user_id: null` siempre)
- Otros juegos

---

## Data model

### Interfaz de callbacks del componente

```ts
interface TetrisCallbacks {
  onScore: (score: number) => void;
  onLines: (lines: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface TetrisRef {
  restart: (startLevel?: number) => void;
  togglePause: () => void;
}
```

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'tetris',
  'TETRIS',
  'Encaja piezas, limpia líneas. Sobrevive',
  'Apila piezas, elimina líneas completas y sobrevive el ritmo implacable que no para de acelerarse. Cada tetromino es una decisión; cada línea limpia, un punto de no retorno.',
  'PUZZLE',
  'cover-tetro',
  'cyan'
);
```

---

## Implementation plan

1. **Seed en Supabase** — aplicar el INSERT SQL del Data model vía
   `mcp__supabase__execute_sql`. Verificar con
   `SELECT * FROM games WHERE id = 'tetris'`.

2. **Crear `src/components/games/TetrisGame.tsx`** — refactor TypeScript de
   `references/started-games/03-tetris/game.js`. Canvas interno 300×600 px
   (COLS=10, ROWS=20, BLOCK=30), escalado por CSS para encajar en `crt-screen`.
   Canvas secundario para preview de siguiente pieza. Sistema de skins
   (retro/neon/pastel/pixel) con preferencia persistida en localStorage bajo
   la clave `tetris-skin`. Toda la lógica en `useEffect` con variables locales.
   `useImperativeHandle` expone `restart(startLevel?)` y `togglePause()`.
   Callbacks `onScore`, `onLines`, `onLevel`, `onGameOver`, `onPause` solo se
   llaman cuando el valor cambia. Referencia: `AsteroidsGame.tsx`.

3. **Crear `src/app/games/tetris/page.tsx`** — Server Component. Llama
   `getGame("tetris")` y `getTopScores("tetris", 10)` en paralelo. Muestra
   ficha (cover-tetro, descripción, stat-strip, leaderboard top 10) y botón
   ▶ JUGAR AHORA que enlaza a `/player/tetris`.
   Referencia: `src/app/games/asteroids/page.tsx`.

4. **Crear `src/app/player/tetris/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: 'tetris', score, player_name: name,
user_id: null })`. Referencia: `src/app/player/asteroids/actions.ts`.

5. **Crear `src/app/player/tetris/page.tsx`** — `"use client"`. Antes de
   iniciar la partida muestra selector de nivel inicial (1–10) y botón
   EMPEZAR. Al iniciar: monta `<TetrisGame>` en `div.crt-screen` vía ref con
   el nivel seleccionado. HUD de React con score, líneas y nivel actualizados
   en tiempo real. Selector de skin (retro/neon/pastel/pixel) accesible desde
   el HUD. Overlay de pausa. Modal de game-over con score final, input de
   nombre (máx. 3 letras, uppercase) + botón GUARDAR (llama `saveScore`,
   luego deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") + botón JUGAR DE
   NUEVO (llama `restart(startLevel)`). Referencia:
   `src/app/player/asteroids/page.tsx`.

6. **Verificar build** — `npm run build` sin errores TypeScript.

---

## Acceptance criteria

- [x] `/games` muestra la card de TETRIS en el catálogo.
- [x] `/games/tetris` carga la ficha propia del juego sin errores.
- [x] `/games/tetris` muestra el top 10 de scores reales de TETRIS.
- [x] `/player/tetris` muestra el selector de nivel inicial (1–10) antes de empezar.
- [x] `/player/tetris` carga sin errores de TypeScript ni warnings en consola.
- [x] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [x] El juego arranca al confirmar el nivel inicial.
- [x] Controles de teclado: ← → mueven la pieza, ↓ soft drop, ↑ / X rotan, Space hard drop, P / Escape pausa.
- [x] El canvas secundario muestra la siguiente pieza en tiempo real.
- [x] El HUD de React muestra score, líneas y nivel actualizados en tiempo real.
- [x] El selector de skin cambia el estilo visual del canvas sin reiniciar la partida.
- [x] La preferencia de skin persiste en localStorage (`tetris-skin`).
- [x] Al llenar el tablero aparece el modal de game over con la puntuación final.
- [x] El botón "JUGAR DE NUEVO" reinicia el juego sin recargar la página.
- [x] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [x] Tras guardar, el botón se deshabilita y muestra "✓ PUNTUACIÓN GUARDADA".
- [x] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [x] `npm run build` completa sin errores.

---

## Decisions

- **Sí: rutas dedicadas `/games/tetris` y `/player/tetris`** — mismo patrón
  que Asteroids; cada juego real tiene sus propias páginas.
- **Sí: refactor a TypeScript en `TetrisGame.tsx`** — consistente con el
  stack 100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game
  loop no necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno 300×600, escalado por CSS** — coordenadas de colisión
  no cambian al escalar.
- **Sí: sistema de skins en scope** — el código fuente ya lo implementa;
  portarlo es trabajo menor y mejora la experiencia.
- **Sí: selector de nivel inicial** — el código fuente ya lo tiene; permite
  a jugadores experimentados empezar en dificultad mayor.
- **Sí: canvas secundario para siguiente pieza dentro de `TetrisGame.tsx`**
  — forma parte del gameplay original; no requiere callback externo.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **No: skin retro forzada** — se mantiene el sistema completo de skins del
  original.
