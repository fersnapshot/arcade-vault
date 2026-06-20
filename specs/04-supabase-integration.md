# SPEC 04 — Integración base de Supabase

- **Status:** Aprobado
- **Depends on:** 03-about-page-contact
- **Date:** 2026-06-19
- **Objective:** Instalar y configurar el cliente de Supabase (browser + server) en el proyecto Next.js como fundación para features futuras de auth y base de datos.

---

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.local`.
- Actualizar `.env.template` (o equivalente) con los placeholders de las nuevas variables.
- `src/lib/supabase/client.ts` — cliente browser para componentes `"use client"`.
- `src/lib/supabase/server.ts` — cliente server para Server Components y Route Handlers.

**Out of scope:**

- Autenticación (login, registro, sesión, providers OAuth).
- Consultas o mutaciones a la base de datos.
- Middleware de Supabase para proteger rutas.
- Generación de tipos TypeScript desde el schema de Supabase.
- Modificación de `UserContext` para conectarla a Supabase Auth.

---

## Implementation plan

1. **Instalar dependencias** — `npm install @supabase/supabase-js @supabase/ssr`.

2. **Añadir variables de entorno** — en `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
   ```

3. **Actualizar el template de entorno** — añadir las mismas claves con valor vacío
   al archivo de plantilla existente (`.env.template` o `.env.example`).

4. **Crear `src/lib/supabase/client.ts`** — función `createBrowserClient` usando
   `@supabase/ssr`:

   ```ts
   import { createBrowserClient } from "@supabase/ssr";

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     );
   }
   ```

5. **Crear `src/lib/supabase/server.ts`** — función `createServerClient` usando
   `@supabase/ssr` con lectura/escritura de cookies via `next/headers`:

   ```ts
   import { createServerClient } from "@supabase/ssr";
   import { cookies } from "next/headers";

   export async function createClient() {
     const cookieStore = await cookies();
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll: () => cookieStore.getAll(),
           setAll: (cookiesToSet) => {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options),
               );
             } catch {}
           },
         },
       },
     );
   }
   ```

---

## Acceptance criteria

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `package.json`.
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con valores reales.
- [ ] El template de entorno contiene las mismas claves con valor vacío.
- [ ] `src/lib/supabase/client.ts` exporta `createClient` sin errores de TypeScript.
- [ ] `src/lib/supabase/server.ts` exporta `createClient` sin errores de TypeScript.
- [ ] `npm run build` completa sin errores.
- [ ] `.env.local` no está commiteado al repositorio.

---

## Decisions

- **Sí: `@supabase/ssr` en lugar de solo `@supabase/supabase-js`** — El paquete SSR
  es el recomendado por Supabase para Next.js App Router; gestiona cookies
  automáticamente y es la base correcta para añadir auth en specs futuros.
  Descartado: cliente genérico solo (`@supabase/supabase-js`) — no maneja sesiones
  en Server Components.

- **Sí: dos clientes separados (browser y server)** — Next.js App Router distingue
  entre contextos cliente y servidor; un único cliente no funciona en ambos.
  Descartado: un cliente compartido — rompería en Server Components por acceso a APIs
  de browser.

- **No: middleware de Supabase** — Sin auth en este spec, el middleware no tiene
  función. Se añadirá cuando exista lógica de sesión real.

- **No: generación de tipos TypeScript** — No hay tablas propias aún. Se incorpora
  cuando se defina el schema de base de datos.
