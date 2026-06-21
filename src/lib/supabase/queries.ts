import { createClient } from "./server";
import { Game, GameWithBest, Score, InsertScore } from "./types";

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getTopScores(
  gameId: string,
  limit = 10,
): Promise<Score[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getTopScoresByGame(
  limit = 5,
): Promise<Record<string, Score[]>> {
  const supabase = await createClient();
  const { data: games } = await supabase.from("games").select("id");
  if (!games || games.length === 0) return {};

  const entries = await Promise.all(
    games.map(async ({ id }) => {
      const scores = await getTopScores(id, limit);
      return [id, scores] as [string, Score[]];
    }),
  );

  return Object.fromEntries(entries);
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getGamesWithBest(): Promise<GameWithBest[]> {
  const [games, bestByGame] = await Promise.all([
    getGames(),
    getTopScoresByGame(1),
  ]);
  return games.map((g) => ({
    ...g,
    best: bestByGame[g.id]?.[0]?.score ?? 0,
  }));
}

export async function insertScore(data: InsertScore): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ ...data, user_id: null });
  if (error) throw error;
}
