let ws;
let questions = [];
let currentAnswers = [];
let strikeCount = 0;
let audioElement = null;
let gameHasStarted = false;
let roundPoints = 0;
let selectedTeam = 1;
let stealInProgress = false;
let stealingTeam = null;

// Initialize WebSocket connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    console.log('Host connected');
    // Register as host client
    ws.send(JSON.stringify({ type: 'register', client: 'host' }));
    loadQuestions();
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleHostMessage(message);
  };

  ws.onclose = () => {
    console.log('Host disconnected');
    setTimeout(initWebSocket, 3000); // Reconnect after 3 seconds
  };
}

// Load questions from API
async function loadQuestions() {
  try {
    const response = await fetch('/api/questions');
    questions = await response.json();
    populateQuestionSelect();
  } catch (error) {
    console.error('Error loading questions:', error);
  }
}

function populateQuestionSelect() {
  const select = document.getElementById('questionSelect');
  select.innerHTML = '<option value="">Select a question...</option>';

  questions.forEach((question, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = question.question;
    select.appendChild(option);
  });
}

function handleHostMessage(message) {
  switch (message.type) {
    case 'stealPhaseStarted':
      stealInProgress = true;
      stealingTeam = message.stealingTeam;
      showStealStatus(stealingTeam);
      break;
    case 'roundReset':
    case 'nextRound':
      stealInProgress = false;
      stealingTeam = null;
      hideStealStatus();
      break;
    case 'roundWon':
      stealInProgress = false;
      stealingTeam = null;
      hideStealStatus();
      break;
  }
}

function loadQuestion() {
  const select = document.getElementById('questionSelect');
  const index = parseInt(select.value);

  if (isNaN(index)) {
    alert('Please select a question');
    return;
  }

  const question = questions[index];
  currentAnswers = question.answers;
  strikeCount = 0;
  roundPoints = 0;
  stealInProgress = false;
  stealingTeam = null;
  hideStealStatus();
  selectedTeam = parseInt(document.getElementById('teamSelect').value) || 1;

  // Update display
  document.getElementById('currentQuestion').textContent = question.question;
  document.getElementById('strikeCount').textContent = strikeCount;
  renderAnswers();

  // Send to display
  ws.send(JSON.stringify({
    type: 'loadQuestion',
    question: question.question,
    answers: question.answers,
    answeringTeam: selectedTeam,
  }));
}

function renderAnswers() {
  const container = document.getElementById('answersContainer');
  container.innerHTML = '';

  currentAnswers.forEach((answer, index) => {
    const item = document.createElement('div');
    item.className = 'answer-item';
    item.innerHTML = `
      <span class="answer-number">${index + 1}</span>
      <div class="answer-content">
        <span class="answer-text">${answer.text}</span>
        <span class="answer-frequency">${answer.frequency} points</span>
      </div>
    `;

    if (isAnswerRevealed(index)) {
      item.classList.add('revealed');
    } else {
      item.onclick = () => revealAnswer(index);
    }

    container.appendChild(item);
  });
}

function revealAnswer(answerIndex) {
  // Mark answer as revealed
  currentAnswers[answerIndex].revealed = true;
  
  // Update round points
  roundPoints += currentAnswers[answerIndex].frequency;

  // Play correct-answer sound on host
  try {
    const audio = new Audio('/sounds/correct-answer.mp3');
    audio.play().catch(err => console.error('Error playing correct-answer sound:', err));
  } catch (err) {
    console.error('Audio playback error:', err);
  }

  // Send to display
  ws.send(JSON.stringify({
    type: 'revealAnswer',
    answerIndex,
  }));

  // Update UI
  renderAnswers();
}

function isAnswerRevealed(index) {
  return currentAnswers[index].revealed === true;
}

function updateTeam(teamNum) {
  const nameInput = teamNum === 1 ? 'team1Name' : 'team2Name';
  const pointsInput = teamNum === 1 ? 'team1Points' : 'team2Points';

  const name = document.getElementById(nameInput).value;
  const points = parseInt(document.getElementById(pointsInput).value) || 0;

  ws.send(JSON.stringify({
    type: 'updateTeam',
    team: teamNum,
    name,
    points,
  }));
}

function addStrike() {
  strikeCount++;
  if (strikeCount > 3) strikeCount = 3;

  document.getElementById('strikeCount').textContent = strikeCount;

  // Play incorrect-answer sound
  const audio = new Audio('/sounds/incorrect-answer.mp3');
  audio.play().catch(error => console.error('Error playing sound:', error));

  ws.send(JSON.stringify({
    type: 'addStrike',
    strikes: strikeCount,
  }));
}

function resetStrikes() {
  strikeCount = 0;
  document.getElementById('strikeCount').textContent = strikeCount;

  ws.send(JSON.stringify({
    type: 'resetStrikes',
    strikes: 0,
  }));
}

function resetRound() {
  // Reset all answers to unrevealed
  currentAnswers.forEach(answer => {
    answer.revealed = false;
  });
  strikeCount = 0;
  stealInProgress = false;
  stealingTeam = null;
  hideStealStatus();

  document.getElementById('strikeCount').textContent = strikeCount;
  renderAnswers();

  ws.send(JSON.stringify({ type: 'resetRound' }));
}

function nextRound() {
  // Reset for next round
  currentAnswers = [];
  strikeCount = 0;
  roundPoints = 0;
  stealInProgress = false;
  stealingTeam = null;
  hideStealStatus();

  document.getElementById('strikeCount').textContent = strikeCount;
  document.getElementById('currentQuestion').textContent = 'No question loaded';
  document.getElementById('answersContainer').innerHTML = '';
  document.getElementById('questionSelect').value = '';

  ws.send(JSON.stringify({ type: 'nextRound' }));
}

function toggleMusic() {
  // If audio element doesn't exist, create it
  if (!audioElement) {
    audioElement = new Audio('/sounds/intro-song.mp3');
    audioElement.addEventListener('ended', () => {
      // Music ended
    });
  }

  // Always restart the music from the beginning
  audioElement.currentTime = 0;
  audioElement.play().catch(error => {
    console.error('Error playing audio:', error);
  });
}

function startGame() {
  gameHasStarted = true;

  // Stop the music
  if (audioElement) {
    audioElement.pause();
    audioElement.currentTime = 0;
  }

  // Hide starting screen and show game controls
  const startingScreen = document.getElementById('startingScreen');
  const gameControls = document.getElementById('gameControls');

  if (startingScreen) {
    startingScreen.classList.add('hidden');
  }
  if (gameControls) {
    gameControls.classList.remove('hidden');
  }

  // Send game started message to display
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'gameStarted' }));
  }
}

function laughingTrack() {
  const audio = new Audio('/sounds/clapping.mp3');
  audio.play().catch(error => console.error('Error playing clapping sound:', error));
}

function showStealStatus(teamNum) {
  let statusEl = document.getElementById('stealStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'stealStatus';
    statusEl.className = 'steal-status';
    const section = document.querySelector('.section:nth-of-type(4)');
    if (section) {
      section.appendChild(statusEl);
    } else {
      document.body.appendChild(statusEl);
    }
  }
  statusEl.textContent = `Steal attempt: Team ${teamNum} must answer correctly.`;
  statusEl.classList.remove('hidden');
}

function hideStealStatus() {
  const statusEl = document.getElementById('stealStatus');
  if (statusEl) {
    statusEl.classList.add('hidden');
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWebSocket);
