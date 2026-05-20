// src/pages/Host.jsx
import { useState } from "react";
import { getState, setPuzzle, revealLetter, revealAll, startAutoReveal, addPoints, bankruptTeam, resetGame } from "../game/gameState";

const puzzles = [
  { category: "Movie", phrase: "THE DARK KNIGHT" },
  { category: "Food", phrase: "SPAGHETTI AND MEATBALLS" },
  { category: "Book", phrase: "CRIME AND PUNISHMENT" },
  { category: "Location", phrase: "SANTA MONICA BEACH" },
  { category: "Book", phrase: "THE SEVEN HUSBANDS OF EVELYN HUGO" }, 
  { category: "Video Game", phrase: "FIVE NIGHTS AT FREDDY'S"},
  { category: "Book", phrase: "THE ODYSSEY"},
  { category: "Book", phrase: "PRIDE AND PREJUDICE"},
  { category: "Book", phrase: "THE GREAT GATSBY"},
  { category: "Book", phrase: "TO KILL A MOCKINGBIRD"},
  { category: "Book", phrase: "WUTHERING HEIGHTS"},
  { category: "Movie", phrase: "GENTLEMAN PREFER BLONDES"},
  { category: "TV Show", phrase: "STRANGER THINGS"},
  { category: "Movie", phrase: "THE BREAKFAST CLUB"},
  { category: "Movie", phrase: "WILLY WONKA AND THE CHOCOLATE FACTORY"},
  { category: "Location", phrase: "BECKMAN LAWN"},
  { category: "TV Show", phrase: "GAME OF THRONES"},
  { category: "Video Game", phrase: "GTA"},
  { category: "Video Game", phrase: "DRESS TO IMPRESS"},
  { category: "Video Game", phrase: "LEAGUE OF LEGENDS"},
  { category: "Video Game", phrase: "MINECRAFT"},
  { category: "Video Game", phrase: "BOOMERANG FU"},
  { category: "Location", phrase: "THE NORTON SIMON MUSEUM"},
  { category: "Location", phrase: "LAKE AVENUE"}, 
  { category: "Landmark", phrase: "ALASKA TRADE BUILDING"}, 
  { category: "Landmark", phrase: "ANCIENT AGORA OF ATHENS"},
  { category: "Location", phrase: "ITHACA"}, 
  { category: "Location", phrase: "HAWKINS LABORATORY"},
  { category: "Location", phrase: "FREDDYS PIZZERIA"},
  { category: "Location", phrase: "THE SEA OF MONSTERS"},
  { category: "Location", phrase: "SURFER BOY PIZZA SHOP"},
];

const btn = (extra = {}) => ({
  padding: "8px 14px",
  fontSize: 14,
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: "bold",
  ...extra,
});

function playBuzzer() {
  const audio = new Audio("/buzzer.mp3");
  audio.play();
}

export default function Host() {
  const [state, setState] = useState(getState());
  const [mode, setMode] = useState("idle");
  const [pendingPuzzle, setPendingPuzzle] = useState(null);
  // One manual-points input value per team
  const [pointInputs, setPointInputs] = useState(["", "", ""]);

  const refresh = () => setState(getState());

  const handleNewPuzzle = () => {
    const p = puzzles[Math.floor(Math.random() * puzzles.length)];
    setPendingPuzzle(p);
    setMode("picking");
  };

  const handleManual = () => {
    setPuzzle(pendingPuzzle);
    refresh();
    setMode("manual");
  };

  const handleAuto = () => {
    setPuzzle(pendingPuzzle);
    refresh();
    startAutoReveal();
    setMode("auto");
  };

  const reveal = (l) => { revealLetter(l); refresh(); };
  const handleRevealAll = () => { revealAll(); refresh(); };

  const handleAddPoints = (i, amount) => {
    addPoints(i, amount);
    refresh();
  };

  const handleBankrupt = (i) => {
    bankruptTeam(i);
    refresh();
  };

  const handleManualPoints = (i) => {
    try {
      // Only allow numbers, operators, spaces, and parentheses — no arbitrary code
      const expr = pointInputs[i].trim();
      if (!/^[0-9+\-*/().\s]+$/.test(expr)) return;
      const val = Function(`"use strict"; return (${expr})`)();
      if (typeof val !== "number" || !isFinite(val)) return;
      addPoints(i, Math.round(val));
      setPointInputs(prev => { const n = [...prev]; n[i] = ""; return n; });
      refresh();
    } catch {
      // Invalid expression — do nothing
    }
  };
    const handleReset = () => {
  if (!window.confirm("Reset everything? This clears all scores and the current puzzle.")) return;
  resetGame();
  setMode("idle");
  setPendingPuzzle(null);
  setPointInputs(["", "", ""]);
  refresh();
};


  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 16 }}>HOST PANEL</h1>
      <button onClick={handleReset} style={btn({ background: "#6b7280", color: "white" })}>
  ↺ Reset Game
    </button>

      {/* ── Buzzer ── */}
      <button onClick={playBuzzer} style={btn({ background: "#111", color: "#ef4444", fontSize: 22, padding: "12px 28px", border: "2px solid #ef4444", marginBottom: 20, letterSpacing: 2 })}>
        🔴 WRONG
      </button>

      {/* ── New Puzzle ── */}
      <button onClick={handleNewPuzzle} style={btn({ background: "#3b82f6", color: "white", fontSize: 16, padding: "10px 22px" })}>
        New Puzzle
      </button>

      {mode === "picking" && pendingPuzzle && (
        <div style={{ marginTop: 16, padding: 18, background: "#1f2937", borderRadius: 12, color: "white", display: "inline-block" }}>
          <p style={{ margin: "0 0 6px", fontWeight: "bold" }}>Next: <em>{pendingPuzzle.category}</em></p>
          <p style={{ margin: "0 0 14px", color: "#9ca3af", fontSize: 13 }}>How should letters be revealed?</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleManual} style={btn({ background: "#374151", color: "white", border: "2px solid #6b7280" })}>✋ Manual</button>
            <button onClick={handleAuto} style={btn({ background: "#7c3aed", color: "white" })}>⚡ Auto Reveal</button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <>
          <h2 style={{ marginTop: 24 }}>Reveal Letters</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => (
              <button key={l} onClick={() => reveal(l)} style={btn({
                background: state.revealed.includes(l) ? "#22c55e" : "#e5e7eb",
                color: state.revealed.includes(l) ? "white" : "#111"
              })}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={handleRevealAll} style={btn({ marginTop: 14, background: "red", color: "white", fontSize: 15 })}>
            Reveal Full Phrase
          </button>
        </>
      )}

      {mode === "auto" && (
        <div style={{ marginTop: 16, padding: 14, background: "#1f2937", borderRadius: 10, color: "#a78bfa", fontWeight: "bold" }}>
          ⚡ Auto reveal running…
        </div>
      )}

      {/* ── Team Controls ── */}
      <h2 style={{ marginTop: 32, marginBottom: 12 }}>Teams</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {state.teams.map((team, i) => (
          <div key={i} style={{
            flex: "1 1 240px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
          }}>
            <h3 style={{ margin: "0 0 4px" }}>{team.name}</h3>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
              Round: <strong style={{ color: "#111" }}>{team.round}</strong>
              &nbsp;·&nbsp;
              Total: <strong style={{ color: "#111" }}>{team.total}</strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Buy Vowel */}
              <button
                onClick={() => handleAddPoints(i, -250)}
                style={btn({ background: "#f59e0b", color: "white", width: "100%" })}
              >
                Buy Vowel (−250)
              </button>

              {/* Bankrupt */}
              <button
                onClick={() => handleBankrupt(i)}
                style={btn({ background: "#ef4444", color: "white", width: "100%" })}
              >
                💀 Bankrupt
              </button>

              {/* Manual points */}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  placeholder="e.g. 2*500 or 300+250"
                  value={pointInputs[i]}
                  onChange={e => setPointInputs(prev => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  onKeyDown={e => e.key === "Enter" && handleManualPoints(i)}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    fontSize: 14,
                    borderRadius: 7,
                    border: "1px solid #d1d5db",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => handleManualPoints(i)}
                  style={btn({ background: "#22c55e", color: "white" })}
                >
                  Add
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                Tip: enter a negative number to subtract
              </p>
            </div>
          </div>
        ))}
      </div>

      <hr style={{ margin: "28px 0" }} />
      <pre style={{ fontSize: 11, color: "#6b7280" }}>{JSON.stringify(state, null, 2)}</pre>
    </div>
    
  );
}