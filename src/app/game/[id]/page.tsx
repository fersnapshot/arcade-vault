import { notFound } from "next/navigation";
import Link from "next/link";
import { GAMES } from "@/data/games";
import { seededScores } from "@/data/scores";

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

  const scores = seededScores(game.id.length * 31 + (game.best % 97));

  return (
    <>
      <div className="av-bg" />
      <div className="av-noise" />

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
            {scores.map((row) => (
              <div
                key={row.rank}
                className={`lb-row${
                  RANK_CLASS[row.rank - 1] ? ` ${RANK_CLASS[row.rank - 1]}` : ""
                }`}
              >
                <span className="rk">#{row.rank}</span>
                <span className="pl">{row.name}</span>
                <span className="sc">{row.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>{game.plays} PARTIDAS</span>
          </div>

          <h2 className={`neon-${game.color}`}>{game.title}</h2>

          <p>{game.long}</p>

          <div className="stat-strip">
            <div>
              <div className="l">Mejor score</div>
              <div className="v">{game.best.toLocaleString()}</div>
            </div>
            <div>
              <div className="l">Partidas</div>
              <div className="v">{game.plays}</div>
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
            <Link href="/library" className="btn ghost">
              ← VOLVER
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
