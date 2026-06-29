"use server";

import { insertScore } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export async function saveScore(playerName: string, score: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await insertScore({
    game_id: "asteroids",
    score,
    player_name: playerName,
    user_id: user?.id ?? null,
  });
}
