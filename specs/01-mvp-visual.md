# SPEC 01 — MVP visual de Arcade Vault: cinco pantallas con App Router

- **Status:** Aprobado
- **Depends on:** ninguno
- **Date:** 2026-06-13
- **Objective:** Implementar las cinco pantallas visuales del MVP de Arcade Vault como rutas reales de Next.js App Router, sin backend ni persistencia.

---

## Scope

**In:**

- Ruta `/` redirige a `/library`.
- Ruta `/library` — (biblioteca) grid de juegos con búsqueda y filtro por categoría.
- Ruta `/game/[id]` — (detalle) ficha del juego con stats y leaderboard simulado.
- Ruta `/player/[id]` — reproductor visual con HUD, simulación CSS y modal de fin de juego.
- Ruta `/auth` — formulario de login/registro con tabs + botones sociales (solo visual).
- Ruta `/hall-of-fame` — (salon) Salón de la Fama con pódium y tabla por juego.
- Componente `Nav` compartido: links, contador de créditos, botón de sesión, menú móvil.
- Footer compartido en el layout raíz.
- Estado del usuario en React Context (se pierde al recargar); sin localStorage.
- Datos de juegos y scores como constantes TypeScript en `src/data/`.
- Covers de juegos como gradientes CSS puros.

**Out of scope (para specs futuros):**

- Lógica real de ningún juego.
- Autenticación con backend (NextAuth, OAuth real).
- Persistencia de scores o sesión en localStorage/DB.
- Imágenes reales de portada.
- Scores reales guardados por el usuario.

---

## Data model

```ts
// src/data/games.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // CSS class name, e.g. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;
}

export const GAMES: Game[] = [
  /* 8 juegos del template */
];
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
```

```ts
// src/data/scores.ts
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// src/context/UserContext.tsx
export interface User {
  name: string; // max 10 chars, uppercase
}

export interface UserContextValue {
  user: User | null;
  login: (u: User) => void;
  signOut: () => void;
}
```

---

## Implementation plan

1. Crear `src/data/games.ts` con `GAMES`, `CATS` y el tipo `Game`.
2. Crear `src/data/scores.ts` con `PLAYERS`, `ScoreRow` y `seededScores`.
3. Crear `src/context/UserContext.tsx` con `UserProvider` y `useUser`.
4. Actualizar `src/app/layout.tsx`: envolver con `UserProvider`, añadir `<Nav>` y `<footer>`.
5. Crear `src/components/Nav.tsx` con links, menú móvil y botón de sesión.
6. Crear `src/app/page.tsx` con redirect a `/library`.
7. Crear `src/app/library/page.tsx` con hero, buscador, chips de categoría y `GameCard`.
8. Crear `src/components/GameCard.tsx` con efecto tilt y botón JUGAR.
9. Crear `src/app/auth/page.tsx` con tabs login/registro y botones sociales.
10. Crear `src/app/game/[id]/page.tsx` con cover, stats, acciones y leaderboard lateral.
11. Crear `src/app/player/[id]/page.tsx` con HUD, arena CSS, pausa y modal de fin de juego.
12. Crear `src/app/hall-of-fame/page.tsx` con pódium, tabs por juego y tabla de scores.

---

## Acceptance criteria

- [ ] `/` redirige automáticamente a `/library`.
- [ ] La biblioteca muestra los 8 juegos del catálogo.
- [ ] El buscador filtra juegos por nombre en tiempo real.
- [ ] Los chips de categoría filtran el grid correctamente.
- [ ] Hacer clic en una card o en JUGAR navega a `/game/[id]`.
- [ ] La página de game muestra el cover, stats y leaderboard simulado del juego correcto.
- [ ] El botón "JUGAR AHORA" en game navega a `/player/[id]`.
- [ ] El reproductor muestra HUD con score, vidas y nivel.
- [ ] El score sube automáticamente mientras no hay pausa ni fin de juego.
- [ ] El botón PAUSA detiene el score y muestra overlay; REANUDAR lo continúa.
- [ ] El botón FIN muestra el modal de fin de juego con el score final.
- [ ] El modal de fin de juego muestra el estado "PUNTUACIÓN GUARDADA" al pulsar guardar (sin persistir nada).
- [ ] `/auth` muestra los tabs INICIAR SESIÓN y CREAR CUENTA, y alterna el campo de email.
- [ ] Iniciar sesión actualiza el `Nav` con el nombre del usuario.
- [ ] Cerrar sesión desde el `Nav` vuelve a mostrar el botón "Iniciar Sesión".
- [ ] El Salón de la Fama muestra pódium y tabla; los tabs cambian los scores por juego.
- [ ] El `Nav` es responsive: en móvil aparece el menú hamburguesa con panel lateral.
- [ ] No hay errores en consola al navegar entre todas las rutas.

---

## Decisions

- **Sí:** App Router con rutas reales (`/library`, `/game/[id]`, etc.). Es la forma natural en Next.js y permite deep linking.
- **No:** SPA con estado de navegación interno. Descartado porque rompe el back del browser y el deep linking.
- **Sí:** React Context para el estado del usuario. Sin dependencias extra, suficiente para este MVP.
- **No:** Zustand u otra librería de estado. Sobreingeniería para un estado tan simple en este momento.
- **Sí:** Datos en `src/data/` como constantes TypeScript. Fácil de reemplazar por llamadas a API en un spec futuro.
- **No:** localStorage para usuario o scores. Fuera de scope en este MVP; se añadirá cuando haya backend real.
- **Sí:** Covers como gradientes CSS. Mantiene el estilo arcade del template sin dependencias de assets.
- **No:** Imágenes reales de portada. Se evaluarán en un spec futuro.
- **Sí:** Simulación visual en el reproductor (score con `setInterval`, enemigos CSS). Cumple el objetivo visual sin implementar lógica de juego real.

---

## What is **not** in this spec

- Lógica real de ningún juego.
- Autenticación con backend (NextAuth, OAuth real con Google/GitHub).
- Persistencia de scores o sesión (localStorage, base de datos).
- Imágenes reales de portada de juegos.
- Scores reales guardados por el usuario autenticado.

Cada uno de estos, si llega, va en su propio spec.
