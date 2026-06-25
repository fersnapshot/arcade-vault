"use server";

import { insertScore } from "@/lib/supabase/queries";

export async function saveScore(playerName: string, score: number) {
  await insertScore({ game_id: "frogger", score, player_name: playerName });
}
