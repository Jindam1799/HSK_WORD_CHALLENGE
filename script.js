// --- 상태 관리 ---
let currentTheme = null;
let currentQuestions = [];
let currentIndex = 0;
let score = 0;

// --- DOM 요소 ---
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const resultScreen = document.getElementById('result-screen');
const themeList = document.getElementById('theme-list');

// --- 초기화 ---
function init() {
  renderLobby();
}

// 로비 그리기
function renderLobby() {
  themeList.innerHTML = '';
  const clearedData = JSON.parse(
    localStorage.getItem('jindam_cleared_themes') || '[]',
  );

  themesData.forEach((theme) => {
    const isCleared = clearedData.includes(theme.id);
    const card = document.createElement('div');
    card.className = `theme-card ${isCleared ? 'cleared' : ''}`;
    card.onclick = () => startGame(theme.id);
    card.innerHTML = `
            <div class="stamp">👑</div>
            <div class="theme-icon">${theme.icon}</div>
            <div class="theme-title">${theme.title}</div>
        `;
    themeList.appendChild(card);
  });
}

function showScreen(screenName) {
  document
    .querySelectorAll('.screen')
    .forEach((s) => s.classList.remove('active'));
  document.getElementById(screenName).classList.add('active');
}

// --- 게임 로직 ---
function startGame(themeId) {
  currentTheme = themesData.find((t) => t.id === themeId);
  if (!currentTheme) return;

  // 문제 섞기 (배열 복사 후 정렬)
  currentQuestions = [...currentTheme.words].sort(() => Math.random() - 0.5);
  currentIndex = 0;
  score = 0;

  showScreen('game-screen');
  renderQuestion();
}

function renderQuestion() {
  // 모든 문제를 다 풀었으면 종료
  if (currentIndex >= currentQuestions.length) {
    endGame(true);
    return;
  }

  const q = currentQuestions[currentIndex];
  document.getElementById('q-chinese').innerText = q.ch;
  document.getElementById('q-pinyin').innerText = q.py;

  // 진행바 업데이트
  document.getElementById('score-display').innerText =
    `${currentIndex} / ${currentQuestions.length}`;
  const progress = (currentIndex / currentQuestions.length) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;

  // 오답 생성 (같은 테마 내 다른 단어)
  let wrongAnswer;
  do {
    const randomIdx = Math.floor(Math.random() * currentTheme.words.length);
    wrongAnswer = currentTheme.words[randomIdx].mean;
  } while (wrongAnswer === q.mean);

  // 버튼 세팅 (랜덤 위치)
  const isAnswerLeft = Math.random() < 0.5;
  const btn1 = document.getElementById('btn-1');
  const btn2 = document.getElementById('btn-2');

  // 이벤트 리스너 초기화를 위해 노드 복제
  const newBtn1 = btn1.cloneNode(true);
  const newBtn2 = btn2.cloneNode(true);
  btn1.parentNode.replaceChild(newBtn1, btn1);
  btn2.parentNode.replaceChild(newBtn2, btn2);

  if (isAnswerLeft) {
    newBtn1.innerText = q.mean;
    newBtn2.innerText = wrongAnswer;
    newBtn1.onclick = () => handleAnswer(true);
    newBtn2.onclick = () => handleAnswer(false);
  } else {
    newBtn1.innerText = wrongAnswer;
    newBtn2.innerText = q.mean;
    newBtn1.onclick = () => handleAnswer(false);
    newBtn2.onclick = () => handleAnswer(true);
  }
}

function handleAnswer(isCorrect) {
  if (isCorrect) {
    score++;
    currentIndex++;
    renderQuestion();
  } else {
    // 틀리면 바로 게임 오버
    endGame(false);
  }
}

function endGame(isSuccess) {
  showScreen('result-screen');
  const icon = document.getElementById('res-icon');
  const title = document.getElementById('res-title');
  const msg = document.getElementById('res-msg');

  if (isSuccess) {
    icon.innerText = '👑';
    title.innerText = '테마 정복 완료!';
    msg.innerText = `'${currentTheme.title}' 테마를 완벽하게 외우셨네요!`;

    // 로컬 스토리지 저장
    const clearedData = JSON.parse(
      localStorage.getItem('jindam_cleared_themes') || '[]',
    );
    if (!clearedData.includes(currentTheme.id)) {
      clearedData.push(currentTheme.id);
      localStorage.setItem(
        'jindam_cleared_themes',
        JSON.stringify(clearedData),
      );
    }
  } else {
    icon.innerText = '😭';
    title.innerText = '아쉽게 실패...';
    msg.innerText = `${currentIndex + 1}번째 단어에서 틀렸어요. 다시 도전해보세요!`;
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
  if (confirm('게임을 종료하고 로비로 갈까요?')) {
    showScreen('lobby-screen');
  }
};

// 앱 시작
init();
