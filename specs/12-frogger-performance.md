# SPEC 12 — Optimización de rendimiento en FroggerGame

- **Status:** Aprobado
- **Depends on:** 11-virtual-gamepad-redesign (Frogger ya implementado)
- **Date:** 2026-06-26
- **Objective:** Eliminar tres fuentes de derroche de CPU/GPU en FroggerGame:
  redraws innecesarios durante la pausa, una allocación per-frame en el loop
  RAF, y re-renders React del componente causados por un useLayoutEffect
  sin array de deps.

---

## Scope

### In

- `src/components/games/FroggerGame.tsx`:
  - RAF loop: saltar `draw()` (y `update()`) cuando `pausedRef.current === true`;
    el canvas retiene el último frame sin pintar nada nuevo.
  - Precomputar `laneByRow: Map<number, Lane>` en `buildLanes()` y regenerarlo
    en cada `init()` / `resetLevel()`. Sustituir `lanes.find(...)` por
    `laneByRow.get(frog.row)`.
  - Convertir el `useLayoutEffect` de sincronización de refs (sin deps) en
    efectos individuales con arrays de dependencias explícitos, eliminando
    la ejecución en cada render del padre.

- `src/app/games/frogger/play/page.tsx`:
  - Auditar si los callbacks inline (`onGameOver`, `onScoreChange`, etc.)
    se recrean en cada render del padre y, si React Compiler no los estabiliza,
    envolverlos en `useCallback`.

### Out

- Lógica de gameplay — ningún cambio en reglas, colisiones, puntuación.
- `VirtualGamepad.tsx` — sin tocar.
- Otros juegos (Asteroids, Tetris, Arkanoid, Snake) — fuera de alcance.
- Optimizaciones de canvas (offscreen canvas, dirty regions) — fuera de alcance.

---

## Implementation plan

1. **`FroggerGame.tsx` — skip draw en pausa**
   Añadir early return en `loop()` antes de `update()` y `draw()`:

   ```ts
   if (pausedRef.current) {
     rafId = requestAnimationFrame(loop);
     return;
   }
   ```

   El canvas retiene el último frame pintado; no se necesita draw explícito
   al pausar.

2. **`FroggerGame.tsx` — precomputar laneByRow**
   - Declarar `let laneByRow: Map<number, Lane>` junto a `let lanes`.
   - En `buildLanes()` (o justo después de llamarlo), construir el Map:
     `laneByRow = new Map(lanes.map(l => [l.row, l]))`.
   - Regenerar en cada `init()` y en cada transición de nivel.
   - Sustituir `lanes.find((l) => l.row === frog.row)` (línea 559) por
     `laneByRow.get(frog.row) ?? null`.

3. **`FroggerGame.tsx` — useLayoutEffect con deps explícitos**
   Reemplazar el `useLayoutEffect` sin deps por efectos separados:

   ```ts
   useLayoutEffect(() => {
     cbRef.current = {
       onScoreChange,
       onLivesChange,
       onLevelChange,
       onGameOver,
     };
   }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

   useLayoutEffect(() => {
     pausedRef.current = paused;
   }, [paused]);
   useLayoutEffect(() => {
     skinRef.current = skin;
   }, [skin]);
   ```

4. **`play/page.tsx` — auditar estabilidad de callbacks**
   Abrir el archivo y verificar si `onGameOver` y demás callbacks inline
   son memoizados por React Compiler (buscar si el compilador genera
   `_c` / `$` memoization helpers en el build). Si no, envolver con
   `useCallback`. Documentar la decisión en el commit.

---

## Acceptance criteria

- [ ] Con el juego en pausa, el CPU usage del tab (DevTools Performance) no
      muestra actividad de paint/composite por encima del idle baseline.
- [ ] `lanes.find` no aparece en ningún frame del profiler durante gameplay
      activo; la búsqueda usa `laneByRow.get`.
- [ ] En React DevTools Profiler, `FroggerGame` no aparece como re-rendered
      durante una partida activa cuando solo cambia `score`, `lives` o
      `level` en el padre (i.e., las props de FroggerGame no cambiaron).
- [ ] El juego sigue funcionando correctamente tras pausar y reanudar:
      entidades retoman posición, timer continúa, rana responde a input.
- [ ] No hay regresiones visuales en los tres skins (classic, neon, retro).
- [ ] No hay regresiones en móvil (VirtualGamepad sigue funcionando).

---

## Decisions taken and discarded

- **Pause: skip draw vs cancelar RAF + restart manual.**
  Elegido: skip draw (early return en loop). Descartado: cancelar RAF al pausar
  y relanzarlo al reanudar, porque requeriría detectar la transición
  paused→playing desde dentro del componente (un efecto adicional vigilando
  `paused`), añadiendo complejidad sin beneficio real — el RAF en idle consume
  <0.1 ms/frame.

- **Lookup: Map vs array indexado por row.**
  Elegido: `Map<number, Lane>`. Descartado: array con índice directo
  (`lanes[row]`) porque las filas no son contiguas desde 0 y habría huecos;
  el Map es más legible y suficientemente rápido.

- **useLayoutEffect: efectos separados vs useEffect.**
  Elegido: `useLayoutEffect` con deps explícitos (manteniendo `Layout` para
  que los refs estén actualizados antes de cualquier paint). Descartado:
  `useEffect` porque introduciría un frame de lag en la sincronización de
  `pausedRef` y `skinRef`.

- **React.memo en FroggerGame.**
  No añadido: React Compiler (`reactCompiler: true`) ya genera memoización
  equivalente. Si tras el paso 3 persisten re-renders, se revisará en un
  follow-up.

- **Callbacks en play/page.tsx.**
  Decisión diferida al paso 4 del plan: depende de si React Compiler los
  estabiliza. Se documenta el resultado en el commit.

---

## Risks

- **Canvas en blanco al reanudar.** Si el browser descarta el contexto 2D
  mientras el RAF está en idle (raro pero posible en mobile con memory
  pressure), el canvas aparecerá vacío al reanudar. Mitigación: no es
  responsabilidad de este spec; el juego ya tiene `key={gameKey}` para
  hard-reset si es necesario.

- **useLayoutEffect con deps y React Compiler.** El compilador puede
  reescribir los efectos; si genera deps incorrectos podría romper la
  sincronización de refs. Verificar en dev que los tres efectos se disparan
  cuando y solo cuando sus deps cambian.
