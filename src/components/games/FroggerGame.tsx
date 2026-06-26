"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type Ref,
} from "react";

export type SkinId = "classic" | "neon" | "retro";

interface SkinPalette {
  name: string;
  bg: string;
  river: string;
  safezone: string;
  road: string;
  log: string;
  logLine: string;
  turtle: string;
  turtleShell: string;
  car: [string, string, string];
  truck: string;
  truckCab: string;
  frog: string;
  frogEye: string;
  goalEmpty: string;
  goalBorder: string;
  goalFilled: string;
  goalFrog: string;
  timerBar: [string, string, string]; // [high, mid, low]
}

const SKINS: Record<SkinId, SkinPalette> = {
  classic: {
    name: "Classic",
    bg: "#193319",
    river: "#0a1e45",
    safezone: "#1a4020",
    road: "#2a2a2a",
    log: "#7a3800",
    logLine: "#5a2800",
    turtle: "#2d8a3e",
    turtleShell: "#1a5a28",
    car: ["#cc2222", "#ddaa00", "#2266cc"],
    truck: "#777",
    truckCab: "#aaa",
    frog: "#44ff44",
    frogEye: "white",
    goalEmpty: "#0f2a0f",
    goalBorder: "#c8a000",
    goalFilled: "#1aff44",
    goalFrog: "#006622",
    timerBar: ["#44ff44", "#ffcc00", "#ff4444"],
  },
  neon: {
    name: "Neon",
    bg: "#050510",
    river: "#030820",
    safezone: "#051a05",
    road: "#101010",
    log: "#ff6600",
    logLine: "#cc4400",
    turtle: "#00ff88",
    turtleShell: "#00cc66",
    car: ["#ff0044", "#ffff00", "#00aaff"],
    truck: "#aa00ff",
    truckCab: "#cc44ff",
    frog: "#00ff00",
    frogEye: "#ffffff",
    goalEmpty: "#020a02",
    goalBorder: "#ffff00",
    goalFilled: "#00ff44",
    goalFrog: "#00aa00",
    timerBar: ["#00ffcc", "#ffff00", "#ff0066"],
  },
  retro: {
    name: "Retro",
    bg: "#2d4a1e",
    river: "#1a2e5a",
    safezone: "#3a5a28",
    road: "#4a3a2a",
    log: "#a05020",
    logLine: "#7a3800",
    turtle: "#5ab040",
    turtleShell: "#3a7828",
    car: ["#e05030", "#d4a020", "#3868b8"],
    truck: "#987060",
    truckCab: "#c8a080",
    frog: "#78cc50",
    frogEye: "#f0e8c0",
    goalEmpty: "#1a2e0a",
    goalBorder: "#d4a020",
    goalFilled: "#78cc50",
    goalFrog: "#2a5a18",
    timerBar: ["#78cc50", "#d4a020", "#e05030"],
  },
};

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const HUD_H = 28;
const CANVAS_W = COLS * CELL; // 640
const CANVAS_H = ROWS * CELL + HUD_H; // 588

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

// 5 goal slots: each 2 cols wide, starting at these columns
const GOAL_COLS = [1, 4, 7, 10, 13];

const JUMP_MS = 120;
const ROUND_TIME_BASE = 25_000;
const ROUND_TIME_MIN = 8_000;

const PTS_ADVANCE = 10;
const PTS_GOAL = 50;
const PTS_ROUND = 200;
const PTS_TIME_MULT = 10;

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number; // pixel x (fractional)
  width: number; // in cells
  type: "car" | "truck" | "log" | "turtle";
  colorIdx?: number;
  submerged?: boolean;
  submergeTimer?: number;
  submergePhase?: "visible" | "submerging";
}

interface Lane {
  row: number;
  speed: number; // px per 16 ms
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number; // cells (may be fractional while drifting on river)
  row: number; // integer cell row
  animating: boolean;
  animT: number;
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
}

export interface FroggerRef {
  restart: () => void;
  togglePause: () => void;
}

interface Props {
  paused: boolean;
  skin?: SkinId;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  ref?: Ref<FroggerRef>;
}

// ─── Lane builders ────────────────────────────────────────────────────────────

function spreadEntities(
  specs: { type: Entity["type"]; width: number }[],
): Entity[] {
  const totalW = specs.reduce((s, e) => s + e.width, 0) * CELL;
  const gap = (CANVAS_W - totalW) / specs.length;
  const entities: Entity[] = [];
  let x = 0;
  for (let i = 0; i < specs.length; i++) {
    entities.push({
      col: x,
      width: specs[i]!.width,
      type: specs[i]!.type,
      colorIdx: i % 3,
    });
    x += specs[i]!.width * CELL + gap;
  }
  return entities;
}

function spreadTurtles(sizes: number[], offsets: number[]): Entity[] {
  const totalW = sizes.reduce((s, w) => s + w, 0) * CELL;
  const gap = (CANVAS_W - totalW) / sizes.length;
  const entities: Entity[] = [];
  let x = 0;
  for (let i = 0; i < sizes.length; i++) {
    entities.push({
      col: x,
      width: sizes[i]!,
      type: "turtle",
      submerged: false,
      submergeTimer: offsets[i] ?? 0,
      submergePhase: "visible",
    });
    x += sizes[i]! * CELL + gap;
  }
  return entities;
}

function buildLanes(level: number): Lane[] {
  const m = 1 + (level - 1) * 0.15;
  return [
    // ─ Road (rows 12 → 8) ─
    {
      row: 12,
      speed: 2.0 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "car", width: 1 },
        { type: "car", width: 1 },
        { type: "truck", width: 3 },
      ]),
    },
    {
      row: 11,
      speed: 2.5 * m,
      dir: -1,
      entities: spreadEntities([
        { type: "car", width: 2 },
        { type: "car", width: 1 },
        { type: "car", width: 2 },
      ]),
    },
    {
      row: 10,
      speed: 3.0 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "truck", width: 3 },
        { type: "car", width: 1 },
      ]),
    },
    {
      row: 9,
      speed: 1.5 * m,
      dir: -1,
      entities: spreadEntities([
        { type: "car", width: 1 },
        { type: "car", width: 1 },
        { type: "car", width: 1 },
        { type: "car", width: 2 },
      ]),
    },
    {
      row: 8,
      speed: 3.5 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "truck", width: 3 },
        { type: "truck", width: 2 },
      ]),
    },
    // ─ River (rows 6 → 1) ─
    {
      row: 6,
      speed: 1.5 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "log", width: 3 },
        { type: "log", width: 2 },
        { type: "log", width: 4 },
      ]),
    },
    {
      row: 5,
      speed: 2.0 * m,
      dir: -1,
      entities: spreadTurtles([2, 3, 2], [0, 1000, 2000]),
    },
    {
      row: 4,
      speed: 2.5 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "log", width: 4 },
        { type: "log", width: 3 },
      ]),
    },
    {
      row: 3,
      speed: 1.8 * m,
      dir: -1,
      entities: spreadTurtles([3, 2, 3], [500, 1500, 0]),
    },
    {
      row: 2,
      speed: 3.0 * m,
      dir: 1,
      entities: spreadEntities([
        { type: "log", width: 3 },
        { type: "log", width: 2 },
        { type: "log", width: 3 },
      ]),
    },
    {
      row: 1,
      speed: 2.2 * m,
      dir: -1,
      entities: spreadTurtles([2, 2, 3], [0, 2000, 1000]),
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FroggerGame({
  paused,
  skin = "classic",
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const restartRef = useRef(false);
  const skinRef = useRef<SkinId>(skin);
  const cbRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  useLayoutEffect(() => {
    cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver };
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  useLayoutEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useLayoutEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useImperativeHandle(ref, () => ({
    restart() {
      restartRef.current = true;
    },
    togglePause() {
      pausedRef.current = !pausedRef.current;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // ── State ──────────────────────────────────────────────────────────────────
    let frog: Frog;
    let lanes: Lane[];
    let laneByRow: Map<number, Lane>;
    let goals: boolean[];
    let lives: number;
    let score: number;
    let level: number;
    let roundTimer: number;
    let rowsReached: Set<number>;
    let pendingDir: Direction | null;
    let isOver: boolean;

    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;

    let lastTs = 0;
    let rafId = 0;

    function makeFrog(): Frog {
      return {
        col: COLS / 2,
        row: ROW_START,
        animating: false,
        animT: 0,
        fromCol: COLS / 2,
        fromRow: ROW_START,
        targetCol: COLS / 2,
        targetRow: ROW_START,
      };
    }

    function getRoundTime(lvl: number): number {
      return Math.max(ROUND_TIME_MIN, ROUND_TIME_BASE - (lvl - 1) * 500);
    }

    function init() {
      lives = 3;
      score = 0;
      level = 1;
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
      isOver = false;
      pendingDir = null;
      goals = [false, false, false, false, false];
      lanes = buildLanes(level);
      laneByRow = new Map(lanes.map((l) => [l.row, l]));
      roundTimer = getRoundTime(level);
      rowsReached = new Set([ROW_START]);
      frog = makeFrog();
    }

    function resetFrog() {
      frog = makeFrog();
      rowsReached = new Set([ROW_START]);
      roundTimer = getRoundTime(level);
      pendingDir = null;
    }

    function killFrog() {
      lives -= 1;
      if (lives <= 0) {
        lives = 0;
        isOver = true;
        cbRef.current.onLivesChange(0);
        cbRef.current.onGameOver(score);
        prevLives = 0;
        return;
      }
      cbRef.current.onLivesChange(lives);
      prevLives = lives;
      resetFrog();
    }

    function getSupport(): Entity | null {
      for (const lane of lanes) {
        if (lane.row !== frog.row) continue;
        const frogPx = frog.col * CELL + CELL / 2;
        for (const e of lane.entities) {
          if (frogPx >= e.col && frogPx < e.col + e.width * CELL) {
            if (e.type === "turtle" && e.submerged) return null;
            return e;
          }
        }
      }
      return null;
    }

    function checkRoadCollision(): boolean {
      for (const lane of lanes) {
        if (lane.row !== frog.row) continue;
        if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
        const frogPx = Math.round(frog.col) * CELL + CELL / 2;
        for (const e of lane.entities) {
          if (frogPx >= e.col && frogPx < e.col + e.width * CELL) return true;
        }
      }
      return false;
    }

    function resolveGoal() {
      const col = Math.round(frog.col);
      for (let i = 0; i < GOAL_COLS.length; i++) {
        if (col >= GOAL_COLS[i]! && col < GOAL_COLS[i]! + 2) {
          if (goals[i]) {
            killFrog();
            return;
          }
          goals[i] = true;
          score += PTS_GOAL + Math.floor(roundTimer / 1000) * PTS_TIME_MULT;
          if (goals.every(Boolean)) {
            score += PTS_ROUND;
            level += 1;
            goals = [false, false, false, false, false];
            lanes = buildLanes(level);
            laneByRow = new Map(lanes.map((l) => [l.row, l]));
            cbRef.current.onLevelChange(level);
            prevLevel = level;
          }
          resetFrog();
          return;
        }
      }
      killFrog();
    }

    function resolveCell() {
      const r = frog.row;
      if (r === ROW_GOALS) {
        resolveGoal();
        return;
      }
      if (frog.targetRow < frog.fromRow && !rowsReached.has(r)) {
        score += PTS_ADVANCE;
        rowsReached.add(r);
      }
      if (r >= ROW_ROAD_TOP && r <= ROW_ROAD_BOT) {
        if (checkRoadCollision()) killFrog();
      }
    }

    function initiateJump(dir: Direction) {
      const baseCol = Math.round(frog.col);
      let tc = baseCol;
      let tr = frog.row;

      if (dir === "up") tr -= 1;
      else if (dir === "down") tr += 1;
      else if (dir === "left") tc -= 1;
      else if (dir === "right") tc += 1;

      if (tr < ROW_GOALS || tr > ROW_START) return;

      const inRiver = tr >= ROW_RIVER_TOP && tr <= ROW_RIVER_BOT;
      if (!inRiver) tc = Math.max(0, Math.min(COLS - 1, tc));

      frog.fromCol = baseCol;
      frog.fromRow = frog.row;
      frog.targetCol = tc;
      frog.targetRow = tr;
      frog.animating = true;
      frog.animT = 0;
      frog.col = baseCol;
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    function update(dt: number) {
      if (isOver) return;
      if (pausedRef.current) return;

      // 1. Move entities + turtle submersion
      for (const lane of lanes) {
        for (const e of lane.entities) {
          e.col += lane.speed * lane.dir * (dt / 16);
          const ew = e.width * CELL;
          if (lane.dir === 1 && e.col > CANVAS_W) e.col = -ew;
          if (lane.dir === -1 && e.col < -ew) e.col = CANVAS_W;
        }
      }

      // 2. Frog animation
      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= JUMP_MS) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;
          resolveCell();
        }
        fireCallbacks();
        return;
      }

      // 3. River drift
      if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        const support = getSupport();
        if (support === null) {
          killFrog();
          fireCallbacks();
          return;
        }
        const lane = laneByRow.get(frog.row)!;
        frog.col += (lane.speed * lane.dir * dt) / (16 * CELL);
        if (frog.col < 0 || frog.col >= COLS) {
          killFrog();
          fireCallbacks();
          return;
        }
      }

      // 4. Road collision (standing frog)
      if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision()) {
          killFrog();
          fireCallbacks();
          return;
        }
      }

      // 5. Input
      if (pendingDir !== null) {
        const d = pendingDir;
        pendingDir = null;
        initiateJump(d);
      }

      // 6. Round timer
      roundTimer -= dt;
      if (roundTimer <= 0) {
        roundTimer = 0;
        killFrog();
        fireCallbacks();
        return;
      }

      fireCallbacks();
    }

    function fireCallbacks() {
      if (score !== prevScore) {
        cbRef.current.onScoreChange(score);
        prevScore = score;
      }
      if (lives !== prevLives) {
        cbRef.current.onLivesChange(lives);
        prevLives = lives;
      }
      if (level !== prevLevel) {
        cbRef.current.onLevelChange(level);
        prevLevel = level;
      }
    }

    // ── Draw helpers ───────────────────────────────────────────────────────────

    function drawLogClassic(x: number, y: number, w: number) {
      const pal = SKINS[skinRef.current];
      ctx.fillStyle = pal.log;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w - 4, CELL - 8, 6);
      ctx.fill();
      ctx.strokeStyle = pal.logLine;
      ctx.lineWidth = 1;
      const segs = Math.floor(w / CELL);
      for (let k = 1; k < segs; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * CELL, y + 6);
        ctx.lineTo(x + k * CELL, y + CELL - 6);
        ctx.stroke();
      }
    }

    function drawLogNeon(x: number, y: number, w: number) {
      const pal = SKINS.neon;
      ctx.shadowColor = pal.log;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pal.log;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w - 4, CELL - 8, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      // bright highlight strip
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x + 4, y + 5, w - 8, 4);
    }

    function drawLogRetro(x: number, y: number, w: number) {
      const pal = SKINS.retro;
      ctx.fillStyle = pal.log;
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w - 4, CELL - 8, 6);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x + 4, y + 5, w - 8, 4);
      ctx.strokeStyle = pal.logLine;
      ctx.lineWidth = 1;
      const segs = Math.floor(w / CELL);
      for (let k = 1; k < segs; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * CELL, y + 6);
        ctx.lineTo(x + k * CELL, y + CELL - 6);
        ctx.stroke();
      }
    }

    function drawLog(x: number, y: number, w: number) {
      const s = skinRef.current;
      if (s === "neon") drawLogNeon(x, y, w);
      else if (s === "retro") drawLogRetro(x, y, w);
      else drawLogClassic(x, y, w);
    }

    function drawTurtleClassic(tx: number, y: number) {
      const pal = SKINS[skinRef.current];
      ctx.fillStyle = pal.turtle;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = pal.turtleShell;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawTurtleNeon(tx: number, y: number) {
      const pal = SKINS.neon;
      ctx.shadowColor = pal.turtle;
      ctx.shadowBlur = 12;
      ctx.fillStyle = pal.turtle;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 4;
      ctx.strokeStyle = pal.turtleShell;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    function drawTurtleRetro(tx: number, y: number) {
      const pal = SKINS.retro;
      ctx.fillStyle = pal.turtle;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.ellipse(
        tx + CELL / 2 - 2,
        y + CELL / 2 - 3,
        6,
        4,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = pal.turtleShell;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(tx + CELL / 2, y + CELL / 2, 8, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    function drawTurtle(tx: number, y: number) {
      const s = skinRef.current;
      if (s === "neon") drawTurtleNeon(tx, y);
      else if (s === "retro") drawTurtleRetro(tx, y);
      else drawTurtleClassic(tx, y);
    }

    function drawCarClassic(x: number, y: number, w: number, colorIdx: number) {
      const pal = SKINS[skinRef.current];
      ctx.fillStyle = pal.car[colorIdx % 3]!;
      ctx.fillRect(x + 2, y + 6, w - 4, CELL - 12);
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x + 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCarNeon(x: number, y: number, w: number, colorIdx: number) {
      const pal = SKINS.neon;
      const c = pal.car[colorIdx % 3]!;
      ctx.shadowColor = c;
      ctx.shadowBlur = 12;
      ctx.fillStyle = c;
      ctx.fillRect(x + 2, y + 6, w - 4, CELL - 12);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x + 3, y + 7, w - 6, 4);
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x + 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCarRetro(x: number, y: number, w: number, colorIdx: number) {
      const pal = SKINS.retro;
      ctx.fillStyle = pal.car[colorIdx % 3]!;
      ctx.fillRect(x + 2, y + 6, w - 4, CELL - 12);
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(x + 3, y + 7, w - 6, 4);
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(x + 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w - 8, y + CELL - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawCar(x: number, y: number, w: number, colorIdx: number) {
      const s = skinRef.current;
      if (s === "neon") drawCarNeon(x, y, w, colorIdx);
      else if (s === "retro") drawCarRetro(x, y, w, colorIdx);
      else drawCarClassic(x, y, w, colorIdx);
    }

    function drawTruckClassic(x: number, y: number, w: number, dir: 1 | -1) {
      const pal = SKINS[skinRef.current];
      ctx.fillStyle = pal.truck;
      ctx.fillRect(x + 2, y + 4, w - 4, CELL - 8);
      ctx.fillStyle = pal.truckCab;
      const cabW = CELL - 4;
      const cabX = dir === 1 ? x + w - cabW - 2 : x + 2;
      ctx.fillRect(cabX, y + 4, cabW, CELL - 8);
      ctx.fillStyle = "#111";
      const segs = Math.floor(w / CELL);
      for (let k = 0; k < segs; k++) {
        ctx.beginPath();
        ctx.arc(x + k * CELL + 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + k * CELL + CELL - 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawTruckNeon(x: number, y: number, w: number, dir: 1 | -1) {
      const pal = SKINS.neon;
      ctx.shadowColor = pal.truck;
      ctx.shadowBlur = 10;
      ctx.fillStyle = pal.truck;
      ctx.fillRect(x + 2, y + 4, w - 4, CELL - 8);
      ctx.shadowColor = pal.truckCab;
      ctx.shadowBlur = 8;
      ctx.fillStyle = pal.truckCab;
      const cabW = CELL - 4;
      const cabX = dir === 1 ? x + w - cabW - 2 : x + 2;
      ctx.fillRect(cabX, y + 4, cabW, CELL - 8);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fillRect(x + 3, y + 5, w - 6, 4);
      ctx.fillStyle = "#111";
      const segs = Math.floor(w / CELL);
      for (let k = 0; k < segs; k++) {
        ctx.beginPath();
        ctx.arc(x + k * CELL + 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + k * CELL + CELL - 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawTruckRetro(x: number, y: number, w: number, dir: 1 | -1) {
      const pal = SKINS.retro;
      ctx.fillStyle = pal.truck;
      ctx.fillRect(x + 2, y + 4, w - 4, CELL - 8);
      ctx.fillStyle = pal.truckCab;
      const cabW = CELL - 4;
      const cabX = dir === 1 ? x + w - cabW - 2 : x + 2;
      ctx.fillRect(cabX, y + 4, cabW, CELL - 8);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(x + 3, y + 5, w - 6, 4);
      ctx.fillStyle = "#111";
      const segs = Math.floor(w / CELL);
      for (let k = 0; k < segs; k++) {
        ctx.beginPath();
        ctx.arc(x + k * CELL + 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + k * CELL + CELL - 8, y + CELL - 5, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawTruck(x: number, y: number, w: number, dir: 1 | -1) {
      const s = skinRef.current;
      if (s === "neon") drawTruckNeon(x, y, w, dir);
      else if (s === "retro") drawTruckRetro(x, y, w, dir);
      else drawTruckClassic(x, y, w, dir);
    }

    function drawFrogClassic(fx: number, fy: number) {
      const pal = SKINS[skinRef.current];
      ctx.fillStyle = pal.frog;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.frogEye;
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFrogNeon(fx: number, fy: number) {
      const pal = SKINS.neon;
      ctx.shadowColor = pal.frog;
      ctx.shadowBlur = 16;
      ctx.fillStyle = pal.frog;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = pal.frogEye;
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFrogRetro(fx: number, fy: number) {
      const pal = SKINS.retro;
      ctx.fillStyle = pal.frog;
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.beginPath();
      ctx.ellipse(fx - 2, fy - 3, 6, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.frogEye;
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(fx - 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(fx + 5, fy - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFrog(fx: number, fy: number) {
      const s = skinRef.current;
      if (s === "neon") drawFrogNeon(fx, fy);
      else if (s === "retro") drawFrogRetro(fx, fy);
      else drawFrogClassic(fx, fy);
    }

    // ── Draw ───────────────────────────────────────────────────────────────────

    function draw() {
      const pal = SKINS[skinRef.current];
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background zones
      for (let r = 0; r < ROWS; r++) {
        const y = HUD_H + r * CELL;
        if (r === ROW_GOALS) {
          ctx.fillStyle = pal.bg;
        } else if (r >= ROW_RIVER_TOP && r <= ROW_RIVER_BOT) {
          ctx.fillStyle = pal.river;
        } else if (r === 7) {
          ctx.fillStyle = pal.safezone;
        } else if (r >= ROW_ROAD_TOP && r <= ROW_ROAD_BOT) {
          ctx.fillStyle = pal.road;
          ctx.fillRect(0, y, CANVAS_W, CELL);
          ctx.strokeStyle = "rgba(255,255,100,0.15)";
          ctx.setLineDash([12, 8]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y + CELL);
          ctx.lineTo(CANVAS_W, y + CELL);
          ctx.stroke();
          ctx.setLineDash([]);
          continue;
        } else {
          ctx.fillStyle = pal.safezone;
        }
        ctx.fillRect(0, y, CANVAS_W, CELL);
      }

      // Goal slots
      for (let i = 0; i < GOAL_COLS.length; i++) {
        const gx = GOAL_COLS[i]! * CELL;
        const gy = HUD_H + ROW_GOALS * CELL;
        if (goals[i]) {
          ctx.fillStyle = pal.goalFilled;
          ctx.fillRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.fillStyle = pal.goalFrog;
          ctx.beginPath();
          ctx.ellipse(gx + CELL, gy + CELL / 2, 14, 11, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = pal.goalEmpty;
          ctx.fillRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.strokeStyle = pal.goalBorder;
          ctx.lineWidth = 2;
          ctx.strokeRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.lineWidth = 1;
        }
      }

      // River entities
      for (const lane of lanes) {
        if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
        const y = HUD_H + lane.row * CELL;
        for (const e of lane.entities) {
          const x = e.col;
          const w = e.width * CELL;

          if (e.type === "log") {
            drawLog(x, y, w);
          } else if (e.type === "turtle") {
            ctx.globalAlpha = e.submerged ? 0.3 : 1;
            for (let k = 0; k < e.width; k++) {
              drawTurtle(x + k * CELL, y);
            }
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
          }
        }
      }

      // Road entities
      for (const lane of lanes) {
        if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
        const y = HUD_H + lane.row * CELL;
        for (const e of lane.entities) {
          const x = e.col;
          const w = e.width * CELL;

          if (e.type === "car") {
            drawCar(x, y, w, e.colorIdx ?? 0);
          } else if (e.type === "truck") {
            drawTruck(x, y, w, lane.dir);
          }
        }
      }

      // Frog
      let fx: number;
      let fy: number;
      if (frog.animating) {
        const t = Math.min(frog.animT / JUMP_MS, 1);
        fx =
          (frog.fromCol + (frog.targetCol - frog.fromCol) * t) * CELL +
          CELL / 2;
        fy =
          HUD_H +
          (frog.fromRow + (frog.targetRow - frog.fromRow) * t) * CELL +
          CELL / 2;
      } else {
        fx = frog.col * CELL + CELL / 2;
        fy = HUD_H + frog.row * CELL + CELL / 2;
      }
      drawFrog(fx, fy);
      ctx.shadowBlur = 0;

      // HUD overlay — franja dedicada arriba del juego
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, CANVAS_W, HUD_H);

      ctx.font = "bold 12px monospace";
      ctx.textBaseline = "top";

      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.fillText(`${score}`, 8, 6);

      ctx.textAlign = "center";
      ctx.fillText(`LV ${level}`, CANVAS_W / 2, 6);

      ctx.textAlign = "right";
      const lifeIcons = "♥ ".repeat(Math.max(0, lives)).trim();
      ctx.fillStyle = "#ff6666";
      ctx.fillText(lifeIcons, CANVAS_W - 8, 6);

      // Timer bar
      const totalTime = getRoundTime(level);
      const ratio = Math.max(0, roundTimer / totalTime);
      const timerColors = pal.timerBar;
      const barColor =
        ratio > 0.5
          ? timerColors[0]
          : ratio > 0.25
            ? timerColors[1]
            : timerColors[2];
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillRect(8, 20, CANVAS_W - 16, 6);
      ctx.fillStyle = barColor;
      ctx.fillRect(8, 20, (CANVAS_W - 16) * ratio, 6);
    }

    // ── RAF loop ───────────────────────────────────────────────────────────────

    function loop(ts: number) {
      if (restartRef.current) {
        restartRef.current = false;
        init();
      }
      if (pausedRef.current) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      const dt = lastTs === 0 ? 16 : Math.min(ts - lastTs, 100);
      lastTs = ts;
      update(dt);
      draw();
      if (!isOver) {
        rafId = requestAnimationFrame(loop);
      } else {
        draw();
      }
    }

    // ── Key listener ──────────────────────────────────────────────────────────

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        pendingDir = "up";
      } else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        pendingDir = "down";
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        pendingDir = "left";
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        pendingDir = "right";
      }
    }

    window.addEventListener("keydown", onKeyDown);
    init();
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
