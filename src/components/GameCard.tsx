"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { Game } from "@/data/games";

function btnColorClass(color: Game["color"]) {
  if (color === "magenta") return "btn magenta";
  if (color === "yellow") return "btn yellow";
  return "btn";
}

export default function GameCard({ game }: { game: Game }) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${
      px * 8
    }deg)`;
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
  }

  const go = () => router.push(`/games/${game.id}`);

  return (
    <div
      ref={cardRef}
      className="card"
      onClick={go}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <button
            className={btnColorClass(game.color)}
            onClick={(e) => {
              e.stopPropagation();
              go();
            }}
          >
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
}
