const LOTTO_MIN = 1;
const LOTTO_MAX = 45;
const LOTTO_COUNT = 6;
const REVEAL_DELAY = 170;
const SET_DELAY = 220;

const setCountInput = document.getElementById("setCount");
const generateButton = document.getElementById("generateButton");
const results = document.getElementById("results");
const quickPicks = Array.from(document.querySelectorAll("[data-count]"));

let isDrawing = false;
let runToken = 0;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function generateNumbers() {
  const pool = Array.from(
    { length: LOTTO_MAX - LOTTO_MIN + 1 },
    (_, index) => index + LOTTO_MIN
  );

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, LOTTO_COUNT).sort((left, right) => left - right);
}

function getBallGroup(number) {
  if (number <= 10) return "group-1";
  if (number <= 20) return "group-2";
  if (number <= 30) return "group-3";
  if (number <= 40) return "group-4";
  return "group-5";
}

function syncQuickPicks(value) {
  quickPicks.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.count) === value);
  });
}

function createSetCard(setIndex) {
  const card = document.createElement("article");
  card.className = "set-card";

  const header = document.createElement("div");
  header.className = "set-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "set-title";

  const title = document.createElement("strong");
  title.textContent = `${setIndex}세트`;

  const sub = document.createElement("span");
  sub.textContent = "번호를 순서대로 공개합니다.";

  titleWrap.append(title, sub);

  const actions = document.createElement("div");
  actions.className = "set-actions";

  const time = document.createElement("span");
  time.className = "draw-meta";
  time.textContent = "추첨 준비 중";

  const reroll = document.createElement("button");
  reroll.className = "mini-button";
  reroll.type = "button";
  reroll.textContent = "이 세트 다시";

  actions.append(time, reroll);
  header.append(titleWrap, actions);

  const balls = document.createElement("div");
  balls.className = "balls";

  const metaRow = document.createElement("div");
  metaRow.className = "meta-row";

  const line = document.createElement("div");
  line.className = "number-line";
  line.textContent = "추첨 중...";

  const state = document.createElement("div");
  state.className = "draw-meta";
  state.textContent = "0 / 6 공개";

  metaRow.append(line, state);
  card.append(header, balls, metaRow);

  return { card, balls, line, state, time, reroll, sub };
}

async function revealSet(setCard, numbers, token) {
  setCard.balls.innerHTML = "";
  setCard.line.textContent = "추첨 중...";
  setCard.state.textContent = "0 / 6 공개";
  setCard.time.textContent = "추첨 진행 중";
  setCard.sub.textContent = "숫자가 하나씩 공개됩니다.";

  for (let index = 0; index < numbers.length; index += 1) {
    if (token !== runToken) {
      return false;
    }

    const number = numbers[index];
    const ball = document.createElement("div");
    ball.className = `ball ${getBallGroup(number)}`;
    ball.textContent = String(number).padStart(2, "0");
    setCard.balls.appendChild(ball);

    await wait(20);
    ball.classList.add("is-visible");

    const shownNumbers = numbers
      .slice(0, index + 1)
      .map((value) => String(value).padStart(2, "0"))
      .join(" / ");

    setCard.line.textContent = shownNumbers;
    setCard.state.textContent = `${index + 1} / 6 공개`;

    await wait(REVEAL_DELAY);
  }

  setCard.time.textContent = "방금 생성됨";
  setCard.sub.textContent = "추첨 완료. 원하는 경우 이 세트만 다시 생성할 수 있습니다.";
  return true;
}

async function rerollSingleSet(setCard) {
  if (isDrawing) {
    return;
  }

  isDrawing = true;
  generateButton.disabled = true;
  runToken += 1;
  const token = runToken;
  setCard.reroll.disabled = true;

  await revealSet(setCard, generateNumbers(), token);

  setCard.reroll.disabled = false;
  generateButton.disabled = false;
  isDrawing = false;
}

function validateSetCount() {
  const value = Number(setCountInput.value);
  if (!Number.isInteger(value) || value < 1 || value > 20) {
    return null;
  }
  return value;
}

async function renderSets() {
  const setCount = validateSetCount();

  if (setCount === null) {
    results.innerHTML = '<div class="empty">올바른 세트 수를 입력한 뒤 다시 시도하세요.</div>';
    return;
  }

  isDrawing = true;
  runToken += 1;
  const token = runToken;
  generateButton.disabled = true;
  syncQuickPicks(setCount);

  results.innerHTML = "";
  const setCards = [];

  for (let setIndex = 1; setIndex <= setCount; setIndex += 1) {
    const setCard = createSetCard(setIndex);
    setCard.reroll.addEventListener("click", () => {
      rerollSingleSet(setCard);
    });
    setCard.reroll.disabled = true;
    setCards.push(setCard);
    results.appendChild(setCard.card);
  }

  for (let index = 0; index < setCards.length; index += 1) {
    if (token !== runToken) {
      return;
    }

    const completed = await revealSet(setCards[index], generateNumbers(), token);

    if (!completed) {
      return;
    }

    setCards[index].reroll.disabled = false;
    await wait(SET_DELAY);
  }

  generateButton.disabled = false;
  isDrawing = false;
}

quickPicks.forEach((button) => {
  button.addEventListener("click", () => {
    const value = Number(button.dataset.count);
    setCountInput.value = value;
    syncQuickPicks(value);
  });
});

setCountInput.addEventListener("input", () => {
  const value = Number(setCountInput.value);
  if (Number.isInteger(value) && value >= 1 && value <= 20) {
    syncQuickPicks(value);
  }
});

generateButton.addEventListener("click", renderSets);
syncQuickPicks(Number(setCountInput.value));
