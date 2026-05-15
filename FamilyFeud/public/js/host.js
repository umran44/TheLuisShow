let ws;
let questions = [];
let currentAnswers = [];
let strikeCount = 0;

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

  // Update display
  document.getElementById('currentQuestion').textContent = question.question;
  document.getElementById('strikeCount').textContent = strikeCount;
  renderAnswers();

  // Send to display
  ws.send(JSON.stringify({
    type: 'loadQuestion',
    question: question.question,
    answers: question.answers,
  }));
}

function renderAnswers() {
  const container = document.getElementById('answersContainer');
  container.innerHTML = '';

  currentAnswers.forEach((answer, index) => {
    const item = document.createElement('div');
    item.className = 'answer-item';
    item.innerHTML = `
      <span class="answer-text">${answer.text}</span>
      <span class="answer-frequency">${answer.frequency} points</span>
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

  document.getElementById('strikeCount').textContent = strikeCount;
  renderAnswers();

  ws.send(JSON.stringify({ type: 'resetRound' }));
}

function nextRound() {
  // Reset for next round
  currentAnswers = [];
  strikeCount = 0;

  document.getElementById('strikeCount').textContent = strikeCount;
  document.getElementById('currentQuestion').textContent = 'No question loaded';
  document.getElementById('answersContainer').innerHTML = '';
  document.getElementById('questionSelect').value = '';

  ws.send(JSON.stringify({ type: 'nextRound' }));
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initWebSocket);
