"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type Ref,
} from "react";
import fruitsPng from "./snake/fruits.png";
import { FRUIT_NAMES, drawFruit } from "./snake/sprites";

const COLS = 40;
const ROWS = 30;
const CELL = 20;
const W = COLS * CELL; // 800
const H = ROWS * CELL; // 600

// Milliseconds between ticks per level (index = level 1–9)
const TICK_MS = [0, 200, 175, 150, 130, 110, 90, 75, 60, 50];
const POINTS_PER_LEVEL = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

export type SkinId = "classic" | "neon" | "retro";

// colors[0] = vacío (null), colors[1] = cabeza, colors[2] = cuerpo base
const SKINS: Record<SkinId, { name: string; colors: (string | null)[] }> = {
  classic: {
    name: "Classic",
    colors: [null, "#00ff44", "#22cc44"],
  },
  neon: {
    name: "Neon",
    colors: [null, "#00ffaa", "#00ff55"],
  },
  retro: {
    name: "Retro",
    colors: [null, "#a8e63d", "#5a9e1a"],
  },
};

export interface SnakeRef {
  restart: (startLevel?: number) => void;
  togglePause: () => void;
}

interface Props {
  startLevel?: number;
  skin?: SkinId;
  onScore: (score: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
  ref?: Ref<SnakeRef>;
}

export default function SnakeGame({
  startLevel = 1,
  skin = "classic",
  onScore,
  onLevel,
  onGameOver,
  onPause,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const restartLevelRef = useRef<number | null>(null);
  const initialLevelRef = useRef(startLevel);
  const pausedRef = useRef(false);
  const cbRef = useRef({ onScore, onLevel, onGameOver, onPause });
  const skinRef = useRef<SkinId>(skin ?? "classic");

  useLayoutEffect(() => {
    cbRef.current = { onScore, onLevel, onGameOver, onPause };
  }, [onScore, onLevel, onGameOver, onPause]);

  useLayoutEffect(() => {
    skinRef.current = skin ?? "classic";
  }, [skin]);

  useImperativeHandle(ref, () => ({
    restart(startLevel = 1) {
      restartLevelRef.current = Math.max(1, Math.min(9, startLevel));
    },
    togglePause() {
      pausedRef.current = !pausedRef.current;
      cbRef.current.onPause(pausedRef.current);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const fruitsImg = new Image();
    fruitsImg.src = fruitsPng.src;

    type Cell = { x: number; y: number };

    // ── Funciones de dibujo por skin ──────────────────────────────────────

    function drawSegmentClassic(
      x: number,
      y: number,
      color: string,
      padding: number,
    ) {
      ctx.fillStyle = color;
      ctx.fillRect(
        x * CELL + padding,
        y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
      );
    }

    function drawSegmentNeon(
      x: number,
      y: number,
      color: string,
      padding: number,
    ) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = color;
      ctx.fillRect(
        x * CELL + padding,
        y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
      );
      // Inner white highlight
      ctx.shadowBlur = 4;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      const inner = CELL * 0.3;
      ctx.fillRect(
        x * CELL + CELL * 0.35,
        y * CELL + CELL * 0.35,
        inner,
        inner,
      );
      ctx.shadowBlur = 0;
    }

    function drawSegmentRetro(
      x: number,
      y: number,
      color: string,
      padding: number,
    ) {
      ctx.fillStyle = color;
      ctx.fillRect(
        x * CELL + padding,
        y * CELL + padding,
        CELL - padding * 2,
        CELL - padding * 2,
      );
      // Brightness band at top
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(
        x * CELL + padding,
        y * CELL + padding,
        CELL - padding * 2,
        4,
      );
    }

    function drawSegment(
      x: number,
      y: number,
      colorIndex: number,
      padding: number,
      fadePct?: number,
    ) {
      const palette = SKINS[skinRef.current].colors;
      let baseColor = palette[colorIndex] as string;

      // Para el cuerpo (colorIndex 2) aplicamos fade HSL en classic/retro,
      // y un fade de opacidad en neon.
      if (colorIndex === 2 && fadePct !== undefined) {
        const s = skinRef.current;
        if (s === "neon") {
          // fade via globalAlpha
          ctx.globalAlpha = Math.max(0.25, fadePct);
          drawSegmentNeon(x, y, baseColor, padding);
          ctx.globalAlpha = 1;
          return;
        } else if (s === "retro") {
          // darken via hsl overlay
          baseColor = palette[2] as string;
          // usamos globalAlpha para simular fade
          ctx.globalAlpha = Math.max(0.3, fadePct);
          drawSegmentRetro(x, y, baseColor, padding);
          ctx.globalAlpha = 1;
          return;
        } else {
          // classic: fade via globalAlpha
          ctx.globalAlpha = Math.max(0.3, fadePct);
          drawSegmentClassic(x, y, baseColor, padding);
          ctx.globalAlpha = 1;
          return;
        }
      }

      const s = skinRef.current;
      if (s === "neon") drawSegmentNeon(x, y, baseColor, padding);
      else if (s === "retro") drawSegmentRetro(x, y, baseColor, padding);
      else drawSegmentClassic(x, y, baseColor, padding);
      ctx.shadowBlur = 0;
    }

    // ── Lógica del juego ──────────────────────────────────────────────────

    let snake: Cell[];
    let dir: Cell;
    let nextDir: Cell;
    let fruit: { x: number; y: number; name: string };
    let score: number;
    let level: number;
    let fruitsEaten: number;
    let gameOver: boolean;
    let tickAccum: number;
    let prevScore = -1;
    let prevLevel = -1;

    function notify() {
      if (score !== prevScore) {
        cbRef.current.onScore(score);
        prevScore = score;
      }
      if (level !== prevLevel) {
        cbRef.current.onLevel(level);
        prevLevel = level;
      }
    }

    function spawnFruit() {
      const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
      let fx: number, fy: number;
      do {
        fx = Math.floor(Math.random() * COLS);
        fy = Math.floor(Math.random() * ROWS);
      } while (occupied.has(`${fx},${fy}`));
      const name = FRUIT_NAMES[Math.floor(Math.random() * FRUIT_NAMES.length)]!;
      fruit = { x: fx, y: fy, name };
    }

    function initGame(startLevel = 1) {
      const cx = Math.floor(COLS / 2);
      const cy = Math.floor(ROWS / 2);
      snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      level = Math.max(1, Math.min(9, startLevel));
      fruitsEaten = 0;
      gameOver = false;
      tickAccum = 0;
      prevScore = -1;
      prevLevel = -1;
      pausedRef.current = false;
      spawnFruit();
      notify();
    }

    function tick() {
      if (gameOver) return;

      dir = nextDir;
      const head = { x: snake[0]!.x + dir.x, y: snake[0]!.y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver = true;
        cbRef.current.onGameOver(score);
        return;
      }

      // Self collision (tail will move so exclude last segment)
      for (let i = 0; i < snake.length - 1; i++) {
        if (snake[i]!.x === head.x && snake[i]!.y === head.y) {
          gameOver = true;
          cbRef.current.onGameOver(score);
          return;
        }
      }

      snake.unshift(head);

      if (head.x === fruit.x && head.y === fruit.y) {
        fruitsEaten++;
        score += POINTS_PER_LEVEL[level]!;
        if (fruitsEaten % 5 === 0 && level < 9) level++;
        spawnFruit();
        // Don't pop — snake grows
      } else {
        snake.pop();
      }

      notify();
    }

    const SKIN_GRID: Record<
      SkinId,
      { grid: string; border: string; glow: string }
    > = {
      classic: {
        grid: "rgba(0,200,0,0.12)",
        border: "#00cc33",
        glow: "rgba(0,204,51,0.55)",
      },
      neon: {
        grid: "rgba(0,255,170,0.14)",
        border: "#00ffaa",
        glow: "rgba(0,255,170,0.7)",
      },
      retro: {
        grid: "rgba(120,200,40,0.13)",
        border: "#7ec820",
        glow: "rgba(126,200,32,0.55)",
      },
    };

    function draw() {
      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      const sg = SKIN_GRID[skinRef.current];

      // Grid lines
      ctx.strokeStyle = sg.grid;
      ctx.lineWidth = 0.5;
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL, 0);
        ctx.lineTo(x * CELL, H);
        ctx.stroke();
      }
      for (let y = 1; y < ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL);
        ctx.lineTo(W, y * CELL);
        ctx.stroke();
      }

      // Border glow + stroke
      ctx.shadowColor = sg.glow;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = sg.border;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
      ctx.shadowBlur = 0;

      // Snake body
      for (let i = snake.length - 1; i >= 0; i--) {
        const seg = snake[i]!;
        const isHead = i === 0;
        if (isHead) {
          drawSegment(seg.x, seg.y, 1, 1);
        } else {
          const fadePct = Math.max(0.25, 1 - i * 0.008);
          drawSegment(seg.x, seg.y, 2, 2, fadePct);
        }
      }

      // Fruit sprite
      if (fruitsImg.complete && fruitsImg.naturalWidth > 0) {
        drawFruit(
          ctx,
          fruitsImg,
          fruit.name,
          fruit.x * CELL,
          fruit.y * CELL,
          CELL,
          CELL,
        );
      } else {
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(
          fruit.x * CELL + CELL / 2,
          fruit.y * CELL + CELL / 2,
          CELL / 2 - 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const ARROW_KEYS = new Set([
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ]);
      if (ARROW_KEYS.has(e.key)) e.preventDefault();

      if ((e.code === "ArrowUp" || e.code === "KeyW") && dir.y !== 1)
        nextDir = { x: 0, y: -1 };
      if ((e.code === "ArrowDown" || e.code === "KeyS") && dir.y !== -1)
        nextDir = { x: 0, y: 1 };
      if ((e.code === "ArrowLeft" || e.code === "KeyA") && dir.x !== 1)
        nextDir = { x: -1, y: 0 };
      if ((e.code === "ArrowRight" || e.code === "KeyD") && dir.x !== -1)
        nextDir = { x: 1, y: 0 };

      if (e.code === "KeyP" || e.code === "Escape") {
        pausedRef.current = !pausedRef.current;
        cbRef.current.onPause(pausedRef.current);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    let rafId: number;
    let lastTime: number | null = null;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min(ts - lastTime, 100);
      lastTime = ts;

      if (restartLevelRef.current !== null) {
        initGame(restartLevelRef.current);
        restartLevelRef.current = null;
      }

      if (pausedRef.current) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (!gameOver) {
        tickAccum += dt;
        const interval = TICK_MS[level] ?? 200;
        while (tickAccum >= interval) {
          tickAccum -= interval;
          tick();
          if (gameOver) break;
        }
      }

      draw();
      rafId = requestAnimationFrame(loop);
    }

    initGame(initialLevelRef.current);
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
    />
  );
}
