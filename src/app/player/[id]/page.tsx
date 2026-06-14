"use client";

import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/data/games";
import { notFound } from "next/navigation";

type GameState = "playing" | "paused" | "over";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  const router = useRouter();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [state, setState] = useState<GameState>("playing");
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state !== "playing") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setScore((s) => {
        const next = s + Math.floor(10 + level * 5);
        if (next > 0 && next % 5000 < 100) {
          setLevel((l) => Math.min(l + 1, 9));
        }
        return next;
      });
    }, 100);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, level]);

  function pause() {
    setState((s) => (s === "playing" ? "paused" : "playing"));
  }

  function end() {
    setState("over");
  }

  function saveScore() {
    setSaved(true);
  }

  return (
    <div className="av-player fade-in">
      {/* HUD */}
      <div className="player-hud">
        <div className="hud-stat">
          <span className="l">SCORE</span>
          <span className="v">{score.toLocaleString()}</span>
        </div>
        <div className="hud-stat lives">
          <span className="l">VIDAS</span>
          <span className="v">{"♥ ".repeat(lives).trim()}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">LV.{level}</span>
        </div>
        <div className="hud-actions">
          <button className="btn" onClick={pause}>
            {state === "paused" ? "▶ REANUDAR" : "⏸ PAUSA"}
          </button>
          <button className="btn magenta" onClick={end}>
            ■ FIN
          </button>
        </div>
      </div>

      {/* CRT screen */}
      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="player-ship" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
          </div>

          {/* Pause overlay */}
          {state === "paused" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.7)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <p
                className="pixel flicker"
                style={{ fontSize: 18, color: "var(--yellow)" }}
              >
                PAUSA
              </p>
              <button className="btn" onClick={pause}>
                ▶ REANUDAR
              </button>
            </div>
          )}
        </div>

        <div className="crt-bottom">
          <span className="led">ACTIVE</span>
          <span className="pixel" style={{ fontSize: 8 }}>
            {game.title}
          </span>
          <span>AV-2026</span>
        </div>
      </div>

      {/* Game over modal */}
      {state === "over" && (
        <div className="modal-bd">
          <div className="modal fade-in">
            <h2>GAME OVER</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString()}</div>

            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    type="text"
                    placeholder="TU NOMBRE (3 LETRAS)"
                    maxLength={3}
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="actions">
                  <button className="btn pulse" onClick={saveScore}>
                    GUARDAR
                  </button>
                  <Link href={`/game/${game.id}`} className="btn ghost">
                    VER FICHA
                  </Link>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/library")}
                  >
                    SALIR
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="toast-saved">✓ PUNTUACIÓN GUARDADA</div>
                <div className="actions" style={{ marginTop: 24 }}>
                  <Link href={`/game/${game.id}`} className="btn">
                    VER LEADERBOARD
                  </Link>
                  <button
                    className="btn ghost"
                    onClick={() => {
                      setScore(0);
                      setLevel(1);
                      setLives(3);
                      setSaved(false);
                      setState("playing");
                    }}
                  >
                    JUGAR DE NUEVO
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
