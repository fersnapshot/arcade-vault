"use client";

import { useState } from "react";
import { GAMES } from "@/data/games";
import { seededScores } from "@/data/scores";

const PODIUM_CLASS = ["gold", "silver", "bronze"];
const PODIUM_LABEL = ["#1", "#2", "#3"];
const TABLE_RANK_CLASS = ["top1", "top2", "top3"];

function getScores(gameId: string, gameBest: number) {
  return seededScores(gameId.length * 31 + (gameBest % 97), 15);
}

export default function HallOfFamePage() {
  const [activeId, setActiveId] = useState(GAMES[0].id);
  const game = GAMES.find((g) => g.id === activeId)!;
  const scores = getScores(game.id, game.best);
  const podium = [scores[1], scores[0], scores[2]]; // 2nd, 1st, 3rd for visual podium layout

  return (
    <>
      <div className="av-bg" />
      <div className="av-noise" />

      <div className="av-hall fade-in">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
          <p>LOS MEJORES SCORES DE ARCADE VAULT</p>
        </div>

        {/* Game tabs */}
        <div className="hall-tabs">
          {GAMES.map((g) => (
            <button
              key={g.id}
              className={`chip${activeId === g.id ? " active" : ""}`}
              onClick={() => setActiveId(g.id)}
            >
              {g.title}
            </button>
          ))}
        </div>

        {/* Podium */}
        <div className="podium">
          {podium.map((row, i) => {
            const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div
                key={row.rank}
                className={`podium-slot ${PODIUM_CLASS[realRank - 1]}`}
              >
                <div className="rank-num">{PODIUM_LABEL[realRank - 1]}</div>
                <div className="name">{row.name}</div>
                <div className="score">{row.score.toLocaleString()}</div>
                <div className="date">{row.date}</div>
              </div>
            );
          })}
        </div>

        {/* Full table */}
        <div className="hall-table">
          <div className="th">
            <span>RANK</span>
            <span>JUGADOR</span>
            <span>SCORE</span>
            <span>FECHA</span>
          </div>
          {scores.map((row, i) => (
            <div
              key={row.rank}
              className={`tr${
                TABLE_RANK_CLASS[i] ? ` ${TABLE_RANK_CLASS[i]}` : ""
              }`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="rk">#{row.rank}</span>
              <span className="pl">{row.name}</span>
              <span className="sc">{row.score.toLocaleString()}</span>
              <span className="dt">{row.date}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
