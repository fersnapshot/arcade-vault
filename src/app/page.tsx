import { getGames } from "@/lib/supabase/queries";
import HomeClient from "./HomeClient";

export default async function HomePage() {
  const games = await getGames();
  return <HomeClient games={games.slice(0, 6)} />;
}
