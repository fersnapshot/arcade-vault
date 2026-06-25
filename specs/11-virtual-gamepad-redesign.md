# SPEC 11 — Rediseño visual del VirtualGamepad (estética neon)

- **Status:** Aprobado
- **Depends on:** SPEC 10
- **Date:** 2026-06-25
- **Objective:** Actualizar la apariencia de `VirtualGamepad.tsx` para que coincida con el diseño de referencia en `references/gamepad-assets/gamepad.html`: estética neon oscura con d-pad, botones A/B y controles meta con glow cyan/magenta, usando un CSS module para los estilos complejos.

---

## Scope

**In:**

- Modificar `src/components/ui/VirtualGamepad.tsx` — solo clases CSS y markup visual; sin tocar la lógica de `keyHandlers`, `dispatchKey`, props ni interfaces
- Crear `src/components/ui/VirtualGamepad.module.css` con todos los estilos neon: d-pad, botones A/B, hub gem animado, botones meta (PAUSA, SALIR, skin selector)
- Estados visuales interactivos: hover, pressed (`:active`)
- Animación `pulse-led` para el hub gem del d-pad

**Out of scope (para specs futuros):**

- Cambios en la lógica de gameplay o en `keyHandlers`
- Modificar las interfaces `GamepadKeyMap` / `VirtualGamepadProps`
- Cambios en las páginas player que usan el componente
- Responsive breakpoints: se mantiene `md:hidden` de Tailwind; el CSS module no redefine media queries de visibilidad
- Soporte landscape / variantes de skin del gamepad en sí
- Aplicar el rediseño a juegos futuros (cada spec nuevo lo incluirá al integrar el componente existente)

---

## Data model

Esta feature no introduce nuevas estructuras de datos. Reutiliza las interfaces de SPEC 10 sin cambios.

---

## Implementation plan

1. **Crear `src/components/ui/VirtualGamepad.module.css`** con:
   - Variables CSS: `--cyan: #00f5ff`, `--magenta: #ff006e`, colores de fondo
   - `.gp`: contenedor principal con gradiente oscuro, borde neon, box-shadow cyan
   - `.gp::before` y `.gp::after`: inner border y textura de puntos (igual que reference)
   - `.dp`: botones d-pad con fondo oscuro, press state (`translateY` + glow cyan)
   - `.dpHub` + `.dpHubGem`: hub central con diamante cyan y animación `@keyframes pulse-led`
   - `.abA` / `.abB`: botones circulares con gradiente radial magenta/cyan, glow exterior, ring animado en hover/active
   - `.metaBtn`: estilo base para PAUSA y SALIR (fondo oscuro, borde neon, texto pixel font, glow en active)
   - `.skinSelect`: selector de skin con fondo oscuro y borde neon

2. **Actualizar `src/components/ui/VirtualGamepad.tsx`** — aplicar las clases del CSS module:
   - Reemplazar clases Tailwind de apariencia por `styles.*`
   - Mantener `md:hidden` de Tailwind en el contenedor raíz (visibilidad)
   - Mantener toda la lógica de handlers, props y estructura JSX intacta

3. **Verificar en viewport móvil (375 px)** que el gamepad tiene la apariencia del reference: fondo oscuro, glow cyan en d-pad, botones A/B con gradiente magenta/cyan, hub gem pulsante

---

## Acceptance criteria

- [ ] El contenedor del gamepad tiene fondo oscuro con gradiente y borde con glow cyan
- [ ] Los 4 botones del d-pad muestran glow cyan al presionar (`:active`)
- [ ] El hub central del d-pad tiene el diamante cyan con animación `pulse-led`
- [ ] El botón A es circular con gradiente magenta y glow magenta
- [ ] El botón B es circular con gradiente cyan y glow cyan
- [ ] Los botones A/B muestran el ring animado en hover y al presionar
- [ ] Los botones PAUSA y SALIR tienen estilo neon coherente con el d-pad
- [ ] El selector de skin tiene fondo oscuro y borde neon
- [ ] En desktop (≥ 768 px) el componente sigue sin renderizarse (`md:hidden`)
- [ ] La lógica de `keyHandlers` y `dispatchKey` no ha sido modificada
- [ ] Las interfaces `GamepadKeyMap` y `VirtualGamepadProps` no han cambiado

---

## Decisions

- **CSS module en lugar de Tailwind para estilos complejos.** Los box-shadows con múltiples capas, gradientes radiales y animaciones `@keyframes` no tienen utilidades directas en Tailwind v4. Descartado: inline styles (dificultan hover/active) y bloque `<style jsx>` (requiere configuración adicional).

- **Rediseño completo incluyendo controles meta (PAUSA, SALIR, skin).** Coherencia visual en todo el componente. Descartado: solo d-pad + A/B (dejaría una mezcla de estilos inconsistente).

- **Hub gem con animación `pulse-led`.** Detalle visual de calidad que refuerza la estética neon sin costo de rendimiento (CSS puro). Descartado: punto estático (menos impacto visual).

- **Mantener `md:hidden` de Tailwind para visibilidad.** El breakpoint ya está establecido en SPEC 10 y funciona correctamente. Descartado: replicar la media query `max-width: 620px` del reference (cambiaría el breakpoint de visibilidad sin justificación).

---

## What is **not** in this spec

- Lógica de gameplay o interfaces de props
- Breakpoints de visibilidad (se mantiene `md:hidden`)
- Variantes de skin del gamepad en sí
- Integración en juegos futuros
