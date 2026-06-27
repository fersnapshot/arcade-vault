# SPEC missile-command (variante A) — Missile Command clásico con vidas y niveles

- **Status:** Draft
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** 2026-06-27
- **Objective:** Integrar MISSILE COMMAND como juego jugable en Arcade Vault, accesible
  desde `/player/missile-command`, con canvas escalado en el `crt-screen`, HUD de score
  - ciudades restantes + oleada, y leaderboard real en Supabase.

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
  onLevel: (wave: number) => void; // número de oleada actual
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface MissileCommandRef {
  restart: () => void;
  togglePause: () => void;
}
```

### Tabla de puntuación

| Objetivo                   | Puntos base | Multiplicador de oleada |
| -------------------------- | ----------- | ----------------------- |
| Misil enemigo destruido    | 25          | ×oleada                 |
| Avión / satélite destruido | 100         | ×oleada                 |
| Ciudad en pie al final     | 100         | ×oleada                 |
| Misil antiéreo sobrante    | 5           | ×oleada                 |

El multiplicador de oleada es igual al número de oleada (oleada 1 → ×1, oleada 2 → ×2, etc.). Se calcula al finalizar cada oleada.

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
   - `batteries[3]` — posiciones fijas de las tres baterías: izquierda, centro, derecha.
   - `cities[6]` — estado vivo/destruido de cada ciudad.
   - `wave` — número de oleada actual.

   Mecánica de oleada: al inicio de cada oleada se generan N misiles enemigos
   (N = 10 + 5 × (wave - 1), máx. 40) con destino aleatorio entre ciudades y
   baterías. Velocidad base aumenta un 15% por oleada. La oleada termina cuando
   todos los misiles enemigos han impactado o han sido destruidos. Bonus de fin
   de oleada calculado según tabla del Data model antes de iniciar la siguiente.

   Mecánica de explosión: al hacer clic, el interceptor sale de la batería más
   cercana al cursor. Al llegar al punto de destino (o a cualquier objeto en su
   radio) genera una explosión circular que crece hasta `maxRadius` (40 px) y
   luego se contrae. Cualquier misil que entre en la explosión es destruido.

   Las baterías tienen munición limitada: 10 interceptores cada una al inicio
   de cada oleada. Si las tres baterías quedan vacías durante la oleada, el
   jugador no puede lanzar más interceptores hasta la siguiente.

   `useImperativeHandle` expone `restart()` y `togglePause()`. Callbacks
   `onScore`, `onLives`, `onLevel`, `onGameOver` y `onPause` solo se llaman
   cuando el valor cambia. Referencia: `AsteroidsGame.tsx`.

   Render del canvas:
   - Fondo negro con gradiente sutil azul-oscuro en la parte superior (cielo).
   - Tierra: franja marrón en la parte inferior de 40 px.
   - Ciudades: dibujo geométrico simple (rectángulos apilados tipo skyline CRT)
     en color verde cuando están en pie, gris oscuro cuando destruidas.
   - Baterías: triángulo con base en la tierra, color blanco, con indicador
     de munición (barras pequeñas) encima.
   - Misiles enemigos: línea trazada desde el borde superior, punta en movimiento
     con trazo de cola en magenta / rojo.
   - Interceptores: línea blanca / cyan en movimiento.
   - Explosiones: círculo con opacidad decreciente en naranja/amarillo.
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
   oleada actualizados en tiempo real. Overlay de pausa. Modal de game-over con
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
- [ ] El HUD de React muestra score, ciudades restantes (6 iconos) y oleada actualizados en tiempo real.
- [ ] Las explosiones son circulares y destruyen misiles enemigos que entren en su radio.
- [ ] La batería lanza solo desde las que tienen munición; si las tres están vacías no se dispara.
- [ ] Al inicio de cada oleada, las baterías se recargan y se aplica el bonus de oleada.
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
- **Sí: control exclusivo por ratón** — Missile Command es el único juego del vault que usa el ratón como mecanismo principal de disparo; diferencia clara en el catálogo.
- **Sí: `onLives` para ciudades** — el número de ciudades en pie es la "vida" del jugador; comunicarlo con `onLives` es semánticamente coherente con el patrón.
- **Sí: tres baterías con munición limitada** — reproduce la mecánica clásica que obliga a elegir qué misiles interceptar; añade tensión estratégica.
- **Sí: color `orange`** — único color sin asignar en el catálogo; visualmente evoca las explosiones del juego original.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- **Esta variante vs la variante B:** esta variante A es el modo clásico con oleadas definidas, munición limitada por batería y bonus al final de oleada. La variante B elimina las baterías delimitadas, da munición infinita y cambia la progresión a modo endless con multiplicador de racha.
