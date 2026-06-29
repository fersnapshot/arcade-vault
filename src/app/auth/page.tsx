"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "register";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function switchTab(t: Tab) {
    setTab(t);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo("Revisa tu correo para confirmar tu cuenta.");
      }
    }

    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="av-auth-wrap">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <div className="mark" />
          <h2>ARCADE VAULT</h2>
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--ink-faint)",
              marginTop: 4,
              letterSpacing: "0.16em",
            }}
          >
            INSERT COIN TO CONTINUE
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === "login" ? "on" : ""}
            onClick={() => switchTab("login")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "register" ? "on" : ""}
            onClick={() => switchTab("register")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="player@arcade.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "#ff4444",
                marginTop: 4,
              }}
            >
              {error}
            </p>
          )}

          {info && (
            <p
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "#44ff88",
                marginTop: 4,
              }}
            >
              {info}
            </p>
          )}

          <button
            type="submit"
            className="btn pulse"
            style={{ width: "100%", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "..." : tab === "login" ? "ENTRAR" : "REGISTRARSE"}
          </button>
        </form>

        <div className="auth-divider">O CONTINUAR CON</div>

        <div className="social">
          <button
            className="btn ghost"
            onClick={() => handleOAuth("google")}
            type="button"
          >
            GOOGLE
          </button>
          <button
            className="btn ghost"
            onClick={() => handleOAuth("github")}
            type="button"
          >
            GITHUB
          </button>
        </div>
      </div>
    </div>
  );
}
