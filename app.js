const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  document.body.style.background = tg.themeParams.bg_color || "#f5f7fb";
}

const DEFAULT_EXERCISES = [
  { id: uid(), title: "6 × 45 сек", mode: "time", seconds: 45, sets: 6, yt: "mDdLC-yKudY", instruction: "Контроль колена и таза." },
  { id: uid(), title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "1raelIFr1vA", instruction: "Медленно, без боли." },
  { id: uid(), title: "20 повторов", mode: "reps", reps: 20, sets: 1, yt: "N28Hpdezg7Q", instruction: "Полная амплитуда." },
  { id: uid(), title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "Gli_DYT8W7U", instruction: "Удерживай корпус стабильным." },
  { id: uid(), title: "3 × 8", mode: "reps", reps: 8, sets: 3, yt: "b8gAQOtLV3Q", instruction: "Ровное дыхание." },
  { id: uid(), title: "10 × intermediate", mode: "reps", reps: 10, sets: 1, yt: "mCI1SId3y-U", instruction: "Средний уровень." },
  { id: uid(), title: "3 × 45 сек", mode: "time", seconds: 45, sets: 3, yt: "1o7awuDGzag", instruction: "Держи позицию 45 секунд." },
  { id: uid(), title: "Mobility · 20", mode: "reps", reps: 20, sets: 1, yt: "-jipWmgofww", instruction: "Мобилизация без рывков." },
  { id: uid(), title: "Mobility · 20", mode: "reps", reps: 20, sets: 1, yt: "4Xhkf_RG5Gc", instruction: "Двигайся плавно." },
  { id: uid(), title: "6 × hold 45 сек", mode: "time", seconds: 45, sets: 6, yt: "bJuV3ZQVfJ4", instruction: "Статическое удержание." },
];

const STORAGE = "knee-rehab-flow-v2";

const state = {
  index: 0,
  set: 1,
  timerLeft: 45,
  timerInt: null,
  repsDone: 0,
  data: loadData(),
};

const els = {
  planHint: byId("planHint"),
  sessionsCount: byId("sessionsCount"),
  streakCount: byId("streakCount"),
  nextDate: byId("nextDate"),
  xpCount: byId("xpCount"),
  levelCount: byId("levelCount"),
  badgeLabel: byId("badgeLabel"),
  startSessionBtn: byId("startSessionBtn"),
  toggleEditorBtn: byId("toggleEditorBtn"),
  editor: byId("editor"),
  exerciseList: byId("exerciseList"),
  exerciseForm: byId("exerciseForm"),
  titleInput: byId("titleInput"),
  modeInput: byId("modeInput"),
  setsInput: byId("setsInput"),
  secondsInput: byId("secondsInput"),
  repsInput: byId("repsInput"),
  youtubeInput: byId("youtubeInput"),
  instructionInput: byId("instructionInput"),
  dashboard: byId("dashboard"),
  player: byId("player"),
  exerciseIndex: byId("exerciseIndex"),
  progressFill: byId("progressFill"),
  exerciseTitle: byId("exerciseTitle"),
  exerciseMeta: byId("exerciseMeta"),
  exerciseInstruction: byId("exerciseInstruction"),
  videoWrap: byId("videoWrap"),
  animationBox: byId("animationBox"),
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
  calendarGrid: byId("calendarGrid"),
  historyList: byId("historyList"),
};

init();

function init() {
  bind();
  els.planHint.textContent = "План: полный круг упражнений через день. Можно редактировать список упражнений ниже.";
  renderAll();
}

function bind() {
  els.startSessionBtn.addEventListener("click", startSession);
  els.toggleEditorBtn.addEventListener("click", () => els.editor.classList.toggle("hidden"));
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

  els.exerciseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const mode = els.modeInput.value;
    const exercise = {
      id: uid(),
      title: els.titleInput.value.trim(),
      mode,
      sets: Number(els.setsInput.value || 1),
      seconds: Number(els.secondsInput.value || 45),
      reps: Number(els.repsInput.value || 10),
      yt: parseYoutubeId(els.youtubeInput.value.trim()),
      instruction: els.instructionInput.value.trim() || "Следи за техникой и дыханием.",
    };

    if (!exercise.title) return;
    if (mode === "time" && !exercise.seconds) exercise.seconds = 45;
    if (mode === "reps" && !exercise.reps) exercise.reps = 10;

    state.data.exercises.push(exercise);
    save();
    renderAll();
    els.exerciseForm.reset();
    els.secondsInput.value = 45;
    els.repsInput.value = 10;
    els.setsInput.value = 1;
  });
}

function startSession() {
  if (!state.data.exercises.length) {
    alert("Добавь хотя бы одно упражнение в конструкторе.");
    return;
  }
  state.index = 0;
  state.set = 1;
  els.dashboard.classList.add("hidden");
  els.player.classList.remove("hidden");
  renderExercise();
}

function renderExercise() {
  const list = state.data.exercises;
  const ex = list[state.index];
  state.repsDone = 0;
  pauseTimer();
  state.timerLeft = ex.seconds || 45;

  els.exerciseIndex.textContent = `Упражнение ${state.index + 1} из ${list.length}`;
  els.progressFill.style.width = `${((state.index + 1) / list.length) * 100}%`;
  els.exerciseTitle.textContent = ex.title;
  els.exerciseMeta.textContent = `Подход ${state.set} / ${ex.sets}`;
  els.exerciseInstruction.textContent = ex.instruction || "";

  if (ex.yt) {
    els.videoWrap.classList.remove("hidden");
    els.animationBox.classList.add("hidden");
    els.exerciseVideo.src = `https://www.youtube.com/embed/${ex.yt}`;
  } else {
    els.videoWrap.classList.add("hidden");
    els.animationBox.classList.remove("hidden");
    els.exerciseVideo.src = "";
    els.animationBox.classList.toggle("pulse", ex.mode === "time");
  }

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
  const ex = state.data.exercises[state.index];
  addXp(10);
  if (state.set < ex.sets) {
    state.set += 1;
    renderExercise();
    return;
  }

  if (state.index < state.data.exercises.length - 1) {
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
    state.set = state.data.exercises[state.index].sets;
  }
  renderExercise();
}

function skip() {
  if (state.index < state.data.exercises.length - 1) {
    state.index += 1;
    state.set = 1;
    renderExercise();
    return;
  }
  completeSession();
}

function completeSession() {
  pauseTimer();
  const doneAt = new Date().toISOString();
  state.data.history.unshift({ doneAt, total: state.data.exercises.length });
  state.data.history = state.data.history.slice(0, 180);
  addXp(100 + getStreak(state.data.history) * 15);
  save();
  renderAll();
  els.player.classList.add("hidden");
  els.dashboard.classList.remove("hidden");

  tg?.HapticFeedback?.notificationOccurred("success");
  tg?.showAlert?.("Сессия завершена. Отличная работа 👏");
}

function renderAll() {
  renderDashboard();
  renderHistory();
  renderCalendar();
  renderEditorList();
}

function renderDashboard() {
  const history = state.data.history;
  els.sessionsCount.textContent = String(history.length);
  els.streakCount.textContent = String(getStreak(history));
  els.nextDate.textContent = getNextDateLabel(history);
  els.xpCount.textContent = String(state.data.xp);
  const level = getLevel(state.data.xp);
  els.levelCount.textContent = String(level);
  els.badgeLabel.textContent = getBadge(level);
}

function renderEditorList() {
  els.exerciseList.innerHTML = "";
  state.data.exercises.forEach((ex, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${i + 1}. ${ex.title}</strong><br>${ex.mode === "time" ? `${ex.sets}×${ex.seconds}с` : `${ex.sets}×${ex.reps}`} ${ex.yt ? "· YouTube" : "· Анимация"}`;
    const del = document.createElement("button");
    del.className = "btn";
    del.textContent = "Удалить";
    del.addEventListener("click", () => {
      state.data.exercises = state.data.exercises.filter((x) => x.id !== ex.id);
      save();
      renderEditorList();
    });
    li.appendChild(document.createElement("br"));
    li.appendChild(del);
    els.exerciseList.appendChild(li);
  });
}

function renderHistory() {
  if (!state.data.history.length) {
    els.historyList.innerHTML = "<li>Пока нет завершенных сессий.</li>";
    return;
  }

  els.historyList.innerHTML = state.data.history
    .slice(0, 14)
    .map((item) => {
      const d = new Date(item.doneAt);
      return `<li>${d.toLocaleDateString("ru-RU")} · ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })} · ${item.total} упражнений</li>`;
    })
    .join("");
}

function renderCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const pad = (first.getDay() + 6) % 7;
  const doneDays = new Set(state.data.history.map((h) => new Date(h.doneAt).toDateString()));

  const cells = [];
  for (let i = 0; i < pad; i += 1) cells.push('<div class="day empty"></div>');
  for (let day = 1; day <= lastDate; day += 1) {
    const d = new Date(year, month, day);
    const done = doneDays.has(d.toDateString());
    cells.push(`<div class="day ${done ? "done" : ""}">${day}</div>`);
  }
  els.calendarGrid.innerHTML = cells.join("");
}

function startTimer() {
  pauseTimer();
  state.timerInt = setInterval(() => {
    state.timerLeft -= 1;
    els.timerValue.textContent = formatTime(state.timerLeft);
    if (state.timerLeft <= 0) {
      pauseTimer();
      tg?.HapticFeedback?.impactOccurred("medium");
    }
  }, 1000);
}

function pauseTimer() {
  if (state.timerInt) clearInterval(state.timerInt);
  state.timerInt = null;
}

function resetTimer() {
  const ex = state.data.exercises[state.index];
  state.timerLeft = ex.seconds || 45;
  els.timerValue.textContent = formatTime(state.timerLeft);
}

function updateReps() {
  els.repsDone.textContent = String(state.repsDone);
}

function addXp(value) {
  state.data.xp += value;
}

function getLevel(xp) {
  return Math.floor(xp / 250) + 1;
}

function getBadge(level) {
  if (level >= 12) return "Легенда";
  if (level >= 8) return "Стабильный атлет";
  if (level >= 4) return "В ритме";
  return "Новичок";
}

function getStreak(history) {
  if (!history.length) return 0;
  const sorted = [...history].map((h) => new Date(h.doneAt)).sort((a, b) => b - a).map(dayNum);
  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1] - sorted[i] <= 2) streak += 1;
    else break;
  }
  return streak;
}

function getNextDateLabel(history) {
  if (!history.length) return "Сегодня";
  const last = new Date(history[0].doneAt);
  const next = new Date(last);
  next.setDate(next.getDate() + 2);
  return next.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function dayNum(d) {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

function parseYoutubeId(url) {
  if (!url) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : "";
}

function formatTime(total) {
  const safe = Math.max(total, 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function loadData() {
  const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
  if (raw?.exercises?.length) {
    return {
      history: raw.history || [],
      exercises: raw.exercises,
      xp: Number(raw.xp || 0),
    };
  }

  return {
    history: [],
    exercises: DEFAULT_EXERCISES,
    xp: 0,
  };
}

function save() {
  localStorage.setItem(STORAGE, JSON.stringify(state.data));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function byId(id) {
  return document.getElementById(id);
}
