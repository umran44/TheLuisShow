const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
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
          broadcastToDisplay({
            type: 'questionLoaded',
            question: message.question,
            answers: message.answers.map(a => ({
              text: a.text,
              frequency: null, // Hidden from display
            })),
          });
          break;

        case 'revealAnswer':
          const answerIndex = message.answerIndex;
          gameState.revealedAnswers.push(answerIndex);
          const answer = gameState.answers[answerIndex];

          if (answer) {
            broadcastToDisplay({
              type: 'answerRevealed',
              answerIndex,
              text: answer.text,
              frequency: answer.frequency,
              correct: true,
            });
          } else {
            gameState.strikes++;
            broadcastToDisplay({
              type: 'answerWrong',
              strikes: gameState.strikes,
              maxStrikes: gameState.maxStrikes,
            });
          }

          // Check if all answers revealed
          if (gameState.revealedAnswers.length === gameState.answers.length) {
            broadcastToDisplay({ type: 'roundWon' });
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
          broadcastToDisplay({ type: 'roundReset' });
          break;

        case 'nextRound':
          gameState.currentRound++;
          gameState.currentQuestion = null;
          gameState.answers = [];
          gameState.revealedAnswers = [];
          gameState.strikes = 0;
          broadcastToDisplay({ type: 'nextRound' });
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
