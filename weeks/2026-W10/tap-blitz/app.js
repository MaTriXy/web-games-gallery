const KEY = "tap-blitz:leaderboard:v1";

const arena = document.getElementById("arena");
const target = document.getElementById("target");
const timeEl = document.getElementById("time");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");
const leaderboardEl = document.getElementById("leaderboard");
const toggleAudioBtn = document.getElementById("toggle-audio");

let roundActive = false;
let score = 0;
let remaining = 30;
let timerId = null;
let audioEnabled = true;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  if (audioCtx?.state === "suspended") {
    audioCtx.resume();
  }
}

function beep(freq, duration = 0.08) {
  if (!audioEnabled) return;
  ensureAudio();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.frequency.value = freq;
  gain.gain.value = 0.08;

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function loadScores() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveScore(nextScore) {
  const board = loadScores();
  board.push({ score: nextScore, at: new Date().toISOString() });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem(KEY, JSON.stringify(board.slice(0, 10)));
}

function renderScores() {
  const board = loadScores();
  leaderboardEl.innerHTML = "";
  if (board.length === 0) {
    leaderboardEl.innerHTML = "<li>No scores yet.</li>";
    return;
  }

  for (const row of board) {
    const li = document.createElement("li");
    li.textContent = `${row.score} taps`;
    leaderboardEl.appendChild(li);
  }
}

function randomizeTarget() {
  const rect = arena.getBoundingClientRect();
  const maxX = rect.width - target.offsetWidth;
  const maxY = rect.height - target.offsetHeight;

  const x = Math.max(0, Math.floor(Math.random() * maxX));
  const y = Math.max(0, Math.floor(Math.random() * maxY));

  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function endRound() {
  roundActive = false;
  clearInterval(timerId);
  timerId = null;
  saveScore(score);
  renderScores();
  statusEl.textContent = `Round complete. Final score: ${score}`;
  startBtn.disabled = false;
  beep(220, 0.2);
}

function tick() {
  remaining -= 1;
  timeEl.textContent = String(remaining);
  if (remaining <= 0) {
    endRound();
  }
}

function startRound() {
  score = 0;
  remaining = 30;
  roundActive = true;
  scoreEl.textContent = "0";
  timeEl.textContent = "30";
  statusEl.textContent = "Go!";
  startBtn.disabled = true;
  randomizeTarget();

  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
  beep(520, 0.12);
}

startBtn.addEventListener("click", () => {
  ensureAudio();
  startRound();
});

target.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  if (!roundActive) return;
  score += 1;
  scoreEl.textContent = String(score);
  randomizeTarget();
  beep(760, 0.06);
});

toggleAudioBtn.addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  toggleAudioBtn.textContent = `Audio: ${audioEnabled ? "On" : "Off"}`;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Service worker is optional for local dev.
    });
  });
}

renderScores();
randomizeTarget();
