"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SnakeGame, { type SnakeRef } from "@/components/games/SnakeGame";
import { saveScore } from "./actions";

type GameState = "selecting" | "playing" | "paused" | "over";

const MAX_LEVEL = 9;

export default function SnakePage() {
  const router = useRouter();
  const gameRef = useRef<SnakeRef>(null);

  const [gameState, setGameState] = useState<GameState>("selecting");
  const [selectedLevel, setSelectedLevel] = useState(1);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleStart() {
    setScore(0);
    setLevel(selectedLevel);
    setGameState("playing");
  }

  function handlePauseClick() {
    gameRef.current?.togglePause();
  }

  async function handleSave() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    try {
      await saveScore(playerName.trim().toUpperCase(), finalScore);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handleRestart() {
    setSaved(false);
    setPlayerName("");
    setScore(0);
    setLevel(selectedLevel);
    setGameState("playing");
    gameRef.current?.restart(selectedLevel);
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
          <span className="v">♥</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">LV.{level}</span>
        </div>
        <div className="hud-actions">
          <button
            className="btn"
            onClick={handlePauseClick}
            disabled={gameState === "over" || gameState === "selecting"}
          >
            {gameState === "paused" ? "▶ REANUDAR" : "⏸ PAUSA"}
          </button>
          <button className="btn magenta" onClick={() => router.push("/games")}>
            ■ SALIR
          </button>
        </div>
      </div>

      {/* CRT screen */}
      <div className="crt">
        <div className="crt-screen">
          {/* Level selector */}
          {gameState === "selecting" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 24,
                background: "#0a0a0f",
              }}
            >
              <p
                className="pixel"
                style={{
                  fontSize: 22,
                  color: "var(--green)",
                  letterSpacing: 4,
                }}
              >
                SNAKE
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  className="pixel"
                  style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}
                >
                  VELOCIDAD INICIAL
                </span>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(Number(e.target.value))}
                  style={{
                    background: "var(--panel)",
                    color: "var(--fg)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 4,
                    padding: "6px 12px",
                    fontSize: 16,
                    fontFamily: "monospace",
                    textAlign: "center",
                  }}
                >
                  {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <button className="btn lg pulse" onClick={handleStart}>
                ▶ EMPEZAR
              </button>
            </div>
          )}

          {/* Game */}
          {gameState !== "selecting" && (
            <SnakeGame
              ref={gameRef}
              startLevel={selectedLevel}
              onScore={setScore}
              onLevel={setLevel}
              onPause={(p) => setGameState(p ? "paused" : "playing")}
              onGameOver={(s) => {
                setFinalScore(s);
                setGameState("over");
              }}
            />
          )}

          {/* Pause overlay */}
          {gameState === "paused" && (
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
              <button className="btn" onClick={handlePauseClick}>
                ▶ REANUDAR
              </button>
            </div>
          )}
        </div>

        <div className="crt-bottom">
          <span className="led">ACTIVE</span>
          <span className="pixel" style={{ fontSize: 8 }}>
            SNAKE
          </span>
          <span>AV-2026</span>
        </div>
      </div>

      {/* Game over modal */}
      {gameState === "over" && (
        <div className="modal-bd">
          <div className="modal fade-in">
            <h2>GAME OVER</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{finalScore.toLocaleString()}</div>

            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    type="text"
                    placeholder="TU NOMBRE (3 LETRAS)"
                    maxLength={3}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="actions">
                  <button
                    className="btn pulse"
                    onClick={handleSave}
                    disabled={saving || !playerName.trim()}
                  >
                    {saving ? "GUARDANDO…" : "GUARDAR"}
                  </button>
                  <Link href="/games/snake" className="btn ghost">
                    VER FICHA
                  </Link>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/games")}
                  >
                    SALIR
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="toast-saved">✓ PUNTUACIÓN GUARDADA</div>
                <div className="actions" style={{ marginTop: 24 }}>
                  <Link href="/games/snake" className="btn">
                    VER LEADERBOARD
                  </Link>
                  <button className="btn ghost" onClick={handleRestart}>
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
