const SCORE_KEY = "lane-dodge:best:v1";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("start");
const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");
const audioBtn = document.getElementById("audio");

const lanes = [90, 180, 270];
const player = { lane: 1, y: 470, size: 44 };

let obstacles = [];
let score = 0;
let running = false;
let raf = null;
let spawnTick = 0;
let speed = 2.6;
let audioEnabled = true;
let audioCtx = null;

function bestScore() {
  return Number(localStorage.getItem(SCORE_KEY) || "0");
}

function setBest(value) {
  localStorage.setItem(SCORE_KEY, String(value));
  bestEl.textContent = String(value);
}

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx?.state === "suspended") audioCtx.resume();
}

function beep(freq, duration = 0.08) {
  if (!audioEnabled) return;
  ensureAudio();
  if (!audioCtx) return;

  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = freq;
  g.gain.value = 0.08;
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + duration);
}

function moveLeft() {
  if (!running) return;
  player.lane = Math.max(0, player.lane - 1);
  beep(450, 0.05);
}

function moveRight() {
  if (!running) return;
  player.lane = Math.min(2, player.lane + 1);
  beep(520, 0.05);
}

function spawnObstacle() {
  obstacles.push({
    lane: Math.floor(Math.random() * 3),
    y: -60,
    size: 44
  });
}

function collide(a, b) {
  return !(a.x + a.size < b.x || b.x + b.size < a.x || a.y + a.size < b.y || b.y + b.size < a.y);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 1; i <= 2; i += 1) {
    ctx.strokeStyle = "#3b3b4c";
    ctx.beginPath();
    ctx.moveTo(i * 120, 0);
    ctx.lineTo(i * 120, canvas.height);
    ctx.stroke();
  }

  const playerRect = {
    x: lanes[player.lane] - player.size / 2,
    y: player.y,
    size: player.size
  };

  ctx.fillStyle = "#ffbf00";
  ctx.fillRect(playerRect.x, playerRect.y, playerRect.size, playerRect.size);

  ctx.fillStyle = "#ff4d4d";
  for (const obstacle of obstacles) {
    const x = lanes[obstacle.lane] - obstacle.size / 2;
    ctx.fillRect(x, obstacle.y, obstacle.size, obstacle.size);
  }
}

function endGame() {
  running = false;
  cancelAnimationFrame(raf);

  const best = bestScore();
  if (score > best) {
    setBest(score);
    statusEl.textContent = `New best: ${score}`;
  } else {
    statusEl.textContent = `Game over. Score: ${score}`;
  }

  startBtn.disabled = false;
  beep(180, 0.2);
}

function loop() {
  if (!running) return;

  spawnTick += 1;
  if (spawnTick > 40) {
    spawnObstacle();
    spawnTick = 0;
    speed += 0.02;
    score += 1;
    scoreEl.textContent = String(score);
  }

  const playerRect = {
    x: lanes[player.lane] - player.size / 2,
    y: player.y,
    size: player.size
  };

  for (const obstacle of obstacles) {
    obstacle.y += speed;
    const obstacleRect = {
      x: lanes[obstacle.lane] - obstacle.size / 2,
      y: obstacle.y,
      size: obstacle.size
    };

    if (collide(playerRect, obstacleRect)) {
      endGame();
      draw();
      return;
    }
  }

  obstacles = obstacles.filter((item) => item.y < canvas.height + 60);
  draw();
  raf = requestAnimationFrame(loop);
}

function startGame() {
  ensureAudio();
  obstacles = [];
  score = 0;
  spawnTick = 0;
  speed = 2.6;
  player.lane = 1;
  scoreEl.textContent = "0";
  statusEl.textContent = "Dodge all blocks.";
  running = true;
  startBtn.disabled = true;
  beep(620, 0.09);
  loop();
}

let touchStartX = null;
canvas.addEventListener("pointerdown", (event) => {
  touchStartX = event.clientX;
});

canvas.addEventListener("pointerup", (event) => {
  if (touchStartX == null) return;
  const delta = event.clientX - touchStartX;
  if (delta > 20) moveRight();
  if (delta < -20) moveLeft();
  touchStartX = null;
});

leftBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveLeft();
});

rightBtn.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  moveRight();
});

startBtn.addEventListener("click", startGame);

audioBtn.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  audioBtn.textContent = `Audio: ${audioEnabled ? "On" : "Off"}`;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // optional
    });
  });
}

setBest(bestScore());
draw();
