import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, getTopScores } from "@/lib/supabase/queries";

const RANK_CLASS = ["top1", "top2", "top3"];

export default async function FroggerDetailPage() {
  const [game, scores] = await Promise.all([
    getGame("frogger"),
    getTopScores("frogger", 10),
  ]);
  if (!game) notFound();
  const bestScore = scores.length > 0 ? scores[0]!.score : 0;
  const plays = scores.length.toString();

  return (
    <>
      <div className="av-detail fade-in">
        <div>
          <div className="detail-cover">
            <div
              className={`cover-bg ${game.cover}`}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>

          <div className="leaderboard" style={{ marginTop: 24 }}>
            <h3>★ LEADERBOARD</h3>
            {scores.length === 0 ? (
              <div className="lb-row">
                <span className="pl">Aún no hay scores.</span>
              </div>
            ) : (
              scores.map((row, i) => (
                <div
                  key={row.id}
                  className={`lb-row${RANK_CLASS[i] ? ` ${RANK_CLASS[i]}` : ""}`}
                >
                  <span className="rk">#{i + 1}</span>
                  <span className="pl">{row.player_name}</span>
                  <span className="sc">{row.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

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
            <Link href="/games/frogger/play" className="btn lg pulse">
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
