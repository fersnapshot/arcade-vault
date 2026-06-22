"use strict";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#5b9bd5", // J - pale blue
  "#ffb74d", // L - orange
  "#f06292", // anillo - rosa
];

const PIECES = [
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
  ], // anillo (hueco)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

// ---- Skin system ----
const SKINS = {
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

let currentSkin = localStorage.getItem("tetris-skin") || "retro";

function getSkinColors() {
  return SKINS[currentSkin]?.colors ?? SKINS.retro.colors;
}

function applySkin(skinId) {
  document.body.classList.remove("skin-neon", "skin-pastel", "skin-pixel");
  if (skinId !== "retro") {
    document.body.classList.add(`skin-${skinId}`);
  }
  document.querySelectorAll(".skin-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.skin === skinId);
  });
  const nameEl = document.getElementById("skinName");
  if (nameEl) nameEl.textContent = SKINS[skinId]?.name ?? skinId;

  currentSkin = skinId;
  localStorage.setItem("tetris-skin", skinId);
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.getElementById("next-canvas");
const nextCtx = nextCanvas.getContext("2d");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayScore = document.getElementById("overlay-score");
const restartBtn = document.getElementById("restart-btn");
const gameoverBox = document.getElementById("gameover-box");
const pauseBox = document.getElementById("pause-box");
const resumeBtn = document.getElementById("resume-btn");
const restartPauseBtn = document.getElementById("restart-pause-btn");
const controlsBtn = document.getElementById("controls-btn");
const pauseControlsPanel = document.getElementById("pause-controls");
const startLevelSelect = document.getElementById("start-level-select");
const nameEntry = document.getElementById("name-entry");
const playerNameInput = document.getElementById("player-name");
const saveScoreBtn = document.getElementById("save-score-btn");
const overlayLeaderboard = document.getElementById("overlay-leaderboard");
const overlayLbBody = document.getElementById("overlay-lb-body");
const leaderboardBody = document.getElementById("leaderboard-body");
const resetRecordsBtn = document.getElementById("reset-records-btn");

// ---- Leaderboard (localStorage) ----
const LS_KEY = "tetris_leaderboard";
const MAX_ENTRIES = 5;

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLeaderboard(lb) {
  localStorage.setItem(LS_KEY, JSON.stringify(lb));
}

function isTopScore(score) {
  const lb = getLeaderboard();
  return lb.length < MAX_ENTRIES || score > lb[lb.length - 1].score;
}

function addEntry(name, score, lines, maxCombo) {
  const lb = getLeaderboard();
  lb.push({ name: name.trim() || "AAA", score, lines, maxCombo });
  lb.sort((a, b) => b.score - a.score);
  lb.splice(MAX_ENTRIES);
  saveLeaderboard(lb);
  return lb;
}

function renderLeaderboard(tbodyEl, highlightScore = null) {
  const lb = getLeaderboard();
  tbodyEl.innerHTML = "";
  if (lb.length === 0) {
    tbodyEl.innerHTML =
      '<tr><td colspan="5" class="lb-empty">Sin records aún</td></tr>';
    return;
  }
  lb.forEach((entry, i) => {
    const tr = document.createElement("tr");
    const isHighlight =
      highlightScore !== null &&
      entry.score === highlightScore &&
      i === lb.findIndex((e) => e.score === highlightScore);
    if (isHighlight) tr.classList.add("lb-highlight");
    tr.innerHTML = `<td>${i + 1}</td><td>${entry.name}</td><td>${entry.score.toLocaleString()}</td><td>${entry.lines}</td><td>${entry.maxCombo}</td>`;
    tbodyEl.appendChild(tr);
  });
}

function refreshMainLeaderboard() {
  renderLeaderboard(leaderboardBody);
}

let board,
  current,
  next,
  score,
  lines,
  level,
  paused,
  gameOver,
  lastTime,
  dropAccum,
  dropInterval,
  animId,
  startLevel,
  comboCount,
  maxCombo;

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(shape, ox, oy) {
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

function rotateCW(shape) {
  const rows = shape.length,
    cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
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
    score += (LINE_SCORES[cleared] || 0) * level;
    if (comboCount > 1) score += 50 * (comboCount - 1) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
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
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = getSkinColors()[colorIndex];
  context.globalAlpha = alpha ?? 1;

  if (currentSkin === "neon") {
    drawBlockNeon(context, x, y, color, size);
  } else if (currentSkin === "pastel") {
    drawBlockPastel(context, x, y, color, size);
  } else if (currentSkin === "pixel") {
    drawBlockPixel(context, x, y, color, size, colorIndex);
  } else {
    drawBlockRetro(context, x, y, color, size);
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function drawBlockRetro(context, x, y, color, size) {
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = "rgba(255,255,255,0.12)";
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
}

function drawBlockNeon(context, x, y, color, size) {
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

function drawBlockPastel(context, x, y, color, size) {
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

function drawBlockPixel(context, x, y, color, size, colorIndex) {
  const bx = x * size;
  const by = y * size;

  context.fillStyle = color;
  context.fillRect(bx + 1, by + 1, size - 2, size - 2);

  const dark = "rgba(0,0,0,0.25)";
  const light = "rgba(255,255,255,0.18)";
  const half = Math.floor(size / 2);

  context.fillStyle = dark;
  context.fillRect(bx + 1, by + 1, half - 1, half - 1);
  context.fillRect(bx + half, by + half, half - 1, half - 1);

  context.fillStyle = light;
  context.fillRect(bx + half, by + 1, half - 1, half - 1);
  context.fillRect(bx + 1, by + half, half - 1, half - 1);

  context.fillStyle = "rgba(255,255,255,0.5)";
  context.fillRect(bx + 1, by + 1, size - 2, 1);
  context.fillRect(bx + 1, by + 1, 1, size - 2);

  context.fillStyle = "rgba(0,0,0,0.5)";
  context.fillRect(bx + 1, by + size - 2, size - 2, 1);
  context.fillRect(bx + size - 2, by + 1, 1, size - 2);
}

function drawGrid() {
  ctx.strokeStyle =
    getComputedStyle(document.body).getPropertyValue("--grid-color").trim() ||
    "#22222e";
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
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

function showOverlayLeaderboard(highlightScore) {
  renderLeaderboard(overlayLbBody, highlightScore);
  overlayLeaderboard.classList.remove("hidden");
}

function showGameOver() {
  gameoverBox.classList.remove("hidden");
  pauseBox.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function showPauseMenu() {
  gameoverBox.classList.add("hidden");
  pauseBox.classList.remove("hidden");
  pauseControlsPanel.classList.add("hidden");
  overlay.classList.remove("hidden");
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = "GAME OVER";
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()} · Líneas: ${lines} · Combo máx: ${maxCombo}`;
  nameEntry.classList.add("hidden");
  overlayLeaderboard.classList.add("hidden");
  playerNameInput.value = "";

  if (isTopScore(score)) {
    nameEntry.classList.remove("hidden");
  } else {
    showOverlayLeaderboard(null);
  }
  showGameOver();
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    overlay.classList.add("hidden");
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    showPauseMenu();
  }
}

function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
    }
  }
  if (gameOver) return;
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  startLevel = parseInt(startLevelSelect.value, 10) || 1;
  board = createBoard();
  score = 0;
  lines = (startLevel - 1) * 10;
  level = startLevel;
  paused = false;
  gameOver = false;
  dropInterval = Math.max(100, 1000 - (startLevel - 1) * 90);
  dropAccum = 0;
  comboCount = 0;
  maxCombo = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  overlay.classList.add("hidden");
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" || e.code === "Escape") {
    e.preventDefault();
    togglePause();
    return;
  }
  if (paused || gameOver) return;
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
      break;
  }
  updateHUD();
});

restartBtn.addEventListener("click", init);

saveScoreBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim() || "AAA";
  addEntry(name, score, lines, maxCombo);
  nameEntry.classList.add("hidden");
  showOverlayLeaderboard(score);
  refreshMainLeaderboard();
});

playerNameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveScoreBtn.click();
});

resetRecordsBtn.addEventListener("click", () => {
  if (confirm("¿Borrar todos los records?")) {
    saveLeaderboard([]);
    refreshMainLeaderboard();
  }
});

resumeBtn.addEventListener("click", () => {
  togglePause();
});

restartPauseBtn.addEventListener("click", () => {
  init();
});

controlsBtn.addEventListener("click", () => {
  pauseControlsPanel.classList.toggle("hidden");
});

document.getElementById("themeToggle").addEventListener("change", (e) => {
  document.body.classList.toggle("light-mode", e.target.checked);
});

document.querySelectorAll(".skin-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    applySkin(btn.dataset.skin);
  });
});

applySkin(currentSkin);
refreshMainLeaderboard();
init();
