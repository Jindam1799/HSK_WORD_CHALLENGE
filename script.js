// --- 설정 ---
const QUESTION_COUNT = 20; // 20문제
const TIME_LIMIT = 5; // 5초 제한

// --- 상태 변수 ---
let currentTheme = null;
let currentQuestions = [];
let currentIndex = 0;
let wrongCount = 0;
let timerInterval = null;

// --- DOM 요소 ---
const themeList = document.getElementById('theme-list');
const timerFill = document.getElementById('timer-fill');
const flashCard = document.querySelector('.flash-card');

// --- 초기화 ---
init();

function init() {
  renderLobby();

  // ★ 카드 클릭 시 병음 보이기 이벤트 등록
  if (flashCard) {
    flashCard.onclick = () => {
      const pinyinEl = document.getElementById('q-pinyin');
      pinyinEl.classList.add('visible');
    };
  }
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
    card.onclick = () => startGame(theme.id);

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

// 게임 시작
function startGame(themeId) {
  currentTheme = themesData.find((t) => t.id === themeId);
  if (!currentTheme) return;

  // 데이터 섞어서 20개만 가져오기
  const fullList = [...currentTheme.words];
  fullList.sort(() => Math.random() - 0.5);
  currentQuestions = fullList.slice(0, QUESTION_COUNT);

  currentIndex = 0;
  wrongCount = 0;

  document.getElementById('current-stage-name').innerText = currentTheme.title;

  showScreen('game-screen');
  renderQuestion();
}

function renderQuestion() {
  // 이전 타이머 정지
  resetTimer();

  // 종료 조건
  if (currentIndex >= currentQuestions.length) {
    endGame(true);
    return;
  }

  const q = currentQuestions[currentIndex];

  // UI 업데이트 (병음은 일단 숨김)
  document.getElementById('q-chinese').innerText = q.ch;
  const pinyinEl = document.getElementById('q-pinyin');
  pinyinEl.innerText = q.py;
  pinyinEl.classList.remove('visible'); // 다시 숨기기

  document.getElementById('score-display').innerText =
    `${currentIndex + 1}/${currentQuestions.length}`;
  const progress = (currentIndex / currentQuestions.length) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;

  // 오답 생성
  let wrongAnswer;
  do {
    const randomIdx = Math.floor(Math.random() * currentTheme.words.length);
    wrongAnswer = currentTheme.words[randomIdx].mean;
  } while (wrongAnswer === q.mean && currentTheme.words.length > 1);

  // 버튼 배치 (좌우 랜덤)
  const isAnswerLeft = Math.random() < 0.5;
  const btn1 = document.getElementById('btn-1');
  const btn2 = document.getElementById('btn-2');

  const newBtn1 = btn1.cloneNode(true);
  const newBtn2 = btn2.cloneNode(true);
  newBtn1.className = 'option-btn';
  newBtn2.className = 'option-btn';

  btn1.parentNode.replaceChild(newBtn1, btn1);
  btn2.parentNode.replaceChild(newBtn2, btn2);

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

  // 문제 표시 후 타이머 시작
  startTimer();
}

// 타이머 함수
function startTimer() {
  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';

  // 약간의 딜레이 후 애니메이션 시작
  setTimeout(() => {
    timerFill.style.transition = `width ${TIME_LIMIT}s linear`;
    timerFill.style.width = '0%';
  }, 50);

  timerInterval = setTimeout(() => {
    handleTimeOut();
  }, TIME_LIMIT * 1000);
}

function resetTimer() {
  clearTimeout(timerInterval);
  timerFill.style.transition = 'none';
  timerFill.style.width = '100%';
}

function handleTimeOut() {
  const btn1 = document.getElementById('btn-1');
  btn1.classList.add('wrong-anim'); // 시간 초과 시각 효과
  setTimeout(() => {
    endGame(false, '시간 초과! ⏱️');
  }, 400);
}

function handleAnswer(isCorrect, btnElement) {
  resetTimer();

  if (isCorrect) {
    currentIndex++;
    renderQuestion();
  } else {
    btnElement.classList.add('wrong-anim');
    wrongCount++;
    setTimeout(() => {
      endGame(false);
    }, 400);
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
    msg.innerText = `${QUESTION_COUNT}문제를 모두 5초 안에 맞추셨어요!`;

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
    title.style.color = '#ff7675';
    msg.innerText = reason
      ? '5초 안에 답해야 해요! 다시 도전해보세요.'
      : `${currentIndex + 1}번째 문제에서 틀렸어요.\n다시 도전해보세요!`;
  }

  document.getElementById('next-btn').onclick = () => {
    renderLobby();
    showScreen('lobby-screen');
  };

  document.getElementById('retry-btn').onclick = () => {
    startGame(currentTheme.id);
  };
}

document.getElementById('close-game').onclick = () => {
  resetTimer();
  if (confirm('게임을 종료하고 로비로 갈까요?')) {
    showScreen('lobby-screen');
  }
};
