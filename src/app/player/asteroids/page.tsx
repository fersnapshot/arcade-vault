"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AsteroidsGame, {
  type AsteroidsRef,
  type SkinId,
} from "@/components/games/AsteroidsGame";
import { VirtualGamepad } from "@/components/ui/VirtualGamepad";
import { saveScore } from "./actions";
import { useSkinLocalStorage } from "@/hooks/useSkinLocalStorage";
import { useUser } from "@/context/UserContext";

const GAMEPAD_KEYMAP = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  actionA: " ",
};

type GameState = "playing" | "paused" | "over";

const SKINS: { id: SkinId; label: string }[] = [
  { id: "classic", label: "CLASSIC" },
  { id: "neon", label: "NEON" },
  { id: "retro", label: "RETRO" },
];

export default function AsteroidsPage() {
  const router = useRouter();
  const gameRef = useRef<AsteroidsRef>(null);
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState(
    user?.user_metadata?.name ?? user?.email?.split("@")[0] ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { skin, handleSkinChange } =
    useSkinLocalStorage<SkinId>("asteroids-skin");

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
          <AsteroidsGame
            ref={gameRef}
            skin={skin}
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
            ASTEROIDS
          </span>
          <span>AV-2026</span>
        </div>
      </div>

      {/* Virtual gamepad (mobile only) */}
      <VirtualGamepad
        keyMap={GAMEPAD_KEYMAP}
        onPause={handlePauseClick}
        onExit={() => router.push("/games")}
        skin={skin}
        skins={SKINS}
        onSkinChange={(s) => handleSkinChange(s as SkinId)}
      />

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
                  <Link href="/games/asteroids" className="btn ghost">
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
                  <Link href="/games/asteroids" className="btn">
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
