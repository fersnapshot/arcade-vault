# ARCADE VAULT — Informe de Seguridad

**Fecha:** 2026-06-29

---

## Lo que está bien

- **Security headers correctos** (`next.config.ts` líneas 10-13): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **`proxy.ts` usa `getUser()` server-side** (línea 28), no `getSession()` — correcto para decisiones de auth.
- **Nombre del archivo proxy correcto**: `src/proxy.ts` — convención Next.js 16 válida.
- **`PASSWORD_REGEX` presente y aplicada** (`src/app/auth/page.tsx` línea 10, aplicada en línea 54) — solo en tab "Registrarse".
- **`getUser()` server-side en todos los `saveScore`** — los 4 juegos (arkanoid, asteroids, snake, tetris).
- **Queries parametrizadas** — `insertScore` usa el query builder de Supabase, sin concatenación SQL cruda.
- **RLS habilitado** en `public.games` y `public.scores` — ambas con `rls_enabled: true`.
- **Políticas RLS exactas del SPEC 14**: `games_select_public`, `scores_select_public`, `scores_insert_public`.
- **`rls_auto_enable()` eliminada** — la función no existe en el schema public.
- **Sin funciones SECURITY DEFINER en public.**
- **Sin `service_role` key en código** — ninguna aparición en `src/`.
- **`.gitignore` correcto** — `.env*` ignorado excepto `.env.template`.
- **`signOut()` correcto** — llama `supabase.auth.signOut()` directamente.
- **`onAuthStateChange` presente** — mantiene `UserContext` sincronizado.

---

## Hallazgos

| Severidad | Área                | Hallazgo                                                                                                                                                                 | Ubicación                                            | Recomendación                                                                                                                 |
| --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **MEDIO** | App — Server Action | Sin validación server-side de `score`: cualquier cliente puede insertar `score = 999999999` o negativos. La política RLS `WITH CHECK (true)` no filtra por valor.        | `src/app/player/*/actions.ts` línea 6 (los 4 juegos) | Rechazar si `score < 0`, no entero, o supera un máximo razonable por juego (p. ej. `10_000_000`).                             |
| **MEDIO** | App — Server Action | Sin validación server-side de `player_name`: longitud ilimitada y sin sanitización.                                                                                      | `src/app/player/*/actions.ts` línea 6 (los 4 juegos) | Validar `playerName.trim().length > 0 && playerName.length <= 32` antes de `insertScore`.                                     |
| **MEDIO** | DB — Advisor activo | `scores_insert_public` con `WITH CHECK (true)`: Supabase reporta `rls_policy_always_true` (WARN). Cualquier usuario anónimo puede insertar sin restricción de contenido. | Política `scores_insert_public` en `public.scores`   | Se mitiga con validación en Server Action. A largo plazo, evaluar restricción a `authenticated`.                              |
| **MEDIO** | DB — Supabase Auth  | **Leaked Password Protection deshabilitada**: no se comprueban contraseñas contra HaveIBeenPwned.org.                                                                    | Dashboard de Supabase Auth                           | Activar en Dashboard → Auth → Password Security → "Enable leaked password protection". Sin cambios de código.                 |
| **BAJO**  | App — Sesión        | `getSession()` en `UserContext.tsx:20` no valida el JWT contra el servidor — podría devolver sesión expirada/manipulada.                                                 | `src/context/UserContext.tsx:20`                     | Aceptable para UI. Las Server Actions ya usan `getUser()` correctamente. Migrar si se toman decisiones de acceso server-side. |
| **BAJO**  | App — Proxy         | El proxy no protege rutas privadas. Si se crean rutas que requieran auth quedarían desprotegidas.                                                                        | `src/proxy.ts:30-33`                                 | Documentar en el proxy dónde agregar rutas privadas futuras.                                                                  |
| **INFO**  | App — Contraseña    | `PASSWORD_REGEX` bypasseable con llamada directa al endpoint de Supabase Auth.                                                                                           | `src/app/auth/page.tsx:54`                           | Intencionado (SPEC 14). Asegurar mínimo 8 chars en Dashboard → Auth → Password Security.                                      |
| **INFO**  | App — Headers       | CSP, HSTS y Permissions-Policy ausentes.                                                                                                                                 | `next.config.ts`                                     | Out-of-scope en SPEC 14.                                                                                                      |

---

## Cobertura de SPEC 14

- [x] RLS en `games` y `scores` — habilitado en ambas tablas
- [x] Políticas SELECT/INSERT — las 3 políticas del spec presentes y correctas
- [x] `rls_auto_enable` eliminada — no existe en pg_proc
- [x] Security headers (3 headers) — presentes con valores exactos en `next.config.ts`
- [x] `PASSWORD_REGEX` en registro — presente y aplicada solo en tab "Registrarse"
- [x] Proxy de auth activo — `src/proxy.ts` correcto

---

## Veredicto

**MEDIO — Brechas medias, revisar antes de producción.**

### Acciones prioritarias

1. **Código** — Agregar validación de `score` y `player_name` en las 4 `saveScore` (`src/app/player/*/actions.ts`)
2. **Dashboard Supabase** — Activar Leaked Password Protection (un toggle, sin cambios de código)
