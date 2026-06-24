"use client";

import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type Ref,
} from "react";
const bounceSrc = "/sounds/arkanoid/ball-bounce.mp3";
const breakSrc = "/sounds/arkanoid/break-sound.mp3";
import {
  drawFrame,
  drawSprite,
  EXPLOSION_DURATION,
  EXPLOSION_FRAMES,
  loadSpritesheet,
} from "./arkanoid/assets/spritesheet";

const W = 800;
const H = 600;

const PADDLE_W = 162;
const PADDLE_H = 14;
const BALL_SIZE = 16;
const BLOCK_W = 32;
const BLOCK_H = 16;
const BLOCK_COLS = 10;
const BLOCK_ROWS_BASE = 6;
const BLOCK_COLORS = ["red", "cyan", "green", "magenta", "yellow", "hotpink"];
const BLOCK_OFFSET_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCK_OFFSET_Y = 60;

const BALL_SPEED = 180;
const PADDLE_SPEED = 360;
const SPEED_INCREMENT = 0.1;
const MAX_LEVELS = 10;
const BLOCKS_BASE = BLOCK_COLS * BLOCK_ROWS_BASE;
const BLOCKS_INCREMENT = 10;

export type SkinId = "classic" | "neon" | "retro";

// Mapeo de color de brick a colores concretos por skin
const SKIN_BRICK_COLORS: Record<SkinId, Record<string, string>> = {
  classic: {
    red: "#e53935",
    cyan: "#00acc1",
    green: "#43a047",
    magenta: "#8e24aa",
    yellow: "#f9a825",
    hotpink: "#e91e63",
  },
  neon: {
    red: "#ff1744",
    cyan: "#00e5ff",
    green: "#00e676",
    magenta: "#e040fb",
    yellow: "#ffea00",
    hotpink: "#ff4081",
  },
  retro: {
    red: "#c0392b",
    cyan: "#16a085",
    green: "#27ae60",
    magenta: "#8e44ad",
    yellow: "#f39c12",
    hotpink: "#e91e63",
  },
};

const SKIN_PADDLE: Record<SkinId, string> = {
  classic: "#90a4ae",
  neon: "#40c4ff",
  retro: "#b0bec5",
};

const SKIN_BALL: Record<SkinId, string> = {
  classic: "#ffffff",
  neon: "#ffffff",
  retro: "#ecf0f1",
};

export interface ArkanoidRef {
  restart: (level?: number) => void;
  togglePause: () => void;
  toggleMute: () => void;
}

interface Props {
  initialLevel?: number;
  skin?: SkinId;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
  onMute: (muted: boolean) => void;
  ref?: Ref<ArkanoidRef>;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  alive: boolean;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Explosion {
  x: number;
  y: number;
  color: string;
  elapsed: number;
}

function applyLevelSpeed(level: number): number {
  return BALL_SPEED * (1 + SPEED_INCREMENT) ** (level - 1);
}

function generateBlocks(level: number): Block[] {
  const total = BLOCKS_BASE + (level - 1) * BLOCKS_INCREMENT;
  const result: Block[] = [];
  for (let i = 0; i < total; i++) {
    const col = i % BLOCK_COLS;
    const row = Math.floor(i / BLOCK_COLS);
    const color =
      BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)]!;
    result.push({
      x: BLOCK_OFFSET_X + col * BLOCK_W,
      y: BLOCK_OFFSET_Y + row * BLOCK_H,
      width: BLOCK_W,
      height: BLOCK_H,
      color,
      alive: true,
    });
  }
  return result;
}

export default function ArkanoidGame({
  initialLevel = 1,
  skin = "classic",
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onPause,
  onMute,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldRestartRef = useRef<number | false>(false);
  const pausedRef = useRef(false);
  const mutedRef = useRef(false);
  const cbRef = useRef({
    onScore,
    onLives,
    onLevel,
    onGameOver,
    onPause,
    onMute,
  });
  const skinRef = useRef<SkinId>(skin ?? "classic");

  useLayoutEffect(() => {
    cbRef.current = { onScore, onLives, onLevel, onGameOver, onPause, onMute };
    skinRef.current = skin ?? "classic";
  });

  useImperativeHandle(ref, () => ({
    restart(level?: number) {
      shouldRestartRef.current = level ?? initialLevel;
    },
    togglePause() {
      pausedRef.current = !pausedRef.current;
      cbRef.current.onPause(pausedRef.current);
    },
    toggleMute() {
      mutedRef.current = !mutedRef.current;
      cbRef.current.onMute(mutedRef.current);
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
      if (e.key === "m" || e.key === "M") {
        mutedRef.current = !mutedRef.current;
        cbRef.current.onMute(mutedRef.current);
      }
      if (e.key === "p" || e.key === "P") {
        if (status === "playing") {
          pausedRef.current = !pausedRef.current;
          cbRef.current.onPause(pausedRef.current);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const onMouseMove = (e: MouseEvent) => {
      if (status !== "playing" || pausedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      paddle.x = Math.max(
        0,
        Math.min(W - paddle.width, mouseX - paddle.width / 2),
      );
    };
    canvas.addEventListener("mousemove", onMouseMove);

    let sfxBounce: HTMLAudioElement | null = null;
    let sfxBreak: HTMLAudioElement | null = null;

    function playSound(audio: HTMLAudioElement | null) {
      if (mutedRef.current || !audio) return;
      (audio.cloneNode() as HTMLAudioElement).play().catch(() => {});
    }

    let currentLevel = 1;
    let score = 0;
    let lives = 3;
    let status: "playing" | "gameover" | "win" = "playing";
    let paddle: Paddle;
    let ball: Ball;
    let blocks: Block[];
    let explosions: Explosion[];

    function initGame(startLevel = initialLevel) {
      currentLevel = startLevel;
      score = 0;
      lives = 3;
      status = "playing";
      explosions = [];
      pausedRef.current = false;

      paddle = {
        x: (W - PADDLE_W) / 2,
        y: H - 40,
        width: PADDLE_W,
        height: PADDLE_H,
      };

      const speed = applyLevelSpeed(currentLevel);
      ball = {
        x: W / 2,
        y: paddle.y - BALL_SIZE,
        vx: speed,
        vy: -speed,
        size: BALL_SIZE,
      };

      blocks = generateBlocks(currentLevel);

      cbRef.current.onScore(score);
      cbRef.current.onLives(lives);
      cbRef.current.onLevel(currentLevel);
    }

    function resetBall() {
      const speed = applyLevelSpeed(currentLevel);
      paddle.x = (W - PADDLE_W) / 2;
      ball.x = W / 2;
      ball.y = paddle.y - BALL_SIZE;
      ball.vx = speed;
      ball.vy = -speed;
    }

    // --- Funciones de dibujo por skin ---

    function drawBrickClassic(context: CanvasRenderingContext2D, block: Block) {
      const color = SKIN_BRICK_COLORS.classic[block.color] ?? "#888";
      context.fillStyle = color;
      context.fillRect(
        block.x + 1,
        block.y + 1,
        block.width - 2,
        block.height - 2,
      );
      // borde oscuro
      context.strokeStyle = "rgba(0,0,0,0.4)";
      context.lineWidth = 1;
      context.strokeRect(
        block.x + 1,
        block.y + 1,
        block.width - 2,
        block.height - 2,
      );
    }

    function drawBrickNeon(context: CanvasRenderingContext2D, block: Block) {
      const color = SKIN_BRICK_COLORS.neon[block.color] ?? "#0ff";
      context.shadowColor = color;
      context.shadowBlur = 12;
      context.fillStyle = color;
      context.fillRect(
        block.x + 2,
        block.y + 2,
        block.width - 4,
        block.height - 4,
      );
      context.shadowBlur = 4;
      context.fillStyle = "rgba(255,255,255,0.55)";
      context.fillRect(
        block.x + block.width * 0.3,
        block.y + block.height * 0.25,
        block.width * 0.4,
        block.height * 0.4,
      );
      context.shadowBlur = 0;
    }

    function drawBrickRetro(context: CanvasRenderingContext2D, block: Block) {
      const color = SKIN_BRICK_COLORS.retro[block.color] ?? "#888";
      context.fillStyle = color;
      context.fillRect(
        block.x + 1,
        block.y + 1,
        block.width - 2,
        block.height - 2,
      );
      // banda de brillo superior
      context.fillStyle = "rgba(255,255,255,0.3)";
      context.fillRect(block.x + 1, block.y + 1, block.width - 2, 4);
    }

    function drawBrick(context: CanvasRenderingContext2D, block: Block) {
      const s = skinRef.current;
      if (s === "neon") {
        drawBrickNeon(context, block);
      } else if (s === "retro") {
        drawBrickRetro(context, block);
      } else if (s === "classic") {
        drawBrickClassic(context, block);
      } else {
        // fallback: sprite original
        drawSprite(
          context,
          `block_${block.color}`,
          block.x,
          block.y,
          block.width,
          block.height,
        );
      }
    }

    function drawPaddleCanvas(context: CanvasRenderingContext2D, p: Paddle) {
      const s = skinRef.current;
      if (s === "neon") {
        const color = SKIN_PADDLE.neon;
        context.shadowColor = color;
        context.shadowBlur = 16;
        context.fillStyle = color;
        context.fillRect(p.x, p.y, p.width, p.height);
        context.shadowBlur = 0;
      } else if (s === "retro") {
        const color = SKIN_PADDLE.retro;
        context.fillStyle = color;
        context.fillRect(p.x, p.y, p.width, p.height);
        context.fillStyle = "rgba(255,255,255,0.3)";
        context.fillRect(p.x, p.y, p.width, 4);
      } else {
        // classic
        const color = SKIN_PADDLE.classic;
        context.fillStyle = color;
        context.fillRect(p.x, p.y, p.width, p.height);
        context.strokeStyle = "rgba(255,255,255,0.2)";
        context.lineWidth = 1;
        context.strokeRect(p.x, p.y, p.width, p.height);
      }
    }

    function drawBallCanvas(context: CanvasRenderingContext2D, b: Ball) {
      const s = skinRef.current;
      const color = SKIN_BALL[s] ?? "#fff";
      const cx = b.x + b.size / 2;
      const cy = b.y + b.size / 2;
      const r = b.size / 2;
      if (s === "neon") {
        context.shadowColor = "#00e5ff";
        context.shadowBlur = 18;
      }
      context.fillStyle = color;
      context.beginPath();
      context.arc(cx, cy, r, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }

    function update(delta: number) {
      if (shouldRestartRef.current !== false) {
        const lvl = shouldRestartRef.current;
        shouldRestartRef.current = false;
        initGame(lvl);
        return;
      }

      if (status !== "playing" || pausedRef.current) return;

      const dt = delta / 1000;

      if (keys["ArrowLeft"])
        paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
      if (keys["ArrowRight"])
        paddle.x = Math.min(W - paddle.width, paddle.x + PADDLE_SPEED * dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
        playSound(sfxBounce);
      }
      if (ball.x + ball.size >= W) {
        ball.x = W - ball.size;
        ball.vx = -Math.abs(ball.vx);
        playSound(sfxBounce);
      }
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        playSound(sfxBounce);
      }

      for (const block of blocks) {
        if (!block.alive) continue;
        if (
          ball.x + ball.size > block.x &&
          ball.x < block.x + block.width &&
          ball.y + ball.size > block.y &&
          ball.y < block.y + block.height
        ) {
          block.alive = false;
          playSound(sfxBreak);
          explosions.push({
            x: block.x + block.width / 2,
            y: block.y + block.height / 2,
            color: block.color,
            elapsed: 0,
          });
          score += 10;
          cbRef.current.onScore(score);
          ball.vy = -ball.vy;
          break;
        }
      }

      // Colisión barrida (swept): la posición previa del borde inferior de la bola
      // antes del movimiento de este frame. Evita tunneling a velocidades altas.
      const prevBallBottom = ball.y + ball.size - ball.vy * dt;
      if (
        ball.vy > 0 &&
        prevBallBottom < paddle.y &&
        ball.y + ball.size >= paddle.y &&
        ball.x + ball.size > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.y = paddle.y - ball.size;
        ball.vy = -Math.abs(ball.vy);
        playSound(sfxBounce);
      }

      for (const ex of explosions) ex.elapsed += delta;
      explosions = explosions.filter(
        (ex) => ex.elapsed < EXPLOSION_DURATION * 4,
      );

      const allDead = blocks.every((b) => !b.alive);
      if (allDead && explosions.length === 0) {
        if (currentLevel < MAX_LEVELS) {
          currentLevel++;
          lives += 1;
          blocks = generateBlocks(currentLevel);
          resetBall();
          cbRef.current.onLives(lives);
          cbRef.current.onLevel(currentLevel);
        } else {
          status = "win";
        }
        return;
      }

      if (!allDead && ball.y > H) {
        lives -= 1;
        cbRef.current.onLives(lives);
        if (lives <= 0) {
          status = "gameover";
          cbRef.current.onGameOver(score);
        } else {
          resetBall();
        }
      }
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const s = skinRef.current;

      for (const block of blocks) {
        if (!block.alive) continue;
        if (s === "classic") {
          // skin classic: sprites originales
          drawSprite(
            ctx,
            `block_${block.color}`,
            block.x,
            block.y,
            block.width,
            block.height,
          );
        } else {
          drawBrick(ctx, block);
        }
      }

      for (const ex of explosions) {
        const frame = Math.min(Math.floor(ex.elapsed / EXPLOSION_DURATION), 3);
        const frames = EXPLOSION_FRAMES[ex.color];
        if (frames) {
          drawFrame(ctx, frames[frame]!, ex.x - 16, ex.y - 8, 32, 16);
        }
      }

      if (s === "classic") {
        drawSprite(
          ctx,
          "paddle",
          paddle.x,
          paddle.y,
          paddle.width,
          paddle.height,
        );
        drawSprite(ctx, "ball", ball.x, ball.y, ball.size, ball.size);
      } else {
        drawPaddleCanvas(ctx, paddle);
        drawBallCanvas(ctx, ball);
      }
    }

    let rafId: number;
    let lastTime: number | null = null;

    function loop(ts: number) {
      const delta = lastTime === null ? 16 : Math.min(ts - lastTime, 50);
      lastTime = ts;
      update(delta);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    loadSpritesheet(() => {
      sfxBounce = new Audio(bounceSrc);
      sfxBreak = new Audio(breakSrc);
      initGame();
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
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
