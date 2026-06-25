---
name: spec-impl-game
description: >
  Implementa un spec de juego aprobado (igual que /spec-impl) y, al terminar con
  éxito, encadena skin-designer y luego mobile-porter (en ese orden, nunca en
  paralelo) para dejar el juego con las 3 skins obligatorias y jugable en móvil.
  Úsalo cuando el usuario diga "implementa el spec <NN-slug>", "spec-impl-game
  <NN-slug>", o quiera implementar un juego y dejarlo completo de una vez.
disable-model-invocation: true
argument-hint: <NN-spec-name>
---

# /spec-impl-game — Implementador de specs de juego con skins + móvil

Esta skill orquesta tres operaciones en secuencia estricta:

1. `/spec-impl` — implementa el spec (flujo completo con pausas por paso).
2. `@skin-designer` — garantiza skins `classic`, `neon` y `retro`.
3. `@mobile-porter` — garantiza soporte móvil con `VirtualGamepad`.

**No reimplementa** la lógica de ninguna de las tres operaciones; las invoca
y coordina.

---

## Fase 1 — Implementar el spec con `/spec-impl`

El argumento recibido es: `$ARGUMENTS`

Invocar la skill `spec-impl` pasando `$ARGUMENTS`. Seguir su flujo exacto de
4 fases:

1. **Identificar el spec** en `specs/` (por nombre completo, número o slug).
2. **Validar el estado** — solo continuar si es `Approved` (o equivalente en
   cualquier idioma). Cualquier otro estado → mostrar el error estándar de
   `spec-impl` y **detenerse aquí**; no continuar a las fases siguientes.
3. **Crear la rama git** `spec-NN-slug` y mostrar el resumen del spec.
4. **Implementar paso a paso** con pausas tras cada paso esperando confirmación
   del usuario.

**Regla dura:** si `spec-impl` se detiene en cualquier punto (spec no Approved,
ambigüedad no resuelta, error de build, o el usuario interrumpe) → **parar
completamente**. No invocar `skin-designer` ni `mobile-porter`.

---

## Fase 2 — Gate de éxito

Continuar a la Fase 3 **solo si** la implementación completó con éxito:

- Todos los pasos del plan ejecutados.
- `npm run build` sin errores TypeScript.
- El usuario no interrumpió el flujo.

El indicador es el mensaje final de `spec-impl`:

```
✅ All steps of the plan are implemented.
```

Si no apareció ese mensaje, parar y reportar por qué.

---

## Fase 3 — Resolver el id del juego

Derivar el id kebab-case del juego implementado. Fuentes (en orden de preferencia):

1. El valor `id` del bloque `INSERT INTO games (id, ...)` en el spec.
2. El slug del nombre del spec (ej. `12-frogger-game.md` → `frogger`).

Usar ese id en las Fases 5 y 6.

---

## Fase 4 — Confirmación antes de la cadena de agentes

Mostrar al usuario:

```
✅ Implementación completada: <id>

A continuación voy a encadenar:
  1. skin-designer — añadirá/verificará skins classic, neon y retro
  2. mobile-porter — añadirá/verificará soporte móvil con VirtualGamepad

¿Procedo con la cadena? (los agentes corren uno después del otro)
```

Esperar confirmación explícita. Si el usuario no confirma, parar aquí sin
invocar ningún agente.

---

## Fase 5 — skin-designer

Con la confirmación recibida, invocar **skin-designer** mediante la herramienta
Agent con `subagent_type: skin-designer`, pasando el id del juego como prompt:

```
Asegúrate de que el juego "<id>" tenga al menos las 3 skins obligatorias:
classic (default), neon y retro. Sigue el patrón de TetrisGame.
```

**Esperar** a que el agente termine y devuelva su reporte completo antes de
continuar. No invocar `mobile-porter` en el mismo bloque de herramientas.

---

## Fase 6 — mobile-porter

Solo tras recibir el reporte de `skin-designer`, invocar **mobile-porter**
mediante la herramienta Agent con `subagent_type: mobile-porter`, pasando el
id del juego:

```
Haz que el juego "<id>" sea jugable en móvil: integra VirtualGamepad con el
keyMap correcto, layout responsive y botones de pausa/salir/skin. Sigue el
SPEC 10.
```

Esperar su reporte completo.

---

## Fase 7 — Reporte final consolidado

Cuando ambos agentes hayan terminado, mostrar:

```
🎮 Juego <ID> completamente integrado en Arcade Vault

Implementación (spec-impl):
  · Rama: spec-NN-slug
  · Spec: specs/NN-slug.md

Skins (skin-designer):
  · <resumen del reporte de skin-designer>

Móvil (mobile-porter):
  · <resumen del reporte de mobile-porter>

Pasos finales:
  1. Verifica los criterios de aceptación del spec.
  2. Cambia el estado del spec a "Implemented" (o equivalente).
  3. Abre /player/<id> en un viewport de 375 px para revisar el móvil.
```

---

## Reglas duras

- **Nunca** lanzar agentes si `spec-impl` no completó con éxito (Fase 2).
- **Nunca** invocar `skin-designer` y `mobile-porter` en paralelo (mismo bloque
  de tool calls) — siempre secuencial, `skin-designer` primero.
- **Siempre** esperar el reporte de `skin-designer` antes de invocar
  `mobile-porter`.
- **Nunca** reimplementar la lógica de `spec-impl`, `skin-designer` ni
  `mobile-porter` — solo orquestar.
- Responder **en el idioma del prompt** que activa la skill.
- Si `$ARGUMENTS` está vacío, listar los specs disponibles en `specs/` y pedir
  al usuario que especifique uno, igual que hace `spec-impl`.
