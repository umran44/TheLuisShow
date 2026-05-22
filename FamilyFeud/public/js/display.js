let ws;
let gameState = {
  currentQuestion: null,
  answers: [],
  revealedAnswers: [],
  team1: { name: 'Team 1', points: 0 },
  team2: { name: 'Team 2', points: 0 },
  strikes: 0,
};
let roundPoints = 0;
let answeringTeam = null;
let stealInProgress = false;

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
      roundPoints = 0;
      answeringTeam = message.answeringTeam || null;
      stealInProgress = false;
      updateRoundPoints();
      renderQuestion();
      renderAnswers();
      break;

    case 'answerRevealed':
      revealAnswer(message.answerIndex, message.text, message.frequency);
      roundPoints += message.frequency;
      updateRoundPoints();
      playDingSound();
      break;

    case 'answerWrong':
      showWrongAnswer();
      playIncorrectSound();
      gameState.strikes = message.strikes;
      updateStrikes();
      break;

    case 'stealPhaseStarted':
      stealInProgress = true;
      break;

    case 'teamsUpdated':
      gameState.team1 = message.team1;
      gameState.team2 = message.team2;
      updateTeamDisplay();
      break;

    case 'roundWon':
      playGameWonSound();
      animatePointsToTeam(message.winningTeam, message.points);
      break;

    case 'roundReset':
      resetDisplay();
      break;

    case 'nextRound':
      roundPoints = 0;
      updateRoundPoints();
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

  if (gameState.answers.length === 0) return;

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
      if (gameState.revealedAnswers.includes(i)) {
        const answer = gameState.answers[i];
        box.classList.add('revealed');
        box.innerHTML = `
          <span class="answer-number">${i + 1}</span>
          <div class="answer-content">
            <span class="answer-text">${answer.text}</span>
            <span class="answer-frequency">${answer.frequency}</span>
          </div>
        `;
      }
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

  // Show Steal! when 3 strikes reached (with delay for X animation)
  if (gameState.strikes >= 3) {
    setTimeout(() => {
      showStealAnimation();
    }, 1500);
  }
}

function updateTeamDisplay() {
  document.getElementById('team1Name').textContent = gameState.team1.name;
  document.getElementById('team1Score').textContent = gameState.team1.points;
  document.getElementById('team2Name').textContent = gameState.team2.name;
  document.getElementById('team2Score').textContent = gameState.team2.points;
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
  stealInProgress = false;
  renderAnswers();
  updateStrikes();
}

function nextRoundDisplay() {
  gameState.revealedAnswers = [];
  gameState.strikes = 0;
  stealInProgress = false;
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
    // Show initial empty answer boxes
    showEmptyAnswerBoxes();
  }
}

function showEmptyAnswerBoxes() {
  const grid = document.getElementById('answersGrid');
  grid.innerHTML = '';
  
  // Display 8 empty boxes (standard Family Feud layout)
  const rows = 4;
  const totalCells = rows * 2;
  
  grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  
  for (let i = 0; i < totalCells; i++) {
    const box = document.createElement('div');
    box.className = 'answer-box empty-cell';
    box.innerHTML = '';
    grid.appendChild(box);
  }
}

function updateRoundPoints() {
  const roundEl = document.getElementById('roundNum');
  if (roundEl) {
    roundEl.textContent = roundPoints;
  }
}

function showStealAnimation() {
  // Only show once per round
  if (document.getElementById('stealText')) return;
  
  const stealDiv = document.createElement('div');
  stealDiv.id = 'stealText';
  stealDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 120px;
    font-weight: bold;
    color: #ffd60a;
    text-shadow: 0 0 40px rgba(255, 214, 10, 1);
    animation: stealFlash 3s ease-in-out;
    z-index: 1500;
  `;
  stealDiv.textContent = 'STEAL!';
  document.body.appendChild(stealDiv);
  
  setTimeout(() => {
    stealDiv.remove();
  }, 3000);
}

function animatePointsToTeam(teamNum, points) {
  const teamEl = teamNum === 1 
    ? document.getElementById('team1Score') 
    : document.getElementById('team2Score');
  
  if (!teamEl) return;
  
  const currentPoints = parseInt(teamEl.textContent) || 0;
  const targetPoints = currentPoints + points;
  const duration = 1500; // 1.5 seconds
  const steps = 30;
  const increment = points / steps;
  let currentStep = 0;
  
  const interval = setInterval(() => {
    currentStep++;
    const newPoints = Math.round(currentPoints + (increment * currentStep));
    teamEl.textContent = newPoints;
    
    if (currentStep >= steps) {
      teamEl.textContent = targetPoints;
      clearInterval(interval);
    }
  }, duration / steps);
}

function playGameWonSound() {
  const audio = new Audio('/sounds/game-won.mp3');
  audio.play().catch(error => console.error('Error playing game-won sound:', error));
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWebSocket);
