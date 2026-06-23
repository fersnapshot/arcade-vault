# SPEC 09 — Integración de Snake como juego jugable

- **Status:** Aprobado
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-23
- **Objective:** Integrar SNAKE como juego jugable en Arcade Vault, accesible
  desde `/player/snake`, con canvas escalado en el `crt-screen`, selector de
  velocidad inicial (niveles 1–9), HUD de score + vida + nivel, sprites de
  frutas del atlas propio, y leaderboard real en Supabase.

---

## Scope

### In

- `src/components/games/SnakeGame.tsx` — componente canvas del juego, implementado
  desde cero en TypeScript
- `src/components/games/snake/fruits.png` — sprite sheet de frutas copiado desde
  `references/source-assets/snake-assets/fruits.png`
- `src/components/games/snake/sprites.ts` — atlas de sprites adaptado a TypeScript
  desde `references/source-assets/snake-assets/sprites.js`
- `src/app/games/snake/page.tsx` — ficha del juego con leaderboard
- `src/app/player/snake/page.tsx` — página de juego con selector de nivel, HUD y modal
- `src/app/player/snake/actions.ts` — server action `saveScore`
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
interface SnakeCallbacks {
  onScore: (score: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface SnakeRef {
  restart: (startLevel?: number) => void;
  togglePause: () => void;
}
```

> `onLives` omitido — el juego tiene 1 sola vida; el HUD la muestra estáticamente.

### Tabla de puntuación por fruta

| Nivel | Puntos por fruta |
| ----- | ---------------- |
| 1     | 10               |
| 2     | 20               |
| 3     | 30               |
| 4     | 40               |
| 5     | 50               |
| 6     | 60               |
| 7     | 70               |
| 8     | 80               |
| 9     | 90               |

El nivel en partida sube cada 5 frutas comidas (cap: 9). La puntuación siempre
refleja el nivel actual en el momento de comer.

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'snake',
  'SNAKE',
  'Come, crece, sobrevive',
  'Controla una serpiente hambrienta que crece con cada bocado y acelera sin piedad. Elige tu velocidad inicial, esquiva tus propios anillos y las paredes, y sobrevive el tiempo suficiente para batir el récord.',
  'ARCADE',
  'cover-snake',
  'green'
);
```

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT SQL del Data model vía
   `mcp__supabase__execute_sql`. Verificar con
   `SELECT * FROM games WHERE id = 'snake'`.

2. **Copiar y adaptar assets**
   - Copiar `references/source-assets/snake-assets/fruits.png` →
     `src/components/games/snake/fruits.png`
   - Crear `src/components/games/snake/sprites.ts` adaptando
     `references/source-assets/snake-assets/sprites.js` a TypeScript:
     exportar `SPRITE_ATLAS` tipado y función `drawFruit(ctx, img, name, dx, dy, dw, dh)`.

3. **Crear `src/components/games/SnakeGame.tsx`** — implementación TypeScript
   desde cero. Canvas interno 800×600 px (grid de 40×30 celdas de 20px),
   escalado por CSS para encajar en `crt-screen`. Toda la lógica en `useEffect`
   con variables locales (sin estado React por entidad). Fruta aleatoria del
   atlas en cada spawn. Velocidad inicial según `startLevel` (nivel 1–9); sube
   automáticamente cada 5 frutas comidas (cap nivel 9). Puntuación según tabla
   fija del Data model. `useImperativeHandle` expone `restart(startLevel?)` y
   `togglePause()`. Callbacks `onScore`, `onLevel`, `onGameOver` y `onPause`
   solo se llaman cuando el valor cambia. Referencia: `AsteroidsGame.tsx`.

4. **Crear `src/app/games/snake/page.tsx`** — Server Component. Llama
   `getGame("snake")` y `getTopScores("snake", 10)` en paralelo. Muestra ficha
   (cover-snake, descripción, stat-strip, leaderboard top 10) y botón
   ▶ JUGAR AHORA que enlaza a `/player/snake`.
   Referencia: `src/app/games/asteroids/page.tsx`.

5. **Crear `src/app/player/snake/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: 'snake', score, player_name: name,
user_id: null })`. Referencia: `src/app/player/asteroids/actions.ts`.

6. **Crear `src/app/player/snake/page.tsx`** — `"use client"`. Antes de iniciar
   muestra selector de velocidad inicial (niveles 1–9) y botón EMPEZAR. Al
   iniciar: monta `<SnakeGame>` en `div.crt-screen` vía ref con el nivel
   seleccionado. HUD de React con score, vida (siempre 1, estático) y nivel
   actualizados en tiempo real. Overlay de pausa. Modal de game-over con score
   final, input de nombre (máx. 3 letras, uppercase) + botón GUARDAR (llama
   `saveScore`, luego deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") + botón
   JUGAR DE NUEVO (llama `restart(startLevel)`).
   Referencia: `src/app/player/asteroids/page.tsx`.

7. **Verificar build** — `npm run build` sin errores TypeScript.

---

## Acceptance criteria

- [ ] `/games` muestra la card de SNAKE en el catálogo.
- [ ] `/games/snake` carga la ficha propia del juego sin errores.
- [ ] `/games/snake` muestra el top 10 de scores reales de SNAKE.
- [ ] `/player/snake` muestra el selector de velocidad inicial (niveles 1–9) antes de empezar.
- [ ] `/player/snake` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca al confirmar el nivel inicial.
- [ ] Controles de teclado: ←↑→↓ y WASD mueven la serpiente, P / Escape pausa/reanuda.
- [ ] El HUD de React muestra score, vida (1) y nivel actualizados en tiempo real.
- [ ] En cada spawn aparece una fruta aleatoria del atlas dibujada con su sprite.
- [ ] La puntuación por fruta corresponde a la tabla fija según el nivel actual.
- [ ] El nivel sube automáticamente cada 5 frutas comidas (máx. nivel 9).
- [ ] El juego termina al chocar la cabeza con una pared o con el propio cuerpo.
- [ ] Al morir aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" reinicia el juego sin recargar la página.
- [ ] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [ ] Tras guardar, el botón se deshabilita y muestra "✓ PUNTUACIÓN GUARDADA".
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: rutas dedicadas `/games/snake` y `/player/snake`** — mismo patrón que
  Asteroids, Tetris y Arkanoid; cada juego real tiene sus propias páginas.
- **Sí: implementación TypeScript desde cero en `SnakeGame.tsx`** — no existe
  started-game de referencia; consistente con el stack 100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game loop
  no necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno 800×600, escalado por CSS** — coordenadas de colisión
  no cambian con el tamaño visual.
- **Sí: selector de velocidad inicial (1–9) antes de empezar** — mismo patrón
  que Tetris y Arkanoid; el nivel seleccionado se pasa a `restart(startLevel)`.
- **Sí: nivel sube cada 5 frutas (cap 9)** — progresión automática en partida
  independiente del nivel inicial elegido.
- **Sí: 1 sola vida mostrada estáticamente en el HUD** — Snake no tiene vidas
  extra; se muestra para consistencia visual con otros juegos del vault.
- **No: `onLives` callback** — la vida es siempre 1; no hay valor que comunicar.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **No: frutas con valor diferente por tipo** — puntuación fija por nivel,
  independiente de la fruta; la variedad es visual, no mecánica.
