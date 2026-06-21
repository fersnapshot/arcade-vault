import { getGames, getTopScoresByGame } from "@/lib/supabase/queries";
import HallOfFameClient from "./HallOfFameClient";

export default async function HallOfFamePage() {
  const [games, scoresByGame] = await Promise.all([
    getGames(),
    getTopScoresByGame(15),
  ]);
  return <HallOfFameClient games={games} scoresByGame={scoresByGame} />;
}
