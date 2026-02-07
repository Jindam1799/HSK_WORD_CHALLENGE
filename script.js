const QUESTION_COUNT = 20;
const TIME_LIMIT = 10;

// --- 상태 변수 ---
let currentTheme = null;
let currentQuestions = [];
let currentIndex = 0;
let wrongCount = 0;
let timerInterval = null;
let selectedThemeId = null;

// --- DOM 요소 ---
const themeList = document.getElementById('theme-list');
const timerFill = document.getElementById('timer-fill');
const flashCard = document.querySelector('.flash-card');
const exitModal = document.getElementById('exit-modal');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const startGuideModal = document.getElementById('start-guide-modal');
const guideStartBtn = document.getElementById('guide-start-btn');
const guideCloseBtn = document.getElementById('guide-close-btn');

// --- 모바일 실제 가시 영역(vh) 계산 ---
function setScreenSize() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setScreenSize();
window.addEventListener('resize', setScreenSize);

// --- 초기화 ---
init();

function init() {
  renderLobby();

  const openingScreen = document.getElementById('opening-screen');
  const securityModal = document.getElementById('security-modal');
  const securityConfirmBtn = document.getElementById('security-confirm-btn');

  if (openingScreen) {
    openingScreen.onclick = () => {
      const video = document.getElementById('opening-video');
      if (video) video.pause();
      securityModal.style.display = 'flex';
    };
  }

  if (securityConfirmBtn) {
    securityConfirmBtn.onclick = () => {
      securityModal.style.display = 'none';
      showScreen('lobby-screen');
    };
  }

  if (flashCard) {
    flashCard.onclick = () => {
      document.getElementById('q-pinyin').classList.add('visible');
    };
  }

  guideStartBtn.onclick = () => {
    startGuideModal.style.display = 'none';
    startGame(selectedThemeId);
  };

  guideCloseBtn.onclick = () => {
    startGuideModal.style.display = 'none';
  };

  document.getElementById('close-game').onclick = () => {
    resetTimer();
    exitModal.style.display = 'flex';
  };

  modalCancelBtn.onclick = () => {
    exitModal.style.display = 'none';
    startTimer();
  };

  modalConfirmBtn.onclick = () => {
    exitModal.style.display = 'none';
    showScreen('lobby-screen');
  };
}

function renderLobby() {
  themeList.innerHTML = '';
  const clearedData = JSON.parse(
    localStorage.getItem('jindam_cleared_hsk') || '[]',
  );
  const total = themesData.length;
  const cleared = clearedData.length;
  document.getElementById('total-cleared').innerText = `${cleared}/${total}`;
  document.getElementById('total-progress').style.width =
    `${(cleared / total) * 100}%`;

  themesData.forEach((theme) => {
    const isCleared = clearedData.includes(theme.id);
    const card = document.createElement('div');
    card.className = `theme-card ${isCleared ? 'cleared' : ''}`;
    card.onclick = () => {
      selectedThemeId = theme.id;
      startGuideModal.style.display = 'flex';
    };
    card.innerHTML = `
      ${isCleared ? '<div class="stamp">👑</div>' : ''}
      <div class="theme-icon">${theme.icon}</div>
      <div class="theme-title">${theme.title}</div>
    `;
    themeList.appendChild(card);
  });
}

function showScreen(screenId) {
  document
    .querySelectorAll('.screen')
    .forEach((s) => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function startGame(themeId) {
  currentTheme = themesData.find((t) => t.id === themeId);
  if (!currentTheme) return;
  currentQuestions = [...currentTheme.words]
    .sort(() => Math.random() - 0.5)
    .slice(0, QUESTION_COUNT);
  currentIndex = 0;
  wrongCount = 0;
  document.getElementById('current-stage-name').innerText = currentTheme.title;
  showScreen('game-screen');
  renderQuestion();
}

function renderQuestion() {
  resetTimer();
  if (currentIndex >= currentQuestions.length) {
    endGame(true);
    return;
  }

  const q = currentQuestions[currentIndex];
  document.getElementById('q-chinese').innerText = q.ch;
  const pinyinEl = document.getElementById('q-pinyin');
  pinyinEl.innerText = q.py;
  pinyinEl.classList.remove('visible');

  document.getElementById('score-display').innerText =
    `${currentIndex + 1}/${currentQuestions.length}`;
  document.getElementById('progress-fill').style.width =
    `${(currentIndex / currentQuestions.length) * 100}%`;

  let wrongAnswer;
  let attempts = 0;
  do {
    const randomIdx = Math.floor(Math.random() * currentTheme.words.length);
    wrongAnswer = currentTheme.words[randomIdx].mean;
    attempts++;
  } while (
    (wrongAnswer === q.mean ||
      wrongAnswer.includes(q.mean) ||
      q.mean.includes(wrongAnswer)) &&
    attempts < 30 &&
    currentTheme.words.length > 1
  );

  const btn1 = document.getElementById('btn-1');
  const btn2 = document.getElementById('btn-2');
  const newBtn1 = btn1.cloneNode(true);
  const newBtn2 = btn2.cloneNode(true);

  // 버튼 클래스 유실 방지
  newBtn1.className = 'option-btn';
  newBtn2.className = 'option-btn';

  btn1.parentNode.replaceChild(newBtn1, btn1);
  btn2.parentNode.replaceChild(newBtn2, btn2);

  const isAnswerLeft = Math.random() < 0.5;
  if (isAnswerLeft) {
    newBtn1.innerText = q.mean;
    newBtn2.innerText = wrongAnswer;
    newBtn1.onclick = () => handleAnswer(true, newBtn1);
    newBtn2.onclick = () => handleAnswer(false, newBtn2);
  } else {
    newBtn1.innerText = wrongAnswer;
    newBtn2.innerText = q.mean;
    newBtn1.onclick = () => handleAnswer(false, newBtn1);
    newBtn2.onclick = () => handleAnswer(true, newBtn2);
  }
  startTimer();
}

function startTimer() {
  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';
  setTimeout(() => {
    timerFill.style.transition = `width ${TIME_LIMIT}s linear`;
    timerFill.style.width = '0%';
  }, 50);
  timerInterval = setTimeout(
    () => endGame(false, '시간 초과! ⏱️'),
    TIME_LIMIT * 1000,
  );
}

function resetTimer() {
  clearTimeout(timerInterval);
  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';
}

function handleAnswer(isCorrect, btnElement) {
  resetTimer();
  if (isCorrect) {
    currentIndex++;
    renderQuestion();
  } else {
    btnElement.classList.add('wrong-anim');
    setTimeout(() => endGame(false), 400);
  }
}

function endGame(isSuccess, reason = '') {
  resetTimer();
  showScreen('result-screen');
  const icon = document.getElementById('res-icon');
  const title = document.getElementById('res-title');
  const msg = document.getElementById('res-msg');

  if (isSuccess) {
    icon.innerText = '👑';
    title.innerText = '테마 정복 완료!';
    title.style.color = 'var(--primary)';
    msg.innerText = `${QUESTION_COUNT}문제를 모두 맞추셨어요!`;
    const clearedData = JSON.parse(
      localStorage.getItem('jindam_cleared_hsk') || '[]',
    );
    if (!clearedData.includes(currentTheme.id)) {
      clearedData.push(currentTheme.id);
      localStorage.setItem('jindam_cleared_hsk', JSON.stringify(clearedData));
    }
  } else {
    icon.innerText = '😢';
    title.innerText = reason ? reason : '아쉽게 실패...';
    title.style.color = 'var(--error)';
    msg.innerText = reason
      ? '10초 안에 답해야 해요!'
      : `${currentIndex + 1}번째 문제에서 틀렸어요.`;
  }

  document.getElementById('next-btn').onclick = () => {
    renderLobby();
    showScreen('lobby-screen');
  };
  document.getElementById('retry-btn').onclick = () =>
    startGame(currentTheme.id);
}
