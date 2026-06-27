# SPEC missile-command (variante B) — Missile Command Endless con racha y multiplicador

- **Status:** Draft
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-27
- **Objective:** Integrar MISSILE COMMAND como juego jugable en Arcade Vault, accesible
  desde `/player/missile-command`, con canvas escalado en el `crt-screen`, HUD de score
  - multiplicador de racha + ciudades restantes, y leaderboard real en Supabase.

---

## Scope

### In

- `src/components/games/MissileCommandGame.tsx` — componente canvas del juego
- `src/app/games/missile-command/page.tsx` — ficha del juego con leaderboard
- `src/app/player/missile-command/page.tsx` — página de juego con HUD y modal
- `src/app/player/missile-command/actions.ts` — server action `saveScore`
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
interface MissileCommandCallbacks {
  onScore: (score: number) => void;
  onLives: (cities: number) => void; // ciudades restantes (inician en 6)
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface MissileCommandRef {
  restart: () => void;
  togglePause: () => void;
}
```

> `onLevel` omitido — no hay oleadas discretas; la dificultad sube de forma
> continua. El multiplicador de racha se muestra en el HUD como dato propio.

### Tabla de puntuación base

| Objetivo                                       | Puntos base             |
| ---------------------------------------------- | ----------------------- |
| Misil enemigo destruido                        | 25                      |
| Avión / satélite destruido                     | 100                     |
| Destruir 3+ en una sola explosión (multi-kill) | +50 por misil adicional |

Todos los puntos base se multiplican por el **multiplicador de racha** activo en
el momento del impacto. La racha sube +1 por cada misil destruido sin dejar que
ninguno impacte en ciudad o batería (máx. ×10). Un impacto enemigo resetea la
racha a ×1.

### Seed SQL

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'missile-command',
  'MISSILE COMMAND',
  'Apunta, dispara, protege tu ciudad',
  'Misiles enemigos llueven del cielo. Con el ratón apuntas y lanzas interceptores desde tres baterías antiaéreas para proteger las seis ciudades a tus pies. Cada oleada es más densa y más rápida. Cuando caiga la última ciudad, el juego habrá terminado.',
  'SHOOTER',
  'cover-missile',
  'orange'
);
```

---

## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT SQL del Data model vía
   `mcp__supabase__execute_sql`. Verificar con
   `SELECT * FROM games WHERE id = 'missile-command'`.

2. **Crear `src/components/games/MissileCommandGame.tsx`** — implementación
   TypeScript desde cero. Canvas interno 800×600 px, escalado por CSS para
   encajar en `crt-screen`. Toda la lógica en `useEffect` con variables locales
   (sin estado React por entidad). Estructura de datos local:

   - `missiles[]` — proyectiles enemigos: `{ x, y, tx, ty, speed, active }`.
   - `interceptors[]` — proyectiles del jugador: `{ x, y, tx, ty, speed, active }`.
   - `explosions[]` — radio creciente tras impacto: `{ x, y, radius, maxRadius, growing }`.
   - `batteries[3]` — posiciones fijas izquierda/centro/derecha; **munición infinita**.
   - `cities[6]` — estado vivo/destruido de cada ciudad.
   - `streak` — contador de racha (misiles destruidos sin fallo); inicia en 0.
   - `multiplier` — calculado como `Math.min(Math.floor(streak / 3) + 1, 10)`.
   - `elapsed` — tiempo en segundos desde el inicio; controla la dificultad continua.

   Mecánica de dificultad continua: los misiles enemigos se generan en un spawn
   loop cuyo intervalo disminuye con el tiempo. Fórmula: `spawnInterval = max(400, 2000 - elapsed * 20)` ms. La velocidad de los misiles sube un 1% cada 5 segundos,
   con un techo de 3× la velocidad inicial. No hay oleadas; el flujo de misiles
   es ininterrumpido desde el primer segundo.

   Mecánica de racha: cada misil destruido incrementa `streak` en 1. Un misil
   que impacta en ciudad o batería pone `streak = 0`. El multiplicador visible
   en HUD es `Math.min(Math.floor(streak / 3) + 1, 10)` (sube de nivel cada 3
   destrucciones consecutivas).

   Mecánica de multi-kill: si una sola explosión destruye 3 o más misiles
   simultáneamente, los misiles a partir del tercero suman 50 puntos adicionales
   antes de aplicar el multiplicador.

   Munición: infinita. El jugador puede hacer clic sin restricción; el canvas
   limita visualmente la cadencia mostrando el "calor" de cada batería (barra de
   sobrecalentamiento que se llena con cada disparo y se enfría sola; cuando
   llega al tope, esa batería queda bloqueada 1 segundo).

   `useImperativeHandle` expone `restart()` y `togglePause()`. Callbacks
   `onScore`, `onLives`, `onGameOver` y `onPause` solo se llaman cuando el valor
   cambia. Referencia: `AsteroidsGame.tsx`.

   Render del canvas:
   - Fondo negro con gradiente sutil azul-oscuro en la parte superior (cielo).
   - Tierra: franja marrón en la parte inferior de 40 px.
   - Ciudades: dibujo geométrico simple (rectángulos apilados tipo skyline CRT)
     en color verde cuando están en pie, gris oscuro cuando destruidas.
   - Baterías: triángulo con base en la tierra, color blanco, con barra de
     "calor" naranja encima que crece con cada disparo y desaparece al enfriarse.
   - Misiles enemigos: línea con cola en magenta / rojo; los que apuntan a
     ciudades con cola más larga para distinguirlos visualmente.
   - Interceptores: línea blanca / cyan en movimiento.
   - Explosiones: círculo con opacidad decreciente en naranja/amarillo.
   - HUD en canvas: multiplicador de racha renderizado directamente sobre el
     canvas en la esquina superior derecha (tamaño grande, color que cambia de
     blanco a amarillo a rojo según nivel).
   - Cursor en canvas: cruz de mira en lugar del cursor nativo.

3. **Crear `src/app/games/missile-command/page.tsx`** — Server Component. Llama
   `getGame("missile-command")` y `getTopScores("missile-command", 10)` en
   paralelo. Muestra ficha (cover-missile, descripción, stat-strip, leaderboard
   top 10) y botón ▶ JUGAR AHORA que enlaza a `/player/missile-command`.
   Referencia: `src/app/games/asteroids/page.tsx`.

4. **Crear `src/app/player/missile-command/actions.ts`** — server action
   `saveScore(name, score)` que llama `insertScore({ game_id: 'missile-command',
score, player_name: name, user_id: null })`.
   Referencia: `src/app/player/asteroids/actions.ts`.

5. **Crear `src/app/player/missile-command/page.tsx`** — `"use client"`. Monta
   `<MissileCommandGame>` en `div.crt-screen` vía ref. HUD de React con score,
   ciudades restantes (iconos de ciudad: verde = en pie, gris = destruida) y
   multiplicador de racha actual (×1 … ×10) actualizados en tiempo real. El
   multiplicador se muestra con color que escala: blanco (×1–×3), amarillo
   (×4–×7), rojo parpadeante (×8–×10). Overlay de pausa. Modal de game-over con
   score final, input de nombre (máx. 3 letras, uppercase) + botón GUARDAR
   (llama `saveScore`, luego deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") +
   botón JUGAR DE NUEVO (llama `restart()`).
   Referencia: `src/app/player/asteroids/page.tsx`.

6. **Verificar build** — `npm run build` sin errores TypeScript.

---

## Acceptance criteria

- [ ] `/games` muestra la card de MISSILE COMMAND en el catálogo.
- [ ] `/games/missile-command` carga la ficha propia del juego sin errores.
- [ ] `/games/missile-command` muestra el top 10 de scores reales de MISSILE COMMAND.
- [ ] `/player/missile-command` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca automáticamente al entrar en `/player/missile-command`.
- [ ] El cursor del ratón sobre el canvas muestra una cruz de mira en lugar del cursor nativo.
- [ ] Al hacer clic, se lanza un interceptor desde la batería más cercana al punto pulsado.
- [ ] El teclado responde: P / Escape pausa/reanuda el juego.
- [ ] El HUD de React muestra score, ciudades restantes (6 iconos) y multiplicador de racha actualizados en tiempo real.
- [ ] El multiplicador de racha cambia de color según su nivel (blanco/amarillo/rojo).
- [ ] Las explosiones son circulares y destruyen misiles enemigos que entren en su radio.
- [ ] Destruir 3+ misiles con una explosión activa el bonus de multi-kill.
- [ ] Un misil que impacta en ciudad o batería resetea la racha a ×1.
- [ ] La batería recalentada bloquea sus disparos durante 1 segundo y luego se recupera.
- [ ] La frecuencia y velocidad de los misiles enemigos aumenta de forma continua con el tiempo.
- [ ] El juego termina cuando la última ciudad es destruida.
- [ ] Al perder aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" reinicia el juego sin recargar la página.
- [ ] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [ ] Tras guardar, el botón se deshabilita y muestra "✓ PUNTUACIÓN GUARDADA".
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: rutas dedicadas `/games/missile-command` y `/player/missile-command`** — mismo patrón que Asteroids; cada juego real tiene sus propias páginas.
- **Sí: implementación TypeScript desde cero en `MissileCommandGame.tsx`** — no existe started-game de referencia; consistente con el stack 100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game loop no necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno 800×600, escalado por CSS** — coordenadas de colisión no cambian al redimensionar.
- **Sí: control exclusivo por ratón** — Missile Command es el único juego del vault que usa el ratón como mecanismo principal; diferenciador claro en el catálogo.
- **Sí: munición infinita con sistema de calor** — elimina la frustración de quedarse sin balas pero añade una restricción táctil (la batería recalentada) que mantiene la tensión sin penalizar irreversiblemente al jugador.
- **Sí: multiplicador de racha** — mecánica de scoring moderna que premia la habilidad y crea partidas con puntuaciones muy variables, ideal para el leaderboard.
- **Sí: dificultad continua en lugar de oleadas** — el modo endless es más adecuado para el leaderboard competitivo: no hay techo de puntuación natural, la partida siempre termina por habilidad del jugador.
- **Sí: color `orange`** — único color sin asignar en el catálogo; visualmente evoca las explosiones del juego original.
- **No: `onLevel`** — no hay oleadas; la dificultad es continua y no hay un número de nivel significativo para el HUD.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **Esta variante vs la variante A:** la variante A replica el diseño clásico con oleadas, munición limitada por batería y bonus al fin de oleada; es más fiel al arcade original y tiene una curva de dificultad escalonada. Esta variante B abandona las oleadas en favor de un modo endless con dificultad continua, multiplicador de racha y sistema de calor en lugar de munición limitada; maximiza la tensión competitiva y las diferencias entre puntuaciones en el leaderboard.
