import {
  getGames,
  getGlobalTopScores,
  getRecentScores,
} from "@/lib/supabase/queries";
import HomeClient from "./HomeClient";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default async function HomePage() {
  const [games, topScores, recentRaw] = await Promise.all([
    getGames(),
    getGlobalTopScores(5),
    getRecentScores(6),
  ]);

  const titleByGame = new Map(games.map((g) => [g.id, g.title]));

  const topPlayers = topScores.map((s, i) => ({
    rank: i + 1,
    name: s.player_name,
    score: s.score,
  }));

  const recentScores = recentRaw.map((s) => ({
    name: s.player_name,
    game: titleByGame.get(s.game_id) ?? s.game_id,
    score: s.score,
    time: formatRelative(s.created_at),
  }));

  return (
    <HomeClient
      games={games.slice(0, 6)}
      topPlayers={topPlayers}
      recentScores={recentScores}
    />
  );
}
