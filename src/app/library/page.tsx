"use client";

import { useState } from "react";
import { GAMES, CATS, type Cat } from "@/data/games";
import GameCard from "@/components/GameCard";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("TODOS");

  const filtered = GAMES.filter((g) => {
    const matchCat = cat === "TODOS" || g.cat === cat;
    const matchQ = g.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <>
      <div className="av-bg" />
      <div className="av-noise" />

      <section className="av-hero">
        <h1>GAME LIBRARY</h1>
        <p className="sub">
          SELECT YOUR GAME<span className="blink">_</span>
        </p>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">▶</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? " active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center font-mono text-sm text-[var(--ink-faint)] py-16 tracking-widest">
            NO SE ENCONTRARON JUEGOS
          </p>
        ) : (
          filtered.map((game) => <GameCard key={game.id} game={game} />)
        )}
      </div>
    </>
  );
}
