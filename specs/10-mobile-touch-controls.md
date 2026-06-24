# SPEC 10 — Soporte de controles táctiles en móvil

- **Status:** Aprobado
- **Depends on:** 05-asteroids-game, 07-tetris-game, 08-arkanoid-game, 09-snake-game
- **Date:** 2026-06-24
- **Objective:** Hacer que los cuatro juegos (Asteroids, Tetris, Arkanoid, Snake)
  sean jugables en dispositivos táctiles móviles, con layout responsive
  (canvas arriba, gamepad virtual abajo) y HUD oculto en móvil salvo
  botón de pausa y selector de skin.

---

## Scope

### In

- Layout responsive en las cuatro páginas player:
  `src/app/player/asteroids/page.tsx`
  `src/app/player/tetris/page.tsx`
  `src/app/player/arkanoid/page.tsx`
  `src/app/player/snake/page.tsx`
- Nuevo componente compartido `src/components/ui/VirtualGamepad.tsx`:
  d-pad (4 direcciones) + 2 botones de acción (A / B) + botón Pausa
  - selector de skin — visible solo en móvil (`md:hidden`)
- Canvas escalado al ancho del viewport en móvil (CSS, sin tocar lógica)
- HUD (score / vidas / nivel) oculto en móvil (`hidden md:flex`)
- Controles táctiles implementados como eventos sintéticos `keydown`/`keyup`
  en `window` — sin modificar la lógica interna de ningún juego
- Mapeo de controles:

  | Juego     | D-pad                          | Botón A  | Botón B   |
  | --------- | ------------------------------ | -------- | --------- |
  | Snake     | 4 direcciones                  | —        | —         |
  | Arkanoid  | ← → paleta                     | lanzar   | —         |
  | Tetris    | ← → mover, ↓ acelerar, ↑ rotar | rotar    | drop duro |
  | Asteroids | ← → rotar, ↑ empuje            | disparar | escudo    |

### Out of scope

- Modificar la lógica de gameplay de ningún juego
- Soporte landscape / rotación de pantalla
- Gestos swipe (se usa d-pad, no swipe)
- Juegos futuros (cada spec nuevo incluirá el mapeo)
- HUD visible en móvil (se oculta por decisión de diseño)
- Tamaños de fuente o botones de modal agrandados para móvil

---

## Data model

No hay cambios de esquema en Supabase ni en localStorage.

### Interfaz de `VirtualGamepad`

```ts
// Mapa de teclas que el gamepad debe emitir por acción
interface GamepadKeyMap {
  up?: string; // e.g. "ArrowUp"
  down?: string; // e.g. "ArrowDown"
  left?: string; // e.g. "ArrowLeft"
  right?: string; // e.g. "ArrowRight"
  actionA?: string; // e.g. " " (espacio)
  actionB?: string; // e.g. "x"
}

interface VirtualGamepadProps {
  keyMap: GamepadKeyMap;
  onPause: () => void;
  skin: string;
  skins: { id: string; label: string }[];
  onSkinChange: (skin: string) => void;
}
```

Cada página player pasa el `keyMap` específico de su juego.

---

## Implementation plan

1. **Crear `VirtualGamepad.tsx`** — componente `md:hidden` con:
   - D-pad (4 botones direccionales) en la mitad izquierda
   - Botones A y B en la mitad derecha (se ocultan si `keyMap.actionA/B` es undefined)
   - Fila inferior: botón Pausa + selector de skin
   - Al pulsar/soltar cada botón: dispatch de `KeyboardEvent` (`keydown`/`keyup`)
     sobre `window` con la tecla definida en `keyMap`
   - Touch events con `touchstart`/`touchend` (no `click`) para respuesta inmediata
   - `preventDefault()` en todos los touch events para evitar scroll accidental

2. **Hacer responsive el layout de cada página player** — en las 4 páginas:
   - En móvil (`< md`): canvas ocupa el ancho completo; columna única
     (canvas arriba, gamepad abajo)
   - En desktop (`md+`): layout actual sin cambios
   - HUD existente marcado `hidden md:flex` (o equivalente Tailwind v4)
   - Botón Pausa del HUD desktop marcado `hidden md:flex`

3. **Integrar `VirtualGamepad` en cada página player** — pasar el `keyMap`
   específico, conectar `onPause` a `gameRef.current.togglePause()`,
   y pasar el estado de skin + handler existente

4. **Escalar el canvas en móvil** — asegurar que el contenedor `crt-screen`
   usa `w-full` y `max-w-full` en móvil para que el canvas CSS-scale
   aproveche el ancho disponible

5. **Verificar los cuatro juegos** en un viewport móvil (375 px):
   Asteroids, Tetris, Arkanoid y Snake — gameplay completo con gamepad virtual

---

## Acceptance criteria

- [ ] En viewport < 768 px, el HUD (score / vidas / nivel) no es visible
- [ ] En viewport < 768 px, el canvas ocupa el ancho completo de la pantalla
- [ ] El componente `VirtualGamepad` aparece debajo del canvas solo en móvil;
      en desktop no se renderiza
- [ ] El d-pad emite los eventos de teclado correctos para cada juego:
      Snake (4 flechas), Arkanoid (← →, lanzar), Tetris (← → ↓ ↑, drop),
      Asteroids (← → ↑, disparar, escudo)
- [ ] Los botones A y B no se muestran si el juego no los necesita (keyMap undefined)
- [ ] El botón Pausa del gamepad llama a `togglePause()` correctamente
- [ ] El selector de skin en el gamepad cambia la skin activa igual que en desktop
- [ ] No hay scroll accidental al usar el d-pad o los botones de acción
- [ ] En desktop (≥ 768 px), el layout y el HUD no han cambiado
- [ ] La lógica de gameplay de ningún juego ha sido modificada

---

## Decisions taken and discarded

- **Eventos sintéticos de teclado en lugar de nueva capa de input.**
  Permite reutilizar la lógica existente de cada juego sin modificarla.
  Descartado: pasar callbacks/props de input a los componentes de juego
  (requería tocar los 4 componentes y sus interfaces).

- **D-pad uniforme para todos los juegos.**
  Simplifica el componente y la experiencia de usuario.
  Descartado: controles adaptados por juego (swipe para Tetris, joystick
  flotante para Asteroids) — mayor complejidad con beneficio marginal.

- **HUD completamente oculto en móvil.**
  Maximiza el espacio visual del canvas.
  Descartado: barra compacta con score visible — el usuario decidió
  priorizar espacio de juego sobre información en tiempo real.

- **Pausa y selector de skin en el área del gamepad.**
  Son los únicos controles meta necesarios durante la partida en móvil.
  El resto del HUD (score, vidas, nivel) se consulta al finalizar la partida
  en el modal de game-over.

- **`touchstart`/`touchend` en lugar de `click`.**
  Elimina el delay de 300 ms que los navegadores móviles añaden a los clicks.

---

## Identified risks

- **Scroll accidental durante el juego.** Si `preventDefault()` no se aplica
  correctamente en los touch events, el navegador puede interpretar swipes
  sobre el d-pad como scroll de página. Mitigación: `touchstart` con
  `{ passive: false }` y `preventDefault()` en todos los botones del gamepad.

- **Canvas demasiado pequeño en móviles estrechos.** Si el canvas escala a
  full-width en un viewport de 375 px, algunos juegos (Asteroids, Tetris)
  pueden quedar con muy poco alto si el gamepad ocupa demasiado espacio.
  Mitigación: limitar la altura del gamepad a ~180 px y usar `aspect-ratio`
  o altura mínima en el canvas.

- **Conflicto entre eventos táctiles y de teclado.** En tablets con teclado
  físico conectado, ambos sistemas pueden dispararse a la vez.
  Mitigación: el sistema de teclado ya existente no se toca; los eventos
  sintéticos son idénticos, por lo que no hay conflicto real.
