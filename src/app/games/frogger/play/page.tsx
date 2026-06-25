"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FroggerRef, type SkinId } from "@/components/games/FroggerGame";
import { saveScore } from "./actions";
import { useSkinLocalStorage } from "@/hooks/useSkinLocalStorage";

const FroggerGame = dynamic(() => import("@/components/games/FroggerGame"), {
  ssr: false,
});

type GameState = "playing" | "paused" | "over";

const SKINS: { id: SkinId; label: string }[] = [
  { id: "classic", label: "CLASSIC" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];

export default function FroggerPlayPage() {
  const router = useRouter();
  const gameRef = useRef<FroggerRef>(null);

  const [gameState, setGameState] = useState<GameState>("playing");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("av_player_name") ?? "";
    }
    return "";
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { skin, handleSkinChange } = useSkinLocalStorage<SkinId>(
    "frogger-skin",
    "classic",
  );

  function handlePauseClick() {
    if (gameState === "over") return;
    setGameState((s) => (s === "paused" ? "playing" : "paused"));
  }

  async function handleSave() {
    if (!playerName.trim() || saving || saved) return;
    setSaving(true);
    try {
      const name = playerName.trim().toUpperCase();
      await saveScore(name, finalScore);
      localStorage.setItem("av_player_name", name);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function handleRestart() {
    setSaved(false);
    setPlayerName(localStorage.getItem("av_player_name") ?? "");
    setScore(0);
    setLives(3);
    setLevel(1);
    setFinalScore(0);
    setGameState("playing");
    setGameKey((k) => k + 1);
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

        {/* Skin selector */}
        <div className="hud-stat" style={{ gap: 4 }}>
          <span className="l">SKIN</span>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {SKINS.map((s) => (
              <button
                key={s.id}
                className={`btn${skin === s.id ? " pulse" : " ghost"}`}
                style={{ fontSize: 9, padding: "2px 6px" }}
                onClick={() => handleSkinChange(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
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
          <FroggerGame
            key={gameKey}
            ref={gameRef}
            paused={gameState === "paused"}
            skin={skin}
            onScoreChange={setScore}
            onLivesChange={setLives}
            onLevelChange={setLevel}
            onGameOver={(s) => {
              setFinalScore(s);
              setGameState("over");
            }}
          />

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
            FROGGER
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
                  <Link href="/games/frogger" className="btn ghost">
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
                  <Link href="/games/frogger" className="btn">
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
