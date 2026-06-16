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
      <svg className="hl-icon" viewBox="0 0 24 22" aria-hidden="true">
        <g fill={C}>
          <rect x="2" y="2" width="6" height="2" />
          <rect x="16" y="2" width="6" height="2" />
          <rect x="0" y="4" width="10" height="4" />
          <rect x="14" y="4" width="10" height="4" />
          <rect x="0" y="8" width="24" height="4" />
          <rect x="2" y="12" width="20" height="2" />
          <rect x="4" y="14" width="16" height="2" />
          <rect x="6" y="16" width="12" height="2" />
          <rect x="8" y="18" width="8" height="2" />
          <rect x="10" y="20" width="4" height="2" />
        </g>
      </svg>
    );
  if (kind === "BROWSER")
    return (
      <svg className="hl-icon" viewBox="0 0 24 20" aria-hidden="true">
        <g fill={C}>
          <rect x="0" y="0" width="24" height="4" />
          <rect x="0" y="4" width="24" height="16" fill="none" stroke={C} strokeWidth="1.5" />
          <rect x="2" y="1" width="2" height="2" fill="#0a0a0f" />
          <rect x="5" y="1" width="2" height="2" fill="#0a0a0f" />
          <rect x="8" y="1" width="2" height="2" fill="#0a0a0f" />
          <rect x="2" y="7" width="20" height="1" />
          <rect x="2" y="10" width="14" height="1" />
          <rect x="2" y="13" width="18" height="1" />
          <rect x="2" y="16" width="10" height="1" />
        </g>
      </svg>
    );
  if (kind === "PLANT")
    return (
      <svg className="hl-icon" viewBox="0 0 24 24" aria-hidden="true">
        <g fill={C}>
          <rect x="10" y="14" width="4" height="8" />
          <rect x="8" y="20" width="8" height="2" />
          <rect x="8" y="8" width="8" height="6" />
          <rect x="6" y="10" width="2" height="4" />
          <rect x="16" y="10" width="2" height="4" />
          <rect x="10" y="4" width="4" height="4" />
          <rect x="8" y="6" width="2" height="2" />
          <rect x="14" y="6" width="2" height="2" />
          <rect x="4" y="12" width="2" height="4" />
          <rect x="18" y="12" width="2" height="4" />
        </g>
      </svg>
    );
  return null;
}

const HIGHLIGHTS = [
  {
    kind: "HEART" as const,
    label: "HECHO CON PASIÓN",
    desc: "Arcade Vault nació del amor por los juegos clásicos. Cada píxel está puesto con cuidado por personas que crecieron jugando en arcades.",
  },
  {
    kind: "BROWSER" as const,
    label: "DIRECTO AL BROWSER",
    desc: "Sin instalaciones, sin plugins, sin esperas. Abre el navegador, elige tu juego y empieza a jugar en segundos desde cualquier dispositivo.",
  },
  {
    kind: "PLANT" as const,
    label: "SIEMPRE CRECIENDO",
    desc: "La biblioteca crece cada mes. Escuchamos a la comunidad para priorizar los juegos que más quieren ver en la plataforma.",
  },
] as const;

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
        setSent(form.name);
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
    setForm({ name: "", email: "", msg: "" });
    setSent(null);
    setError(null);
  }

  return (
    <div className="about fade-in">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="about-hero">
        <div className="hero-eyebrow pixel neon-cyan" style={{ marginBottom: 20 }}>
          ▸ ACERCA DE
        </div>
        <h1 className="about-title">ARCADE VAULT</h1>
        <p className="about-mission">
          Somos un proyecto independiente dedicado a preservar y celebrar los
          videojuegos clásicos. Nuestra misión es simple: llevar la magia de
          los arcades a cualquier navegador, de forma gratuita, sin barreras y
          con el respeto que estos juegos se merecen.
        </p>
        <div className="highlight-row reveal">
          {HIGHLIGHTS.map((h) => (
            <div key={h.kind} className="highlight">
              <HighlightIcon kind={h.kind} />
              <div className="hl-label pixel">{h.label}</div>
              <div className="hl-desc">{h.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="about-divider" aria-hidden="true">
        <div className="div-bar" />
        <div className="div-pixels">
          {PIXELS.map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.06}s` }} />
          ))}
        </div>
        <div className="div-bar" />
      </div>

      {/* ── CONTACTO ─────────────────────────────────────────────────────── */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          {/* Intro */}
          <div className="contact-intro">
            <h2 className="contact-title pixel">ESCRÍBENOS</h2>
            <p className="contact-sub">
              ¿Tienes una idea, un bug que reportar o simplemente quieres
              saludar? Nos encanta leer los mensajes de la comunidad.
              Respondemos a todo, aunque a veces tardemos un poco.
            </p>
            <div className="contact-tips">
              <div className="tip">
                <span className="tip-led" />
                Sugerencias de nuevos juegos
              </div>
              <div className="tip">
                <span className="tip-led" />
                Reportes de bugs o errores
              </div>
              <div className="tip">
                <span className="tip-led" />
                Colaboraciones y propuestas
              </div>
            </div>
          </div>

          {/* Form / Terminal */}
          <div>
            {sent ? (
              <div className="terminal-success">
                <div className="term-bar">
                  <span className="dot" />
                  <span className="dot" style={{ background: "var(--yellow)", boxShadow: "0 0 6px var(--yellow)" }} />
                  <span className="dot" style={{ background: "var(--magenta)", boxShadow: "0 0 6px var(--magenta)" }} />
                </div>
                <div className="term-body">
                  <div className="term-title">✔ MENSAJE ENVIADO</div>
                  <div className="line">
                    <span className="prompt">$</span> contact --from &quot;{sent.toUpperCase()}&quot;
                  </div>
                  <div className="line" style={{ color: "var(--green)" }}>
                    STATUS: 200 OK — Tu mensaje ha llegado. ¡Gracias!
                  </div>
                  <div className="line">
                    <span className="caret" />
                  </div>
                  <button
                    className="btn"
                    style={{ marginTop: 12 }}
                    onClick={handleReset}
                  >
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              </div>
            ) : (
              <form
                className={`contact-form${shake ? " shake" : ""}`}
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="field">
                  <label>NOMBRE</label>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>MENSAJE</label>
                  <textarea
                    rows={5}
                    placeholder="Cuéntanos..."
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
                  className="btn magenta lg"
                  disabled={loading}
                  style={{ display: "flex" }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      ENVIANDO…
                    </>
                  ) : (
                    "ENVIAR MENSAJE →"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
