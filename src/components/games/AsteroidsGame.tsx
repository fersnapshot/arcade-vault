"use client";

import {
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from "react";

export type SkinId = "classic" | "neon" | "retro";

const SKINS: Record<
  SkinId,
  {
    name: string;
    ship: string;
    asteroid: string;
    bullet: string;
    particle: string;
    powerUp: string;
    thrust: string;
    shadowBlur: number;
  }
> = {
  classic: {
    name: "Classic",
    ship: "#ffffff",
    asteroid: "#ffffff",
    bullet: "#ffffff",
    particle: "#ffffff",
    powerUp: "#00ffff",
    thrust: "rgba(255,130,0,0.85)",
    shadowBlur: 0,
  },
  neon: {
    name: "Neon",
    ship: "#00ffff",
    asteroid: "#ff00ff",
    bullet: "#ffff00",
    particle: "#ff8800",
    powerUp: "#00ff88",
    thrust: "rgba(0,255,200,0.9)",
    shadowBlur: 14,
  },
  retro: {
    name: "Retro",
    ship: "#ffd54f",
    asteroid: "#81c784",
    bullet: "#e57373",
    particle: "#ffb74d",
    powerUp: "#4dd0e1",
    thrust: "rgba(255,100,0,0.85)",
    shadowBlur: 0,
  },
};

const W = 800;
const H = 600;
const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;
const RADII: number[] = [0, 16, 30, 50];
const SPEEDS: number[] = [0, 85, 55, 32];
const POINTS: number[] = [0, 100, 50, 20];

const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  radius: number;
  dead: boolean;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, color: string, shadowBlur: number) {
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead: boolean;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: [number, number][];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size]!;
    this.dead = false;
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size]! + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, color: string, shadowBlur: number) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0]![0], this.verts[0]![1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i]![0], this.verts[i]![1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl = POWERUP_TTL;
    this.dead = false;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, color: string, shadowBlur: number) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
  }
}

class Ship {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  radius: number;
  thrusting: boolean;
  invincible: number;
  shootCooldown: number;
  dead: boolean;
  tripleShot: number;

  constructor() {
    this.tripleShot = 0;
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;
    const ROT = 3.5;
    const THRUST = 260;
    const DRAG = 0.987;
    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;
    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }
    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(
    ctx: CanvasRenderingContext2D,
    color: string,
    shadowBlur: number,
    thrustColor: string,
  ) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowColor = color;
    ctx.shadowBlur = shadowBlur;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.stroke();
    if (this.thrusting && Math.random() > 0.35) {
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = thrustColor;
      ctx.stroke();
    }
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, color: string) {
    const alpha = this.ttl / this.life;
    // parse color to inject alpha — color is always a hex #rrggbb
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

export interface AsteroidsRef {
  restart: () => void;
  togglePause: () => void;
}

interface Props {
  skin?: SkinId;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  onPause: (paused: boolean) => void;
  ref?: Ref<AsteroidsRef>;
}

export default function AsteroidsGame({
  skin = "classic",
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onPause,
  ref,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldRestartRef = useRef(false);
  const pausedRef = useRef(false);
  const cbRef = useRef({ onScore, onLives, onLevel, onGameOver, onPause });
  const skinRef = useRef<SkinId>(skin);

  useLayoutEffect(() => {
    cbRef.current = { onScore, onLives, onLevel, onGameOver, onPause };
  }, [onScore, onLives, onLevel, onGameOver, onPause]);

  useLayoutEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useImperativeHandle(ref, () => ({
    restart() {
      shouldRestartRef.current = true;
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

    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    const GAME_KEYS = new Set([
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
    ]);

    const onKeyDown = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.key)) e.preventDefault();
      if (!keys[e.code]) justPressed[e.code] = true;
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function pressed(code: string): boolean {
      const val = !!justPressed[code];
      justPressed[code] = false;
      return val;
    }

    let ship: Ship;
    let bullets: Bullet[];
    let asteroids: Asteroid[];
    let particles: Particle[];
    let powerUps: PowerUp[];
    let score: number;
    let lives: number;
    let level: number;
    let gameState: "playing" | "dead" | "gameover";
    let deadTimer: number;
    let powerUpSpawned: boolean;
    let killsSinceSpawn: number;
    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;

    function notify() {
      if (score !== prevScore) {
        cbRef.current.onScore(score);
        prevScore = score;
      }
      if (lives !== prevLives) {
        cbRef.current.onLives(lives);
        prevLives = lives;
      }
      if (level !== prevLevel) {
        cbRef.current.onLevel(level);
        prevLevel = level;
      }
    }

    function spawnAsteroids(count: number) {
      const SAFE_DIST = 130;
      for (let i = 0; i < count; i++) {
        let x = 0,
          y = 0;
        do {
          x = rand(0, W);
          y = rand(0, H);
        } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
        asteroids.push(new Asteroid(x, y, 3));
      }
    }

    function initGame() {
      ship = new Ship();
      bullets = [];
      asteroids = [];
      particles = [];
      powerUps = [];
      powerUpSpawned = false;
      killsSinceSpawn = 0;
      score = 0;
      lives = 3;
      level = 1;
      gameState = "playing";
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
      spawnAsteroids(4);
      notify();
    }

    function nextLevel() {
      level++;
      bullets = [];
      particles = [];
      powerUps = [];
      powerUpSpawned = false;
      killsSinceSpawn = 0;
      ship.reset();
      spawnAsteroids(3 + level);
      notify();
    }

    function explode(x: number, y: number, count = 8) {
      for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
    }

    function killShip() {
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives--;
      notify();
      if (lives <= 0) {
        gameState = "gameover";
        cbRef.current.onGameOver(score);
      } else {
        gameState = "dead";
        deadTimer = 2;
      }
    }

    function update(dt: number) {
      if (shouldRestartRef.current) {
        shouldRestartRef.current = false;
        pausedRef.current = false;
        initGame();
        return;
      }

      if (pausedRef.current) return;

      if (gameState === "gameover") {
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }

      if (gameState === "dead") {
        deadTimer -= dt;
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        asteroids.forEach((a) => a.update(dt));
        if (deadTimer <= 0) {
          gameState = "playing";
          ship.reset();
        }
        return;
      }

      if (pressed("Space")) bullets.push(...ship.tryShoot());

      ship.update(dt, keys);
      bullets.forEach((b) => b.update(dt));
      asteroids.forEach((a) => a.update(dt));
      particles.forEach((p) => p.update(dt));
      powerUps.forEach((p) => p.update(dt));

      bullets = bullets.filter((b) => !b.dead);
      particles = particles.filter((p) => !p.dead);
      powerUps = powerUps.filter((p) => !p.dead);

      for (const p of powerUps) {
        if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
          p.dead = true;
          ship.tripleShot = POWERUP_DURATION;
        }
      }

      const newAsteroids: Asteroid[] = [];
      for (const b of bullets) {
        for (const a of asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            score += POINTS[a.size]!;
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
            if (!powerUpSpawned) {
              killsSinceSpawn++;
              const guaranteed = killsSinceSpawn >= 5;
              if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
                powerUps.push(new PowerUp(a.x, a.y));
                powerUpSpawned = true;
              }
            }
          }
        }
      }
      asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
      bullets = bullets.filter((b) => !b.dead);

      if (ship.invincible <= 0) {
        for (const a of asteroids) {
          if (dist(ship, a) < ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }

      if (asteroids.length === 0) nextLevel();

      notify();
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const sk = SKINS[skinRef.current];
      particles.forEach((p) => p.draw(ctx, sk.particle));
      asteroids.forEach((a) => a.draw(ctx, sk.asteroid, sk.shadowBlur));
      powerUps.forEach((p) => p.draw(ctx, sk.powerUp, sk.shadowBlur));
      bullets.forEach((b) => b.draw(ctx, sk.bullet, sk.shadowBlur));
      ship.draw(ctx, sk.ship, sk.shadowBlur, sk.thrust);

      if (ship.tripleShot > 0) {
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = sk.powerUp;
        ctx.font = "15px monospace";
        ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
      }
    }

    let rafId: number;
    let lastTime: number | null = null;

    function loop(ts: number) {
      if (pausedRef.current) {
        rafId = requestAnimationFrame(loop);
        return;
      }
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
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
