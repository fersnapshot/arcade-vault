export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: string;
  created_at: string;
}

export interface Score {
  id: string;
  game_id: string;
  score: number;
  player_name: string;
  user_id: string | null;
  created_at: string;
}

export interface GameWithBest extends Game {
  best: number;
}

export interface InsertScore {
  game_id: string;
  score: number;
  player_name: string;
}
