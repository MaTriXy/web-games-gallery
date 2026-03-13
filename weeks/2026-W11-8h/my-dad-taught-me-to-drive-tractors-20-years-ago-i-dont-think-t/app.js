const GAME_TITLE = `Dad's Drift Lesson`;
const ACCENT = `#C86B2A`;
const MODE = `dodge_stream`;
const THEME_LABEL = `My dad taught me to drive tractors 20 years ago. I don’t think this is quite wha`;
const MOTIF_A = `taught`;
const MOTIF_B = `drive`;
const OBJECTIVE_TAG = `taught vs drive`;
const STAR_THRESHOLDS = [120,260,420];

const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const comboEl = document.getElementById("combo");
const multiplierEl = document.getElementById("multiplier");
const bestEl = document.getElementById("bestCombo");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const boardEl = document.getElementById("board");
const playfield = document.getElementById("playfield");
const sequencePads = [...document.querySelectorAll(".pad")];
const themeEl = document.getElementById("themeTag");
const summaryEl = document.getElementById("summary");
const introOverlayEl = document.getElementById("introOverlay");
const gameShellEl = document.getElementById("gameShell");
const overlayEl = document.getElementById("resultOverlay");

let score = 0;
let combo = 0;
let bestCombo = 0;
let seconds = 45;
let active = false;
let muted = false;
let startedAt = 0;
let timerId = null;
let animationId = null;
let tapTimeoutId = null;
let sequence = [];
let inputIndex = 0;
let dodgePlayerX = 50;
let dodgeBlocks = [];
let dodgeLastSpawn = 0;
let tapTargets = [];
let tapRound = 0;
let dodgeBound = false;
let sequenceBound = false;

const AUDIO_CTX = window.AudioContext || window.webkitAudioContext;
const audioCtx = AUDIO_CTX ? new AUDIO_CTX() : null;
window.__audioContext = audioCtx;

function beep(freq = 440, dur = 0.08) {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.01);
}

function currentMultiplier() {
  return 1 + Math.min(4, Math.floor(combo / 4));
}

function addPoints(base) {
  score += base * currentMultiplier();
  bestCombo = Math.max(bestCombo, combo);
  updateHud();
}

function breakCombo(message) {
  combo = 0;
  updateHud();
  if (message) setStatus(message);
}

function loadBoard() {
  const key = "trend_generated_leaderboard_v2";
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveBoard(scoreValue) {
  const key = "trend_generated_leaderboard_v2";
  const rows = loadBoard();
  rows.push(scoreValue);
  rows.sort((a, b) => b - a);
  localStorage.setItem(key, JSON.stringify(rows.slice(0, 10)));
}

function renderBoard() {
  const rows = loadBoard();
  boardEl.innerHTML = rows.map((value) => `<li>${value}</li>`).join("");
}

function renderSummary(duration) {
  const stars = STAR_THRESHOLDS.reduce((acc, threshold) => acc + (score >= threshold ? 1 : 0), 0);
  summaryEl.innerHTML = `
    <strong>${GAME_TITLE}</strong>
    <span>Score ${Math.round(score)}</span>
    <span>Best combo ${bestCombo}</span>
    <span>Stars ${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>
    <span>Duration ${duration}s</span>
  `;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function updateHud() {
  scoreEl.textContent = String(Math.round(score));
  timerEl.textContent = String(seconds);
  comboEl.textContent = String(combo);
  multiplierEl.textContent = "x" + currentMultiplier();
  bestEl.textContent = String(bestCombo);
}

function endGame() {
  if (!active) return;
  active = false;
  if (timerId) clearInterval(timerId);
  if (animationId) cancelAnimationFrame(animationId);
  if (tapTimeoutId) clearTimeout(tapTimeoutId);
  document.body.classList.remove("running");
  saveBoard(score);
  renderBoard();
  const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  renderSummary(duration);
  overlayEl.classList.remove("hidden");
  setStatus(`Round complete. Score: ${Math.round(score)}`);
  window.webkit?.messageHandlers?.nativeApp?.postMessage({
    action: "gameEnd",
    data: { score: Math.round(score), duration }
  });
}

function beginTimer() {
  timerId = setInterval(() => {
    seconds -= 1;
    updateHud();
    if (seconds <= 0) endGame();
  }, 1000);
}

function resetRound() {
  score = 0;
  combo = 0;
  bestCombo = 0;
  seconds = 45;
  tapRound = 0;
  if (timerId) clearInterval(timerId);
  if (animationId) cancelAnimationFrame(animationId);
  if (tapTimeoutId) clearTimeout(tapTimeoutId);
  document.body.classList.add("running");
  gameShellEl.classList.remove("hidden");
  introOverlayEl.classList.add("hidden");
  overlayEl.classList.add("hidden");
  updateHud();
}

function spawnTapTargetLoop() {
  playfield.innerHTML = "";
  tapTargets = [];
  for (let i = 0; i < 3; i += 1) {
    const target = document.createElement("button");
    target.className = "target";
    playfield.appendChild(target);
    tapTargets.push(target);
  }

  const reposition = () => {
    tapRound += 1;
    const validIndex = tapRound % tapTargets.length;
    tapTargets.forEach((target, index) => {
      const w = Math.max(30, playfield.clientWidth - 84);
      const h = Math.max(30, playfield.clientHeight - 84);
      target.style.left = Math.floor(Math.random() * w) + "px";
      target.style.top = Math.floor(Math.random() * h) + "px";
      target.textContent = index === validIndex ? MOTIF_A : MOTIF_B;
      target.dataset.kind = index === validIndex ? "valid" : "decoy";
      target.classList.toggle("decoy", index !== validIndex);
    });
    const windowMs = Math.max(600, 1500 - tapRound * 35);
    setStatus(`Tap ${MOTIF_A}. Avoid ${MOTIF_B}. Window: ${(windowMs / 1000).toFixed(1)}s`);
    if (tapTimeoutId) clearTimeout(tapTimeoutId);
    tapTimeoutId = setTimeout(() => {
      if (!active) return;
      seconds = Math.max(0, seconds - 2);
      breakCombo(`Too slow. ${MOTIF_A} escaped.`);
      beep(190, 0.12);
      reposition();
    }, windowMs);
  };

  tapTargets.forEach((target) => {
    target.addEventListener("pointerdown", () => {
      if (!active) return;
      if (tapTimeoutId) clearTimeout(tapTimeoutId);
      if (target.dataset.kind === "valid") {
        combo += 1;
        addPoints(3);
        beep(360 + combo * 6, 0.05);
      } else {
        seconds = Math.max(0, seconds - 2);
        breakCombo(`Wrong hit. ${MOTIF_B} is a decoy.`);
        beep(180, 0.12);
      }
      reposition();
    });
  });

  reposition();
}

function dodgeLoop(ts) {
  if (!active) return;
  const elapsed = Math.max(0, 45 - seconds);
  const spawnGap = Math.max(240, 680 - elapsed * 9 - combo * 12);
  if (!dodgeLastSpawn || ts - dodgeLastSpawn > spawnGap) {
    dodgeBlocks.push({
      x: Math.random() * 90,
      y: -10,
      speed: 0.45 + elapsed * 0.018 + Math.random() * 0.7,
      kind: Math.random() > 0.78 ? "boost" : "hazard"
    });
    dodgeLastSpawn = ts;
  }
  dodgeBlocks.forEach((b) => { b.y += b.speed * 2; });
  dodgeBlocks = dodgeBlocks.filter((b) => b.y < 110);
  dodgeBlocks = dodgeBlocks.filter((b) => {
    const touching = Math.abs(b.x - dodgePlayerX) < 10 && Math.abs(b.y - 92) < 8;
    if (!touching) return true;
    if (b.kind === "boost") {
      combo += 1;
      addPoints(5);
      seconds = Math.min(45, seconds + 1);
      beep(520, 0.08);
      setStatus(`Boost collected from ${MOTIF_A}.`);
    } else {
      seconds = Math.max(0, seconds - 3);
      breakCombo(`${MOTIF_B} clipped you. Recover the streak.`);
      beep(160, 0.2);
    }
    return false;
  });
  if (active) {
    score += 0.18;
  }
  playfield.innerHTML = `<div class="runner" style="left:${dodgePlayerX}%"></div>` +
    dodgeBlocks.map((b) => `<div class="block ${b.kind}" style="left:${b.x}%;top:${b.y}%"></div>`).join("");
  updateHud();
  animationId = requestAnimationFrame(dodgeLoop);
}

function setupDodge() {
  playfield.innerHTML = "";
  dodgeBlocks = [];
  dodgePlayerX = 50;
  dodgeLastSpawn = 0;
  if (dodgeBound) return;
  dodgeBound = true;
  playfield.addEventListener("pointermove", (event) => {
    if (!active) return;
    const rect = playfield.getBoundingClientRect();
    dodgePlayerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  });
  playfield.addEventListener("pointerdown", (event) => {
    if (!active) return;
    const rect = playfield.getBoundingClientRect();
    dodgePlayerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
  });
}

function flashPad(index) {
  const pad = sequencePads[index];
  if (!pad) return;
  pad.classList.add("lit");
  beep(260 + index * 120, 0.1);
  setTimeout(() => pad.classList.remove("lit"), 180);
}

async function playSequence() {
  for (const step of sequence) {
    flashPad(step);
    await new Promise((resolve) => setTimeout(resolve, 380));
  }
  inputIndex = 0;
}

function setupSequence() {
  sequence = [];
  inputIndex = 0;
  if (sequenceBound) return;
  sequenceBound = true;
  sequencePads.forEach((pad) => {
    pad.addEventListener("pointerdown", () => {
      if (!active || sequence.length === 0) return;
      const pressed = Number(pad.dataset.pad);
      flashPad(pressed);
      if (sequence[inputIndex] === pressed) {
        inputIndex += 1;
        if (inputIndex >= sequence.length) {
          combo += 1;
          addPoints(sequence.length * 2);
          sequence.push(Math.floor(Math.random() * 4));
          setStatus(`Sequence clear. Follow the next ${MOTIF_A} pulse.`);
          setTimeout(playSequence, 350);
        }
      } else {
        seconds = Math.max(0, seconds - 4);
        breakCombo(`Wrong ${MOTIF_A} pulse. Watch the order.`);
      }
    });
  });
}

async function startRound() {
  if (audioCtx && audioCtx.state === "suspended") {
    try { await audioCtx.resume(); } catch {}
  }
  resetRound();
  active = true;
  startedAt = Date.now();
  setStatus("Go!");
  beginTimer();

  if (MODE === "tap_targets") {
    sequencePads.forEach((p) => p.classList.add("hidden"));
    spawnTapTargetLoop();
  } else if (MODE === "dodge_stream") {
    sequencePads.forEach((p) => p.classList.add("hidden"));
    setupDodge();
    setStatus(`Dodge ${MOTIF_B} and catch ${MOTIF_A}.`);
    animationId = requestAnimationFrame(dodgeLoop);
  } else {
    sequencePads.forEach((p) => p.classList.remove("hidden"));
    playfield.innerHTML = "";
    setupSequence();
    sequence = [Math.floor(Math.random() * 4), Math.floor(Math.random() * 4)];
    await playSequence();
  }
}

startBtn.addEventListener("click", () => {
  if (active) return;
  startRound();
});

restartBtn.addEventListener("click", () => {
  if (active) return;
  startRound();
});

window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "setAudioMuted") {
    muted = !!data.muted;
  }
});

document.querySelector("h1").textContent = GAME_TITLE;
themeEl.textContent = THEME_LABEL + " / " + OBJECTIVE_TAG;
document.documentElement.style.setProperty("--accent", ACCENT);
playfield.classList.add("mode-" + MODE);
renderBoard();
setStatus("Press Start");
updateHud();