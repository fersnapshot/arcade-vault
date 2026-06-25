"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type Ref,
} from "react";

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const CANVAS_W = COLS * CELL; // 640
const CANVAS_H = ROWS * CELL; // 560

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

// 5 goal slots: each 2 cols wide, starting at these columns
const GOAL_COLS = [1, 4, 7, 10, 13];

const JUMP_MS = 120;
const ROUND_TIME_BASE = 15_000;
const ROUND_TIME_MIN = 8_000;
const TURTLE_VISIBLE_MS = 3_000;
const TURTLE_SUBMERGE_MS = 1_500;

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
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const restartRef = useRef(false);
  const cbRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  useLayoutEffect(() => {
    cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver };
    pausedRef.current = paused;
  });

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

          if (e.type === "turtle") {
            e.submergeTimer! += dt;
            const threshold =
              e.submergePhase === "visible"
                ? TURTLE_VISIBLE_MS
                : TURTLE_SUBMERGE_MS;
            if (e.submergeTimer! >= threshold) {
              e.submergeTimer = 0;
              e.submerged = !e.submerged;
              e.submergePhase = e.submerged ? "submerging" : "visible";
            }
          }
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
        const lane = lanes.find((l) => l.row === frog.row)!;
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

    // ── Draw ───────────────────────────────────────────────────────────────────

    function draw() {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background zones
      for (let r = 0; r < ROWS; r++) {
        const y = r * CELL;
        if (r === ROW_GOALS) {
          ctx.fillStyle = "#193319";
        } else if (r >= ROW_RIVER_TOP && r <= ROW_RIVER_BOT) {
          ctx.fillStyle = "#0a1e45";
        } else if (r === 7) {
          ctx.fillStyle = "#1a4020";
        } else if (r >= ROW_ROAD_TOP && r <= ROW_ROAD_BOT) {
          ctx.fillStyle = "#2a2a2a";
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
          ctx.fillStyle = "#1a4020";
        }
        ctx.fillRect(0, y, CANVAS_W, CELL);
      }

      // Goal slots
      for (let i = 0; i < GOAL_COLS.length; i++) {
        const gx = GOAL_COLS[i]! * CELL;
        const gy = ROW_GOALS * CELL;
        if (goals[i]) {
          ctx.fillStyle = "#1aff44";
          ctx.fillRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.fillStyle = "#006622";
          ctx.beginPath();
          ctx.ellipse(gx + CELL, gy + CELL / 2, 14, 11, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#0f2a0f";
          ctx.fillRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.strokeStyle = "#c8a000";
          ctx.lineWidth = 2;
          ctx.strokeRect(gx + 2, gy + 2, 2 * CELL - 4, CELL - 4);
          ctx.lineWidth = 1;
        }
      }

      // River entities
      for (const lane of lanes) {
        if (lane.row < ROW_RIVER_TOP || lane.row > ROW_RIVER_BOT) continue;
        const y = lane.row * CELL;
        for (const e of lane.entities) {
          const x = e.col;
          const w = e.width * CELL;

          if (e.type === "log") {
            ctx.fillStyle = "#7a3800";
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 4, w - 4, CELL - 8, 6);
            ctx.fill();
            ctx.strokeStyle = "#5a2800";
            ctx.lineWidth = 1;
            for (let k = 1; k < e.width; k++) {
              ctx.beginPath();
              ctx.moveTo(x + k * CELL, y + 6);
              ctx.lineTo(x + k * CELL, y + CELL - 6);
              ctx.stroke();
            }
          } else if (e.type === "turtle") {
            ctx.globalAlpha = e.submerged ? 0.3 : 1;
            for (let k = 0; k < e.width; k++) {
              const tx = x + k * CELL;
              ctx.fillStyle = "#2d8a3e";
              ctx.beginPath();
              ctx.ellipse(
                tx + CELL / 2,
                y + CELL / 2,
                14,
                11,
                0,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              ctx.strokeStyle = "#1a5a28";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.ellipse(tx + CELL / 2, y + CELL / 2, 8, 6, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
            ctx.globalAlpha = 1;
          }
        }
      }

      // Road entities
      const CAR_COLORS = ["#cc2222", "#ddaa00", "#2266cc"] as const;
      for (const lane of lanes) {
        if (lane.row < ROW_ROAD_TOP || lane.row > ROW_ROAD_BOT) continue;
        const y = lane.row * CELL;
        for (const e of lane.entities) {
          const x = e.col;
          const w = e.width * CELL;

          if (e.type === "car") {
            ctx.fillStyle = CAR_COLORS[(e.colorIdx ?? 0) % 3]!;
            ctx.fillRect(x + 2, y + 6, w - 4, CELL - 12);
            ctx.fillStyle = "#111";
            ctx.beginPath();
            ctx.arc(x + 8, y + CELL - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + w - 8, y + CELL - 5, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (e.type === "truck") {
            ctx.fillStyle = "#777";
            ctx.fillRect(x + 2, y + 4, w - 4, CELL - 8);
            ctx.fillStyle = "#aaa";
            const cabW = CELL - 4;
            const cabX = lane.dir === 1 ? x + w - cabW - 2 : x + 2;
            ctx.fillRect(cabX, y + 4, cabW, CELL - 8);
            ctx.fillStyle = "#111";
            for (let k = 0; k < e.width; k++) {
              ctx.beginPath();
              ctx.arc(x + k * CELL + 8, y + CELL - 5, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(x + k * CELL + CELL - 8, y + CELL - 5, 4, 0, Math.PI * 2);
              ctx.fill();
            }
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
          (frog.fromRow + (frog.targetRow - frog.fromRow) * t) * CELL +
          CELL / 2;
      } else {
        fx = frog.col * CELL + CELL / 2;
        fy = frog.row * CELL + CELL / 2;
      }
      ctx.fillStyle = "#44ff44";
      ctx.beginPath();
      ctx.ellipse(fx, fy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "white";
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

      // HUD overlay
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, 28);

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
      const barColor =
        ratio > 0.5 ? "#44ff44" : ratio > 0.25 ? "#ffcc00" : "#ff4444";
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

    document.addEventListener("keydown", onKeyDown);
    init();
    rafId = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
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
