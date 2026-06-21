import { getGamesWithBest } from "@/lib/supabase/queries";
import LibraryClient from "./LibraryClient";

export default async function LibraryPage() {
  const games = await getGamesWithBest();
  return <LibraryClient games={games} />;
}
