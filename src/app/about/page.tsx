"use client";

import { useEffect, useState } from "react";

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function HighlightIcon({ kind }: { kind: "HEART" | "BROWSER" | "PLANT" }) {
  const C = "currentColor";
  if (kind === "HEART")
    return (
      <svg className="hl-icon" viewBox="0 0 16 16" aria-hidden="true">
        <g fill={C}>
          <rect x="2" y="3" width="4" height="2" />
          <rect x="10" y="3" width="4" height="2" />
          <rect x="1" y="4" width="2" height="4" />
          <rect x="13" y="4" width="2" height="4" />
          <rect x="2" y="8" width="2" height="2" />
          <rect x="12" y="8" width="2" height="2" />
          <rect x="3" y="9" width="10" height="2" />
          <rect x="4" y="11" width="8" height="2" />
          <rect x="5" y="12" width="6" height="2" />
          <rect x="6" y="13" width="4" height="1" />
          <rect x="7" y="14" width="2" height="1" />
        </g>
      </svg>
    );
  if (kind === "BROWSER")
    return (
      <svg className="hl-icon" viewBox="0 0 16 16" aria-hidden="true">
        <g fill={C}>
          <rect
            x="1"
            y="2"
            width="14"
            height="12"
            fill="none"
            stroke={C}
            strokeWidth="1.4"
          />
          <rect x="1" y="2" width="14" height="3" />
          <rect x="3" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="5" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="7" y="3" width="1" height="1" fill="#0a0a0f" />
          <rect x="3" y="7" width="10" height="1" />
          <rect x="3" y="9" width="7" height="1" />
          <rect x="3" y="11" width="9" height="1" />
          <rect x="3" y="13" width="5" height="1" />
        </g>
      </svg>
    );
  if (kind === "PLANT")
    return (
      <svg className="hl-icon" viewBox="0 0 16 16" aria-hidden="true">
        <g fill={C}>
          <rect x="7" y="9" width="2" height="5" />
          <rect x="5" y="13" width="6" height="1" />
          <rect x="5" y="5" width="6" height="4" />
          <rect x="3" y="7" width="2" height="3" />
          <rect x="11" y="7" width="2" height="3" />
          <rect x="7" y="2" width="2" height="3" />
          <rect x="5" y="4" width="2" height="1" />
          <rect x="9" y="4" width="2" height="1" />
          <rect x="2" y="8" width="1" height="3" />
          <rect x="13" y="8" width="1" height="3" />
        </g>
      </svg>
    );
  return null;
}

const HIGHLIGHTS: {
  kind: "HEART" | "BROWSER" | "PLANT";
  color: string;
  text: string;
}[] = [
  { kind: "HEART", color: "magenta", text: "HECHO CON ❤️ PARA JUGADORES" },
  {
    kind: "BROWSER",
    color: "cyan",
    text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",
  },
  { kind: "PLANT", color: "green", text: "PROYECTO EN CONSTANTE CRECIMIENTO" },
];

const PIXELS = Array.from({ length: 24 });

export default function AboutPage() {
  useReveal();

  const [form, setForm] = useState({ name: "", email: "", msg: "" });
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      triggerShake();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(form.name.trim());
      } else {
        setError(data.error ?? "Error desconocido.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSent(null);
    setForm({ name: "", email: "", msg: "" });
  }

  return (
    <div className="about fade-in">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra
          misión es preservar y celebrar los arcades que definieron una
          generación, haciéndolos accesibles para todos, en cualquier lugar y
          sin costo.
        </p>
        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.kind}
              className={`highlight ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.kind} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {PIXELS.map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* ── CONTACTO ─────────────────────────────────────────────────────── */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          {/* Intro */}
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o
              simplemente quieres saludar? Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                RESPUESTA EN 24-48H
              </div>
              <div className="tip">
                <span className="tip-led y" />
                SUGERENCIAS BIENVENIDAS
              </div>
              <div className="tip">
                <span className="tip-led m" />
                SIN SPAM, JAMÁS
              </div>
            </div>
          </div>

          {/* Form / Terminal */}
          <form
            className={`contact-form${shake ? " shake" : ""}`}
            onSubmit={handleSubmit}
            noValidate
          >
            {!sent ? (
              <>
                <div className="field">
                  <label>NOMBRE</label>
                  <input
                    type="text"
                    placeholder="px_kai"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>CORREO ELECTRÓNICO</label>
                  <input
                    type="email"
                    placeholder="jugador@vault.gg"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea
                    rows={5}
                    placeholder="Cuéntanos qué tienes en mente…"
                    value={form.msg}
                    onChange={(e) => setForm({ ...form, msg: e.target.value })}
                  />
                </div>
                {error && (
                  <div style={{ color: "var(--magenta)", fontSize: 13 }}>
                    ✖ {error}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn xl"
                  disabled={loading}
                  style={{ width: "100%" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      ENVIANDO…
                    </>
                  ) : (
                    "▶  ENVIAR MENSAJE"
                  )}
                </button>
              </>
            ) : (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot r" />
                  <span className="dot y" />
                  <span className="dot g" />
                  <span className="term-title">VAULT-OS // TERMINAL</span>
                </div>
                <div className="term-body">
                  <div className="line">
                    <span className="prompt">vault@arcade:~$</span>
                    ./send_message --to=team
                  </div>
                  <div className="line dim">[OK] Conectando con servidor…</div>
                  <div className="line dim">[OK] Validando contenido…</div>
                  <div className="line dim">[OK] Transmitiendo paquete…</div>
                  <div className="line success">
                    &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
                    {sent.toUpperCase()}.<span className="caret">_</span>
                  </div>
                  <div style={{ marginTop: 18 }}>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={handleReset}
                    >
                      ENVIAR OTRO MENSAJE
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
