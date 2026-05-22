const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.json());

// Game state
let gameState = {
  currentQuestion: null,
  answers: [],
  revealedAnswers: [],
  team1: { name: 'Team 1', points: 0 },
  team2: { name: 'Team 2', points: 0 },
  strikes: 0,
  maxStrikes: 3,
  currentRound: 1,
  answeringTeam: 1,
  roundPoints: 0,
  stealInProgress: false,
  roundOver: false,
};

// Track connected clients
const clients = {
  display: null,
  host: null,
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'register':
          clients[message.client] = ws;
          console.log(`${message.client} connected`);
          // Send current state to newly connected client
          ws.send(JSON.stringify({
            type: 'gameState',
            data: gameState,
          }));
          break;

        case 'loadQuestion':
          gameState.currentQuestion = message.question;
          gameState.answers = message.answers;
          gameState.revealedAnswers = [];
          gameState.strikes = 0;
          gameState.answeringTeam = Number(message.answeringTeam) || 1;
          gameState.stealInProgress = false;
          gameState.roundOver = false;
          gameState.roundPoints = gameState.answers.reduce((sum, ans) => sum + ans.frequency, 0);
          broadcastToDisplay({
            type: 'questionLoaded',
            question: message.question,
            answers: message.answers.map(a => ({
              text: a.text,
              frequency: null, // Hidden from display
            })),
            answeringTeam: gameState.answeringTeam,
          });
          break;
        case 'resetStrikes':
          gameState.strikes = 0;
          gameState.stealInProgress = false;
          broadcastToDisplay({
            type: 'roundReset'
          });
          break;
        case 'addStrike':
          if (gameState.stealInProgress) {
            // Steal attempt failed, original answering team keeps only revealed board points
            const winningTeam = Number(gameState.answeringTeam) || 1;
            const revealedPoints = getRevealedPoints();
            if (winningTeam === 1) {
              gameState.team1.points += revealedPoints;
            } else {
              gameState.team2.points += revealedPoints;
            }
            gameState.roundOver = true;
            broadcastToDisplay({
              type: 'roundWon',
              winningTeam,
              points: revealedPoints,
            });
            gameState.stealInProgress = false;
          } else {
            gameState.strikes = Math.min(gameState.strikes + 1, gameState.maxStrikes);
            broadcastToDisplay({
              type: 'answerWrong',
              strikes: gameState.strikes,
              maxStrikes: gameState.maxStrikes
            });

            if (gameState.strikes >= gameState.maxStrikes) {
              gameState.stealInProgress = true;
              broadcastToDisplay({
                type: 'stealPhaseStarted',
                stealingTeam: gameState.answeringTeam === 1 ? 2 : 1,
              });
            }
          }
          break;
        case 'revealAnswer':
          const answerIndex = message.answerIndex;
          if (gameState.revealedAnswers.includes(answerIndex)) {
            break;
          }
          gameState.revealedAnswers.push(answerIndex);
          const answer = gameState.answers[answerIndex];
          
          if (answer) {
            // Correct answer
            broadcastToDisplay({
              type: 'answerRevealed',
              answerIndex,
              text: answer.text,
              frequency: answer.frequency,
              correct: true,
            });

            if (gameState.roundOver) {
              break;
            }

            // If steal is in progress, the stealing team wins with only revealed board points
            if (gameState.stealInProgress) {
              const stealingTeam = gameState.answeringTeam === 1 ? 2 : 1;
              const revealedPoints = getRevealedPoints();
              if (stealingTeam === 1) {
                gameState.team1.points += revealedPoints;
              } else {
                gameState.team2.points += revealedPoints;
              }
              gameState.roundOver = true;
              broadcastToDisplay({
                type: 'roundWon',
                winningTeam: stealingTeam,
                points: revealedPoints,
              });
              gameState.stealInProgress = false;
            } else {
              // Check if all answers revealed
              if (gameState.revealedAnswers.length === gameState.answers.length) {
                // All answers revealed - answering team wins
                const winningTeam = Number(gameState.answeringTeam) || 1;
                const revealedPoints = getRevealedPoints();
                if (winningTeam === 1) {
                  gameState.team1.points += revealedPoints;
                } else {
                  gameState.team2.points += revealedPoints;
                }
                gameState.roundOver = true;
                broadcastToDisplay({
                  type: 'roundWon',
                  winningTeam,
                  points: revealedPoints,
                });
              }
            }
          } else {
            if (gameState.roundOver) {
              break;
            }

            // Wrong answer
            if (gameState.stealInProgress) {
              // Steal attempt failed - original answering team wins with only revealed points
              const winningTeam = Number(gameState.answeringTeam) || 1;
              const revealedPoints = getRevealedPoints();
              if (winningTeam === 1) {
                gameState.team1.points += revealedPoints;
              } else {
                gameState.team2.points += revealedPoints;
              }
              gameState.roundOver = true;
              broadcastToDisplay({
                type: 'roundWon',
                winningTeam,
                points: revealedPoints,
              });
              gameState.stealInProgress = false;
            } else {
              // Regular play - add strike
              gameState.strikes++;
              broadcastToDisplay({
                type: 'answerWrong',
                strikes: gameState.strikes,
                maxStrikes: gameState.maxStrikes,
              });

              // Check if 3 strikes reached - enter steal phase
              if (gameState.strikes >= 3) {
                gameState.stealInProgress = true;
                broadcastToDisplay({
                  type: 'stealPhaseStarted',
                  stealingTeam: gameState.answeringTeam === 1 ? 2 : 1,
                });
              }
            }
          }
          break;

        case 'updateTeam':
          if (message.team === 1) {
            gameState.team1.name = message.name;
            gameState.team1.points = message.points;
          } else {
            gameState.team2.name = message.name;
            gameState.team2.points = message.points;
          }
          broadcastToDisplay({
            type: 'teamsUpdated',
            team1: gameState.team1,
            team2: gameState.team2,
          });
          break;

        case 'resetRound':
          gameState.revealedAnswers = [];
          gameState.strikes = 0;
          gameState.stealInProgress = false;
          gameState.roundOver = false;
          broadcastToDisplay({ type: 'roundReset' });
          break;

        case 'nextRound':
          gameState.currentRound++;
          gameState.currentQuestion = null;
          gameState.answers = [];
          gameState.revealedAnswers = [];
          gameState.strikes = 0;
          gameState.roundPoints = 0;
          gameState.stealInProgress = false;
          gameState.roundOver = false;
          broadcastToDisplay({ type: 'nextRound' });
          break;

        case 'gameStarted':
          broadcastToDisplay({ type: 'gameStarted' });
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    if (clients.display === ws) clients.display = null;
    if (clients.host === ws) clients.host = null;
    console.log('Client disconnected');
  });
});

function broadcastToDisplay(message) {
  if (clients.display && clients.display.readyState === WebSocket.OPEN) {
    clients.display.send(JSON.stringify(message));
  }
}

function getRevealedPoints() {
  return gameState.revealedAnswers.reduce((sum, answerIndex) => {
    const answer = gameState.answers[answerIndex];
    return sum + (answer ? answer.frequency : 0);
  }, 0);
}

// API endpoints
app.get('/api/questions', (req, res) => {
  // Load questions from questions.json
  const questions = require('./data/questions.json');
  res.json(questions);
});

app.get('/api/gameState', (req, res) => {
  res.json(gameState);
});

// Routes for HTML pages
app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Display page: http://localhost:${PORT}/display`);
  console.log(`Host page: http://localhost:${PORT}/host`);
});
