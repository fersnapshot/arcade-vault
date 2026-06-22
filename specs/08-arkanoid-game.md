# SPEC 08 — Integración de Arkanoid como juego jugable

- **Status:** Aprobado
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-22
- **Objective:** Integrar ARKANOID como juego jugable en Arcade Vault, accesible
  desde `/player/arkanoid`, con canvas escalado en el `crt-screen`, HUD de score
  - vidas + nivel, y leaderboard real en Supabase.

---

## Scope

### In

- `src/components/games/ArkanoidGame.tsx` — componente canvas del juego
- `src/components/games/arkanoid/assets/spritesheet-breakout.png` — spritesheet copiado
- `src/components/games/arkanoid/assets/spritesheet.ts` — utilidades de sprites adaptadas a TS
- `src/components/games/arkanoid/sounds/ball-bounce.mp3` — sonido de rebote copiado
- `src/components/games/arkanoid/sounds/break-sound.mp3` — sonido de ruptura copiado
- `src/app/games/arkanoid/page.tsx` — ficha del juego con leaderboard
- `src/app/player/arkanoid/page.tsx` — página de juego con HUD y modal
- `src/app/player/arkanoid/actions.ts` — server action `saveScore`
- Seed SQL — INSERT en tabla `games` (lo aplica `/spec-impl`)

### Out of scope

- Controles táctiles / móvil
- Anti-cheat / validación servidor
- Auth / `user_id` real (`user_id: null` siempre)
- Otros juegos

---

## Data model

### Interfaz de callbacks del componente

```ts
interface ArkanoidCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface ArkanoidRef {
  restart: () => void;
  togglePause: () => void;
}
```

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'arkanoid',
  'ARKANOID',
  'Destruye bloques, salva la bola',
  'Controla la paleta para mantener la bola en juego y destruir todos los bloques antes de quedarte sin vidas. Varios niveles de dificultad creciente.',
  'ARCADE',
  'cover-bricks',
  'magenta'
);
```

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT SQL del Data model vía MCP
   (`mcp__supabase__execute_sql`). Verificar con
   `SELECT * FROM games WHERE id = 'arkanoid'`.

2. **Copiar assets** — copiar desde `references/started-games/04-arkanoid/assets/`:
   - `spritesheet-breakout.png` → `src/components/games/arkanoid/assets/`
   - `spritesheet.js` → `src/components/games/arkanoid/assets/spritesheet.ts`
     (adaptar a TypeScript: exportar `loadSpritesheet`, `drawSprite`, `drawFrame`,
     `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`)
   - `sounds/ball-bounce.mp3` → `src/components/games/arkanoid/sounds/`
   - `sounds/break-sound.mp3` → `src/components/games/arkanoid/sounds/`

3. **Crear `src/components/games/ArkanoidGame.tsx`** — refactor TypeScript de
   `game.js`. Canvas interno 800×600, escalado por CSS. Toda la lógica en
   `useEffect` con variables locales (sin estado React por entidad). Soporte de
   teclado (← →, P, M) y ratón. `useImperativeHandle` expone `restart()` y
   `togglePause()`. Callbacks `onScore`, `onLives`, `onLevel`, `onGameOver` y
   `onPause` solo se llaman cuando el valor cambia. Referencia: `AsteroidsGame.tsx`.

4. **Crear `src/app/games/arkanoid/page.tsx`** — Server Component. Llama
   `getGame("arkanoid")` y `getTopScores("arkanoid", 10)` en paralelo. Muestra
   ficha (cover, descripción, stat-strip, leaderboard) y botón ▶ JUGAR AHORA
   que enlaza a `/player/arkanoid`. Referencia: `src/app/games/asteroids/page.tsx`.

5. **Crear `src/app/player/arkanoid/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: 'arkanoid', score, player_name: name,
user_id: null })`. Referencia: `src/app/player/asteroids/actions.ts`.

6. **Crear `src/app/player/arkanoid/page.tsx`** — `"use client"`. Monta
   `<ArkanoidGame>` en `div.crt-screen` via `ref`. HUD de React con score, vidas
   y nivel actualizados en tiempo real. Overlay de pausa. Modal de game-over con
   input de nombre (máx. 3 letras, uppercase) + botón GUARDAR (llama `saveScore`,
   luego deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") + botón JUGAR DE NUEVO
   (llama `restart()`). Referencia: `src/app/player/asteroids/page.tsx`.

7. **Verificar build** — `npm run build` sin errores TypeScript.

---

## Acceptance criteria

- [ ] `/games` muestra la card de ARKANOID en el catálogo.
- [ ] `/games/arkanoid` carga la ficha propia del juego sin errores.
- [ ] `/games/arkanoid` muestra el top 10 de scores reales de ARKANOID.
- [ ] `/player/arkanoid` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca automáticamente al entrar en `/player/arkanoid`.
- [ ] Los controles de teclado funcionan: ← → mueven la paleta, P pausa/reanuda, M silencia/activa sonido.
- [ ] El ratón mueve la paleta dentro del canvas.
- [ ] El HUD de React muestra score, vidas y nivel actualizados en tiempo real.
- [ ] Al perder todas las vidas aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" en el modal reinicia el juego sin recargar la página.
- [ ] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [ ] Tras guardar, el botón se deshabilita y muestra "✓ PUNTUACIÓN GUARDADA".
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] Los sonidos de rebote y ruptura se reproducen correctamente (salvo que esté silenciado con M).
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: rutas dedicadas `/games/arkanoid` y `/player/arkanoid`** — mismo patrón
  que Asteroids y Tetris; cada juego real tiene sus propias páginas.
- **Sí: refactor a TypeScript en `ArkanoidGame.tsx`** — consistente con el stack
  100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game loop no
  necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno 800×600, escalado por CSS** — coordenadas de colisión no
  cambian al redimensionar.
- **Sí: soporte de ratón y teclado** — el original los soporta ambos; se mantiene.
- **Sí: assets co-localizados en `src/components/games/arkanoid/`** — spritesheet
  y sonidos viven junto al componente que los usa.
- **Sí: `spritesheet.js` adaptado a TypeScript** — se convierte a `.ts` con exports
  nombrados, eliminando globals del DOM.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
