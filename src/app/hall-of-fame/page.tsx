import { getTopScoresByGame } from "@/lib/supabase/queries";
import HallOfFameClient from "./HallOfFameClient";

export default async function HallOfFamePage() {
  const scoresByGame = await getTopScoresByGame(15);
  return <HallOfFameClient scoresByGame={scoresByGame} />;
}
