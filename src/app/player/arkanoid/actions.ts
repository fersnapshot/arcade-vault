"use server";

import { insertScore } from "@/lib/supabase/queries";

export async function saveScore(playerName: string, score: number) {
  await insertScore({ game_id: "arkanoid", score, player_name: playerName });
}
