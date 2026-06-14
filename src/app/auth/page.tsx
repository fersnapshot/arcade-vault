"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

type Tab = "login" | "register";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUser();
  const router = useRouter();

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const playerName = name.trim() || email.split("@")[0];
    login({ name: playerName });
    router.push("/library");
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
            onClick={() => setTab("login")}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === "register" ? "on" : ""}
            onClick={() => setTab("register")}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="field">
              <label>Nombre de jugador</label>
              <input
                type="text"
                placeholder="MAX 10 CHARS"
                maxLength={10}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
          )}

          {tab === "register" && (
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="player@arcade.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {tab === "login" && (
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="player@arcade.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn pulse"
            style={{ width: "100%", marginTop: 8 }}
          >
            {tab === "login" ? "ENTRAR" : "REGISTRARSE"}
          </button>
        </form>

        <div className="auth-divider">O CONTINUAR CON</div>

        <div className="social">
          <button className="btn ghost">GOOGLE</button>
          <button className="btn ghost">GITHUB</button>
        </div>
      </div>
    </div>
  );
}
