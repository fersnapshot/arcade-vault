"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { Game } from "@/data/games";

const COLOR_CLASS: Record<Game["color"], string> = {
  cyan: "neon-cyan",
  magenta: "neon-magenta",
  green: "neon-green",
  yellow: "neon-yellow",
};

export default function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${
      -y * 10
    }deg) translateY(-4px)`;
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
  }

  const go = () => router.push(`/game/${game.id}`);

  return (
    <div
      ref={cardRef}
      className="card"
      onClick={go}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition:
          "transform 180ms ease, box-shadow 220ms ease, border-color 220ms ease",
      }}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <span className="label">{game.cat}</span>
      </div>

      <div className="meta">
        <div className={`title ${COLOR_CLASS[game.color]}`}>{game.title}</div>
        <div className="desc">{game.short}</div>
      </div>

      <div className="row">
        <div className="score-badge">
          <span>MEJOR SCORE</span>
          <b>{game.best.toLocaleString("es-ES")}</b>
        </div>
        <button
          className="btn"
          onClick={(e) => {
            e.stopPropagation();
            go();
          }}
        >
          JUGAR
        </button>
      </div>
    </div>
  );
}
