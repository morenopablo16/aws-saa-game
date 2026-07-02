/*
 * game.js — Capa de UI del modo juego.
 * Depende de: QUESTIONS (quiz-data-all.js) y GameCore (game-core.js).
 */
(function () {
  "use strict";

  const GC = window.GameCore;
  const ALL = (typeof QUESTIONS !== "undefined" ? QUESTIONS : []).filter(
    (q) => q && q.id && Array.isArray(q.options) && q.options.length > 0
  );

  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------
  // Persistencia
  // ---------------------------------------------------------------
  const GAME_KEY = "aws_saa_game_v1";
  // Claves del quiz clásico: se leen para migrar y se siguen escribiendo
  // para que ambos modos compartan el estado de vistas/falladas.
  const WRONG_KEY = "aws_saa_wrong_ids_v1";
  const SEEN_KEY = "aws_saa_seen_ids_v1";

  function freshState() {
    return {
      v: 1,
      xp: 0,
      coins: 0,
      bestCombo: 0,
      totals: { answered: 0, correct: 0 },
      streak: { last: "", days: 0 },
      daily: { day: "", missions: [] },
      exams: [],  // packs de examen activos; vacío = todos (se normaliza al cargar)
      q: {},      // qid -> {s, c, w, box, due, flag}
      boss: {},   // categoryId -> true si el jefe fue derrotado
      history: [] // {t, mode, n, c, xp}
    };
  }

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function saveState() {
    try { localStorage.setItem(GAME_KEY, JSON.stringify(state)); } catch {}
  }

  // Migración desde el quiz clásico: marca vistas y falladas una sola vez.
  function migrateFromClassic(st) {
    const seen = loadJSON(SEEN_KEY);
    const wrong = loadJSON(WRONG_KEY);
    const now = Date.now();
    if (Array.isArray(seen)) {
      for (const id of seen) {
        if (!st.q[id]) st.q[id] = { s: 1, c: 1, w: 0, box: 1, due: now + GC.LEITNER_MS[1], flag: false };
      }
    }
    if (Array.isArray(wrong)) {
      for (const id of wrong) {
        st.q[id] = { s: 1, c: 0, w: 1, box: 0, due: now, flag: false };
      }
    }
    return st;
  }

  function syncClassicKeys(qid, correct) {
    try {
      const seen = new Set(loadJSON(SEEN_KEY) || []);
      seen.add(qid);
      localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
      const wrong = new Set(loadJSON(WRONG_KEY) || []);
      if (correct) wrong.delete(qid); else wrong.add(qid);
      localStorage.setItem(WRONG_KEY, JSON.stringify([...wrong]));
    } catch {}
  }

  let state = loadJSON(GAME_KEY);
  if (!state || state.v !== 1) {
    state = migrateFromClassic(freshState());
    saveState();
  }

  const catIndex = GC.buildCategoryIndex(ALL);
  const chestRng = GC.mulberry32((Date.now() & 0xffffffff) >>> 0);

  // ---------------------------------------------------------------
  // Packs de examen (Exam 1..N): la selección delimita el pool de todos los modos
  // ---------------------------------------------------------------
  const EXAMS = [...new Set(ALL.map((q) => q.exam))].sort(
    (a, b) => parseInt(a.replace(/\D+/g, ""), 10) - parseInt(b.replace(/\D+/g, ""), 10)
  );
  const examByQ = {};
  for (const q of ALL) examByQ[q.id] = q.exam;
  // Estados guardados antes de esta versión no traen "exams": todos activos.
  if (!Array.isArray(state.exams) || state.exams.length === 0) state.exams = EXAMS.slice();

  function enabledExams() { return new Set(state.exams); }

  function activePool() {
    const en = enabledExams();
    return en.size >= EXAMS.length ? ALL : ALL.filter((q) => en.has(q.exam));
  }

  // ---------------------------------------------------------------
  // Misiones diarias
  // ---------------------------------------------------------------
  function ensureDaily() {
    const today = GC.dayKey(new Date());
    if (state.daily.day !== today) {
      state.daily = { day: today, missions: GC.generateDailyMissions(today) };
      saveState();
    }
  }

  // ---------------------------------------------------------------
  // Sesión de juego
  // ---------------------------------------------------------------
  const MODES = {
    quick:    { name: "Ronda rápida", tag: "RONDA RÁPIDA", icon: "⚡", desc: "10 preguntas adaptadas a tus puntos débiles y repasos pendientes." },
    campaign: { name: "Campaña", tag: "CAMPAÑA", icon: "🗺️", desc: "Domina un servicio de AWS pregunta a pregunta." },
    boss:     { name: "Boss battle", tag: "BOSS BATTLE", icon: "⚔️", desc: "5 preguntas difíciles. Acierta 4 para derrotar al jefe." },
    sprint:   { name: "Sprint", tag: "SPRINT 5:00", icon: "⏱️", desc: "5 minutos. Responde todo lo que puedas." },
    survival: { name: "Supervivencia", tag: "SUPERVIVENCIA", icon: "❤️", desc: "3 vidas. Cada fallo cuesta una. ¿Hasta dónde llegas?" },
    review:   { name: "Repaso", tag: "REPASO", icon: "🔁", desc: "Preguntas falladas, marcadas y repasos que tocan hoy." },
  };

  let S = null; // sesión activa

  function newSession(mode, categoryId) {
    const queue = GC.buildQueue(
      mode,
      { categoryId: categoryId || null, count: mode === "boss" ? 5 : mode === "review" ? 15 : 10 },
      activePool(), catIndex, state.q, Date.now(), Math.random
    );
    if (queue.length === 0) {
      toast("No hay preguntas para este modo con los packs de examen activos.", "reward");
      return;
    }
    S = {
      mode, categoryId: categoryId || null,
      queue, idx: 0,
      answered: 0, correct: 0, hardWins: 0,
      combo: 0, bestCombo: 0,
      xp: 0, coins: 0,
      lives: mode === "survival" ? 3 : null,
      deadline: mode === "sprint" ? Date.now() + 5 * 60e3 : null,
      timerId: null,
      qStart: 0,
      doubleXp: 0,
      pendingChest: null,
      locked: false,
      missionsDone: 0,
      bossWon: false,
    };
    if (S.deadline) startSprintTimer();
    showView("play");
    renderPlaybar();
    renderQuestion();
  }

  function startSprintTimer() {
    S.timerId = setInterval(() => {
      if (!S || !S.deadline) return;
      const left = Math.ceil((S.deadline - Date.now()) / 1000);
      const el = $("playTimer");
      el.textContent = fmtTime(left);
      el.classList.toggle("warn", left <= 30);
      if (left <= 0) endSession("¡Tiempo!");
    }, 250);
  }

  function stopTimers() {
    if (S && S.timerId) { clearInterval(S.timerId); S.timerId = null; }
  }

  function fmtTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  // ---------------------------------------------------------------
  // Render: HUD
  // ---------------------------------------------------------------
  function renderHUD() {
    const lv = GC.levelFromXp(state.xp);
    const rank = GC.rankForLevel(lv.level);
    $("hudRankIcon").textContent = rank.icon;
    $("hudRankName").textContent = rank.name;
    $("hudLevel").textContent = "NIVEL " + lv.level;
    $("hudXpText").textContent = lv.into + " / " + lv.need;
    const pct = Math.min(100, Math.round((lv.into / lv.need) * 100));
    $("hudXpFill").style.width = pct + "%";
    $("hudXpBar").setAttribute("aria-valuenow", String(pct));
    $("hudCoins").textContent = state.coins;
    $("hudDailyStreak").textContent = state.streak.days;
  }

  // ---------------------------------------------------------------
  // Render: dashboard
  // ---------------------------------------------------------------
  function renderMissions() {
    const box = $("missionsList");
    box.innerHTML = "";
    for (const m of state.daily.missions) {
      const div = document.createElement("div");
      div.className = "mission-card" + (m.done ? " done" : "");
      const pct = Math.min(100, Math.round((m.progress / m.n) * 100));
      div.innerHTML =
        `<div class="mtext">${m.done ? "✅ " : ""}${m.text}</div>` +
        `<div class="mini-bar"><div class="fill" style="width:${pct}%"></div></div>` +
        `<div class="mreward">${m.progress}/${m.n} · Recompensa: +${m.reward.xp} XP, +${m.reward.coins} 🪙</div>`;
      box.appendChild(div);
    }
  }

  function categoryStats(catId) {
    const en = enabledExams();
    const ids = (catIndex.byCat[catId] || []).filter((id) => en.has(examByQ[id]));
    let c = 0, w = 0, mastered = 0;
    for (const id of ids) {
      const s = state.q[id];
      if (!s) continue;
      c += s.c || 0;
      w += s.w || 0;
      if ((s.c || 0) > 0) mastered++;
    }
    return {
      total: ids.length,
      mastered,
      accuracy: c + w === 0 ? null : c / (c + w),
    };
  }

  function renderExams() {
    const box = $("examChips");
    box.innerHTML = "";
    const en = enabledExams();
    for (const exam of EXAMS) {
      const ids = ALL.filter((q) => q.exam === exam);
      const mastered = ids.filter((q) => state.q[q.id] && (state.q[q.id].c || 0) > 0).length;
      const btn = document.createElement("button");
      btn.className = "exam-chip";
      btn.setAttribute("aria-pressed", en.has(exam) ? "true" : "false");
      btn.innerHTML = `<span class="n">${exam}</span><span class="pct">${mastered}/${ids.length}</span>`;
      btn.addEventListener("click", () => toggleExam(exam));
      box.appendChild(btn);
    }
    const pool = activePool();
    $("examsNote").textContent =
      pool.length + " preguntas en juego · la selección se aplica a todos los modos";
  }

  function toggleExam(exam) {
    const en = enabledExams();
    if (en.has(exam)) {
      if (en.size === 1) {
        toast("Deja al menos un pack activo.", "");
        return;
      }
      en.delete(exam);
    } else {
      en.add(exam);
    }
    state.exams = EXAMS.filter((e) => en.has(e));
    saveState();
    renderDashboard();
  }

  function renderModes() {
    const grid = $("modesGrid");
    grid.innerHTML = "";
    for (const key of ["quick", "sprint", "survival", "review"]) {
      const m = MODES[key];
      const btn = document.createElement("button");
      btn.className = "mode-card";
      let extra = "";
      if (key === "review") {
        const now = Date.now();
        const pool = activePool();
        const due = pool.filter((q) => GC.isDue(state.q[q.id], now)).length;
        const flagged = pool.filter((q) => state.q[q.id] && state.q[q.id].flag).length;
        if (due + flagged > 0) extra = `<div class="mode-desc" style="color:var(--orange-hi); margin-top:4px;">${due} pendientes · ${flagged} marcadas</div>`;
      }
      btn.innerHTML =
        `<div class="mode-icon">${m.icon}</div>` +
        `<div class="mode-name">${m.name}</div>` +
        `<div class="mode-desc">${m.desc}</div>` + extra;
      btn.addEventListener("click", () => newSession(key));
      grid.appendChild(btn);
    }
    // Acceso al examen simulacro del modo clásico
    const link = document.createElement("button");
    link.className = "mode-card";
    link.innerHTML =
      `<div class="mode-icon">📋</div>` +
      `<div class="mode-name">Examen simulacro</div>` +
      `<div class="mode-desc">50 preguntas con tiempo, en el modo clásico.</div>`;
    link.addEventListener("click", () => { location.href = "quiz.html"; });
    grid.appendChild(link);
  }

  function renderCategories() {
    const grid = $("catGrid");
    grid.innerHTML = "";
    const cats = GC.CATEGORY_DEFS.concat([GC.CATEGORY_FALLBACK]).filter(
      (c) => (catIndex.byCat[c.id] || []).length > 0
    );
    for (const cat of cats) {
      const st = categoryStats(cat.id);
      const pct = st.total === 0 ? 0 : Math.round((st.mastered / st.total) * 100);
      const weak = st.accuracy !== null && st.accuracy < 0.6 && st.total >= 5;
      const div = document.createElement("div");
      div.className = "cat-card" + (weak ? " weak" : "");
      const accTxt = st.accuracy === null ? "—" : Math.round(st.accuracy * 100) + "% acierto";
      const bossDone = !!state.boss[cat.id];
      div.innerHTML =
        `<div class="cat-head"><span class="cat-name">${cat.icon} ${cat.name}</span>` +
        `<span class="cat-pct">${pct}%</span></div>` +
        `<div class="mini-bar"><div class="fill" style="width:${pct}%"></div></div>` +
        `<div class="cat-pct" style="margin-top:6px;">${st.mastered}/${st.total} dominadas · ${accTxt}</div>` +
        `<div class="cat-actions">` +
        `<button data-act="play">▶ Jugar</button>` +
        `<button data-act="boss" class="${bossDone ? "boss-done" : ""}">${bossDone ? "👑 Jefe vencido" : "⚔️ Boss"}</button>` +
        `</div>`;
      div.querySelector('[data-act="play"]').addEventListener("click", () => newSession("campaign", cat.id));
      div.querySelector('[data-act="boss"]').addEventListener("click", () => newSession("boss", cat.id));
      grid.appendChild(div);
    }
  }

  function renderStats() {
    const row = $("statsRow");
    const lv = GC.levelFromXp(state.xp);
    const t = state.totals;
    const acc = t.answered === 0 ? "—" : Math.round((t.correct / t.answered) * 100) + "%";
    const now = Date.now();
    const due = activePool().filter((q) => GC.isDue(state.q[q.id], now)).length;
    const mastered = Object.values(state.q).filter((s) => (s.box || 0) >= 3).length;
    const tiles = [
      { num: lv.level, lbl: "Nivel" },
      { num: acc, lbl: "Precisión" },
      { num: t.answered, lbl: "Respondidas" },
      { num: state.bestCombo, lbl: "Mejor racha" },
      { num: mastered, lbl: "Dominadas" },
      { num: due, lbl: "Para repasar" },
    ];
    row.innerHTML = tiles
      .map((x) => `<div class="stat-tile"><div class="num">${x.num}</div><div class="lbl">${x.lbl}</div></div>`)
      .join("");
  }

  function renderDashboard() {
    ensureDaily();
    renderHUD();
    renderMissions();
    renderExams();
    renderModes();
    renderCategories();
    renderStats();
  }

  // ---------------------------------------------------------------
  // Render: partida
  // ---------------------------------------------------------------
  function renderPlaybar() {
    const m = MODES[S.mode];
    let tag = m.tag;
    if (S.categoryId) tag += " // " + GC.categoryById(S.categoryId).name.toUpperCase();
    $("playModeTag").textContent = tag;
    $("playTimer").textContent = S.deadline ? fmtTime((S.deadline - Date.now()) / 1000) : "";
    $("playLives").textContent = S.lives !== null ? "❤️".repeat(S.lives) + "🖤".repeat(3 - S.lives) : "";
    renderProgressTag();
    renderCombo();
  }

  function renderProgressTag() {
    const endless = S.mode === "sprint" || S.mode === "survival";
    $("playProgress").textContent = endless
      ? `${S.answered} respondidas`
      : `Q ${Math.min(S.idx + 1, S.queue.length)}/${S.queue.length}`;
  }

  function renderCombo() {
    const meter = $("comboMeter");
    $("comboN").textContent = S.combo;
    const mult = GC.comboMultiplier(S.combo);
    $("comboX").textContent = mult > 1 ? "×" + mult + " XP" : "racha";
    meter.className = "combo-meter" +
      (S.combo >= 10 ? " heat-3" : S.combo >= 5 ? " heat-2" : S.combo >= 3 ? " heat-1" : "");
  }

  function currentQ() { return S.queue[S.idx]; }

  function renderQuestion() {
    const q = currentQ();
    if (!q) { endSession("Sin más preguntas"); return; }
    S.locked = false;
    S.qStart = Date.now();
    $("resultBox").innerHTML = "";
    $("qCard").classList.remove("flash-ok", "flash-bad");

    const cat = GC.categoryById(catIndex.byQ[q.id]);
    const hard = GC.isHard(q, state.q[q.id]);
    const multi = (q.correct || []).length > 1;
    const chips = [`<span class="chip">${cat.icon} ${cat.name}</span>`];
    if (hard) chips.push(`<span class="chip hard">difícil</span>`);
    if (multi) chips.push(`<span class="chip multi">elige ${q.correct.length}</span>`);
    chips.push(`<span class="chip">${q.exam} · #${q.index}</span>`);
    $("qChips").innerHTML = chips.join("");

    $("qPrompt").innerHTML = q.prompt;

    const wrap = $("qOptions");
    wrap.innerHTML = "";
    const type = multi ? "checkbox" : "radio";
    for (const opt of q.options) {
      const row = document.createElement("label");
      row.className = "opt";
      row.dataset.k = opt.k;
      const input = document.createElement("input");
      input.type = type;
      input.name = "opt";
      input.value = opt.k;
      const k = document.createElement("div");
      k.className = "optk";
      k.textContent = opt.k;
      const txt = document.createElement("div");
      txt.textContent = opt.html;
      row.append(input, k, txt);
      wrap.appendChild(row);
    }

    const flagged = state.q[q.id] && state.q[q.id].flag;
    const flagBtn = $("flagBtn");
    flagBtn.textContent = flagged ? "★ Marcada para repaso" : "☆ Marcar para repaso";
    flagBtn.classList.toggle("flagged", !!flagged);

    $("submitBtn").disabled = false;
    $("nextBtn").disabled = true;
    renderProgressTag();
  }

  function selectedLetters() {
    return Array.from($("qOptions").querySelectorAll("input"))
      .filter((i) => i.checked)
      .map((i) => i.value)
      .sort();
  }

  // ---------------------------------------------------------------
  // Responder
  // ---------------------------------------------------------------
  function submit() {
    const q = currentQ();
    if (!q || S.locked) return;
    const chosen = selectedLetters();
    if (chosen.length === 0) { toast("Elige al menos una opción", ""); return; }
    S.locked = true;

    const ok = GC.checkAnswer(q, chosen);
    const elapsed = Date.now() - S.qStart;
    const hard = GC.isHard(q, state.q[q.id]);

    S.answered += 1;
    if (ok) {
      S.correct += 1;
      S.combo += 1;
      S.bestCombo = Math.max(S.bestCombo, S.combo);
      if (hard) S.hardWins += 1;
    } else {
      S.combo = 0;
      if (S.lives !== null) S.lives -= 1;
    }

    const reward = GC.scoreAnswer({
      correct: ok, hard, elapsedMs: elapsed,
      combo: S.combo, doubleXp: S.doubleXp > 0,
    });
    if (S.doubleXp > 0) S.doubleXp -= 1;

    // Estado global
    const before = GC.levelFromXp(state.xp).level;
    state.xp += reward.xp;
    state.coins += reward.coins;
    state.totals.answered += 1;
    if (ok) state.totals.correct += 1;
    state.bestCombo = Math.max(state.bestCombo, S.combo);
    const prevFlag = state.q[q.id] ? !!state.q[q.id].flag : false;
    state.q[q.id] = GC.scheduleReview(state.q[q.id], ok, Date.now());
    state.q[q.id].flag = prevFlag;
    GC.updateDailyStreak(state.streak, GC.dayKey(new Date()));
    syncClassicKeys(q.id, ok);

    S.xp += reward.xp;
    S.coins += reward.coins;

    // Misiones
    ensureDaily();
    const completed = GC.applyEventToMissions(state.daily.missions, {
      correct: ok, hard, categoryId: catIndex.byQ[q.id], xp: reward.xp, combo: S.combo,
    });
    for (const m of completed) {
      state.xp += m.reward.xp;
      state.coins += m.reward.coins;
      S.missionsDone += 1;
      toast(`🎯 Misión completada: ${m.text} · +${m.reward.xp} XP, +${m.reward.coins} 🪙`, "mission");
    }

    // Cofre cada N respuestas
    if (S.answered % GC.CHEST_EVERY === 0) {
      S.pendingChest = GC.rollChest(chestRng);
    }

    saveState();

    // Feedback visual
    revealAnswer(q, chosen, ok, reward, elapsed);
    renderCombo();
    renderHUD();
    if (S.lives !== null) $("playLives").textContent = "❤️".repeat(Math.max(0, S.lives)) + "🖤".repeat(3 - Math.max(0, S.lives));

    // Level-up
    const after = GC.levelFromXp(state.xp).level;
    if (after > before) {
      const rank = GC.rankForLevel(after);
      const prevRank = GC.rankForLevel(before);
      const rankUp = rank.name !== prevRank.name;
      showOverlay({
        icon: rankUp ? rank.icon : "🎉",
        title: rankUp ? `¡Nuevo rango: ${rank.name}!` : `¡Nivel ${after}!`,
        sub: rankUp
          ? `Has ascendido a ${rank.name}. Sigue así y llegarás a ${(GC.nextRank(after) || { name: "la cima" }).name}.`
          : `Sigues creciendo como arquitecto. Rango actual: ${rank.name}.`,
      });
    }

    $("submitBtn").disabled = true;
    $("nextBtn").disabled = false;
    $("nextBtn").focus();
  }

  function revealAnswer(q, chosen, ok, reward, elapsed) {
    const correct = (q.correct || []).slice().sort();
    const correctSet = new Set(correct);
    const chosenSet = new Set(chosen);
    for (const el of $("qOptions").querySelectorAll(".opt")) {
      const k = el.dataset.k;
      if (correctSet.has(k)) el.classList.add("correct");
      else if (chosenSet.has(k)) el.classList.add("wrong");
      el.querySelector("input").disabled = true;
    }

    const card = $("qCard");
    card.classList.remove("flash-ok", "flash-bad");
    void card.offsetWidth; // reinicia la animación
    card.classList.add(ok ? "flash-ok" : "flash-bad");

    // XP flotante
    const float = $("xpFloat");
    float.textContent = `+${reward.xp} XP` + (reward.mult > 1 ? ` ×${reward.mult}` : "");
    float.classList.remove("go");
    void float.offsetWidth;
    float.classList.add("go");

    const res = document.createElement("div");
    res.className = "result-panel " + (ok ? "ok" : "bad");
    const secs = (elapsed / 1000).toFixed(1);
    let verdict;
    if (ok) {
      verdict = reward.speedBonus >= 5 ? "⚡ ¡Correcto y rápido!" : "✅ ¡Correcto!";
      if (S.combo >= 5) verdict += ` Racha de ${S.combo} 🔥`;
    } else {
      verdict = "❌ Incorrecto — apunta esta";
    }
    let html = `<div class="verdict">${verdict}</div>` +
      `<div class="detail">Tu respuesta: <b>${chosen.join(", ") || "(ninguna)"}</b> · Correcta: <b>${correct.join(", ")}</b> · ${secs}s · +${reward.xp} XP` +
      (reward.coins ? ` · +${reward.coins} 🪙` : "") + `</div>`;
    if (q.explanation) {
      html += `<div class="explain"><b>Por qué:</b> ${q.explanation}</div>`;
    } else {
      html += `<div class="explain">Esta pregunta aún no tiene explicación. Puedes añadirla en <b>quiz-data-all.js</b> (campo <code>explanation</code>).</div>`;
    }
    res.innerHTML = html;
    const box = $("resultBox");
    box.innerHTML = "";
    box.appendChild(res);

    if (!ok && S.lives !== null && S.lives <= 0) {
      // La derrota se muestra al pulsar "Siguiente" para que pueda leer la explicación.
      $("nextBtn").textContent = "Ver resultado";
    } else {
      $("nextBtn").textContent = "Siguiente";
    }
  }

  function next() {
    if (!S) return;

    if (S.pendingChest) {
      const chest = S.pendingChest;
      S.pendingChest = null;
      applyChest(chest);
      return; // el overlay continúa la partida al cerrarse
    }

    advance();
  }

  function applyChest(chest) {
    let sub;
    if (chest.type === "coins") {
      state.coins += chest.amount;
      S.coins += chest.amount;
      sub = `+${chest.amount} monedas 🪙`;
    } else if (chest.type === "xp") {
      state.xp += chest.amount;
      S.xp += chest.amount;
      sub = `+${chest.amount} XP ✨`;
    } else {
      S.doubleXp = chest.amount;
      sub = `XP doble durante las próximas ${chest.amount} preguntas ⚡`;
    }
    saveState();
    renderHUD();
    showOverlay({
      icon: "🎁",
      title: "¡Cofre desbloqueado!",
      sub: `${GC.CHEST_EVERY} preguntas respondidas. Recompensa: ${sub}`,
      onClose: advance,
    });
  }

  function advance() {
    if (!S) return;
    if (S.lives !== null && S.lives <= 0) { endSession("Sin vidas"); return; }
    if (S.deadline && Date.now() >= S.deadline) { endSession("¡Tiempo!"); return; }
    if (S.idx + 1 >= S.queue.length) { endSession("Cola completada"); return; }
    S.idx += 1;
    renderQuestion();
  }

  // ---------------------------------------------------------------
  // Fin de sesión y resumen
  // ---------------------------------------------------------------
  function endSession(reason) {
    if (!S) return;
    stopTimers();

    // Resultado del boss
    if (S.mode === "boss" && S.categoryId) {
      S.bossWon = S.correct >= 4;
      if (S.bossWon && !state.boss[S.categoryId]) {
        state.boss[S.categoryId] = true;
        state.xp += 150;
        state.coins += 40;
        toast(`👑 ¡Jefe de ${GC.categoryById(S.categoryId).name} derrotado! +150 XP, +40 🪙`, "reward");
      }
    }

    state.history.push({ t: Date.now(), mode: S.mode, n: S.answered, c: S.correct, xp: S.xp });
    if (state.history.length > 100) state.history = state.history.slice(-100);
    saveState();

    renderSummary(reason);
    showView("summary");
    renderHUD();
  }

  function renderSummary(reason) {
    const m = MODES[S.mode];
    $("summaryMode").textContent = m.tag + (S.categoryId ? " // " + GC.categoryById(S.categoryId).name.toUpperCase() : "");
    const acc = S.answered === 0 ? 0 : Math.round((S.correct / S.answered) * 100);

    let title, sub;
    if (S.mode === "boss") {
      title = S.bossWon ? "👑 ¡Jefe derrotado!" : "💀 El jefe resiste…";
      sub = S.bossWon
        ? "Dominas este servicio. Recompensa reclamada."
        : `Necesitas 4/5 para vencer. Conseguiste ${S.correct}/${S.answered}. Repasa y vuelve a por él.`;
    } else if (acc >= 80) {
      title = "🏆 Sesión brillante";
      sub = "Precisión de examen real. Una ronda más y esto está hecho.";
    } else if (acc >= 60) {
      title = "💪 Buen avance";
      sub = "Vas por buen camino. Las falladas ya están en tu cola de repaso.";
    } else {
      title = "🧭 Terreno explorado";
      sub = "Fallar aquí es ganar en el examen: cada fallo ya está programado para repaso.";
    }
    $("summaryTitle").textContent = title;
    $("summarySub").textContent = sub + (reason ? ` (${reason})` : "");

    const tiles = [
      { num: S.answered, lbl: "Respondidas" },
      { num: S.correct, lbl: "Aciertos" },
      { num: acc + "%", lbl: "Precisión" },
      { num: "+" + S.xp, lbl: "XP ganada" },
      { num: "+" + S.coins, lbl: "Monedas" },
      { num: S.bestCombo, lbl: "Mejor racha" },
    ];
    if (S.missionsDone > 0) tiles.push({ num: S.missionsDone, lbl: "Misiones ✅" });
    $("summaryGrid").innerHTML = tiles
      .map((x) => `<div class="stat-tile"><div class="num">${x.num}</div><div class="lbl">${x.lbl}</div></div>`)
      .join("");

    $("againBtn").textContent = S.mode === "boss" && !S.bossWon ? "⚔️ Revancha" : "⚡ Otra ronda";
  }

  // ---------------------------------------------------------------
  // Overlays y toasts
  // ---------------------------------------------------------------
  const overlayQueue = [];
  let overlayOpen = false;

  function showOverlay(cfg) {
    overlayQueue.push(cfg);
    if (!overlayOpen) nextOverlay();
  }

  function nextOverlay() {
    const cfg = overlayQueue.shift();
    if (!cfg) { overlayOpen = false; return; }
    overlayOpen = true;
    $("ovIcon").textContent = cfg.icon;
    $("ovTitle").textContent = cfg.title;
    $("ovSub").textContent = cfg.sub || "";
    $("overlay").classList.remove("hidden");
    $("ovBtn").onclick = () => {
      $("overlay").classList.add("hidden");
      overlayOpen = false;
      if (cfg.onClose) cfg.onClose();
      nextOverlay();
    };
    $("ovBtn").focus();
  }

  function toast(msg, kind) {
    const box = $("toasts");
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.classList.add("out"), 3600);
    setTimeout(() => el.remove(), 4100);
  }

  // ---------------------------------------------------------------
  // Vistas y eventos globales
  // ---------------------------------------------------------------
  function showView(name) {
    $("viewDashboard").classList.toggle("hidden", name !== "dashboard");
    $("viewPlay").classList.toggle("hidden", name !== "play");
    $("viewSummary").classList.toggle("hidden", name !== "summary");
    if (name === "dashboard") renderDashboard();
  }

  $("submitBtn").addEventListener("click", submit);
  $("nextBtn").addEventListener("click", next);
  $("quitBtn").addEventListener("click", () => endSession("Sesión terminada"));
  $("dashBtn").addEventListener("click", () => { S = null; showView("dashboard"); });
  $("againBtn").addEventListener("click", () => newSession(S.mode, S.categoryId));

  $("flagBtn").addEventListener("click", () => {
    const q = currentQ();
    if (!q) return;
    if (!state.q[q.id]) state.q[q.id] = { s: 0, c: 0, w: 0, box: 0, due: 0, flag: false };
    state.q[q.id].flag = !state.q[q.id].flag;
    saveState();
    const flagged = state.q[q.id].flag;
    $("flagBtn").textContent = flagged ? "★ Marcada para repaso" : "☆ Marcar para repaso";
    $("flagBtn").classList.toggle("flagged", flagged);
    toast(flagged ? "Pregunta marcada: aparecerá en Repaso" : "Marca quitada", "");
  });

  $("examsAllBtn").addEventListener("click", () => {
    state.exams = EXAMS.slice();
    saveState();
    renderDashboard();
  });

  // Export/import: el progreso vive en localStorage (por dispositivo);
  // estos botones permiten moverlo entre PC y móvil a mano.
  $("exportBtn").addEventListener("click", () => {
    const payload = {
      kind: "aws-saa-game-progress",
      exportedAt: new Date().toISOString(),
      game: state,
      classic: { seen: loadJSON(SEEN_KEY) || [], wrong: loadJSON(WRONG_KEY) || [] },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "aws-saa-progreso-" + GC.dayKey(new Date()) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Progreso exportado. Guárdalo o envíatelo al otro dispositivo.", "reward");
  });

  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result);
        if (payload.kind !== "aws-saa-game-progress" || !payload.game || payload.game.v !== 1) {
          toast("Archivo no válido: no parece un export de progreso.", "");
          return;
        }
        const ok = confirm(
          "Importar progreso del " + (payload.exportedAt || "?").slice(0, 10) +
          ".\nEsto SUSTITUYE el progreso actual de este dispositivo. ¿Continuar?"
        );
        if (!ok) return;
        localStorage.setItem(GAME_KEY, JSON.stringify(payload.game));
        if (payload.classic) {
          localStorage.setItem(SEEN_KEY, JSON.stringify(payload.classic.seen || []));
          localStorage.setItem(WRONG_KEY, JSON.stringify(payload.classic.wrong || []));
        }
        location.reload();
      } catch {
        toast("No se pudo leer el archivo.", "");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("resetBtn").addEventListener("click", () => {
    const ok = confirm(
      "¿Reiniciar TODO el progreso del juego (XP, nivel, misiones, repasos)?\n" +
      "El historial del quiz clásico no se toca."
    );
    if (!ok) return;
    localStorage.removeItem(GAME_KEY);
    location.reload();
  });

  // Teclado: A-E marcan opciones, Enter responde / avanza.
  document.addEventListener("keydown", (e) => {
    if ($("viewPlay").classList.contains("hidden") || overlayOpen) return;
    const key = e.key.toUpperCase();
    if (["A", "B", "C", "D", "E"].includes(key) && !S.locked) {
      const input = $("qOptions").querySelector(`input[value="${key}"]`);
      if (input) input.checked = input.type === "radio" ? true : !input.checked;
    } else if (e.key === "Enter") {
      if (!S.locked) submit();
      else next();
    }
  });

  // ---------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------
  if (ALL.length === 0) {
    document.body.innerHTML =
      '<div style="padding:40px; text-align:center; font-family:sans-serif; color:#e8edf7;">' +
      "No se pudieron cargar las preguntas (quiz-data-all.js). Abre game.html desde la carpeta del proyecto.</div>";
  } else {
    ensureDaily();
    showView("dashboard");
  }
})();
