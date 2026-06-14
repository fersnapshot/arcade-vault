export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;
}

export const GAMES: Game[] = [
  {
    id: "brick-basher",
    title: "BRICK BASHER",
    short: "Destroy the wall, claim the high score.",
    long: "A relentless breakout-style classic. Every brick hides a multiplier; every missed ball costs a life. How long can you keep the streak alive?",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    best: 48200,
    plays: "1.4M",
  },
  {
    id: "turbo-dash",
    title: "TURBO DASH",
    short: "Outrun the darkness.",
    long: "An endless neon corridor accelerates without mercy. Dodge obstacles at terminal velocity. The track adapts — the darkness does not.",
    cat: "ARCADE",
    cover: "cover-turbo",
    color: "yellow",
    best: 31750,
    plays: "980K",
  },
  {
    id: "cube-nexus",
    title: "CUBE NEXUS",
    short: "Stack, rotate, survive.",
    long: "Falling blocks at merciless speed. Clear lines, unlock cascades, and race to the top of the global leaderboard before the grid fills.",
    cat: "PUZZLE",
    cover: "cover-cube",
    color: "green",
    best: 124600,
    plays: "2.1M",
  },
  {
    id: "cipher-lock",
    title: "CIPHER LOCK",
    short: "Crack the code before the timer flatlines.",
    long: "Six symbols. Forty-five seconds. The vault does not care about your excuses. Each wrong guess costs precious seconds — think fast or think wrong.",
    cat: "PUZZLE",
    cover: "cover-cipher",
    color: "magenta",
    best: 99900,
    plays: "654K",
  },
  {
    id: "nova-strike",
    title: "NOVA STRIKE",
    short: "One ship versus an armada.",
    long: "Deep space, no allies. Waves of enemy formations with escalating AI patterns. The leaderboard is merciless — only perfect runs reach the top.",
    cat: "SHOOTER",
    cover: "cover-nova",
    color: "magenta",
    best: 875400,
    plays: "3.2M",
  },
  {
    id: "plasma-cannon",
    title: "PLASMA CANNON",
    short: "Side-scrolling hellfire.",
    long: "Horizontal shooter with a branching upgrade tree. Power up your cannon, unleash screen-clearing bombs, and tear through enemy strongholds.",
    cat: "SHOOTER",
    cover: "cover-plasma",
    color: "cyan",
    best: 512800,
    plays: "1.8M",
  },
  {
    id: "iron-fist",
    title: "IRON FIST",
    short: "Two players. One winner.",
    long: "Frame-perfect old-school combat. Eight fighters, twenty move sets, one brutal tournament bracket. Master the timing or face a flawless defeat.",
    cat: "VERSUS",
    cover: "cover-iron",
    color: "yellow",
    best: 250000,
    plays: "4.5M",
  },
  {
    id: "speed-duel",
    title: "SPEED DUEL",
    short: "Head-to-head velocity.",
    long: "Two racers, one track, infinite rivalry. Draft, block, and nitro-boost your way to first place. The cabinet shakes. The crowd decides.",
    cat: "VERSUS",
    cover: "cover-speed",
    color: "green",
    best: 188500,
    plays: "2.7M",
  },
];

export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export type Cat = (typeof CATS)[number];
