# SPEC frogger (variante A) — Frogger clásico con vidas, niveles y carretera + río

- **Status:** Draft
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-24
- **Objective:** Integrar FROGGER como juego jugable en Arcade Vault, accesible
  desde `/player/frogger`, con canvas escalado en el `crt-screen`, HUD de score
  - vidas + nivel, mecánica clásica de cruzar carretera (coches) y río (troncos
    y tortugas), y leaderboard real en Supabase.

---

## Scope

### In

- `src/components/games/FroggerGame.tsx` — componente canvas del juego, implementado desde cero en TypeScript
- `src/app/games/frogger/page.tsx` — ficha del juego con leaderboard
- `src/app/player/frogger/page.tsx` — página de juego con HUD y modal
- `src/app/player/frogger/actions.ts` — server action `saveScore`
- Seed SQL — INSERT en tabla `games` (lo aplica `/spec-impl`)

### Out of scope

- Controles táctiles / móvil
- Anti-cheat / validación servidor
- Auth / `user_id` real (`user_id: null` siempre)
- Otros juegos
- Sonido / efectos de audio
- Animaciones de sprites complejas (la rana y obstáculos se dibujan con primitivas de canvas)

---

## Data model

### Interfaz de callbacks del componente

```ts
interface FroggerCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface FroggerRef {
  restart: () => void;
  togglePause: () => void;
}
```

### Tabla de puntuación

| Acción                          | Puntos base          |
| ------------------------------- | -------------------- |
| Avanzar una celda hacia arriba  | 10                   |
| Llegar a una zona segura (home) | 50                   |
| Completar todas las homes       | 200 × nivel          |
| Bonus de tiempo restante        | tiempo_restante × 10 |

El nivel sube al colocar la rana en las 5 zonas home del otro lado del río. A partir del nivel 2 los obstáculos aumentan velocidad en un 20 % por nivel (cap: ×3).

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'frogger',
  'FROGGER',
  'Cruza la carretera. Sobrevive el río',
  'Guía a tu rana a través de una carretera con coches que no perdonan y un río de troncos y tortugas que se mueven sin parar. Llena las cinco zonas del otro lado antes de que se acabe el tiempo. Cada nivel es más rápido y más despiadado.',
  'ARCADE',
  'cover-frogger',
  'green'
);
```

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT SQL del Data model vía
   `mcp__supabase__execute_sql`. Verificar con
   `SELECT * FROM games WHERE id = 'frogger'`.

2. **Crear `src/components/games/FroggerGame.tsx`** — implementación TypeScript
   desde cero. Canvas interno 480×560 px (grid de 14 filas × 12 columnas de
   40 px), escalado por CSS para encajar en `crt-screen`. Zonas del mapa (de
   arriba a abajo): 1 fila de homes, 1 fila segura, 5 filas de río (troncos y
   tortugas), 1 fila segura central, 4 filas de carretera (coches), 1 fila de
   salida de la rana. Lógica completa en `useEffect` con variables locales:
   posición de la rana, array de obstáculos (coches + plataformas), timer de
   nivel, vidas, score y estado de las homes. Game loop vía
   `requestAnimationFrame`. Detección de colisión por celda. La rana se mueve
   celda a celda con las teclas de dirección. En el río la rana sobrevive solo
   si está encima de un tronco o tortuga; si cae al agua pierde una vida.
   `useImperativeHandle` expone `restart()` y `togglePause()`. Callbacks
   `onScore`, `onLives`, `onLevel`, `onGameOver` y `onPause` solo se llaman
   cuando el valor cambia. Referencia: `AsteroidsGame.tsx`.

3. **Crear `src/app/games/frogger/page.tsx`** — Server Component. Llama
   `getGame("frogger")` y `getTopScores("frogger", 10)` en paralelo. Muestra
   ficha (cover-frogger, descripción, stat-strip, leaderboard top 10) y botón
   ▶ JUGAR AHORA que enlaza a `/player/frogger`.
   Referencia: `src/app/games/asteroids/page.tsx`.

4. **Crear `src/app/player/frogger/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: 'frogger', score, player_name: name,
user_id: null })`. Referencia: `src/app/player/asteroids/actions.ts`.

5. **Crear `src/app/player/frogger/page.tsx`** — `"use client"`. Monta
   `<FroggerGame>` en `div.crt-screen` vía ref. HUD de React con score, vidas
   (iconos de rana) y nivel actualizados en tiempo real. Overlay de pausa.
   Modal de game-over con score final, input de nombre (máx. 3 letras,
   uppercase) + botón GUARDAR (llama `saveScore`, luego deshabilita y muestra
   "✓ PUNTUACIÓN GUARDADA") + botón JUGAR DE NUEVO (llama `restart()`).
   Referencia: `src/app/player/asteroids/page.tsx`.

6. **Verificar build** — `npm run build` sin errores TypeScript.

---

## Acceptance criteria

- [ ] `/games` muestra la card de FROGGER en el catálogo.
- [ ] `/games/frogger` carga la ficha propia del juego sin errores.
- [ ] `/games/frogger` muestra el top 10 de scores reales de FROGGER.
- [ ] `/player/frogger` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca automáticamente al entrar en `/player/frogger`.
- [ ] Los controles de teclado funcionan: ↑ avanza, ↓ retrocede, ← mueve izquierda, → mueve derecha, P / Escape pausa/reanuda.
- [ ] El HUD de React muestra score, vidas (iconos de rana) y nivel actualizados en tiempo real.
- [ ] La rana muere al ser atropellada por un coche.
- [ ] La rana muere al caer al agua (sin estar sobre un tronco o tortuga).
- [ ] La rana muere al salirse del canvas lateralmente en el río.
- [ ] Al llegar a una zona home se registra visualmente y la rana vuelve a la salida.
- [ ] Al completar las 5 homes sube el nivel y los obstáculos aumentan velocidad.
- [ ] Hay un timer visible en canvas; al agotarse la rana pierde una vida.
- [ ] Al perder todas las vidas aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" reinicia el juego sin recargar la página.
- [ ] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [ ] Tras guardar, el botón se deshabilita y muestra "✓ PUNTUACIÓN GUARDADA".
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: rutas dedicadas `/games/frogger` y `/player/frogger`** — mismo patrón
  que Asteroids, Tetris, Arkanoid y Snake; cada juego real tiene sus propias páginas.
- **Sí: implementación TypeScript desde cero en `FroggerGame.tsx`** — no existe
  started-game de referencia; consistente con el stack 100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game loop
  no necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno 480×560, escalado por CSS** — coordenadas de colisión
  no cambian con el tamaño visual; proporción vertical necesaria para las 14 filas.
- **Sí: movimiento por celda (no continuo)** — respeta la mecánica original de
  Frogger; las colisiones son más predecibles y el canvas se mantiene limpio.
- **Sí: 3 vidas iniciales con `onLives`** — Frogger clásico tiene vidas; el HUD
  las muestra como iconos de rana para reforzar el personaje.
- **Sí: timer por vida en el propio canvas** — cuenta regresiva visible en canvas;
  al llegar a 0 descuenta una vida igual que una colisión.
- **Sí: niveles con escalado de velocidad** — cada nivel completado aumenta la
  velocidad de todos los obstáculos un 20 %, con cap en ×3.
- **Sí: troncos Y tortugas en el río** — dos tipos de plataformas con velocidades
  distintas; las tortugas pueden sumergirse en niveles altos (ver Variante B para
  implementación completa de tortugas sumergibles).
- **No: tortugas sumergibles en esta variante** — complejidad adicional reservada
  para Variante B; aquí las tortugas actúan como troncos simples.
- **No: sprites externos / atlas de imágenes** — la rana y obstáculos se dibujan
  con primitivas de canvas (rectángulos + arcos) con estética CRT; sin dependencias
  de assets externos.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **Esta variante vs Variante B:** Variante A es la mecánica clásica completa
  (vidas + niveles + timer + 5 homes) con estética de primitivas de canvas; Variante B
  es endless sin vidas pero con multiplicador de puntos, tortugas sumergibles y
  mayor complejidad visual, orientada a puntuación máxima en lugar de supervivencia.
