// src/game/gameState.js

const STORAGE_KEY = "wheel-game-state";

const defaultTeams = [
  { name: "Team 1", total: 0, round: 0 },
  { name: "Team 2", total: 0, round: 0 },
  { name: "Team 3", total: 0, round: 0 },
];

const defaultState = {
  puzzle: null,
  revealed: [],        // letters revealed by manual mode
  revealedIndices: [], // tile indices revealed by auto mode
  teams: defaultTeams,
};

export const getState = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState;
  const parsed = JSON.parse(saved);
  if (!parsed.revealedIndices) parsed.revealedIndices = [];
  if (!parsed.teams) parsed.teams = defaultTeams;
  return parsed;
};

export const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// On new puzzle: fold each team's round score into total, reset round
export const setPuzzle = (puzzle) => {
  const state = getState();
  const teams = state.teams.map(t => ({
    ...t,
    total: t.total + t.round,
    round: 0,
  }));
  saveState({ ...state, puzzle, revealed: [], revealedIndices: [], teams });
};

export const revealLetter = (letter) => {
  const state = getState();
  if (!state.revealed.includes(letter)) {
    state.revealed.push(letter);
  }
  saveState(state);
};

export const revealIndex = (index) => {
  const state = getState();
  if (!state.revealedIndices.includes(index)) {
    state.revealedIndices.push(index);
  }
  saveState(state);
};

export const revealAll = () => {
  const state = getState();
  const phrase = state.puzzle?.phrase || "";
  state.revealed = phrase.split("").filter((c) => c !== " ");
  saveState(state);
};

// Add (or subtract) points from a team's round score
export const addPoints = (teamIndex, amount) => {
  const state = getState();
  state.teams[teamIndex].round += amount;
  saveState(state);
};

// Bankrupt: reset round score to 0
export const bankruptTeam = (teamIndex) => {
  const state = getState();
  state.teams[teamIndex].round = 0;
  saveState(state);
};

export const resetGame = () => {
  saveState({
    puzzle: null,
    revealed: [],
    revealedIndices: [],
    teams: [
      { name: "Team 1", total: 0, round: 0 },
      { name: "Team 2", total: 0, round: 0 },
      { name: "Team 3", total: 0, round: 0 },
    ]
  });
};

// Auto reveal: shuffles every individual non-space tile index and reveals
// them one at a time at intervals that shrink by 1.5x (speeds up).
// Starting interval: 3000ms. Pattern: 3s, 2s, 1.33s, 0.89s ...
export const startAutoReveal = () => {
  const state = getState();
  const phrase = state.puzzle?.phrase || "";

  const indices = phrase
    .split("")
    .map((c, i) => ({ char: c, index: i }))
    .filter(({ char }) => char !== " ")
    .map(({ index }) => index)
    .sort(() => Math.random() - 0.5);

  let delay = 0;
  let interval = 3000;

  indices.forEach((tileIndex) => {
    delay += interval;
    interval /= 1.2;
    setTimeout(() => {
      revealIndex(tileIndex);
    }, delay);
  });
};
