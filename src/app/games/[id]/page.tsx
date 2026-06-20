import { notFound } from "next/navigation";
import Link from "next/link";
import { GAMES } from "@/data/games";
import { seededScores } from "@/data/scores";
import { getTopScores } from "@/lib/supabase/queries";
import type { Score } from "@/lib/supabase/types";

export function generateStaticParams() {
  return GAMES.map((g) => ({ id: g.id }));
}

const RANK_CLASS = ["top1", "top2", "top3"];

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  const isAsteroids = id === "asteroids";

  let lbRows: { rank: number; name: string; score: number }[] = [];
  let bestScore = game.best;
  let plays = game.plays;

  if (isAsteroids) {
    const real: Score[] = await getTopScores("asteroids", 10);
    lbRows = real.map((r, i) => ({
      rank: i + 1,
      name: r.player_name,
      score: r.score,
    }));
    if (real.length > 0) {
      bestScore = real[0].score;
      plays = real.length.toString();
    }
  } else {
    const seeded = seededScores(game.id.length * 31 + (game.best % 97));
    lbRows = seeded.map((r) => ({
      rank: r.rank,
      name: r.name,
      score: r.score,
    }));
  }

  return (
    <>
      <div className="av-detail fade-in">
        {/* Left column */}
        <div>
          <div className="detail-cover">
            <div
              className={`cover-bg ${game.cover}`}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>

          <div className="leaderboard" style={{ marginTop: 24 }}>
            <h3>★ LEADERBOARD</h3>
            {lbRows.length === 0 ? (
              <div className="lb-row">
                <span className="pl">Aún no hay scores.</span>
              </div>
            ) : (
              lbRows.map((row) => (
                <div
                  key={row.rank}
                  className={`lb-row${RANK_CLASS[row.rank - 1] ? ` ${RANK_CLASS[row.rank - 1]}` : ""}`}
                >
                  <span className="rk">#{row.rank}</span>
                  <span className="pl">{row.name}</span>
                  <span className="sc">{row.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>{plays} PARTIDAS</span>
          </div>

          <h2 className={`neon-${game.color}`}>{game.title}</h2>

          <p>{game.long}</p>

          <div className="stat-strip">
            <div>
              <div className="l">Mejor score</div>
              <div className="v">{bestScore.toLocaleString()}</div>
            </div>
            <div>
              <div className="l">Partidas</div>
              <div className="v">{plays}</div>
            </div>
            <div>
              <div className="l">Categoría</div>
              <div className="v" style={{ fontSize: 12 }}>
                {game.cat}
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <Link href={`/player/${game.id}`} className="btn lg pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost">
              ← VOLVER
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
