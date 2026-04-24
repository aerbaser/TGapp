const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || "#f5f7fb";
}

const exercises = [
  { id: 1, title: "6 × 45 сек", mode: "time", seconds: 45, sets: 6, yt: "mDdLC-yKudY" },
  { id: 2, title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "1raelIFr1vA" },
  { id: 3, title: "20 повторов", mode: "reps", reps: 20, sets: 1, yt: "N28Hpdezg7Q" },
  { id: 4, title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "Gli_DYT8W7U" },
  { id: 5, title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "b8gAQOtLV3Q" },
  { id: 6, title: "10 × intermediate", mode: "reps", reps: 10, sets: 1, yt: "mCI1SId3y-U" },
  { id: 7, title: "3 × 45 сек", mode: "time", seconds: 45, sets: 3, yt: "1o7awuDGzag" },
  { id: 8, title: "Mobility · 20", mode: "reps", reps: 20, sets: 1, yt: "-jipWmgofww" },
  { id: 9, title: "Mobility · 20", mode: "reps", reps: 20, sets: 1, yt: "4Xhkf_RG5Gc" },
  { id: 10, title: "6 × hold 45 сек", mode: "time", seconds: 45, sets: 6, yt: "bJuV3ZQVfJ4" },
];

const STORAGE = "knee-rehab-flow-v1";

const state = {
  index: 0,
  set: 1,
  timerLeft: 45,
  timerInt: null,
  repsDone: 0,
  sessionDone: false,
  data: JSON.parse(localStorage.getItem(STORAGE) || '{"history":[]}'),
};

const els = {
  planHint: byId("planHint"),
  sessionsCount: byId("sessionsCount"),
  streakCount: byId("streakCount"),
  nextDate: byId("nextDate"),
  startSessionBtn: byId("startSessionBtn"),
  dashboard: byId("dashboard"),
  player: byId("player"),
  exerciseIndex: byId("exerciseIndex"),
  progressFill: byId("progressFill"),
  exerciseTitle: byId("exerciseTitle"),
  exerciseMeta: byId("exerciseMeta"),
  exerciseVideo: byId("exerciseVideo"),
  timerValue: byId("timerValue"),
  timerStartBtn: byId("timerStartBtn"),
  timerPauseBtn: byId("timerPauseBtn"),
  timerResetBtn: byId("timerResetBtn"),
  repsPanel: byId("repsPanel"),
  repsDone: byId("repsDone"),
  repsTarget: byId("repsTarget"),
  repAddBtn: byId("repAddBtn"),
  prevBtn: byId("prevBtn"),
  doneBtn: byId("doneBtn"),
  skipBtn: byId("skipBtn"),
  historyList: byId("historyList"),
};

init();

function init() {
  bind();
  renderDashboard();
  renderHistory();
  els.planHint.textContent =
    "План: полный круг упражнений через день. Отмечай каждое упражнение кнопкой «Готово».";
}

function bind() {
  els.startSessionBtn.addEventListener("click", startSession);
  els.doneBtn.addEventListener("click", next);
  els.skipBtn.addEventListener("click", skip);
  els.prevBtn.addEventListener("click", prev);
  els.timerStartBtn.addEventListener("click", startTimer);
  els.timerPauseBtn.addEventListener("click", pauseTimer);
  els.timerResetBtn.addEventListener("click", resetTimer);
  els.repAddBtn.addEventListener("click", () => {
    state.repsDone += 1;
    updateReps();
  });
}

function startSession() {
  state.index = 0;
  state.set = 1;
  state.sessionDone = false;
  els.dashboard.classList.add("hidden");
  els.player.classList.remove("hidden");
  renderExercise();
}

function renderExercise() {
  const ex = exercises[state.index];
  state.repsDone = 0;
  pauseTimer();
  state.timerLeft = ex.seconds || 45;

  els.exerciseIndex.textContent = `Упражнение ${state.index + 1} из ${exercises.length}`;
  els.progressFill.style.width = `${((state.index + 1) / exercises.length) * 100}%`;
  els.exerciseTitle.textContent = ex.title;
  els.exerciseMeta.textContent = `Подход ${state.set} / ${ex.sets}`;
  els.exerciseVideo.src = `https://www.youtube.com/embed/${ex.yt}`;

  const isTimed = ex.mode === "time";
  els.repsPanel.classList.toggle("hidden", isTimed);
  els.timerValue.textContent = formatTime(state.timerLeft);
  els.timerStartBtn.disabled = !isTimed;
  els.timerPauseBtn.disabled = !isTimed;
  els.timerResetBtn.disabled = !isTimed;

  if (!isTimed) {
    els.repsTarget.textContent = String(ex.reps);
    updateReps();
  }
}

function next() {
  const ex = exercises[state.index];
  if (state.set < ex.sets) {
    state.set += 1;
    renderExercise();
    return;
  }

  if (state.index < exercises.length - 1) {
    state.index += 1;
    state.set = 1;
    renderExercise();
    return;
  }

  completeSession();
}

function prev() {
  if (state.index === 0 && state.set === 1) return;
  if (state.set > 1) {
    state.set -= 1;
  } else {
    state.index -= 1;
    state.set = exercises[state.index].sets;
  }
  renderExercise();
}

function skip() {
  if (state.index < exercises.length - 1) {
    state.index += 1;
    state.set = 1;
    renderExercise();
  } else {
    completeSession();
  }
}

function completeSession() {
  pauseTimer();
  const doneAt = new Date().toISOString();
  state.data.history.unshift({ doneAt, completed: true, total: exercises.length });
  state.data.history = state.data.history.slice(0, 30);
  save();
  renderDashboard();
  renderHistory();
  els.player.classList.add("hidden");
  els.dashboard.classList.remove("hidden");

  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred("success");
  if (tg?.showAlert) tg.showAlert("Сессия завершена. Отличная работа 👏");
}

function startTimer() {
  pauseTimer();
  state.timerInt = setInterval(() => {
    state.timerLeft -= 1;
    els.timerValue.textContent = formatTime(state.timerLeft);
    if (state.timerLeft <= 0) {
      pauseTimer();
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("medium");
    }
  }, 1000);
}

function pauseTimer() {
  if (state.timerInt) clearInterval(state.timerInt);
  state.timerInt = null;
}

function resetTimer() {
  const ex = exercises[state.index];
  state.timerLeft = ex.seconds || 45;
  els.timerValue.textContent = formatTime(state.timerLeft);
}

function updateReps() {
  els.repsDone.textContent = String(state.repsDone);
}

function renderDashboard() {
  const history = state.data.history;
  els.sessionsCount.textContent = String(history.length);
  els.streakCount.textContent = String(getStreak(history));
  els.nextDate.textContent = getNextDateLabel(history);
}

function renderHistory() {
  if (!state.data.history.length) {
    els.historyList.innerHTML = "<li>Пока нет завершенных сессий.</li>";
    return;
  }

  els.historyList.innerHTML = state.data.history
    .map((item) => {
      const d = new Date(item.doneAt);
      return `<li>${d.toLocaleDateString("ru-RU")} · ${d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })} · ${item.total} упражнений</li>`;
    })
    .join("");
}

function getStreak(history) {
  if (!history.length) return 0;
  const sorted = [...history]
    .map((h) => new Date(h.doneAt))
    .sort((a, b) => b - a)
    .map((d) => dayNum(d));

  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const diff = sorted[i - 1] - sorted[i];
    if (diff <= 2) streak += 1;
    else break;
  }
  return streak;
}

function getNextDateLabel(history) {
  if (!history.length) return "Сегодня";
  const last = new Date(history[0].doneAt);
  const next = new Date(last);
  next.setDate(next.getDate() + 2);
  return next.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
}

function dayNum(d) {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

function formatTime(total) {
  const safe = Math.max(total, 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function save() {
  localStorage.setItem(STORAGE, JSON.stringify(state.data));
}

function byId(id) {
  return document.getElementById(id);
}
