# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**BIGZY Games — Daily Emoji Puzzle**
A browser game where players decode an emoji sequence to guess a movie, TV show, song, or phrase. One puzzle per day, resets at midnight. Built with vanilla HTML/CSS/JavaScript — no build step required.

## How to Run

Open directly in a browser:
```
open index.html
```

For live-reload during development:
```
npx live-server .
```

## Architecture

**Script load order** (declared in `index.html`) is critical:
1. `js/puzzles.js` — must load first (exports `PUZZLES`, `getPuzzleOfDay()`, `getTodayKey()`)
2. `js/storage.js` — must load second (uses nothing from puzzles.js but must be available before game.js)
3. `js/game.js` — loads last, depends on both above

All three files use plain globals (no `import`/`export`) so the browser can load them as classic scripts.

**Game flow:**
- `getPuzzleOfDay()` seeds today's puzzle by computing `daysSince(2024-01-01) % PUZZLES.length`
- `getTodayKey()` returns `"YYYY-MM-DD"` used as the localStorage key
- `loadState(todayKey)` / `saveState(todayKey, state)` persist guesses and result for the day
- `recordResult(won, todayKey)` updates the persistent stats object (streak, maxStreak, played, wins)
- On each wrong guess, `state.hintsRevealed` increments to unlock the next hint from `puzzle.hints[]`

**State shape** (stored per day in localStorage under `bigzy_state_YYYY-MM-DD`):
```js
{ guesses: string[], result: null | "win" | "loss", hintsRevealed: number }
```

**Stats shape** (stored under `bigzy_stats`):
```js
{ played, wins, streak, maxStreak, lastWinDate }
```

## Adding Puzzles

Add entries to the `PUZZLES` array in `js/puzzles.js`. Each entry:
```js
{
  emojis: "🦁 👑",          // displayed large — keep to 2–4 emojis
  answer: "The Lion King",  // exact answer (comparison is case/punctuation-insensitive)
  category: "Movie",        // "Movie" | "TV Show" | "Song" | "Phrase"
  hints: [                  // exactly 5 hints, revealed one per wrong guess
    "It's a Movie",
    "Animated Disney film",
    "Released in 1994",
    "A young prince reclaims his kingdom",
    "First word: 'The'",
  ],
}
```

Guesses are normalized before comparison (`normalizeStr` in `game.js`): lowercased, trimmed, punctuation stripped.

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Single page — all HTML structure and script tags |
| `css/style.css` | All styles; dark-mode, responsive, animations |
| `js/puzzles.js` | Puzzle database + `getPuzzleOfDay()` / `getTodayKey()` |
| `js/storage.js` | localStorage read/write for state and stats |
| `js/game.js` | DOM rendering, guess handling, modal, share, animations |
