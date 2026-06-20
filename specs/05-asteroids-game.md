# SPEC 05 — Juego Asteroids integrado en la plataforma

- **Status:** Aprobado
- **Depends on:** 01-mvp-visual (estructura de rutas y componentes del player)
- **Date:** 2026-06-20
- **Objective:** Integrar el juego Asteroids como primera partida jugable real en la plataforma, accesible desde `/player/asteroids`, con el canvas escalado dentro del `crt-screen` y comunicación en tiempo real entre la lógica del juego y el HUD de React.

---

## Scope

**In:**

- `src/data/games.ts` — nueva entrada con `id: "asteroids"`.
- `src/components/games/AsteroidsCanvas.tsx` — refactor TypeScript del `game.js` original;
  recibe callbacks para notificar cambios de score, vidas, nivel y game over.
- `src/app/player/asteroids/page.tsx` — ruta dedicada que monta `AsteroidsCanvas`,
  gestiona el HUD de React y muestra el modal de game over.
- Canvas escalado con CSS para caber en el `crt-screen` responsivo sin scroll horizontal
  (transform scale o `width/height: 100%` manteniendo aspect ratio 4:3).

**Out of scope:**

- Controles táctiles para móvil.
- Persistencia de puntuación en Supabase.
- Modificación de `/player/[id]/page.tsx` (el simulador genérico queda intacto).
- Integración de otros juegos.
- Leaderboard real (usa datos stub como el resto de juegos).

---

## Data model

Interfaz de callbacks que `AsteroidsCanvas` acepta como props:

```ts
interface AsteroidsCallbacks {
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
}
```

El componente no gestiona estado React interno — toda la lógica del juego vive
en variables de módulo dentro del `useEffect` que arranca el game loop.
Los callbacks se llaman desde el loop cuando detectan un cambio de valor.

No se introducen tipos nuevos en `src/data/games.ts`; la entrada de Asteroids
usa la interfaz `Game` existente:

```ts
{
  id: "asteroids",
  title: "ASTEROIDS",
  short: "Destroy the rocks. Survive the void.",
  long: "Campo de asteroides toroidal: los grandes se parten en medianos, los medianos en pequeños. Power-up de disparo triple. ¿Cuántos niveles aguantas?",
  cat: "SHOOTER",
  cover: "cover-rocas",
  color: "cyan",
  best: 0,
  plays: "0",
}
```

---

## Implementation plan

1. **Añadir entrada en `src/data/games.ts`** — nueva entrada `"asteroids"` al array
   `GAMES` con los datos confirmados.

2. **Crear `src/components/games/AsteroidsCanvas.tsx`** — refactor TypeScript del
   `game.js` original:
   - `useRef<HTMLCanvasElement>` para el canvas.
   - Toda la lógica del juego (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`,
     `Particle`, game loop, colisiones) dentro de un `useEffect` que arranca al montar
     y cancela el `requestAnimationFrame` al desmontar.
   - Input (`keydown`/`keyup`) registrado en el `useEffect` y limpiado en el cleanup.
   - Los callbacks (`onScore`, `onLives`, `onLevel`, `onGameOver`, `onPause`) se llaman
     solo cuando el valor cambia para evitar re-renders innecesarios.
   - Canvas interno fijo 800×600 (lógica del juego). CSS escala el elemento canvas
     con `style={{ width: '100%', height: '100%', objectFit: 'contain' }}` para
     caber en `crt-screen` sin distorsión.
   - El componente expone un ref imperativo (`useImperativeHandle`) con método
     `restart()` para que la página padre pueda reiniciar desde el modal.

3. **Crear `src/app/player/asteroids/page.tsx`** — página dedicada:
   - Monta `AsteroidsCanvas` dentro del `div.crt-screen` existente.
   - Estado React local: `score`, `lives`, `level`, `paused`, `gameOver`.
   - HUD de React actualizado vía callbacks.
   - Botón pausa llama al método `onPause` y muestra overlay.
   - Modal de game over igual al de `/player/[id]` (puntuación final, input nombre,
     botón guardar stub, botón jugar de nuevo que llama `restart()`).

---

## Acceptance criteria

- [ ] `/games` muestra la card de ASTEROIDS en el catálogo.
- [ ] `/games/asteroids` carga la ficha del juego sin errores.
- [ ] `/player/asteroids` carga sin errores de TypeScript ni warnings en consola.
- [ ] El canvas ocupa el `crt-screen` sin scroll horizontal en desktop y tablet.
- [ ] El juego arranca automáticamente al entrar en `/player/asteroids`.
- [ ] Los controles de teclado (←→ rotar, ↑ propulsar, Espacio disparar) funcionan.
- [ ] El HUD de React muestra score, vidas y nivel actualizados en tiempo real.
- [ ] El power-up de disparo triple funciona y su contador se refleja en el canvas.
- [ ] Al perder todas las vidas aparece el modal de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" en el modal reinicia el juego sin recargar la página.
- [ ] El botón pausa detiene el game loop y muestra el overlay; reanudar lo reactiva.
- [ ] `npm run build` completa sin errores.

---

## Decisions

- **Sí: ruta dedicada `/player/asteroids`** — Evita condicionales por juego en la
  página genérica `[id]`. Cada juego real tendrá su propia página; el genérico
  queda como placeholder para los ficticios.
  Descartado: condicional en `[id]` — ensucia la página con lógica específica de juego.

- **Sí: refactor a TypeScript en `AsteroidsCanvas.tsx`** — Consistente con el stack
  100% TypeScript del proyecto. Los tipos detectan errores en los callbacks.
  Descartado: copiar `game.js` sin cambios con `// @ts-nocheck` — deuda técnica
  innecesaria en un proyecto nuevo.

- **Sí: lógica del juego en `useEffect` con variables de módulo locales** — El game
  loop no necesita reactividad de React; vivir fuera del estado evita re-renders
  durante el loop (60 fps).
  Descartado: clases con estado React (`useState`) para cada entidad — destruiría
  el rendimiento.

- **Sí: canvas interno 800×600, escalado por CSS** — La lógica de colisiones y
  coordenadas no cambia; solo el elemento DOM se escala visualmente.
  Descartado: redimensionar el canvas en JS con `resize` observer — complejidad
  extra sin beneficio real para un juego de estas dimensiones.

- **No: persistencia de scores** — Sin tabla en Supabase aún. El botón "GUARDAR"
  queda como stub; se implementa en un spec posterior.

- **No: controles táctiles** — Fuera de scope; se añaden en spec dedicado.
