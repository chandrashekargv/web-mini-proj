const board = document.getElementById('game-board');
const resetBtn = document.getElementById('reset-btn');
const timerDisplay = document.getElementById('timer');
const bestTimeDisplay = document.getElementById('best-time');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const movesDisplay = document.getElementById('moves');
const bestMovesDisplay = document.getElementById('best-moves');
const scoreBestTime = document.getElementById('score-best-time');
const scoreBestMoves = document.getElementById('score-best-moves');
const cardSymbols = ['🍎','🍌','🍇','🍒','🍋','🍉','🍓','🍍'];
let cards = [];
let flippedCards = [];
let lockBoard = false;
let timer = null;
let startTime = null;
let elapsed = 0;
let bestMoves = localStorage.getItem('memory-best-moves') ? parseInt(localStorage.getItem('memory-best-moves')) : null;
let bestMovesTime = localStorage.getItem('memory-best-moves-time') ? parseFloat(localStorage.getItem('memory-best-moves-time')) : null;
let bestTime = localStorage.getItem('memory-best-time') ? parseFloat(localStorage.getItem('memory-best-time')) : null;
let bestTimeMoves = localStorage.getItem('memory-best-time-moves') ? parseInt(localStorage.getItem('memory-best-time-moves')) : null;
let moves = 0;
let paused = false;
let pauseStart = null;
let totalPaused = 0;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateMoves() {
  movesDisplay.textContent = `Moves: ${moves}`;
}

function updateTimer() {
  if (!paused && startTime) {
    elapsed = ((Date.now() - startTime - totalPaused) / 1000);
    timerDisplay.textContent = `Time: ${elapsed.toFixed(1)}s`;
  }
}

function showBestTime() {
  if (bestTimeDisplay) {
    if (bestTime !== null) {
      bestTimeDisplay.textContent = `Best Time: ${bestTime.toFixed(1)}s`;
    } else {
      bestTimeDisplay.textContent = 'Best Time: --';
    }
  }
  if (bestMovesDisplay) {
    if (bestMoves !== null) {
      bestMovesDisplay.textContent = `Best Moves: ${bestMoves}`;
    } else {
      bestMovesDisplay.textContent = 'Best Moves: --';
    }
  }
  // Scoreboard
  if (scoreBestTime) {
    if (bestTime !== null && bestTimeMoves !== null) {
      scoreBestTime.textContent = `Fastest: ${bestTime.toFixed(1)} s / ${bestTimeMoves} moves`;
    } else {
      scoreBestTime.textContent = 'Fastest: -- s / -- moves';
    }
  }
  if (scoreBestMoves) {
    if (bestMoves !== null && bestMovesTime !== null) {
      scoreBestMoves.textContent = `Fewest Moves: ${bestMoves} moves / ${bestMovesTime.toFixed(1)} s`;
    } else {
      scoreBestMoves.textContent = 'Fewest Moves: -- moves / -- s';
    }
  }
}

function startGameTimer() {
  startTime = Date.now();
  totalPaused = 0;
  timer = setInterval(updateTimer, 100);
}

function stopGameTimer() {
  clearInterval(timer);
  updateTimer();
}

function pauseTimer() {
  if (!paused) {
    paused = true;
    pauseStart = Date.now();
    clearInterval(timer);
    pauseBtn.textContent = 'Resume';
  } else {
    paused = false;
    totalPaused += Date.now() - pauseStart;
    timer = setInterval(updateTimer, 100);
    pauseBtn.textContent = 'Pause';
  }
}

function createBoard() {
  stopGameTimer(); // Always clear any running timer first
  board.innerHTML = '';
  flippedCards = [];
  lockBoard = true;
  moves = 0;
  updateMoves();
  cards = shuffle([...cardSymbols, ...cardSymbols]);
  cards.forEach(symbol => {
    const card = document.createElement('div');
    card.classList.add('card', 'flipped');
    card.dataset.symbol = symbol;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${symbol}</div>
        <div class="card-back">?</div>
      </div>
    `;
    card.addEventListener('click', flipCard);
    board.appendChild(card);
  });
  timerDisplay.textContent = 'Time: 0.0s';
  elapsed = 0;
  showBestTime && showBestTime();
  startBtn.disabled = true;
  pauseBtn.disabled = true;
  // After 3 seconds, flip all cards face down and enable Start button
  setTimeout(() => {
    document.querySelectorAll('.card').forEach(card => {
      card.classList.remove('flipped');
    });
    startBtn.disabled = false;
    pauseBtn.disabled = false;
    // Board remains locked until Start is pressed
  }, 3000);
}

function startGame() {
  startBtn.disabled = true;
  lockBoard = false;
  paused = false;
  pauseBtn.textContent = 'Pause';
  startGameTimer();
}

function flipCard(e) {
  if (lockBoard || paused) return;
  const card = e.currentTarget;
  if (card.classList.contains('flipped') || flippedCards.length === 2) return;
  card.classList.add('flipped');
  flippedCards.push(card);
  if (flippedCards.length === 2) {
    moves++;
    updateMoves();
    checkForMatch();
  }
}

function checkForMatch() {
  const [card1, card2] = flippedCards;
  if (card1.dataset.symbol === card2.dataset.symbol) {
    flippedCards = [];
    if (document.querySelectorAll('.card.flipped').length === cards.length) {
      stopGameTimer();
      setTimeout(() => {
        let msg = `Congratulations! You matched all cards!\nTime: ${elapsed.toFixed(1)}s\nMoves: ${moves}`;
        // Best time
        let newBest = false;
        if (bestTime === null || elapsed < bestTime) {
          bestTime = elapsed;
          bestTimeMoves = moves;
          localStorage.setItem('memory-best-time', bestTime);
          localStorage.setItem('memory-best-time-moves', bestTimeMoves);
          msg += '\nNew Fastest Time!';
          newBest = true;
        }
        // Best moves
        if (bestMoves === null || moves < bestMoves || (moves === bestMoves && elapsed < bestMovesTime)) {
          bestMoves = moves;
          bestMovesTime = elapsed;
          localStorage.setItem('memory-best-moves', bestMoves);
          localStorage.setItem('memory-best-moves-time', bestMovesTime);
          msg += '\nNew Fewest Moves!';
          newBest = true;
        }
        showBestTime();
        alert(msg);
      }, 300);
    }
  } else {
    lockBoard = true;
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      flippedCards = [];
      lockBoard = false;
    }, 1000);
  }
}

resetBtn.addEventListener('click', () => {
  stopGameTimer();
  createBoard();
});
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseTimer);
const resetBestBtn = document.getElementById('reset-best-btn');
if (resetBestBtn) {
  resetBestBtn.addEventListener('click', () => {
    localStorage.removeItem('memory-best-time');
    localStorage.removeItem('memory-best-time-moves');
    localStorage.removeItem('memory-best-moves');
    localStorage.removeItem('memory-best-moves-time');
    bestTime = null;
    bestTimeMoves = null;
    bestMoves = null;
    bestMovesTime = null;
    showBestTime();
  });
}
createBoard();
