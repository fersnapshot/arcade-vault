"use client";

import { useState } from "react";
import GameCard from "@/components/GameCard";
import type { GameWithBest } from "@/lib/supabase/types";

type Cat = "TODOS" | string;

export default function LibraryClient({ games }: { games: GameWithBest[] }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<Cat>("TODOS");

  const cats = ["TODOS", ...Array.from(new Set(games.map((g) => g.cat)))];

  const filtered = games.filter((g) => {
    const matchCat = cat === "TODOS" || g.cat === cat;
    const matchQ = g.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <>
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="Buscar un juego por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="av-chips">
          {cats.map((c) => (
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
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 80,
              color: "var(--ink-faint)",
            }}
          >
            <div
              className="pixel"
              style={{
                fontSize: 14,
                color: "var(--magenta)",
                marginBottom: 12,
              }}
            >
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        ) : (
          filtered.map((game) => <GameCard key={game.id} game={game} />)
        )}
      </div>
    </>
  );
}
