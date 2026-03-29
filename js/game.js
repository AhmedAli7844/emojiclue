// BIGZY Games — EmojiClue
// Core game logic

const MAX_ATTEMPTS = 6;

let puzzle = null;
let todayKey = "";
let state = {
  guesses: [],
  result: null,
  hintsRevealed: 0,
};

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  puzzle = getPuzzleOfDay();
  todayKey = getTodayKey();

  const saved = loadState(todayKey);
  if (saved) {
    state = saved;
  }

  renderAll();
  setupInput();

  // If game is already over, show the modal after a short delay
  if (state.result) {
    setTimeout(() => showModal(state.result === "win"), 600);
  }
});

// ─── Rendering ───────────────────────────────────────────────────────────────

function renderAll() {
  renderEmojis();
  renderAttempts();
  renderGuesses();
  renderHints();
  updateInputState();
}

function renderEmojis() {
  document.getElementById("emoji-display").textContent = puzzle.emojis;
  const tag = document.getElementById("category-tag");
  if (tag) tag.textContent = puzzle.category;

  const card = document.querySelector(".emoji-card");
  const existing = card.querySelector(".puzzle-image");
  if (existing) existing.remove();

  if (puzzle.image) {
    const img = document.createElement("img");
    img.src = puzzle.image;
    img.alt = "Movie still";
    img.className = "puzzle-image";
    img.onerror = () => img.remove();
    card.appendChild(img);
  }
}

function renderAttempts() {
  const remaining = MAX_ATTEMPTS - state.guesses.length;
  const el = document.getElementById("attempts-left");
  el.textContent = remaining;
  el.dataset.remaining = remaining;
}

function renderGuesses() {
  const list = document.getElementById("guesses-list");
  list.innerHTML = "";

  state.guesses.forEach((guess, i) => {
    const isCorrect =
      state.result === "win" && i === state.guesses.length - 1;
    const li = document.createElement("li");
    li.className = "guess-item " + (isCorrect ? "correct" : "wrong");
    li.textContent = guess;
    list.appendChild(li);
  });

  // Empty slots
  const remaining = MAX_ATTEMPTS - state.guesses.length;
  for (let i = 0; i < remaining; i++) {
    const li = document.createElement("li");
    li.className = "guess-item empty";
    list.appendChild(li);
  }
}

function renderHints() {
  const container = document.getElementById("hints-container");
  container.innerHTML = "";

  for (let i = 0; i <= state.hintsRevealed && i < puzzle.hints.length; i++) {
    const div = document.createElement("div");
    div.className = "hint" + (i === state.hintsRevealed ? " hint-new" : "");
    div.innerHTML = `<span class="hint-num">Hint ${i + 1}</span> ${escapeHtml(puzzle.hints[i])}`;
    container.appendChild(div);
  }
}

function updateInputState() {
  const input = document.getElementById("guess-input");
  const btn = document.getElementById("submit-btn");
  const disabled = !!state.result;
  input.disabled = disabled;
  btn.disabled = disabled;
  if (!disabled) input.focus();
}

// ─── Input & Submit ──────────────────────────────────────────────────────────

function setupInput() {
  const input = document.getElementById("guess-input");
  const btn = document.getElementById("submit-btn");

  btn.addEventListener("click", handleSubmit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSubmit();
  });
}

function handleSubmit() {
  const input = document.getElementById("guess-input");
  const guess = input.value.trim();
  if (!guess || state.result) return;

  input.value = "";
  submitGuess(guess);
}

function submitGuess(guess) {
  const correct = normalizeStr(guess) === normalizeStr(puzzle.answer);
  state.guesses.push(guess);

  if (correct) {
    state.result = "win";
    state.hintsRevealed = Math.min(
      state.hintsRevealed,
      puzzle.hints.length - 1
    );
    saveState(todayKey, state);
    recordResult(true, todayKey);
    renderAll();
    animateEmojis("bounce");
    setTimeout(() => showModal(true), 900);
  } else {
    // Reveal next hint (but not beyond what's available)
    if (state.hintsRevealed < puzzle.hints.length - 1) {
      state.hintsRevealed += 1;
    }

    const attemptsUsed = state.guesses.length;
    if (attemptsUsed >= MAX_ATTEMPTS) {
      state.result = "loss";
      saveState(todayKey, state);
      recordResult(false, todayKey);
      renderAll();
      animateEmojis("shake");
      setTimeout(() => showModal(false), 900);
    } else {
      saveState(todayKey, state);
      renderAll();
      animateGuessItem(attemptsUsed - 1, "shake");
    }
  }
}

// ─── Modal ───────────────────────────────────────────────────────────────────

function showModal(won) {
  const modal = document.getElementById("result-modal");
  const title = document.getElementById("modal-title");
  const answer = document.getElementById("modal-answer");
  const statsEl = document.getElementById("modal-stats");

  title.textContent = won ? "You got it! 🎉" : "Better luck tomorrow!";
  title.className = won ? "modal-title win" : "modal-title loss";

  answer.innerHTML = won
    ? ""
    : `The answer was: <strong>${escapeHtml(puzzle.answer)}</strong>`;

  const stats = loadStats();
  const winPct =
    stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;

  statsEl.innerHTML = `
    <div class="stat"><span class="stat-val">${stats.played}</span><span class="stat-label">Played</span></div>
    <div class="stat"><span class="stat-val">${winPct}%</span><span class="stat-label">Win Rate</span></div>
    <div class="stat"><span class="stat-val">${stats.streak}</span><span class="stat-label">Streak</span></div>
    <div class="stat"><span class="stat-val">${stats.maxStreak}</span><span class="stat-label">Best Streak</span></div>
  `;

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("result-modal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

// ─── Share ───────────────────────────────────────────────────────────────────

function shareResult() {
  const text = buildShareText();
  if (navigator.share) {
    navigator.share({ text }).catch(() => copyToClipboard(text));
  } else {
    copyToClipboard(text);
  }
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Result copied — share with friends!"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function buildShareText() {
  const puzzleIndex = getTodayPuzzleIndex();
  const attemptsUsed = state.guesses.length;
  const won = state.result === "win";

  const squares = state.guesses.map((g) =>
    normalizeStr(g) === normalizeStr(puzzle.answer) ? "🟩" : "🟥"
  ).join("");

  const score = won ? `${attemptsUsed}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;

  return `EmojiClue #${puzzleIndex + 1} ${score}\n${puzzle.emojis}\n${squares}\nhttps://emojiclue.vercel.app`;
}

function fallbackCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
  showToast("Link copied — share with friends!");
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 2500);
}

// ─── Animations ──────────────────────────────────────────────────────────────

function animateEmojis(type) {
  const el = document.getElementById("emoji-display");
  el.classList.remove("bounce", "shake");
  void el.offsetWidth; // reflow to restart animation
  el.classList.add(type);
}

function animateGuessItem(index, type) {
  const items = document.querySelectorAll(".guess-item");
  if (items[index]) {
    items[index].classList.remove("shake");
    void items[index].offsetWidth;
    items[index].classList.add(type);
  }
}

// ─── Admin Mode ──────────────────────────────────────────────────────────────

let adminIndex = null; // null = normal user mode

function getTodayPuzzleIndex() {
  return Math.floor((new Date() - new Date(2024, 0, 1)) / 864e5) % PUZZLES.length;
}

function onAdminStatusChange(isAdminUser) {
  if (isAdminUser) {
    showAdminNav();
  } else {
    hideAdminNav();
    if (adminIndex !== null) {
      adminIndex = null;
      puzzle = getPuzzleOfDay();
      todayKey = getTodayKey();
      const saved = loadState(todayKey);
      state = saved || { guesses: [], result: null, hintsRevealed: 0 };
      renderAll();
    }
  }
}

function showAdminNav() {
  if (document.getElementById("admin-nav")) return;
  const nav = document.createElement("div");
  nav.id = "admin-nav";
  nav.className = "admin-nav";
  nav.innerHTML = `
    <button class="admin-nav-btn" onclick="adminPrev()">← Prev</button>
    <span id="admin-nav-label" class="admin-nav-label"></span>
    <button class="admin-nav-btn" onclick="adminNext()">Next →</button>
  `;
  document.querySelector("main").prepend(nav);
  updateAdminNavLabel();
}

function hideAdminNav() {
  const nav = document.getElementById("admin-nav");
  if (nav) nav.remove();
}

function updateAdminNavLabel() {
  const label = document.getElementById("admin-nav-label");
  if (!label) return;
  const idx = adminIndex !== null ? adminIndex : getTodayPuzzleIndex();
  label.textContent = `Puzzle ${idx + 1} of ${PUZZLES.length}`;
}

function adminPrev() {
  if (adminIndex === null) adminIndex = getTodayPuzzleIndex();
  adminIndex = (adminIndex - 1 + PUZZLES.length) % PUZZLES.length;
  loadAdminPuzzle(adminIndex);
}

function adminNext() {
  if (adminIndex === null) adminIndex = getTodayPuzzleIndex();
  adminIndex = (adminIndex + 1) % PUZZLES.length;
  loadAdminPuzzle(adminIndex);
}

function loadAdminPuzzle(index) {
  puzzle = PUZZLES[index];
  todayKey = "admin_" + index;
  const saved = loadState(todayKey);
  state = saved || { guesses: [], result: null, hintsRevealed: 0 };
  updateAdminNavLabel();
  renderAll();
  if (state.result) setTimeout(() => showModal(state.result === "win"), 600);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeStr(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
