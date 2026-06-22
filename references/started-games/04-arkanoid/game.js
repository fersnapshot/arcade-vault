const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_W = 800;
const CANVAS_H = 600;

const PADDLE_W = 162;
const PADDLE_H = 14;
const BALL_SIZE = 16;
const BLOCK_W = 32;
const BLOCK_H = 16;
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_COLORS = ["red", "cyan", "green", "magenta", "yellow", "hotpink"];
const BLOCK_OFFSET_X = (CANVAS_W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCK_OFFSET_Y = 60;

const BALL_SPEED = 180; // px/segundo (equivalente a 3 px/frame × 60 fps)

const MAX_LEVELS = 10;
const BLOCKS_BASE = 60;
const BLOCKS_INCREMENT = 10;
const SPEED_INCREMENT = 0.1;

let currentLevel = 1;
let paused = false;
let selectedLevel = 1;

let state, paddle, ball, blocks, explosions;

let sfxBounce;
let sfxBreak;
let muted = false;

function initState() {
  currentLevel = 1;
  selectedLevel = 1;
  state = { lives: 3, score: 0, status: "playing" };
  explosions = [];

  paddle = {
    x: (CANVAS_W - PADDLE_W) / 2,
    y: CANVAS_H - 40,
    width: PADDLE_W,
    height: PADDLE_H,
  };

  const speed = applyLevelSpeed(currentLevel);
  ball = {
    x: CANVAS_W / 2,
    y: paddle.y - BALL_SIZE,
    vx: speed,
    vy: -speed,
    size: BALL_SIZE,
  };

  blocks = generateBlocks(currentLevel);
}

function startLevel(level) {
  currentLevel = level;
  blocks = generateBlocks(level);
  const speed = applyLevelSpeed(level);
  paddle.x = (CANVAS_W - PADDLE_W) / 2;
  ball.x = CANVAS_W / 2;
  ball.y = paddle.y - BALL_SIZE;
  ball.vx = speed;
  ball.vy = -speed;
  explosions = [];
}

function applyLevelSpeed(level) {
  return BALL_SPEED * (1 + SPEED_INCREMENT) ** (level - 1);
}

function generateBlocks(level) {
  const total = BLOCKS_BASE + (level - 1) * BLOCKS_INCREMENT;
  const result = [];
  for (let i = 0; i < total; i++) {
    const col = i % BLOCK_COLS;
    const row = Math.floor(i / BLOCK_COLS);
    const color = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
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

initState();

const keys = {};
let restartBtn = null;

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "m" || e.key === "M") muted = !muted;

  if (e.key === "p" || e.key === "P") {
    if (state.status === "playing") {
      paused = !paused;
      if (paused) selectedLevel = currentLevel;
    }
  }

});
window.addEventListener("keyup", (e) => (keys[e.key] = false));

canvas.addEventListener("click", (e) => {
  if (!restartBtn) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (
    mx >= restartBtn.x &&
    mx <= restartBtn.x + restartBtn.w &&
    my >= restartBtn.y &&
    my <= restartBtn.y + restartBtn.h
  ) {
    initState();
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (state.status !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.max(
    0,
    Math.min(CANVAS_W - paddle.width, mouseX - paddle.width / 2)
  );
});

const PADDLE_SPEED = 360; // px/segundo (equivalente a 6 px/frame × 60 fps)

function update(delta) {
  if (state.status !== "playing") return;
  if (paused) return;

  const dt = delta / 1000; // ms → segundos

  if (keys["ArrowLeft"]) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
  if (keys["ArrowRight"])
    paddle.x = Math.min(CANVAS_W - paddle.width, paddle.x + PADDLE_SPEED * dt);

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // paredes laterales
  if (ball.x <= 0) {
    ball.x = 0;
    ball.vx = Math.abs(ball.vx);
    playSound(sfxBounce);
  }
  if (ball.x + ball.size >= CANVAS_W) {
    ball.x = CANVAS_W - ball.size;
    ball.vx = -Math.abs(ball.vx);
    playSound(sfxBounce);
  }

  // techo
  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
    playSound(sfxBounce);
  }

  // bloques
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
      state.score += 10;
      ball.vy = -ball.vy;
      break;
    }
  }

  // paleta
  if (
    ball.vy > 0 &&
    ball.y + ball.size >= paddle.y &&
    ball.y + ball.size <= paddle.y + paddle.height &&
    ball.x + ball.size > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.y = paddle.y - ball.size;
    ball.vy = -Math.abs(ball.vy);
    playSound(sfxBounce);
  }

  // explosiones
  for (const e of explosions) e.elapsed += delta;
  explosions.splice(
    0,
    explosions.length,
    ...explosions.filter((e) => e.elapsed < EXPLOSION_DURATION * 4)
  );

  // nivel completado
  const allDead = blocks.every((b) => !b.alive);
  if (allDead && explosions.length === 0) {
    if (currentLevel < MAX_LEVELS) {
      currentLevel++;
      state.lives += 1;
      blocks = generateBlocks(currentLevel);
      const speed = applyLevelSpeed(currentLevel);
      paddle.x = (CANVAS_W - PADDLE_W) / 2;
      ball.x = CANVAS_W / 2;
      ball.y = paddle.y - BALL_SIZE;
      ball.vx = speed;
      ball.vy = -speed;
    } else {
      state.status = "win";
    }
  }

  // bola fuera por abajo
  if (!allDead && ball.y > CANVAS_H) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.status = "gameover";
    } else {
      const speed = applyLevelSpeed(currentLevel);
      paddle.x = (CANVAS_W - PADDLE_W) / 2;
      ball.x = CANVAS_W / 2;
      ball.y = paddle.y - BALL_SIZE;
      ball.vx = speed;
      ball.vy = -speed;
    }
  }
}

function render() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const block of blocks) {
    if (block.alive) {
      drawSprite(
        ctx,
        `block_${block.color}`,
        block.x,
        block.y,
        block.width,
        block.height
      );
    }
  }

  for (const e of explosions) {
    const frame = Math.min(Math.floor(e.elapsed / EXPLOSION_DURATION), 3);
    drawFrame(ctx, EXPLOSION_FRAMES[e.color][frame], e.x - 16, e.y - 8, 32, 16);
  }

  drawSprite(ctx, "paddle", paddle.x, paddle.y, paddle.width, paddle.height);
  drawSprite(ctx, "ball", ball.x, ball.y, ball.size, ball.size);

  ctx.fillStyle = "#fff";
  ctx.font = "16px monospace";
  ctx.fillText(`Score: ${state.score}`, 10, 20);
  ctx.fillText(`Level: ${currentLevel} / ${MAX_LEVELS}`, CANVAS_W / 2 - 50, 20);
  ctx.font = "20px monospace";
  ctx.fillText(muted ? "🔇" : "🔊", 10, 44);
  const ballSize = 16;
  const ballSpacing = 20;
  for (let i = 0; i < state.lives; i++) {
    drawSprite(
      ctx,
      "ball",
      CANVAS_W - 20 - i * ballSpacing,
      6,
      ballSize,
      ballSize
    );
  }

  if (paused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.fillText("PAUSA", CANVAS_W / 2, 220);
    ctx.textAlign = "left";

    showLevelSelectUI("pause");
  } else if (state.status !== "playing") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const msg = state.status === "win" ? "You Win!" : "Game Over";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 48px monospace";
    ctx.textAlign = "center";
    ctx.fillText(msg, CANVAS_W / 2, CANVAS_H / 2 - 50);

    ctx.font = "20px monospace";
    ctx.fillText(`Score: ${state.score}`, CANVAS_W / 2, CANVAS_H / 2);
    ctx.textAlign = "left";

    showLevelSelectUI("restart");
  } else {
    hideLevelSelectUI();
  }
}

function playSound(audio) {
  if (!muted) audio.cloneNode().play();
}

let lastTime = 0;
function loop(timestamp) {
  const delta = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
  lastTime = timestamp;
  update(delta);
  render();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  sfxBounce = new Audio("assets/sounds/ball-bounce.mp3");
  sfxBreak = new Audio("assets/sounds/break-sound.mp3");
  loop();
});

const levelSelect = document.getElementById("level-select");
const levelSelectBtn = document.getElementById("level-select-btn");
const levelSelectUI = document.getElementById("level-select-ui");

let levelSelectContext = null;

function showLevelSelectUI(context) {
  levelSelectContext = context;
  levelSelect.value = selectedLevel;
  levelSelectUI.style.display = "flex";
}

function hideLevelSelectUI() {
  levelSelectUI.style.display = "none";
  levelSelectContext = null;
}

for (let i = 1; i <= MAX_LEVELS; i++) {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `Nivel ${i}`;
  levelSelect.appendChild(opt);
}

levelSelect.addEventListener("change", () => {
  selectedLevel = +levelSelect.value;
});

levelSelectBtn.addEventListener("click", () => {
  const context = levelSelectContext;
  hideLevelSelectUI();
  if (context === "pause") {
    startLevel(selectedLevel);
    paused = false;
  } else if (context === "restart") {
    state.score = 0;
    state.lives = 3;
    state.status = "playing";
    startLevel(selectedLevel);
  }
});
