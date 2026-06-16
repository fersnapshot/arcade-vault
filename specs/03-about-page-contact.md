# SPEC 03 — About Page y formulario de contacto con Resend

- **Status:** Approved
- **Depends on:** 02-homepage-and-nav, references/templates/home-about/
- **Date:** 2026-06-15
- **Objective:** Crear la ruta `/about` con la página "Acerca de" y el formulario de contacto que envía emails reales a `[EMAIL_ADDRESS]` usando Resend, y habilitar el link "Acerca de" en el Nav.

---

## Scope

**In:**

- `src/app/about/page.tsx` — nueva ruta `/about` con las secciones del template: hero "Acerca de", divider pixel-art animado, y sección de contacto con formulario.
- `src/app/api/contact/route.ts` — API Route (POST) que recibe `{name, email, msg}` y usa Resend para enviar el email a `[EMAIL_ADDRESS]`.
- `src/components/Nav.tsx` — habilitar el link "Acerca de" (`disabled: true` → link real a `/about`).
- `.env.local` — variable `RESEND_API_KEY`.
- Estilos en `src/app/globals.css` — clases del template: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-form`, `.terminal-success`, `.shake`, `.tip`, `.tip-led`, y animaciones reveal.
- `HighlightIcon` — componente SVG pixel-art inline (HEART, BROWSER, PLANT) dentro de `page.tsx`.
- Estado del formulario: `{name, email, msg}`, feedback de envío (`sent` / `error`), animación `shake` en campos vacíos.
- `IntersectionObserver` para animaciones reveal al hacer scroll (igual que homepage).

**Out of scope:**

- Email de confirmación al remitente (solo se notifica al equipo).
- Autenticación o rate-limiting en la API Route (queda para spec posterior si se necesita).
- Página de admin para ver mensajes recibidos.
- Internacionalización o idioma alternativo.

---

## Data model

No se introducen tipos de datos persistentes. La API Route recibe y reenvía:

```ts
// Body del POST a /api/contact
interface ContactPayload {
  name: string;
  email: string;
  msg: string;
}

// Respuesta de la API Route
type ContactResponse = { ok: true } | { ok: false; error: string };
```

El formulario en el cliente maneja estado local con `useState`:

```ts
const [form, setForm] = useState({ name: "", email: "", msg: "" });
const [sent, setSent] = useState<string | null>(null); // nombre del remitente si OK
const [error, setError] = useState<string | null>(null);
const [shake, setShake] = useState(false);
const [loading, setLoading] = useState(false);
```

---

## Implementation plan

1. **Crear `.env.local`** en la raíz del proyecto con `RESEND_API_KEY=<tu-key>`.

2. **Instalar Resend** — `npm install resend`.

3. **Crear `src/app/api/contact/route.ts`** — API Route POST que valida que `name`, `email` y `msg` no estén vacíos, llama a Resend para enviar el email a `[EMAIL_ADDRESS]`, y devuelve `{ ok: true }` o `{ ok: false, error }`.

4. **Añadir estilos en `src/app/globals.css`** — clases del template: `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`, `.hl-icon`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`, `.contact-form`, `.terminal-success`, `.term-bar`, `.term-body`, `.term-title`, `.line`, `.prompt`, `.dot`, `.caret`, y animación `shake`.

5. **Crear `src/app/about/page.tsx`** — Client Component con:

   - Hook `useReveal` con `IntersectionObserver` (igual que homepage).
   - Componente `HighlightIcon` con SVGs pixel-art (HEART, BROWSER, PLANT).
   - Sección hero: kicker "▸ ACERCA DE", título, misión, highlight-row.
   - Divider animado pixel-art.
   - Sección contacto: intro con tips + formulario con estado local.
   - `onSubmit` hace `fetch('/api/contact', { method: 'POST', body: JSON.stringify(form) })` y muestra `terminal-success` si OK, o mensaje de error si falla.

6. **Actualizar `src/components/Nav.tsx`** — cambiar `disabled: true` a `disabled: false` (o eliminar la propiedad) en el link "Acerca de" apuntando a `/about`.

---

## Acceptance criteria

- [ ] La ruta `/about` carga sin errores de TypeScript ni warnings en consola.
- [ ] El link "Acerca de" en el Nav navega a `/about` y muestra el estado activo (color cyan + línea inferior).
- [ ] La página muestra las tres secciones en orden: hero, divider animado, contacto.
- [ ] El hero muestra el kicker "▸ ACERCA DE", el título, la misión y los tres highlights (HEART, BROWSER, PLANT) con sus íconos SVG.
- [ ] El divider muestra 24 píxeles animados entre las dos barras.
- [ ] Las secciones con clase `.reveal` aparecen con animación fade-in al hacer scroll.
- [ ] El formulario muestra shake si se intenta enviar con algún campo vacío.
- [ ] El formulario llama a `POST /api/contact` al hacer submit con todos los campos rellenos.
- [ ] Si la API responde `{ ok: true }`, el formulario se reemplaza por el bloque `terminal-success` con el nombre del remitente en mayúsculas.
- [ ] El botón "ENVIAR OTRO MENSAJE" limpia el formulario y vuelve al estado inicial.
- [ ] Si la API falla, se muestra un mensaje de error visible (no un crash).
- [ ] `[EMAIL_ADDRESS]` recibe el email con nombre, email y mensaje del remitente.
- [ ] `.env.local` contiene `RESEND_API_KEY` y no está commiteado al repositorio.

---

## Decisions

- **Sí: API Route en `/api/contact`** — La API Key de Resend nunca sale al cliente; el fetch va al backend de Next.js. Descartado: llamar a Resend directamente desde el cliente (expondría la key en el bundle).

- **Sí: solo notificación al equipo, sin copia al remitente** — Evita complejidad de templates de confirmación y riesgo de que el dominio quede marcado como spam. Descartado: email de confirmación al usuario (queda para spec posterior si se necesita).

- **Sí: estilos en `globals.css`** — Consistente con specs 01 y 02. Descartado: CSS Modules (el template usa clases BEM propias que conviene mantener).

- **Sí: `HighlightIcon` como componente local en `page.tsx`** — Solo se usa en esta página; no justifica un archivo propio. Descartado: moverlo a `src/components/` (over-engineering para un componente de una sola página).

- **Sí: habilitar link "Acerca de" en Nav** — El spec 02 lo dejó deshabilitado como placeholder; este spec implementa la ruta real.
