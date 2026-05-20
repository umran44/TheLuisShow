import { useEffect, useState, useRef } from "react";
import { getState } from "../game/gameState";

const STYLES = `
  @keyframes tileFlash {
    0%   { background: #ffffff; box-shadow: 0 0 24px 8px #fffde7; color: #1a1a1a; }
    40%  { background: #facc15; box-shadow: 0 0 16px 4px #fde68a; color: #1a1a1a; }
    100% { background: #22c55e; box-shadow: none; color: white; }
  }
  @keyframes solvedRipple {
    0%   { background: #22c55e; transform: scale(1); }
    30%  { background: #facc15; transform: scale(1.15); box-shadow: 0 0 20px 6px #fde68a; }
    60%  { background: #4ade80; transform: scale(1.05); }
    100% { background: #22c55e; transform: scale(1); box-shadow: none; }
  }
  .tile-flash {
    animation: tileFlash 0.7s ease-out forwards;
  }
  .tile-solved {
    animation: solvedRipple 0.8s ease-in-out forwards;
  }
`;

// Shimmer sound: rapid ascending arpeggio of sine tones
function playShimmer() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [523, 659, 784, 1047, 1319, 1568, 2093]; // C5 up two octaves
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.07;
    const end = start + 0.35;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.18, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.start(start);
    osc.stop(end);
  });
}

function padRow(full, target = 14) {
  const missing = target - full.length;
  if (missing <= 0) return full;
  const left = Math.floor(missing / 2);
  const right = missing - left;
  const emptyTile = () => ({ type: "empty", value: "" });
  return [
    ...Array.from({ length: left }, emptyTile),
    ...full,
    ...Array.from({ length: right }, emptyTile)
  ];
}

export default function Display() {
  const [state, setState] = useState(getState());
  // Only manual mode (letter-based reveals) triggers flash
  const [flashingIndices, setFlashingIndices] = useState(new Set());
  const [isSolved, setIsSolved] = useState(false);

  const prevRevealedLetters = useRef(new Set());
  const prevRevealedIndices = useRef(new Set());
  const solvedSoundPlayed = useRef(false);

  useEffect(() => {
    const update = () => setState(getState());
    window.addEventListener("storage", update);
    const interval = setInterval(update, 100);
    return () => {
      window.removeEventListener("storage", update);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!state.puzzle) return;

    const phrase = state.puzzle.phrase;
    const allCharIndices = phrase
      .split("")
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c !== " ")
      .map(({ i }) => i);

    // Flash only for newly revealed letters (manual mode)
    const newlyFlashing = new Set();
    state.revealed.forEach(letter => {
      if (!prevRevealedLetters.current.has(letter)) {
        phrase.split("").forEach((c, i) => {
          if (c === letter) newlyFlashing.add(i);
        });
      }
    });
    // Auto mode (revealedIndices) intentionally excluded — no flash

    if (newlyFlashing.size > 0) {
      setFlashingIndices(newlyFlashing);
      setTimeout(() => setFlashingIndices(new Set()), 750);
    }

    // Check solved
    const totalRevealed = new Set([
      ...state.revealedIndices,
      ...phrase.split("").flatMap((c, i) =>
        state.revealed.includes(c) ? [i] : []
      )
    ]);
    const solved = allCharIndices.every(i => totalRevealed.has(i));

    if (solved && !solvedSoundPlayed.current) {
      solvedSoundPlayed.current = true;
      playShimmer();
    }
    if (!solved) {
      solvedSoundPlayed.current = false;
    }
    setIsSolved(solved);

    prevRevealedLetters.current = new Set(state.revealed);
    prevRevealedIndices.current = new Set(state.revealedIndices);
  }, [state]);

  if (!state.puzzle || !state.puzzle.phrase) {
    return <h1>Waiting for game...</h1>;
  }

  const tiles = [];
  let phraseIndex = 0;
  state.puzzle.phrase.split(" ").forEach((word, wi, arr) => {
    word.split("").forEach(c => {
      tiles.push({ type: "char", value: c, phraseIndex });
      phraseIndex++;
    });
    if (wi !== arr.length - 1) {
      tiles.push({ type: "space", value: " ", phraseIndex: null });
      phraseIndex++;
    }
  });

  const spaceIndices = [];
  tiles.forEach((tile, i) => {
    if (tile.type === "space") spaceIndices.push(i);
  });

  const rows = [];
  const pushindex = [];
  const less14 = spaceIndices.filter(i => i < 14);
  let firstpush = 0;
  if (less14.length === 0) {
    rows.push(tiles.slice(0, tiles.length));
  } else {
    firstpush = Math.max(...less14);
    pushindex.push({ type: "integer", value: firstpush });

    const less28 = spaceIndices.filter(i => i > firstpush && i < firstpush + 14);
    if (less28.length > 0) {
      const secondpush = Math.max(...less28);
      pushindex.push({ type: "integer", value: secondpush });
      const less42 = spaceIndices.filter(i => i > secondpush && i < secondpush + 14);
      if (less42.length > 0) {
        const thirdpush = Math.max(...less42);
        pushindex.push({ type: "integer", value: thirdpush });
      }
    }

    let prev = 0;
    const filler = Array.from({ length: 13 }, () => ({ type: "empty", value: " ", phraseIndex: null }));
    rows.push(filler);
    pushindex.forEach(index => {
      const full = tiles.slice(prev, index.value);
      rows.push(padRow(full));
      prev = index.value + 1;
    });
    rows.push(padRow(tiles.slice(prev)));
    rows.push(filler);
  }

  const baseTileStyle = {
    width: 60,
    height: 80,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 32,
    fontWeight: "bold",
    borderRadius: 8,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111827", color: "white", display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
      <style>{STYLES}</style>
      <h1>{state.puzzle.category}</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20, alignItems: "center" }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 6 }}>
            {row.map((tile, colIndex) => {
              const isRevealed =
                tile.type === "char"
                  ? state.revealed.includes(tile.value) ||
                    state.revealedIndices.includes(tile.phraseIndex)
                  : false;

              const isFlashing = flashingIndices.has(tile.phraseIndex);
              const rippleDelay = isSolved && tile.type === "char"
                ? `${colIndex * 0.06}s`
                : "0s";

              let bg = tile.type === "char" ? "#22c55e"
                     : tile.type === "space" ? "#1f2937"
                     : "#2a4a66";

              const className = isFlashing
                ? "tile-flash"
                : isSolved && tile.type === "char"
                ? "tile-solved"
                : "";

              return (
                <div
                  key={colIndex}
                  className={className}
                  style={{
                    ...baseTileStyle,
                    background: bg,
                    color: "white",
                    animationDelay: rippleDelay
                  }}
                >
                  {isRevealed ? tile.value : ""}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Wrong guesses (manual mode only) — letters guessed that aren't in the phrase */}
      {(() => {
        const phrase = state.puzzle.phrase;
        const phraseLetters = new Set(phrase.split("").filter(c => c !== " "));
        const wrongGuesses = state.revealed.filter(l => !phraseLetters.has(l)).sort();

        if (wrongGuesses.length === 0) return null;

        return (
          <div style={{ marginTop: 40, textAlign: "center" }}>
            <div style={{ color: "#6b7280", fontSize: 13, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
              Already Guessed
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              {wrongGuesses.map(letter => (
                <div
                  key={letter}
                  style={{
                    width: 44,
                    height: 44,
                    background: "#374151",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: "bold",
                    borderRadius: 6
                  }}
                >
                  {letter}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Team Scores */}
      {state.teams && state.teams.length > 0 && (
        <div style={{ marginTop: 48, width: "100%", maxWidth: 800 }}>
          <div style={{ color: "#6b7280", fontSize: 13, letterSpacing: 2, marginBottom: 14, textAlign: "center", textTransform: "uppercase" }}>
            Scores
          </div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {state.teams.map((team, i) => (
              <div key={i} style={{
                flex: "1 1 180px",
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: 12,
                padding: "16px 20px",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 6 }}>{team.name}</div>
                <div style={{ fontSize: 36, fontWeight: "bold", color: "#facc15", lineHeight: 1 }}>
                  {team.round.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                  Total: {team.total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
