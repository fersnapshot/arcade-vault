"use client";

import { useState } from "react";
import type { Game, Score } from "@/lib/supabase/types";

const PODIUM_CLASS = ["gold", "silver", "bronze"];
const PODIUM_LABEL = ["#1", "#2", "#3"];
const TABLE_RANK_CLASS = ["top1", "top2", "top3"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

interface Props {
  games: Game[];
  scoresByGame: Record<string, Score[]>;
}

export default function HallOfFameClient({ games, scoresByGame }: Props) {
  const [activeId, setActiveId] = useState(games[0]?.id ?? "");
  const scores = scoresByGame[activeId] ?? [];
  const podium = [scores[1], scores[0], scores[2]];

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES SCORES DE ARCADE VAULT</p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={`chip${activeId === g.id ? " active" : ""}`}
            onClick={() => setActiveId(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {scores.length === 0 ? (
        <div className="hall-empty">
          <p>Aún no hay scores para este juego.</p>
        </div>
      ) : (
        <>
          <div className="podium">
            {podium.map((row, i) => {
              const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
              if (!row)
                return (
                  <div
                    key={i}
                    className={`podium-slot ${PODIUM_CLASS[realRank - 1]}`}
                  />
                );
              return (
                <div
                  key={row.id}
                  className={`podium-slot ${PODIUM_CLASS[realRank - 1]}`}
                >
                  <div className="rank-num">{PODIUM_LABEL[realRank - 1]}</div>
                  <div className="name">{row.player_name}</div>
                  <div className="score">{row.score.toLocaleString()}</div>
                  <div className="date">{formatDate(row.created_at)}</div>
                </div>
              );
            })}
          </div>

          <div className="hall-table">
            <div className="th">
              <span>RANK</span>
              <span>JUGADOR</span>
              <span>SCORE</span>
              <span>FECHA</span>
            </div>
            {scores.map((row, i) => (
              <div
                key={row.id}
                className={`tr${TABLE_RANK_CLASS[i] ? ` ${TABLE_RANK_CLASS[i]}` : ""}`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="rk">#{i + 1}</span>
                <span className="pl">{row.player_name}</span>
                <span className="sc">{row.score.toLocaleString()}</span>
                <span className="dt">{formatDate(row.created_at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
