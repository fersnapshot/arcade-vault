# SPEC frogger (variante B) — Frogger Endless con multiplicador, tortugas sumergibles y dificultad escalable

- **Status:** Draft
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-24
- **Objective:** Integrar FROGGER como juego jugable en Arcade Vault, accesible
  desde `/player/frogger`, con canvas escalado en el `crt-screen`, HUD de score
  - multiplicador + nivel, mecánica endless sin vidas pero con multiplicador de
    puntos que se pierde al morir y reinicia la rana, y leaderboard real en Supabase.

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

---

## Data model

### Interfaz de callbacks del componente

```ts
interface FroggerCallbacks {
  onScore: (score: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface FroggerRef {
  restart: () => void;
  togglePause: () => void;
}
```

> `onLives` omitido — la variante B es endless; no hay sistema de vidas.
> Al morir la rana se reinicia en la posición de salida pero el juego continúa;
> el multiplicador se resetea a ×1. El game over ocurre al expirar un timer
> global de 90 segundos.

### Tabla de puntuación y multiplicador

| Acción                         | Puntos base × multiplicador |
| ------------------------------ | --------------------------- |
| Avanzar una celda hacia arriba | 10 × mult                   |
| Llegar a una zona home         | 100 × mult                  |
| Completar las 5 homes          | 500 × mult                  |

**Multiplicador:** empieza en ×1. Sube +0.5 por cada home completada (cap ×5).
Al morir (coche o agua) el multiplicador se resetea a ×1 y la rana vuelve al inicio.

**Nivel:** sube cada vez que se completan las 5 homes. A partir del nivel 2 los
obstáculos aumentan velocidad un 15 % por nivel (cap: ×4). Las tortugas se
sumergen a partir del nivel 3.

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'frogger',
  'FROGGER',
  'Cruza la carretera. Sobrevive el río',
  'Guía a tu rana a través de una carretera con coches que no perdonan y un río de troncos y tortugas que se sumergen sin aviso. Acumula el mayor multiplicador posible antes de que se agote el tiempo. Cada muerte te lo quita todo.',
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
   posición de la rana, array de obstáculos (coches + plataformas), timer global
   de 90 s, multiplicador, nivel, score y estado de las homes. Game loop vía
   `requestAnimationFrame`. Detección de colisión por celda. La rana se mueve
   celda a celda con las teclas de dirección. En el río la rana sobrevive solo
   si está encima de un tronco o tortuga no sumergida; si cae al agua el
   multiplicador se resetea y la rana vuelve al inicio (sin game over inmediato).
   Tortugas sumergibles a partir del nivel 3: ciclo visible → parpadeo → sumergida
   (hitbox inactiva). Al expirar el timer global de 90 s se dispara `onGameOver`.
   `useImperativeHandle` expone `restart()` y `togglePause()`. Callbacks
   `onScore`, `onLevel`, `onGameOver` y `onPause` solo se llaman cuando el valor
   cambia. Referencia: `AsteroidsGame.tsx`.

3. **Crear `src/app/games/frogger/page.tsx`** — Server Component. Llama
   `getGame("frogger")` y `getTopScores("frogger", 10)` en paralelo. Muestra
   ficha (cover-frogger, descripción, stat-strip, leaderboard top 10) y botón
   ▶ JUGAR AHORA que enlaza a `/player/frogger`.
   Referencia: `src/app/games/asteroids/page.tsx`.

4. **Crear `src/app/player/frogger/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: 'frogger', score, player_name: name,
user_id: null })`. Referencia: `src/app/player/asteroids/actions.ts`.

5. **Crear `src/app/player/frogger/page.tsx`** — `"use client"`. Monta
   `<FroggerGame>` en `div.crt-screen` vía ref. HUD de React con score,
   multiplicador actual (ej. `×2.5`) y nivel actualizados en tiempo real. Timer
   global de 90 s visible en el HUD, que cuenta regresiva en React leyendo el
   valor emitido por un callback adicional `onTime` — o bien el timer se dibuja
   directamente en canvas y se comunica vía `onScore` al finalizar. Overlay de
   pausa. Modal de game-over (al expirar el tiempo) con score final, input de
   nombre (máx. 3 letras, uppercase) + botón GUARDAR (llama `saveScore`, luego
   deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") + botón JUGAR DE NUEVO (llama
   `restart()`). Referencia: `src/app/player/asteroids/page.tsx`.

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
- [ ] El HUD de React muestra score, multiplicador (ej. `×2.5`) y nivel actualizados en tiempo real.
- [ ] Al morir (coche o agua) el multiplicador se resetea a ×1 y la rana vuelve al inicio sin game over.
- [ ] El multiplicador sube +0.5 por cada home completada, con cap en ×5.
- [ ] Al completar las 5 homes sube el nivel y los obstáculos aumentan velocidad.
- [ ] A partir del nivel 3 las tortugas muestran ciclo de parpadeo antes de sumergirse.
- [ ] Cuando una tortuga está sumergida la rana cae al agua si está sobre ella.
- [ ] El timer global de 90 s cuenta regresiva y al expirar aparece el modal de game over.
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
- **Sí: endless sin vidas + timer global de 90 s** — elimina el sistema de vidas
  clásico; el juego nunca para por muertes individuales, solo por tiempo agotado;
  la tensión viene del multiplicador que se pierde al morir.
- **Sí: multiplicador de puntos** — mecánica de riesgo/recompensa que diferencia
  esta variante; perder el multiplicador es el "castigo" de morir en lugar de
  perder una vida.
- **Sí: tortugas sumergibles a partir del nivel 3** — complejidad añadida que
  escala con el nivel; el parpadeo previo avisa al jugador para que reaccione.
- **No: timer por vida / cuenta regresiva por cruce** — en esta variante solo hay
  un timer global; simplifica la lógica y mantiene el foco en el multiplicador.
- **No: sistema de vidas** — diseño intencional de la variante B; las muertes
  reinician la rana pero no terminan la partida.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **Esta variante vs Variante A:** Variante B elimina las vidas y sustituye la
  mecánica de supervivencia por un sistema de multiplicador de puntos con timer
  global; las muertes son costosas (pierdes el multiplicador) pero no terminan la
  partida, orientando el diseño hacia maximizar score en lugar de sobrevivir el
  mayor número de cruces. Las tortugas sumergibles añaden una capa de lectura del
  tablero que la Variante A no tiene.
