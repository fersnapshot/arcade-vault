/* eslint-disable @typescript-eslint/no-unused-vars */

interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

const PLAYERS = [
  "ACE",
  "BLZ",
  "CYB",
  "DOT",
  "EVA",
  "FLX",
  "GUN",
  "HXR",
  "ICE",
  "JAX",
  "KAI",
  "LUX",
  "MAX",
  "NEO",
  "ORB",
  "PIX",
  "QUE",
  "RAD",
  "SYN",
  "TRX",
  "ULT",
  "VEX",
  "WRX",
  "XNO",
  "YGO",
  "ZAP",
];

const DATES = [
  "2026-06-01",
  "2026-05-28",
  "2026-05-14",
  "2026-04-30",
  "2026-04-12",
  "2026-03-22",
  "2026-03-08",
  "2026-02-19",
  "2026-02-03",
  "2026-01-17",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededScores(seed: number, count = 10): ScoreRow[] {
  const rand = seededRandom(seed);
  const baseScore = 50000 + Math.floor(rand() * 900000);

  return Array.from({ length: count }, (_, i) => {
    const decay = 1 - i * (0.06 + rand() * 0.04);
    const score = Math.max(100, Math.floor(baseScore * decay));
    const playerIdx = Math.floor(rand() * PLAYERS.length);
    const dateIdx = Math.min(i, DATES.length - 1);
    return {
      rank: i + 1,
      name: PLAYERS[playerIdx],
      score,
      date: DATES[dateIdx],
    };
  });
}
