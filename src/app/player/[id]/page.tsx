import { notFound } from "next/navigation";
import { getGame } from "@/lib/supabase/queries";
import PlayerClient from "./PlayerClient";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();
  return <PlayerClient game={game} />;
}
