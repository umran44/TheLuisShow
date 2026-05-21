let ws;
let gameState = {
  currentQuestion: null,
  answers: [],
  revealedAnswers: [],
  team1: { name: 'Team 1', points: 0 },
  team2: { name: 'Team 2', points: 0 },
  strikes: 0,
};

// Initialize WebSocket connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('Display connected');
    // Register as display client
    ws.send(JSON.stringify({ type: 'register', client: 'display' }));
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleMessage(message);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Display disconnected');
    setTimeout(initWebSocket, 3000); // Reconnect after 3 seconds
  };
}

function handleMessage(message) {
  switch (message.type) {
    case 'gameStarted':
      showGameContent();
      break;

    case 'gameState':
      gameState = message.data;
      updateDisplay();
      break;

    case 'questionLoaded':
      gameState.currentQuestion = message.question;
      gameState.answers = message.answers;
      gameState.revealedAnswers = [];
      renderQuestion();
      renderAnswers();
      break;

    case 'answerRevealed':
      revealAnswer(message.answerIndex, message.text, message.frequency);
      playDingSound();
      break;

    case 'answerWrong':
      showWrongAnswer();
      playIncorrectSound();
      gameState.strikes = message.strikes;
      updateStrikes();
      break;

    case 'teamsUpdated':
      gameState.team1 = message.team1;
      gameState.team2 = message.team2;
      updateTeamDisplay();
      break;

    case 'roundWon':
      showWinningScreen();
      playWinningMusic();
      break;

    case 'roundReset':
      resetDisplay();
      break;

    case 'nextRound':
      nextRoundDisplay();
      break;
  }
}

function renderQuestion() {
  const questionEl = document.getElementById('question');
  questionEl.textContent = gameState.currentQuestion;
}

function renderAnswers() {
  const grid = document.getElementById('answersGrid');
  grid.innerHTML = '';

  // Determine rows needed
  const rows = gameState.answers.length >= 9 ? 5 : 4;
  const totalCells = rows * 2; // 2 columns

  // Adjust grid rows
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  // Create cells for each position in the grid
  for (let i = 0; i < totalCells; i++) {
    const box = document.createElement('div');
    box.className = 'answer-box';

    if (i < gameState.answers.length) {
      // Answer cell
      box.innerHTML = `<span class="answer-number">${i + 1}</span>`;
    } else {
      // Empty/placeholder cell
      box.classList.add('empty-cell');
      box.innerHTML = '';
    }
    grid.appendChild(box);
  }
}

function revealAnswer(index, text, frequency) {
  const boxes = document.querySelectorAll('.answer-box');
  if (boxes[index]) {
    boxes[index].classList.add('revealed');
    boxes[index].innerHTML = `
      <span class="answer-number">${index + 1}</span>
      <div class="answer-content">
        <span class="answer-text">${text}</span>
        <span class="answer-frequency">${frequency}</span>
      </div>
    `;
  }
  gameState.revealedAnswers.push(index);
}

function showWrongAnswer() {
  const indicator = document.getElementById('wrongIndicator');
  indicator.classList.remove('hidden');
  setTimeout(() => {
    indicator.classList.add('hidden');
  }, 1500);
}

function updateStrikes() {
  const strikes = document.querySelectorAll('.strike-x');
  strikes.forEach((strike, index) => {
    if (index < gameState.strikes) {
      strike.classList.add('active');
    } else {
      strike.classList.remove('active');
    }
  });
}

function updateTeamDisplay() {
  document.getElementById('team1Name').textContent = gameState.team1.name;
  document.getElementById('team1Score').textContent = gameState.team1.points;
  document.getElementById('team2Name').textContent = gameState.team2.name;
  document.getElementById('team2Score').textContent = gameState.team2.points;
}

function showWinningScreen() {
  document.getElementById('winningScreen').classList.remove('hidden');
  setTimeout(() => {
    document.getElementById('winningScreen').classList.add('hidden');
  }, 3000);
}

function updateDisplay() {
  updateTeamDisplay();
  if (gameState.currentQuestion) {
    renderQuestion();
    renderAnswers();
  }
  updateStrikes();
}

function resetDisplay() {
  gameState.revealedAnswers = [];
  gameState.strikes = 0;
  renderAnswers();
  updateStrikes();
}

function nextRoundDisplay() {
  gameState.revealedAnswers = [];
  gameState.strikes = 0;
  document.getElementById('question').textContent = 'Waiting for next question...';
  document.getElementById('answersGrid').innerHTML = '';
  updateStrikes();
}

// Sound effects (using Web Audio API)
function playDingSound() {
  // Create a simple ding sound using Web Audio API
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

function playIncorrectSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.2);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.2);
}

function playWinningMusic() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  let currentNote = 0;

  const playNote = () => {
    if (currentNote >= notes.length * 2) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = notes[currentNote % notes.length];
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    currentNote++;
    setTimeout(playNote, 200);
  };

  playNote();
}

function showGameContent() {
  const startingScreen = document.getElementById('startingScreen');
  const gameContent = document.getElementById('gameContent');
  
  if (startingScreen) {
    startingScreen.classList.add('hidden');
  }
  if (gameContent) {
    gameContent.classList.remove('hidden');
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWebSocket);
