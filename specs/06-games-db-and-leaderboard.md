# SPEC 06 — Base de datos de juegos, scores y leaderboard

- **Status:** Aprobado
- **Depends on:** 04-supabase-integration, 05-asteroids-game
- **Date:** 2026-06-20
- **Objective:** Crear las tablas `games` y `scores` en Supabase, migrar sólo el juego Asteroids, guardar scores reales desde Asteroids y cablear el leaderboard en `/hall-of-fame` y `/games/asteroids` con datos reales.

---

## Scope

**In:**

- Migración Supabase: tabla `games` (catálogo) y tabla `scores` (partidas).
- Seed inicial de `games` con solo el juego Asteroids.
- `src/lib/supabase/queries.ts` — funciones server-side para leer juegos y scores.
- `src/app/player/asteroids/page.tsx` — implementar el botón "GUARDAR" (antes stub)
  para insertar el score en la tabla `scores` al terminar una partida.
- `/hall-of-fame` — cablear con datos reales: top scores agrupados por juego.
- `/games/asteroids` — cablear el leaderboard con top scores de Asteroids.
- `best` y `plays` en la UI calculados dinámicamente desde `scores` (sin columnas extra en `games`).

**Out of scope:**

- Autenticación: `user_id` existe en el schema pero siempre será `null` por ahora.
- Leaderboard para juegos que no sean Asteroids (estructura preparada, UI no).
- Eliminar `src/data/games.ts` (se mantiene como referencia de seed).
- Controles táctiles ni otras mejoras al canvas de Asteroids.
- Validación de scores en servidor (anti-cheat).

---

## Data model

### Tabla `games`

| Columna    | Tipo        | Notas                            |
| ---------- | ----------- | -------------------------------- |
| id         | text        | PK, ej. `"asteroids"`            |
| title      | text        | `"ASTEROIDS"`                    |
| short      | text        | Descripción corta                |
| long       | text        | Descripción larga                |
| cat        | text        | `"SHOOTER"`, `"PUZZLE"`, etc.    |
| cover      | text        | Nombre del asset de portada      |
| color      | text        | Color de acento (`"cyan"`, etc.) |
| created_at | timestamptz | Default `now()`                  |

### Tabla `scores`

| Columna     | Tipo        | Notas                      |
| ----------- | ----------- | -------------------------- |
| id          | uuid        | PK, generado por Supabase  |
| game_id     | text        | FK → `games.id`            |
| score       | integer     | Puntuación final           |
| player_name | text        | Nombre libre, sin auth     |
| created_at  | timestamptz | Default `now()`            |
| user_id     | uuid        | Nullable, sin FK por ahora |

### Queries principales (`src/lib/supabase/queries.ts`)

```ts
// Todos los juegos
getGames(): Promise<Game[]>

// Top N scores de un juego concreto
getTopScores(gameId: string, limit?: number): Promise<Score[]>

// Top scores agrupados por juego (para hall-of-fame)
getTopScoresByGame(limit?: number): Promise<Record<string, Score[]>>

// Insertar score
insertScore(data: InsertScore): Promise<void>
```

---

## Implementation plan

1. **Migración Supabase** — crear tablas via MCP `apply_migration`:
   - Tabla `games` con las columnas confirmadas.
   - Tabla `scores` con FK a `games.id`.
   - RLS desactivado por ahora (datos públicos de lectura, inserción sin auth).

2. **Seed de `games`** — insertar via SQL el registro de Asteroids
   (campos `best` y `plays` no se migran, son calculados).

3. **Crear `src/lib/supabase/queries.ts`** — funciones server-side con el cliente
   de `src/lib/supabase/server.ts`:
   - `getGames()` — `select *` de `games`.
   - `getTopScores(gameId, limit = 10)` — scores de un juego ordenados por score desc.
   - `getTopScoresByGame(limit = 5)` — top N por cada juego (via query con window
     function o múltiples queries según lo que soporte el cliente Supabase).
   - `insertScore(data)` — insert en `scores`.

4. **Cablear `/hall-of-fame`** — convertir a Server Component que llama
   `getTopScoresByGame()` y renderiza el leaderboard por juego con datos reales.

5. **Cablear `/games/asteroids`** — añadir sección leaderboard que llama
   `getTopScores("asteroids")` y muestra el top 10.

6. **Implementar GUARDAR en `/player/asteroids`** — en el modal de game over,
   el botón "GUARDAR" llama `insertScore()` con `game_id: "asteroids"`,
   `score`, `player_name` del input, `user_id: null`. Tras guardar, mostrar
   confirmación y deshabilitar el botón.

---

## Acceptance criteria

- [ ] Las tablas `games` y `scores` existen en Supabase con el schema definido.
- [ ] El juego Asteroids está insertado en la tabla `games` (único seed inicial).
- [ ] `getGames()` devuelve los juegos desde Supabase sin errores de TypeScript.
- [ ] `getTopScores("asteroids", 10)` devuelve los scores correctos ordenados desc.
- [ ] `getTopScoresByGame()` devuelve scores agrupados por juego.
- [ ] `/hall-of-fame` muestra scores reales agrupados por juego (no datos stub).
- [ ] `/games/asteroids` muestra el top 10 de scores reales de Asteroids.
- [ ] El botón "GUARDAR" en el modal de game over inserta el score en Supabase.
- [ ] Tras guardar, el botón se deshabilita y muestra confirmación.
- [ ] `user_id` se guarda como `null` en todos los inserts.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: tablas `games` y `scores` separadas** — Permite escalar a múltiples juegos
  sin duplicar datos de catálogo en cada score.
  Descartado: una sola tabla con juego embebido en cada row de score — redundancia
  y dificulta actualizar metadatos del juego.

- **Sí: `best` y `plays` calculados dinámicamente desde `scores`** — Sin riesgo de
  inconsistencia entre el contador y los datos reales.
  Descartado: columnas en `games` actualizadas con cada insert — requiere transacción
  y puede desincronizarse si falla la actualización.

- **Sí: `user_id` nullable sin FK** — Permite jugar sin autenticación. La FK se
  añadirá cuando se implemente auth en un spec posterior.
  Descartado: requerir auth para guardar — bloquea la experiencia de usuario sin
  aportar valor en esta fase.

- **Sí: solo Asteroids en el seed inicial** — El resto del catálogo permanece en
  `src/data/games.ts` hasta que cada juego sea real y jugable.
  Descartado: migrar todos los juegos stub — Supabase quedaría con juegos sin scores
  posibles y `getTopScoresByGame()` devolvería vacíos para la mayoría.

- **No: RLS en Supabase por ahora** — Sin auth, activar RLS complicaría las queries
  sin aportar seguridad real. Se activa cuando se implemente auth.

- **No: validación anti-cheat de scores** — Fuera de scope; se aborda en un spec
  dedicado si el proyecto lo requiere.
