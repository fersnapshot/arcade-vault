# SPEC 14 — Hardening de seguridad

- **Status:** Aprobado
- **Depends on:** 04-supabase-integration, 13-user-auth
- **Date:** 2026-06-29
- **Objective:** Habilitar RLS en las tablas `games` y `scores`, eliminar la función
  pública `rls_auto_enable()`, añadir security headers HTTP en Next.js, y validar
  la contraseña client-side en el formulario de registro.

---

## Scope

**In:**

- RLS habilitado en `public.games` con política SELECT para `anon` y `authenticated`.
- RLS habilitado en `public.scores` con política SELECT para `anon` y `authenticated`,
  e INSERT para `anon` y `authenticated`.
- Eliminación de la función `public.rls_auto_enable()` del schema público.
- Security headers en `next.config.ts`:
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- Validación client-side de contraseña en `src/app/auth/page.tsx` (tab "Registrarse"):
  regex que exige mínimo 8 caracteres, al menos 1 minúscula, 1 mayúscula, 1 dígito
  y 1 símbolo. El error se muestra solo al intentar enviar el formulario.
- Rutas protegidas o proxy de auth en Next.js, información sobre proxy aquí: https://nextjs.org/docs/app/getting-started/proxy

Ejemplo: proxy.ts

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL("/home", request.url));
}

// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }

export const config = {
  matcher: "/about/:path*",
};
```

**Out of scope:**

- Configuración de Supabase Auth (password mínimo 8 chars, leaked password protection,
  max signup rate) — ya aplicada en el dashboard.
- Content-Security-Policy y Permissions-Policy.
- UPDATE / DELETE policies en ninguna tabla.
- RLS en schemas distintos de `public`.
- Validación de contraseña en el tab "Iniciar Sesión" (Supabase Auth retorna error si no coincide).

---

## Data model

### Migraciones SQL (vía MCP)

**RLS en `games`:**

```sql
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_select_public"
  ON public.games FOR SELECT
  TO anon, authenticated
  USING (true);
```

**RLS en `scores`:**

```sql
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_select_public"
  ON public.scores FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "scores_insert_public"
  ON public.scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

**Eliminar `rls_auto_enable()`:**

```sql
DROP FUNCTION IF EXISTS public.rls_auto_enable();
```

### Validación de contraseña

Constante en `src/app/auth/page.tsx`:

```ts
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
```

### Next.js — sin cambios de esquema

Solo modificación de `next.config.ts`; no hay nuevos tipos ni tablas.

---

## Implementation plan

1. **Migración RLS `games`** — aplicar vía MCP `apply_migration`: habilitar RLS
   y crear política `games_select_public`.

2. **Migración RLS `scores`** — aplicar vía MCP `apply_migration`: habilitar RLS
   y crear políticas `scores_select_public` y `scores_insert_public`.

3. **Eliminar `rls_auto_enable()`** — aplicar vía MCP `execute_sql`:
   `DROP FUNCTION IF EXISTS public.rls_auto_enable()`.

4. **Security headers** — modificar `next.config.ts`: añadir la función async
   `headers` que aplica los tres headers a todas las rutas (`/(.*)`).

5. **Validación de contraseña** — en `src/app/auth/page.tsx`, añadir la constante
   `PASSWORD_REGEX` y validar en el handler de submit del tab "Registrarse";
   mostrar mensaje de error inline si no se cumple antes de llamar a Supabase.

6. **Rutas protegidas o proxy de auth en Next.js** — añadir un proxy de auth en Next.js
   para proteger las rutas que no deben ser accesibles sin autenticación.

7. **Verificación** — ejecutar `npm run build` sin errores de TypeScript y confirmar
   en el panel de Supabase que los advisors de RLS y la función pública ya no aparecen.

---

## Acceptance criteria

- [ ] El advisor `rls_disabled_in_public` no aparece en el panel de Supabase para
      ninguna de las dos tablas.
- [ ] `SELECT` en `public.games` funciona sin sesión (anon) y con sesión autenticada.
- [ ] `SELECT` en `public.scores` funciona sin sesión (anon) y con sesión autenticada.
- [ ] `INSERT` en `public.scores` funciona sin sesión (anon) y con sesión autenticada
      (guardar score desde el modal de game-over sigue funcionando en ambos casos).
- [ ] La función `public.rls_auto_enable()` ya no existe; los warnings
      `anon_security_definer_function_executable` y
      `authenticated_security_definer_function_executable` desaparecen del panel.
- [ ] Las respuestas HTTP de la app incluyen los headers `X-Content-Type-Options: nosniff`,
      `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] En el tab "Registrarse", intentar enviar con una contraseña que no cumpla la regex
      muestra un error inline y no llama a Supabase.
- [ ] Una contraseña que cumpla todos los requisitos (≥8 chars, minúscula, mayúscula,
      dígito, símbolo) pasa la validación y el formulario continúa.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: políticas con `USING (true)` / `WITH CHECK (true)`** — El contenido de ambas
  tablas es público por naturaleza (catálogo de juegos y leaderboard). No se necesita
  filtrado por usuario.
  Descartado: restringir INSERT en `scores` solo a `authenticated` — bloquearía el
  flujo de juego anónimo que está en scope.

- **Sí: eliminar `rls_auto_enable()`** — La función ya no cumple ningún propósito útil
  en producción y expone una superficie de ataque innecesaria.
  Descartado: revocar EXECUTE o cambiar a SECURITY INVOKER — más complejidad sin
  beneficio si la función es prescindible.

- **Sí: validación solo en submit (no on-blur/on-change)** — Menos interrupciones
  mientras el usuario escribe. El error desaparece al volver a intentar.
  Descartado: validación en tiempo real — más feedback pero más ruido en un formulario
  simple.

- **No: Content-Security-Policy ni Permissions-Policy** — Requieren inventario de
  orígenes externos (Supabase, Google/GitHub OAuth, fuentes) y ajuste iterativo;
  se reservan para un spec dedicado si la plataforma lo requiere.

- **No: validación de contraseña en el tab "Iniciar Sesión"** — Supabase Auth retorna
  error descriptivo si las credenciales no coinciden; validar antes sería redundante.
