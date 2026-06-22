"use client";

import {
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const LINE_SCORES = [0, 100, 300, 500, 800];

export type SkinId = "retro" | "neon" | "pastel" | "pixel";

const SKINS: Record<SkinId, { name: string; colors: (string | null)[] }> = {
  retro: {
    name: "Retro",
    colors: [
      null,
      "#4dd0e1",
      "#ffd54f",
      "#ba68c8",
      "#81c784",
      "#e57373",
      "#5b9bd5",
      "#ffb74d",
      "#f06292",
    ],
  },
  neon: {
    name: "Neon",
    colors: [
      null,
      "#00ffff",
      "#ffff00",
      "#ff00ff",
      "#00ff88",
      "#ff3366",
      "#3388ff",
      "#ff8800",
      "#ff66cc",
    ],
  },
  pastel: {
    name: "Pastel",
    colors: [
      null,
      "#a8e6f0",
      "#fde9a2",
      "#d9b8e8",
      "#b8e4bb",
      "#f5b8b8",
      "#a8c8f0",
      "#ffd8a8",
      "#f8c0d8",
    ],
  },
  pixel: {
    name: "Pixel Art",
    colors: [
      null,
      "#3cc8d8",
      "#f0c040",
      "#a050b8",
      "#60b060",
      "#d04040",
      "#4888c0",
      "#e08030",
      "#d05888",
    ],
  },
};

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // ring
];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export interface TetrisRef {
  restart: (startLevel?: number) => void;
  togglePause: () => void;
}

interface Props {
  skin?: SkinId;
  onScore: (score: number) => void;
  onLines: (lines: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
  ref?: Ref<TetrisRef>;
}

export default function TetrisGame({
  skin = "retro",
  onScore,
  onLines,
  onLevel,
  onGameOver,
  onPause,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const shouldRestartRef = useRef({ active: false, startLevel: 1 });
  const pausedRef = useRef(false);
  const cbRef = useRef({ onScore, onLines, onLevel, onGameOver, onPause });
  const skinRef = useRef<SkinId>(skin);

  useLayoutEffect(() => {
    cbRef.current = { onScore, onLines, onLevel, onGameOver, onPause };
    skinRef.current = skin;
  });

  useImperativeHandle(ref, () => ({
    restart(startLevel = 1) {
      shouldRestartRef.current = { active: true, startLevel };
    },
    togglePause() {
      pausedRef.current = !pausedRef.current;
      cbRef.current.onPause(pausedRef.current);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current!;
    const nextCanvas = nextCanvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const nextCtx = nextCanvas.getContext("2d")!;

    function getSkinColors() {
      return SKINS[skinRef.current].colors;
    }

    function drawBlockRetro(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      size: number,
    ) {
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = "rgba(255,255,255,0.12)";
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    }

    function drawBlockNeon(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      size: number,
    ) {
      context.shadowColor = color;
      context.shadowBlur = 14;
      context.fillStyle = color;
      context.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
      context.shadowBlur = 4;
      context.fillStyle = "rgba(255,255,255,0.6)";
      context.fillRect(
        x * size + size * 0.3,
        y * size + size * 0.3,
        size * 0.4,
        size * 0.4,
      );
      context.shadowBlur = 0;
    }

    function drawBlockPastel(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      size: number,
    ) {
      const margin = 2;
      const bx = x * size + margin;
      const by = y * size + margin;
      const bw = size - margin * 2;
      const bh = size - margin * 2;
      const r = 6;
      context.beginPath();
      context.moveTo(bx + r, by);
      context.lineTo(bx + bw - r, by);
      context.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      context.lineTo(bx + bw, by + bh - r);
      context.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      context.lineTo(bx + r, by + bh);
      context.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      context.lineTo(bx, by + r);
      context.quadraticCurveTo(bx, by, bx + r, by);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.35)";
      context.fillRect(bx + 3, by + 3, bw - 6, Math.floor(bh / 3));
    }

    function drawBlockPixel(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      size: number,
    ) {
      const bx = x * size;
      const by = y * size;
      context.fillStyle = color;
      context.fillRect(bx + 1, by + 1, size - 2, size - 2);
      const half = Math.floor(size / 2);
      context.fillStyle = "rgba(0,0,0,0.25)";
      context.fillRect(bx + 1, by + 1, half - 1, half - 1);
      context.fillRect(bx + half, by + half, half - 1, half - 1);
      context.fillStyle = "rgba(255,255,255,0.18)";
      context.fillRect(bx + half, by + 1, half - 1, half - 1);
      context.fillRect(bx + 1, by + half, half - 1, half - 1);
      context.fillStyle = "rgba(255,255,255,0.5)";
      context.fillRect(bx + 1, by + 1, size - 2, 1);
      context.fillRect(bx + 1, by + 1, 1, size - 2);
      context.fillStyle = "rgba(0,0,0,0.5)";
      context.fillRect(bx + 1, by + size - 2, size - 2, 1);
      context.fillRect(bx + size - 2, by + 1, 1, size - 2);
    }

    function drawBlock(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      colorIndex: number,
      size: number,
      alpha?: number,
    ) {
      if (!colorIndex) return;
      const color = getSkinColors()[colorIndex] as string;
      context.globalAlpha = alpha ?? 1;
      const s = skinRef.current;
      if (s === "neon") drawBlockNeon(context, x, y, color, size);
      else if (s === "pastel") drawBlockPastel(context, x, y, color, size);
      else if (s === "pixel") drawBlockPixel(context, x, y, color, size);
      else drawBlockRetro(context, x, y, color, size);
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }

    let board: number[][];
    let current: Piece;
    let next: Piece;
    let score: number;
    let lines: number;
    let level: number;
    let gameOver: boolean;
    let lastTime: number;
    let dropAccum: number;
    let dropInterval: number;
    let comboCount: number;
    let maxCombo: number;

    let prevScore = -1;
    let prevLines = -1;
    let prevLevel = -1;

    function notify() {
      if (score !== prevScore) {
        cbRef.current.onScore(score);
        prevScore = score;
      }
      if (lines !== prevLines) {
        cbRef.current.onLines(lines);
        prevLines = lines;
      }
      if (level !== prevLevel) {
        cbRef.current.onLevel(level);
        prevLevel = level;
      }
    }

    function createBoard() {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 8) + 1;
      const shape = PIECES[type]!.map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]) {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array(rows).fill(0),
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      for (const kick of [0, -1, 1, -2, 2]) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        comboCount++;
        if (comboCount > maxCombo) maxCombo = comboCount;
        lines += cleared;
        score += (LINE_SCORES[cleared] ?? 0) * level;
        if (comboCount > 1) score += 50 * (comboCount - 1) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      } else {
        comboCount = 0;
      }
    }

    function ghostY() {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function drawNext() {
      const NB = 30;
      nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
    }

    function endGame() {
      gameOver = true;
      cbRef.current.onGameOver(score);
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) {
        endGame();
        return;
      }
      drawNext();
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
      notify();
    }

    function drawGrid() {
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }
    }

    function draw() {
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawGrid();
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);
      const gy = ghostY();
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              ctx,
              current.x + c,
              gy + r,
              current.shape[r][c],
              BLOCK,
              0.2,
            );
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          drawBlock(
            ctx,
            current.x + c,
            current.y + r,
            current.shape[r][c],
            BLOCK,
          );
    }

    function initGame(sl = 1) {
      board = createBoard();
      score = 0;
      lines = (sl - 1) * 10;
      level = sl;
      gameOver = false;
      dropInterval = Math.max(100, 1000 - (sl - 1) * 90);
      dropAccum = 0;
      comboCount = 0;
      maxCombo = 0;
      prevScore = -1;
      prevLines = -1;
      prevLevel = -1;
      next = randomPiece();
      spawn();
      notify();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        pausedRef.current = !pausedRef.current;
        cbRef.current.onPause(pausedRef.current);
        return;
      }
      if (pausedRef.current || gameOver) return;
      switch (e.code) {
        case "ArrowLeft":
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case "ArrowRight":
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case "ArrowDown":
          softDrop();
          break;
        case "ArrowUp":
        case "KeyX":
          tryRotate();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          return;
      }
      notify();
    };

    window.addEventListener("keydown", onKeyDown);

    let rafId: number;

    function loop(ts: number) {
      if (shouldRestartRef.current.active) {
        const sl = shouldRestartRef.current.startLevel;
        shouldRestartRef.current.active = false;
        pausedRef.current = false;
        lastTime = ts;
        initGame(sl);
      }

      if (!gameOver && !pausedRef.current) {
        const dt = ts - lastTime;
        dropAccum += dt;
        if (dropAccum >= dropInterval) {
          dropAccum = 0;
          if (!collide(current.shape, current.x, current.y + 1)) {
            current.y++;
          } else {
            lockPiece();
          }
        }
        if (!gameOver) draw();
      }

      lastTime = ts;
      rafId = requestAnimationFrame(loop);
    }

    lastTime = performance.now();
    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={300}
        height={600}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      <canvas ref={nextCanvasRef} width={120} height={120} />
    </>
  );
}
