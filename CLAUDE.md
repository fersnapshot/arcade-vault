# CLAUDE.md

Este archivo proporciona instrucciones a Claude Code (claude.ai/code) para trabajar en este repositorio.

@AGENTS.md

## Proyecto

Arcade Vault — plataforma de juegos online donde los usuarios compiten por la puntuación más alta. Los juegos se renderizan en un canvas dentro de una pantalla con efecto CRT y envían puntuaciones a un leaderboard real. Los juegos nuevos se construyen spec-first con `/spec-game` (variante especializada de `/spec`) y luego se implementan con `/spec-impl`.

## Stack

- **Next.js 16.2.9** con App Router — leer `node_modules/next/dist/docs/` antes de escribir código; las APIs difieren de versiones anteriores
- **React 19.2.4** con React Compiler activo (`reactCompiler: true` en `next.config.ts`)
- **Tailwind CSS v4** — basado en PostCSS, config en `postcss.config.mjs`; la sintaxis v4 difiere de v3
- **TypeScript**
- **Supabase** (`@supabase/ssr`) — Postgres con tablas `games` + `scores`; proyecto configurado vía MCP en `.mcp.json`
- **Resend** (`resend`) — email transaccional para el formulario de contacto

No se ha configurado ningún ejecutor (motor) de pruebas.

## Skills

- `/frontend-design` — siempre usar para diseñar la interfaz de usuario.
- `/spec-game` — diseña el spec para integrar un juego nuevo (con leaderboard) siguiendo el patrón de los specs 05/06. Solo escribe `specs/NN-slug.md`; no implementa. Definido en `.claude/skills/spec-game/`.
- `/spec-impl-game <NN-slug>` — implementa un spec aprobado y encadena en secuencia estricta: `@skin-designer` (3 skins obligatorias) y luego `@mobile-porter` (soporte móvil). Usar cuando se quiera dejar el juego completamente integrado de una vez.

## Agentes

- `@game-planner` — recomienda UN juego nuevo que encaje en la plataforma. Usar antes de `/spec-game`.
- `@game-jam` — genera 2 specs completos (variantes A y B) para un juego dado. No implementa código.
- `@skin-designer` — garantiza ≥3 skins (`classic`, `neon`, `retro`) en un juego implementado.
- `@mobile-porter` — garantiza soporte móvil (SPEC 10) en un juego implementado.
- `@game-performance-booster` — aplica patrones de rendimiento (SPEC 12) a un juego implementado.
- `@security-auditor` — audita seguridad y reporta hallazgos.

## Arquitectura

Solo App Router — sin Pages Router. Todas las rutas viven bajo `src/app/`. El layout raíz en `src/app/layout.tsx` configura las fuentes **Press Start 2P** (`--font-pixel`) y **JetBrains Mono** (`--font-mono`), el fondo CRT/ruido, el `Nav`, el footer, y envuelve todo en `UserProvider`.

React Compiler está activo, por lo que las optimizaciones manuales con `useMemo`/`useCallback` son innecesarias y deben evitarse.

### Supabase

- Cliente server: `src/lib/supabase/server.ts` (`createClient()` — async, basado en cookies).
- Queries (server-side): `src/lib/supabase/queries.ts` — `getGame`, `getGames`, `getGamesWithBest`, `getTopScores`, `getTopScoresByGame`, `insertScore`, etc.
- Tipos: `src/lib/supabase/types.ts` — `Game`, `Score`, `GameWithBest`, `InsertScore`.
- Las tablas `games` y `scores` ya existen; los cambios de esquema van por MCP (`mcp__supabase__apply_migration` / `execute_sql`).

### Patrón de integración de juegos

Cada juego real tiene rutas dedicadas (las genéricas `/games/[id]` y `/player/[id]` son placeholders y no se tocan). Implementación de referencia: **Asteroids**. Por juego:

- `src/components/games/<Name>Game.tsx` — componente canvas. Tamaño interno fijo escalado por CSS; toda la lógica del juego en un único `useEffect` con variables locales (sin estado React por entidad); `useImperativeHandle` expone `restart()` / `togglePause()`; los callbacks se disparan solo al cambiar el valor.
- `src/app/games/<id>/page.tsx` — Server Component página de detalle: `getGame` + `getTopScores`, muestra la ficha, leaderboard y ▶ JUGAR AHORA.
- `src/app/player/<id>/page.tsx` — página `"use client"`: monta el juego en `div.crt-screen`, HUD de React (score / vidas / nivel), overlay de pausa, modal de game-over con input de nombre + guardar.
- `src/app/player/<id>/actions.ts` — server action `saveScore` que llama a `insertScore` (siempre `user_id: null`; auth aún no implementado).

Juegos implementados: ver `references/implemented-games.md`.

La sesión de usuario es client-only en memoria via `src/context/UserContext.tsx` (`useUser`); no es auth real.

## Specs

Todos los specs viven en `specs/NN-slug.md` (numeración secuencial).

Los specs de game-jam viven en `specs/game-jam/<game-id>/`.

## Flujo de trabajo

Las funcionalidades se construyen spec-first. Para un juego nuevo usar `/spec-game <nombre|referencia>` para escribir el spec, luego `/spec-impl NN-slug` para implementarlo. Los fuentes de los juegos pueden venir de `references/started-games/`. Seguir las pautas en <https://github.com/Klerith/fernando-skills>.
