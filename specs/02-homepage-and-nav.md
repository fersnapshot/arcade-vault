# SPEC 02 — Homepage de Arcade Vault

- **Status:** Aprobado
- **Depends on:** 01-mvp-visual
- **Date:** 2026-06-15
- **Objective:** Crear la ruta `/` como homepage con hero, features, juegos, stats, actividad en vivo, precios y CTA final; y actualizar `Nav` para añadir el link "Inicio" y el contador de créditos hardcodeado.

---

## Scope

**In:**

- Ruta `/` — nueva `HomePage` con 7 secciones: Hero, ¿Por qué Arcade Vault?, Juegos disponibles, Stats, Actividad en vivo, Precios, CTA final.
- `src/app/page.tsx` — reemplaza el `redirect("/games")` actual por la nueva página.
- `src/components/Nav.tsx` — añade link "Inicio" (`/`), link "Acerca de" deshabilitado visualmente, y contador `CRÉDITOS · 03` hardcodeado.
- Siluetas flotantes pixel-art decorativas en el hero (SVG inline, `aria-hidden`).
- Sección "Juegos disponibles ahora": primeros 6 juegos de `GAMES` (`src/data/games.ts`), como `MiniCard` con cover CSS y link a `/game/[id]`.
- Sección "Actividad en vivo": datos derivados de `src/data/scores.ts` y `src/data/games.ts` — últimas puntuaciones y top 5 jugadores del día (estáticos, sin llamada a API).
- Todos los estilos nuevos en `src/app/globals.css` con variables CSS ya existentes.
- Animaciones reveal con `IntersectionObserver` (aparición al hacer scroll).

**Out of scope:**

- Ruta `/about` — spec posterior.
- Lógica real del contador de créditos (conectado a UserContext).
- Scores reales o llamadas a API.
- Animación de ticker en tiempo real (los datos son estáticos).

---

## Data model

No se introducen tipos ni archivos de datos nuevos. Se reutilizan:

- `GAMES: Game[]` de `src/data/games.ts` — primeros 6 para "Juegos disponibles ahora".
- `seededScores(seed, count): ScoreRow[]` de `src/data/scores.ts`:
  - **Top jugadores · Hoy**: `seededScores(1, 5)` — top 5 por score.
  - **Últimas puntuaciones**: una entrada por cada uno de los 6 juegos, tomando `seededScores(gameIndex, 1)[0]`, con tiempos relativos como array de strings hardcodeados (`["hace 2 min", "hace 5 min", ...]`).

Todo se computa en el módulo de la página, sin estado React ni efectos.

---

## Implementation plan

1. **Actualizar `src/app/page.tsx`** — eliminar el `redirect("/games")` y exportar el componente `HomePage` con las 7 secciones en orden.

2. **Estilos en `src/app/globals.css`** — añadir las clases necesarias para la homepage: `.home-hero`, `.home-silos`, `.silo`, `.feature-grid`, `.feature-card`, `.mini-rail`, `.mini-card`, `.home-stats`, `.activity-grid`, `.activity-card`, `.ticker`, `.top-list`, `.pricing-grid`, `.price-card`, `.home-final`, y animaciones reveal con `@keyframes`.

3. **Componente `FloatingSilhouettes`** — SVGs pixel-art inline dentro de `page.tsx`, `aria-hidden`, posicionados con CSS absoluto sobre el hero.

4. **Hook `useReveal`** — `IntersectionObserver` en `page.tsx` (client component) que añade clase `in` a elementos `.reveal` al entrar en viewport.

5. **Sección Hero** — eyebrow con blink, título en 3 líneas con colores neon, subtítulo, dos CTAs (`/games` y `/auth`), flecha de scroll.

6. **Sección ¿Por qué Arcade Vault?** — 4 feature cards con íconos SVG pixel inline (GAMEPAD, FREE, TROPHY, ROCKET) y colores por card.

7. **Sección Juegos disponibles ahora** — `GAMES.slice(0, 6)` como `MiniCard` con cover CSS (`cover-*` classes ya existentes) y `<Link href="/game/[id]">`.

8. **Sección Stats** — 3 bloques: `12+`, `MILES`, `GLOBAL`.

9. **Sección Actividad en vivo** — dos paneles: últimas puntuaciones (6 filas derivadas de `seededScores`) y top 5 jugadores (`seededScores(1, 5)`).

10. **Sección Precios** — price card con lista de features + stamp "FREE PLAY" + FAQ lateral.

11. **Sección CTA final** — título pixel, botón "INSERTAR MONEDA →", tagline.

---

## Acceptance criteria

- [x] La ruta `/` muestra la homepage; no redirige a `/games`.
- [x] El Nav muestra: logo con ícono pixel + "ARCADE VAULT" (cyan/magenta), links Inicio/Biblioteca/Salón de la Fama/Acerca de, créditos hardcodeados y botón de sesión.
- [x] El link activo en el Nav tiene color cyan y línea inferior visible.
- [x] "Acerca de" aparece en el Nav pero no es clickeable (sin ruta aún).
- [x] El hero muestra el título en 3 líneas con colores neon, los dos CTAs y las siluetas flotantes pixel-art.
- [x] Las secciones aparecen con animación fade-in al hacer scroll (IntersectionObserver).
- [x] La sección "Juegos disponibles ahora" muestra exactamente los primeros 6 juegos de `GAMES` con sus covers CSS y links a `/game/[id]`.
- [x] La sección "Actividad en vivo" muestra datos derivados de `seededScores` — no arrays hardcodeados en el JSX.
- [x] La sección "Precios" muestra el plan $0 con la lista de features, el stamp "FREE PLAY" y los 3 FAQs.
- [x] La página es responsive: el Nav colapsa a hamburger en móvil, las grids se apilan en una columna.
- [x] No hay errores de TypeScript ni warnings de consola al cargar la ruta `/`.

---

## Decisions taken and discarded

- **`/` como homepage, no redirección** — La ruta raíz ahora renderiza la homepage en lugar de redirigir a `/games`. La redirección era un placeholder del spec 01.

- **Datos de actividad desde `seededScores`, no hardcodeados** — Garantiza coherencia con los datos que ya usa el resto de la app (hall-of-fame, game detail). Descartado: constantes locales en `page.tsx` (habrían divergido de los scores reales).

- **Estilos en `globals.css`, no módulos CSS** — Consistente con la convención del proyecto (spec 01 usa el mismo enfoque). Descartado: CSS Modules o Tailwind puro (el template usa clases BEM propias que conviene mantener).

- **"Acerca de" deshabilitado en el Nav** — El link aparece pero no navega. Reservado para spec posterior. Descartado: omitirlo del Nav (perdería la estructura visual del diseño).

- **Créditos hardcodeados** — `CRÉDITOS · 03` es decorativo por ahora. Conectarlo a `UserContext` queda para cuando exista lógica de créditos real.
