"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ArkanoidGame, {
  type ArkanoidRef,
} from "@/components/games/ArkanoidGame";
import { saveScore } from "./actions";

type GameState = "playing" | "paused" | "over";

export default function ArkanoidPage() {
  const router = useRouter();
  const gameRef = useRef<ArkanoidRef>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    setLives(3);
    setLevel(1);
    setGameState("playing");
    gameRef.current?.restart();
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
          <span className="v">{"♥ ".repeat(Math.max(0, lives)).trim()}</span>
        </div>
        <div className="hud-stat level">
          <span className="l">NIVEL</span>
          <span className="v">LV.{level}</span>
        </div>
        <div className="hud-actions">
          <button
            className="btn"
            onClick={handlePauseClick}
            disabled={gameState === "over"}
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
          <ArkanoidGame
            ref={gameRef}
            onScore={setScore}
            onLives={setLives}
            onLevel={setLevel}
            onPause={(p) => setGameState(p ? "paused" : "playing")}
            onGameOver={(s) => {
              setFinalScore(s);
              setGameState("over");
            }}
          />

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
            ARKANOID
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
                  <Link href="/games/arkanoid" className="btn ghost">
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
                  <Link href="/games/arkanoid" className="btn">
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
