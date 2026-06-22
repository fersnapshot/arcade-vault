---
name: spec-game
description: >
  Diseña el spec para integrar un juego (con leaderboard) en Arcade Vault,
  siguiendo el método spec-driven de /spec. Úsala al añadir un juego nuevo,
  venga o no de references/started-games/. No escribe código; produce
  specs/NN-slug.md listo para /spec-impl. Trigger cuando el usuario mencione
  añadir un juego, integrar un juego, crear un spec de juego, o nombre algún
  juego concreto como Tetris, Arkanoid, Snake, etc.
disable-model-invocation: true
argument-hint: "<nombre o id del juego, o ruta en references/started-games/>"
---

# /spec-game — Diseñador de specs para juegos de Arcade Vault

Esta skill produce el spec que define cómo integrar un juego jugable en la
plataforma Arcade Vault. Es una variante especializada de `/spec`: el flujo es
idéntico (preguntas → redacción sección por sección → guardar), pero las
preguntas y la plantilla están orientadas al patrón de integración establecido
en los specs 05 y 06.

**La skill solo escribe el `.md` del spec.** Toda implementación (código,
migraciones, seeds) la ejecuta posteriormente `/spec-impl`.

---

## Filosofía

Un spec de juego no es documentación decorativa. Es el contrato que evita
que cada nuevo juego reinvente la rueda. El patrón ya existe — esta skill lo
captura y lo aplica de forma consistente.

**Reglas duras (nunca romper):**

- **Nunca escribir código** durante esta skill. Solo el `.md` final.
- **Nunca proponer implementar** después de guardar. El flujo termina cuando
  se escribe el archivo. El usuario ejecuta `/spec-impl` cuando esté listo.
- **Nunca generar el spec completo en una sola respuesta.** Sección a sección,
  con confirmación del usuario antes de avanzar.
- **Nunca asumir decisiones que el usuario no haya confirmado.** Si falta
  información, preguntar.
- Responder **en el idioma del prompt inicial**.
- Si el usuario quiere saltarse las preguntas, recordar: "Las preguntas ahora
  ahorran horas después. ¿Seguro que quieres saltarlas?" Si insiste, respetar
  y anotar en Decisions: "Definición rápida sin aclaración detallada".

---

## Patrón de integración de Arcade Vault

Este es el patrón que los specs 05 + 06 establecieron y que todo juego nuevo
debe seguir. La skill lo usa para rellenar el Implementation plan y las
Acceptance criteria del spec que genera.

### Archivos que crea o toca cada juego nuevo

| Archivo                               | Qué hace                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/games/<Name>Game.tsx` | Componente canvas del juego. Refactor TypeScript del `game.js` fuente (si existe). Canvas interno de tamaño fijo, escalado por CSS. Toda la lógica del juego en un `useEffect` con variables locales (sin estado React por entidad). `useImperativeHandle` expone `restart()` y `togglePause()`. Callbacks solo se llaman cuando el valor cambia. |
| `src/app/games/<id>/page.tsx`         | Ruta de detalle propia del juego (Server Component). Llama `getGame("<id>")` y `getTopScores("<id>", 10)`, muestra la ficha con leaderboard y el botón ▶ JUGAR AHORA. Patrón en `src/app/games/asteroids/page.tsx`.                                                                                                                               |
| `src/app/player/<id>/page.tsx`        | Ruta dedicada `"use client"`. Monta el componente en `div.crt-screen`, HUD de React (score, vidas, nivel según el juego), overlay de pausa y modal de game-over con input de nombre + botón GUARDAR.                                                                                                                                              |
| `src/app/player/<id>/actions.ts`      | Server action `saveScore` que llama `insertScore({ game_id: "<id>", score, player_name, user_id: null })`.                                                                                                                                                                                                                                        |
| Seed SQL                              | `INSERT INTO games (id, title, short, long, cat, cover, color) VALUES (...)` — incluido en el spec como bloque SQL; lo aplica `/spec-impl` vía MCP Supabase.                                                                                                                                                                                      |

### Lo que ya existe y no se toca

- **Tablas Supabase** `games` y `scores` ya creadas.
- **Queries server-side** `src/lib/supabase/queries.ts`: `getGame`, `getTopScores`,
  `getGamesWithBest`, `insertScore`, `getTopScoresByGame`, etc.
- **Tipos** `src/lib/supabase/types.ts`: `Game`, `Score`, `InsertScore`.
- **Ruta genérica `/player/[id]`** — existe como placeholder para juegos ficticios;
  cada juego real tiene su propia ruta `/player/<id>/page.tsx` (no se toca la genérica).
- **Ruta genérica `/games/[id]`** — existe pero cada juego real tiene su propia ruta
  `/games/<id>/page.tsx`. Patrón de referencia: `src/app/games/asteroids/page.tsx`.
- **Catálogo** `/games` — ya lee `getGamesWithBest()`, muestra automáticamente
  cualquier juego en la tabla `games`.

### Interfaz de callbacks del componente (referencia)

```ts
// Solo incluir los callbacks que el juego realmente use
interface GameCallbacks {
  onScore: (score: number) => void;
  onLives?: (lives: number) => void;      // omitir si el juego no tiene vidas
  onLevel?: (level: number) => void;      // omitir si el juego no tiene niveles
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

// Ref imperativo que expone la página padre
export interface <Name>Ref {
  restart: () => void;
  togglePause: () => void;
}
```

Patrón de referencia completo: `src/components/games/AsteroidsGame.tsx`,
`src/app/games/asteroids/page.tsx` y `src/app/player/asteroids/page.tsx`.

---

## Fases de la skill

### Fase 1 — Contexto del proyecto

Antes de hacer preguntas sobre el juego, recoger contexto del proyecto:

1. Leer `CLAUDE.md` (o `AGENTS.md` si no existe) para entender el stack.
2. Listar `specs/` para ver qué specs existen y cómo están numerados. Leer al
   menos los dos más recientes para capturar las convenciones del proyecto.
3. **Identificar el juego de origen:**
   - Si `$ARGUMENTS` se parece a una carpeta en `references/started-games/`
     (ej. `03-tetris`, `tetris`, `arkanoid`, `04-arkanoid`), buscar esa carpeta
     y leer su `README.md`, `CLAUDE.md` (si existe) y el comienzo de `game.js`
     (~100 líneas) para entender la mecánica, controles, scoring, vidas/niveles
     y power-ups **antes** de preguntar.
   - Si `$ARGUMENTS` es un nombre de juego sin carpeta en references, o está
     vacío, seguir a Fase 2 directamente.
4. Echar un vistazo a los archivos del patrón para luego referenciarlos bien
   en el spec:
   - `src/components/games/AsteroidsGame.tsx` (primeras 20 líneas)
   - `src/app/games/asteroids/page.tsx` (estructura de la ficha con leaderboard)
   - `src/app/player/asteroids/page.tsx` (estructura HUD y modal)
   - `src/app/player/asteroids/actions.ts`

Si `$ARGUMENTS` está vacío al empezar, pedir una descripción del juego en una
sola frase antes de continuar.

---

### Fase 2 — Preguntas de aclaración

Preguntar en **bloques de 3 a 5**, esperar respuesta antes del siguiente bloque.

**Cuándo parar:** cuando puedas responder estas tres preguntas sin asumir nada:

1. ¿Qué archivos aparecen o cambian?
2. ¿Cuál es el primer y el último paso ejecutable?
3. ¿Cómo verifico que el juego está integrado correctamente?

**Categorías de preguntas a cubrir:**

**Identidad del juego**

- `id` en kebab-case (ej. `cube-nexus`). ¿Ya existe un entry en `src/data/games.ts`? ¿Ese id es el definitivo?
- `title` (mayúsculas), `short` (frase corta del catálogo), `long` (descripción larga para la ficha).
- `cat`: ARCADE / PUZZLE / SHOOTER / VERSUS.
- `color`: cyan / magenta / green / yellow.
- `cover`: nombre del asset CSS (ej. `cover-tetro`). ¿Existe ya en el proyecto o hay que crear uno nuevo?

**Mecánica y HUD**

- ¿El juego tiene **vidas**? → si no, omitir `onLives` y el indicador de vidas en el HUD.
- ¿El juego tiene **niveles** (dificultad progresiva)? → si no, omitir `onLevel`.
- ¿Hay **power-ups**? Si los hay, ¿el canvas los muestra o el HUD de React también?
- ¿Cuál es la **condición de game over** (cuándo se dispara `onGameOver`)?

**Origen del código**

- ¿Viene de `references/started-games/`? ¿De una fuente externa (URL/repo)? ¿O se escribe desde cero?
- Si es externo: ¿bajo qué licencia? ¿Hay atribución que añadir al spec?

**Controles**

- Teclado: ¿qué teclas y qué hacen? Confirmar o listar.
- Táctil: por defecto fuera de scope — confirmar explícitamente si el usuario quiere incluirlo.

**Scope explícito (confirmar qué queda fuera)**

- Controles táctiles / móvil → fuera por defecto.
- Anti-cheat / validación servidor → fuera por defecto.
- Auth / `user_id` real → fuera por defecto (`user_id: null` siempre).

---

### Fase 3 — Redactar el spec sección a sección

Orden estricto. Mostrar cada sección en markdown, preguntar si se queda así o
se ajusta, esperar confirmación antes de la siguiente.

#### 3.1 — Header

```markdown
# SPEC NN — <Título descriptivo>

- **Status:** Draft
- **Depends on:** 05-asteroids-game, 06-games-db-and-leaderboard
- **Date:** <hoy>
- **Objective:** Integrar <TITLE> como juego jugable en Arcade Vault, accesible desde `/player/<id>`, con canvas escalado en el `crt-screen` y leaderboard real en Supabase.
```

#### 3.2 — Scope

**In:** listar los 5 archivos del patrón (componente, ruta games/<id>, ruta player, action, seed SQL) con sus rutas definitivas para este juego, más cualquier extra específico del juego (ej. assets nuevos).

**Out of scope:** controles táctiles, anti-cheat, auth/user_id real, otros juegos. Añadir los que el usuario haya confirmado como fuera.

#### 3.3 — Data model

Dos partes:

**1. Interfaz de callbacks del componente** (solo los que aplican según la mecánica):

```ts
interface <Name>Callbacks {
  onScore: (score: number) => void;
  // onLives / onLevel solo si el juego los tiene
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}

export interface <Name>Ref {
  restart: () => void;
  togglePause: () => void;
}
```

**2. Seed SQL del juego** (bloque SQL que `/spec-impl` aplicará vía MCP):

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  '<id>',
  '<TITLE>',
  '<short>',
  '<long>',
  '<CAT>',
  '<cover>',
  '<color>'
);
```

#### 3.4 — Implementation plan

Pasos numerados, cada uno deja el sistema funcional:

1. **Seed en Supabase** — ejecutar el INSERT SQL del Data model vía MCP
   (`mcp__supabase__execute_sql`). Verificar con `SELECT * FROM games WHERE id = '<id>'`.
2. **Crear `src/components/games/<Name>Game.tsx`** — refactor TypeScript del
   `game.js` fuente (o implementación nueva si no hay fuente). Canvas interno
   WxH fijo, escalado por CSS. Toda la lógica en `useEffect` con variables
   locales. `useImperativeHandle` expone `restart()` y `togglePause()`.
   Callbacks solo al cambiar valor. Referencia: `AsteroidsGame.tsx`.
3. **Crear `src/app/games/<id>/page.tsx`** — Server Component. Llama
   `getGame("<id>")` y `getTopScores("<id>", 10)` en paralelo. Muestra ficha
   (cover, descripción, stat-strip, leaderboard) y botón ▶ JUGAR AHORA que
   enlaza a `/player/<id>`. Referencia: `src/app/games/asteroids/page.tsx`.
4. **Crear `src/app/player/<id>/actions.ts`** — server action `saveScore(name,
score)` que llama `insertScore({ game_id: '<id>', score, player_name: name })`.
   Referencia: `src/app/player/asteroids/actions.ts`.
5. **Crear `src/app/player/<id>/page.tsx`** — `"use client"`. Monta
   `<Name>Game` en `div.crt-screen` via `ref`. HUD de React (score +
   [vidas] + [nivel]). Overlay de pausa. Modal de game-over con input de
   nombre (máx. 3 letras, uppercase) + botón GUARDAR (llama `saveScore`,
   luego deshabilita y muestra "✓ PUNTUACIÓN GUARDADA") + botón JUGAR DE
   NUEVO (llama `restart()`). Referencia: `src/app/player/asteroids/page.tsx`.
6. **Verificar build** — `npm run build` sin errores TypeScript.

#### 3.5 — Acceptance criteria

```markdown
- [ ] `/games` muestra la card de <TITLE> en el catálogo.
- [ ] `/games/<id>` carga la ficha propia del juego sin errores.
- [ ] `/games/<id>` muestra el top 10 de scores reales de <TITLE>.
- [ ] `/player/<id>` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca automáticamente al entrar en `/player/<id>`.
- [ ] Los controles de teclado funcionan: <listar teclas confirmadas en Fase 2>.
- [ ] El HUD de React muestra score [, vidas] [, nivel] actualizados en tiempo real.
- [ ] Al perder todas las vidas aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" en el modal reinicia el juego sin recargar la página.
- [ ] El botón "GUARDAR" inserta el score en Supabase con `user_id = null`.
- [ ] Tras guardar, el botón se deshabilita y muestra confirmación.
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] `npm run build` completa sin errores.
```

Ajustar según los callbacks/HUD que el juego tenga (omitir vidas/nivel si no aplica).

#### 3.6 — Decisions

Capturar al menos:

- **Sí: rutas dedicadas `/games/<id>` y `/player/<id>`** — mismo patrón que Asteroids; cada juego real tiene sus propias páginas.
- **Sí: refactor a TypeScript en `<Name>Game.tsx`** — consistente con el stack 100% TS.
- **Sí: lógica del juego en `useEffect` con variables locales** — el game loop no necesita reactividad de React; evita re-renders a 60 fps.
- **Sí: canvas interno WxH, escalado por CSS** — coordenadas de colisión no cambian.
- **No: controles táctiles** — fuera de scope; spec dedicado si se necesita.
- **No: `user_id` real** — sin auth aún; se añade en spec de autenticación.
- Cualquier otra decisión tomada durante las preguntas de Fase 2.

#### 3.7 — Risks (solo si aplica)

Omitir si no hay riesgos no obvios. Si el juego viene de fuente externa, mencionar la licencia.

---

### Fase 4 — Guardar el spec

Cuando todas las secciones estén confirmadas:

1. Determinar el número siguiente mirando `specs/`. Si el último es `06-...`, este será `07-`.
2. Generar un slug corto a partir del id del juego (ej. `tetris-game`, `arkanoid-integration`).
3. Proponer el nombre completo `specs/NN-slug.md` y confirmar con el usuario antes de escribir.
4. Crear el archivo con todas las secciones aprobadas.
5. Confirmar al usuario:
   - Ruta del archivo creado.
   - El spec está en estado `Draft`. Cambiarlo a `Approved` una vez revisado.
   - Siguiente paso: `/spec-impl NN-slug` para implementarlo.
6. **Parar aquí.** No proponer implementar, no sugerir pasos de código, no continuar.

---

## Argumento inicial

Si el usuario invocó `/spec-game 03-tetris`, usar `03-tetris` como pista del juego de origen
y buscar `references/started-games/03-tetris/` antes de preguntar.

Si invocó `/spec-game` sin argumento, pedir la descripción del juego en una frase antes de
continuar a Fase 2.
