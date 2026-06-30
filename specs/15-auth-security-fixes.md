# SPEC 15 — Correcciones de seguridad en autenticación

- **Status:** Aprobado
- **Depends on:** 13-user-auth, 14-security-hardening
- **Date:** 2026-06-30
- **Objective:** Corregir cuatro hallazgos de seguridad identificados en la auditoría
  del flujo de autenticación: manejo de errores en el callback OAuth/email, uso de
  `getSession()` inseguro en el contexto de usuario, falta de manejo de errores en
  OAuth desde la UI, y mensajes de error técnicos expuestos al usuario.

---

## Scope

**In:**

- `src/app/auth/callback/route.ts` — manejar el error de `exchangeCodeForSession`
  y redirigir a `/auth?error=callback_failed` si falla, en lugar de redirigir
  siempre a `/`.
- `src/context/UserContext.tsx` — reemplazar `getSession()` por `getUser()` para
  la inicialización del estado (verificación server-side en lugar de leer cookie local).
- `src/app/auth/page.tsx` — añadir manejo de error en `handleOAuth` y mostrar
  mensaje inline al usuario si el flujo OAuth falla.
- `src/app/auth/page.tsx` — normalizar los mensajes de error de Supabase Auth para
  evitar filtrar detalles técnicos internos al usuario.
- `src/app/auth/page.tsx` — mostrar el parámetro `?error=callback_failed` en la UI
  si la página `/auth` se carga con ese query param (caso de fallo en callback).

**Out of scope:**

- Rate-limiting del formulario de login (lo gestiona Supabase Auth en el servidor).
- Protección de rutas privadas (no hay rutas que requieran auth; se reserva para
  un spec dedicado si la plataforma lo requiere).
- Content-Security-Policy (requiere inventario de orígenes; spec independiente).
- Recuperación de contraseña / forgot password.
- Validación del formato del `code` recibido en el callback (Supabase Auth ya lo
  valida internamente; el error se captura con el manejo de error añadido).

---

## Data model

### Sin cambios de esquema

No se requieren migraciones SQL ni nuevos tipos TypeScript. Todos los cambios son
en lógica de cliente y route handlers existentes.

---

## Implementation plan

1. **Callback con manejo de error** — en `src/app/auth/callback/route.ts`,
   capturar el `error` devuelto por `exchangeCodeForSession` y redirigir a
   `/auth?error=callback_failed` si está presente; si no hay `code` en los
   query params, redirigir también a `/auth?error=callback_failed` en lugar de
   a `/`:

   ```ts
   export async function GET(request: NextRequest) {
     const { searchParams, origin } = new URL(request.url);
     const code = searchParams.get("code");

     if (code) {
       const supabase = await createClient();
       const { error } = await supabase.auth.exchangeCodeForSession(code);
       if (error) {
         return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
       }
       return NextResponse.redirect(`${origin}/`);
     }

     return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
   }
   ```

2. **`getUser()` en UserContext** — en `src/context/UserContext.tsx`, sustituir
   la llamada inicial de `getSession()` por `getUser()` para que el estado de
   usuario sea verificado contra el servidor y no solo desde la cookie local:

   ```ts
   supabase.auth.getUser().then(({ data: { user } }) => {
     setUser(user ?? null);
   });
   ```

3. **Manejo de error OAuth** — en `src/app/auth/page.tsx`, la función `handleOAuth`
   debe capturar el error devuelto por `signInWithOAuth` y llamar a `setError` con
   un mensaje normalizado si falla:

   ```ts
   async function handleOAuth(provider: "google" | "github") {
     const supabase = createClient();
     const { error } = await supabase.auth.signInWithOAuth({
       provider,
       options: { redirectTo: `${window.location.origin}/auth/callback` },
     });
     if (error)
       setError(
         "No se pudo iniciar sesión con " + provider + ". Inténtalo de nuevo.",
       );
   }
   ```

4. **Normalización de errores de Supabase** — en `src/app/auth/page.tsx`, crear
   una función `normalizeAuthError(msg: string): string` que mapee los mensajes
   técnicos más frecuentes de Supabase Auth a texto amigable en español:

   | Mensaje Supabase (substring) | Texto mostrado al usuario                           |
   | ---------------------------- | --------------------------------------------------- |
   | `Invalid login credentials`  | `Email o contraseña incorrectos.`                   |
   | `Email not confirmed`        | `Debes confirmar tu email antes de iniciar sesión.` |
   | `User already registered`    | `Ya existe una cuenta con ese email.`               |
   | `Password should be`         | `La contraseña no cumple los requisitos mínimos.`   |
   | cualquier otro               | `Ocurrió un error. Inténtalo de nuevo.`             |

   Aplicar esta función al mostrar errores en login, registro y al leer el query
   param `?error=callback_failed` al montar la página.

5. **Mostrar error de callback en la UI** — en `src/app/auth/page.tsx`, leer
   `useSearchParams()` al montar el componente; si `searchParams.get("error")`
   es `"callback_failed"`, inicializar `error` con el mensaje normalizado
   `"El enlace ha expirado o no es válido. Solicita uno nuevo."`.

6. **Verificación** — ejecutar `npm run build` sin errores de TypeScript.

---

## Acceptance criteria

- [ ] `GET /auth/callback` sin `code` redirige a `/auth?error=callback_failed`.
- [ ] `GET /auth/callback?code=<inválido>` redirige a `/auth?error=callback_failed`
      y la página `/auth` muestra el mensaje de error correspondiente.
- [ ] `GET /auth/callback?code=<válido>` sigue redirigiendo a `/` con sesión activa.
- [ ] `UserContext` inicializa el usuario con `getUser()` (verificación server-side);
      un token revocado no mantiene al usuario logueado hasta que expire.
- [ ] Si `signInWithOAuth` devuelve error, se muestra un mensaje inline en la UI;
      no ocurre fallo silencioso.
- [ ] Los mensajes de error de login/registro muestran texto en español sin detalles
      técnicos internos de Supabase.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: redirigir a `/auth?error=callback_failed` (no a `/`)** — Un redirect
  silencioso a `/` cuando el callback falla deja al usuario sin sesión sin
  explicación. El query param permite mostrar un mensaje en la misma pantalla
  de auth.
  Descartado: página de error dedicada `/auth/error` — añade una ruta extra
  innecesaria para un mensaje que encaja en la página de auth existente.

- **Sí: `getUser()` en lugar de `getSession()` para inicialización** — `getSession()`
  lee solo la cookie local; un token revocado en Supabase no se detecta hasta la
  siguiente llamada autenticada. `getUser()` verifica contra el servidor.
  Descartado: mantener `getSession()` — ya implementado así en SPEC 13; el cambio
  es trivial y el beneficio de seguridad es real.

- **Sí: normalizar errores en el cliente** — Los mensajes raw de Supabase Auth
  exponen detalles de implementación y están en inglés; mapearlos en el cliente
  es la solución más sencilla sin necesidad de un proxy server.
  Descartado: proxy server que intercepte respuestas de Supabase — complejidad
  desproporcionada para el beneficio.

- **No: validar formato del `code` antes de llamar a `exchangeCodeForSession`** —
  Supabase Auth ya valida el code y devuelve error si no es válido; validarlo
  adicionalmente sería redundante con el manejo de error añadido en el paso 1.

- **No: rate-limiting en el cliente** — Supabase Auth aplica rate-limiting en el
  servidor. Añadir debounce o locks en el cliente es defensa en profundidad de bajo
  impacto; se puede considerar si aparecen problemas reales.
