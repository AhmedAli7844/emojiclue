// BIGZY Games — Daily Emoji Puzzle
// LocalStorage helpers for persisting game state and player stats

const STORAGE_KEYS = {
  STATE_PREFIX: "bigzy_state_", // + YYYY-MM-DD
  STATS: "bigzy_stats",
};

/**
 * Load today's game state.
 * Returns null if no state exists for today.
 *
 * State shape:
 * {
 *   guesses: string[],     // submitted guesses (up to 6)
 *   result: null | "win" | "loss",
 *   hintsRevealed: number, // how many hints are visible
 * }
 */
function loadState(todayKey) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATE_PREFIX + todayKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Save today's game state to localStorage.
 */
function saveState(todayKey, state) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.STATE_PREFIX + todayKey,
      JSON.stringify(state)
    );
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Load persistent player stats.
 *
 * Stats shape:
 * {
 *   played: number,
 *   wins: number,
 *   streak: number,
 *   maxStreak: number,
 *   lastWinDate: string | null,  // "YYYY-MM-DD"
 * }
 */
function loadStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    return raw
      ? JSON.parse(raw)
      : { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWinDate: null };
  } catch {
    return { played: 0, wins: 0, streak: 0, maxStreak: 0, lastWinDate: null };
  }
}

/**
 * Save player stats to localStorage.
 */
function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {
    // Storage quota exceeded — fail silently
  }
}

/**
 * Record the outcome of a completed game (called once per day).
 * Updates streak logic and saves stats.
 */
function recordResult(won, todayKey) {
  const stats = loadStats();
  stats.played += 1;

  if (won) {
    stats.wins += 1;

    // Streak: check if last win was yesterday
    const yesterday = getYesterdayKey();
    if (stats.lastWinDate === yesterday || stats.lastWinDate === todayKey) {
      stats.streak += stats.lastWinDate === todayKey ? 0 : 1;
    } else {
      stats.streak = 1; // streak broken, restart
    }

    stats.maxStreak = Math.max(stats.maxStreak, stats.streak);
    stats.lastWinDate = todayKey;
  } else {
    // Loss breaks the streak
    if (stats.lastWinDate !== todayKey) {
      stats.streak = 0;
    }
  }

  saveStats(stats);
  return stats;
}

/** Returns "YYYY-MM-DD" for yesterday */
function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
