# SPEC 13 — Autenticación de usuarios

- **Status:** Aprobado
- **Depends on:** 04-supabase-integration, 06-games-db-and-leaderboard
- **Date:** 2026-06-28
- **Objective:** Implementar login, registro y sesión persistente con Supabase Auth
  (email/password + Google + GitHub) en una página `/auth` con tabs, y asociar
  `user_id` real a los scores cuando el usuario está autenticado.

---

## Scope

**In:**

- `src/app/auth/page.tsx` — página `/auth` con dos tabs: "Iniciar Sesión" y "Registrarse".
- `src/app/auth/callback/route.ts` — Route Handler para el callback OAuth (Google/GitHub)
  y para el link de confirmación de email.
- `src/context/UserContext.tsx` — migración completa: expone el objeto `User` de
  `@supabase/supabase-js` (con `id`, `email`, `user_metadata`, etc.); elimina la
  interfaz `User` custom; `signOut` llama a `supabase.auth.signOut()`; la sesión se
  inicializa desde Supabase y persiste entre recargas.
- Formulario email + password: campos email, contraseña; validación básica client-side.
- Botones OAuth: "Continuar con Google" y "Continuar con GitHub".
- Confirmación de email activada (Supabase SMTP); mensaje informativo tras el registro.
- Tras login/registro exitoso → redirect a `/`.
- `src/app/player/[id]/page.tsx` — cuando el usuario está autenticado, el input
  de nombre en el modal de game-over se pre-rellena con `user_metadata.name` o
  el email recortado (antes del `@`); el usuario puede editarlo antes de guardar.
- `src/app/player/[id]/actions.ts` — `saveScore` llama a `supabase.auth.getUser()`
  (cliente server de `server.ts`; al ser Server Action puede escribir cookies y refresca la
  sesión si hace falta) y pasa `user_id: user?.id ?? null` a `insertScore`; guarda también
  `player_name` (confirmado por el usuario). Sin sesión activa, `user_id` queda `null`.
- `src/components/Nav.tsx` — actualizar para usar el `User` de Supabase;
  nombre visible = `user.user_metadata?.name ?? user.email?.split("@")[0]`.

**Out of scope:**

- Rutas protegidas (ninguna ruta requiere auth para acceder).
- Página de perfil de usuario.
- Cambio de contraseña / recuperación de cuenta (forgot password).
- `display_name` personalizado al registrarse.
- Integración de Resend para emails transaccionales de auth.
- Validación anti-cheat o asociación retroactiva de scores anónimos a un usuario.
- RLS en Supabase (se activa en un spec posterior).

---

## Data model

### Base de datos — sin cambios de schema

La tabla `scores` ya tiene `player_name text` y `user_id uuid nullable` desde SPEC 06.
No se requiere ninguna migración adicional.

### Tipos TypeScript

**`src/context/UserContext.tsx`** — eliminar la interfaz `User` custom y usar
el tipo `User` de `@supabase/supabase-js` directamente:

```ts
import type { User } from "@supabase/supabase-js";

interface UserContextValue {
  user: User | null;
  signOut: () => Promise<void>;
}
```

El método `login` desaparece del contexto: el login ocurre en la página `/auth`
directamente contra Supabase Auth; el contexto solo refleja el estado de sesión.

**`src/lib/supabase/types.ts`** — `InsertScore` ya incluye `user_id: string | null`;
no requiere cambios.

### Sesión

- La sesión se gestiona con cookies via `@supabase/ssr` (ya configurado en SPEC 04).
- **Client-side**: el browser client (`autoRefreshToken` activo por defecto) refresca el
  token y reescribe las cookies automáticamente; `UserContext` se mantiene sincronizado con
  `onAuthStateChange`. La sesión persiste tras recargar sin necesidad de middleware.
- **Server-side**: el callback Route Handler y la Server Action `saveScore` leen/refrescan la
  sesión bajo demanda via `getUser()` (pueden escribir cookies). No se usa middleware.
- `UserContext` lee la sesión inicial en el cliente con
  `supabase.auth.getSession()` y escucha cambios con `onAuthStateChange`.

---

## Implementation plan

1. **Route Handler de callback** — crear `src/app/auth/callback/route.ts` que
   intercambia el `code` de OAuth / confirmación de email por una sesión con
   `supabase.auth.exchangeCodeForSession(code)` y redirige a `/`.

2. **Página `/auth`** — crear `src/app/auth/page.tsx` (`"use client"`) con:
   - Dos tabs: "Iniciar Sesión" / "Registrarse".
   - Formulario email + password compartido entre tabs (campos email y contraseña).
   - Botones OAuth: "Continuar con Google" y "Continuar con GitHub" (ambas tabs).
   - Tab "Registrarse": tras submit muestra mensaje informativo
     ("Revisa tu correo para confirmar tu cuenta") sin redirigir.
   - Tab "Iniciar Sesión": tras submit exitoso redirige a `/`.
   - Errores de Supabase Auth mostrados inline bajo el formulario.
   - Estilo coherente con el resto de la plataforma (font-pixel, colores CRT).

3. **Migrar `UserContext`** — reescribir `src/context/UserContext.tsx`:
   - Usa el cliente browser de `src/lib/supabase/client.ts`.
   - Inicializa `user` con `supabase.auth.getSession()` en un `useEffect`.
   - Suscribe a `onAuthStateChange` para mantener el estado sincronizado.
   - Expone `user: User | null` y `signOut: () => Promise<void>`.
   - Elimina la interfaz `User` custom y el método `login`.

4. **Actualizar `Nav.tsx`** — cambiar referencias al `User` custom:
   - Nombre visible: `user.user_metadata?.name ?? user.email?.split("@")[0]`.
   - Botón SALIR llama al nuevo `signOut` (que es async; añadir `void` al onClick).

5. **Pre-rellenar nombre en modal de game-over** — en cada `src/app/player/[id]/page.tsx`,
   leer `user` del contexto e inicializar el estado del input de nombre con
   `user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? ""`.

6. **Actualizar `saveScore`** — en cada `src/app/player/[id]/actions.ts`,
   obtener el usuario con el cliente server (`createClient` de `server.ts`):
   ```ts
   const supabase = await createClient();
   const {
     data: { user },
   } = await supabase.auth.getUser();
   ```
   Y pasar `user_id: user?.id ?? null` a `insertScore`. Al ser Server Action puede
   escribir cookies, por lo que refresca la sesión si el token ha expirado.

---

## Acceptance criteria

- [ ] La sesión persiste tras recargar sin middleware (refresco client-side del browser client + refresco on-demand en Server Action/Route Handler).
- [ ] `GET /auth/callback?code=...` intercambia el código y redirige a `/` sin error.
- [ ] `/auth` muestra dos tabs: "Iniciar Sesión" y "Registrarse".
- [ ] El formulario de registro con email + password envía el email de confirmación
      (Supabase SMTP) y muestra el mensaje informativo sin redirigir.
- [ ] El formulario de login con email + password redirige a `/` tras éxito.
- [ ] Los botones "Continuar con Google" y "Continuar con GitHub" inician el flujo
      OAuth y completan la autenticación vía `/auth/callback`.
- [ ] Errores de Supabase Auth (credenciales incorrectas, email ya registrado, etc.)
      se muestran inline bajo el formulario.
- [ ] `UserContext` expone el `User` de Supabase; la sesión persiste tras recargar.
- [ ] El Nav muestra el nombre del usuario autenticado (`user_metadata.name` o email
      recortado) y el botón SALIR cierra la sesión correctamente.
- [ ] El modal de game-over pre-rellena el input de nombre con el nombre del usuario
      autenticado (editable antes de guardar).
- [ ] `saveScore` guarda `user_id` real cuando el usuario está autenticado y `null`
      cuando no lo está.
- [ ] Un usuario no autenticado puede seguir jugando y guardando scores con nombre libre.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: una sola página `/auth` con tabs** — Menos rutas, flujo más limpio.
  Descartado: `/auth/login` y `/auth/register` separados — innecesario para este
  volumen de formularios.

- **Sí: email + password + Google + GitHub** — Cubre los casos de uso más comunes
  sin añadir complejidad. Descartado: magic link o phone auth — más fricción de
  configuración sin beneficio claro en esta fase.

- **Sí: confirmación de email activada con SMTP de Supabase** — Evita cuentas con
  emails falsos. Descartado: Resend — requiere config de dominio propio y es un
  spec independiente.

- **Sí: `User` de Supabase expuesto directamente en el contexto** — Evita un
  wrapper custom que quede desincronizado con los campos reales de Supabase Auth.
  Descartado: mantener la interfaz `User` custom — redundante y frágil.

- **Sí: `player_name` editable + `user_id` inmutable en scores** — Permite que el
  jugador elija cómo aparece en el leaderboard sin perder la trazabilidad del usuario
  real aunque cambie el nombre después.
  Descartado: usar solo `user_id` y mostrar el nombre desde auth — requeriría
  join con auth en cada query de leaderboard.

- **No: rutas protegidas** — La experiencia es pública; auth solo enriquece los datos.
  Descartado: proteger `/player/[id]` — bloquearía el juego casual sin ventaja real.

- **No: RLS en Supabase** — Se activa en un spec posterior cuando haya lógica de
  permisos real. Activarlo ahora sin política definida rompería las queries existentes.

- **No: recuperación de contraseña (forgot password)** — Fuera de scope; se añade
  en un spec dedicado si el proyecto lo requiere.

- **No: middleware de refresco de sesión** — No hay rutas protegidas ni Server Components
  que lean auth, así que el refresco client-side del browser client (`autoRefreshToken`) +
  el refresco on-demand en el callback y en `saveScore` (ambos pueden escribir cookies)
  cubren todo el scope. Descartado: `src/middleware.ts` con `updateSession` — es el patrón
  oficial de `@supabase/ssr` pero corre en cada request sin necesidad actual; se puede añadir
  más adelante si se introducen rutas protegidas o Server Components que lean sesión.
