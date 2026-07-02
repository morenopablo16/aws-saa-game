/*
 * game-core.js — Lógica pura del modo juego (sin DOM).
 * La usa game.js (navegador) y game-selftest.js (Node).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.GameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // ---------- RNG determinista (para misiones diarias y cofres) ----------
  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Categorías por servicio AWS ----------
  // Las preguntas no traen categoría: se infiere contando menciones de servicios
  // en el enunciado y las opciones. Gana la categoría con más impactos.
  const CATEGORY_DEFS = [
    { id: "ec2",        name: "EC2 y Auto Scaling",       icon: "🖥️", rx: /\bEC2\b|Auto Scaling|Spot (Instance|Fleet)|Reserved Instance|placement group|\bAMI\b|launch template|Dedicated Host/gi },
    { id: "s3",         name: "S3 y Glacier",             icon: "🪣", rx: /\bS3\b|Glacier|bucket/gi },
    { id: "vpc",        name: "VPC y Redes",              icon: "🌐", rx: /\bVPC\b|subnet|NAT (gateway|instance)|Transit Gateway|Direct Connect|\bVPN\b|security group|network ACL|PrivateLink|VPC endpoint|Global Accelerator|Elastic Load|Application Load Balancer|Network Load Balancer|\bALB\b|\bNLB\b|Route 53|\bDNS\b/gi },
    { id: "iam",        name: "IAM y Seguridad",          icon: "🛡️", rx: /\bIAM\b|\bKMS\b|Secrets Manager|GuardDuty|\bWAF\b|Shield|Cognito|Macie|Security Hub|Inspector|\bACM\b|encrypt(ion|ed)?/gi },
    { id: "rds",        name: "RDS y Aurora",             icon: "🗄️", rx: /\bRDS\b|Aurora|MySQL|PostgreSQL|read replica|Multi-AZ|ElastiCache|Redis|Memcached/gi },
    { id: "dynamodb",   name: "DynamoDB",                 icon: "⚡", rx: /DynamoDB|\bDAX\b|global table/gi },
    { id: "lambda",     name: "Lambda y Serverless",      icon: "λ",  rx: /Lambda|API Gateway|Step Functions|serverless/gi },
    { id: "containers", name: "Contenedores",             icon: "📦", rx: /\bECS\b|\bEKS\b|Fargate|Kubernetes|container|\bECR\b|Docker/gi },
    { id: "cloudfront", name: "CloudFront y Edge",        icon: "🌍", rx: /CloudFront|edge location|origin access|\bOAI\b|Lambda@Edge/gi },
    { id: "messaging",  name: "SQS, SNS y EventBridge",   icon: "📨", rx: /\bSQS\b|\bSNS\b|EventBridge|Amazon MQ|queue|fan-?out/gi },
    { id: "analytics",  name: "Analítica y Big Data",     icon: "📊", rx: /Kinesis|Athena|Redshift|\bEMR\b|Glue|QuickSight|OpenSearch|Elasticsearch|Firehose|Data Streams/gi },
    { id: "storage",    name: "EBS, EFS y FSx",           icon: "💾", rx: /\bEBS\b|\bEFS\b|FSx|Storage Gateway|Elastic Block Store|Elastic File System|instance store/gi },
    { id: "migration",  name: "Migración y Transfer",     icon: "🚚", rx: /Snowball|Snowmobile|Snowcone|DataSync|\bDMS\b|Migration Hub|Transfer Family|Application Migration/gi },
    { id: "mgmt",       name: "Observabilidad y Gestión", icon: "🔭", rx: /CloudWatch|CloudTrail|AWS Config\b|Organizations|Control Tower|Trusted Advisor|Systems Manager|Cost Explorer|Budgets|Savings Plans|Service Catalog/gi },
  ];
  const CATEGORY_FALLBACK = { id: "general", name: "Cloud General", icon: "☁️" };

  function questionText(q) {
    const opts = (q.options || []).map((o) => o.html || "").join(" ");
    return (q.prompt || "") + " " + opts;
  }

  function categorize(q) {
    const text = questionText(q);
    let best = null, bestScore = 0;
    for (const def of CATEGORY_DEFS) {
      const m = text.match(def.rx);
      const score = m ? m.length : 0;
      if (score > bestScore) { best = def; bestScore = score; }
    }
    return best || CATEGORY_FALLBACK;
  }

  // Mapa qid -> categoría, calculado una vez al arrancar.
  function buildCategoryIndex(questions) {
    const byQ = {}, byCat = {};
    for (const def of CATEGORY_DEFS.concat([CATEGORY_FALLBACK])) byCat[def.id] = [];
    for (const q of questions) {
      const cat = categorize(q);
      byQ[q.id] = cat.id;
      byCat[cat.id].push(q.id);
    }
    return { byQ, byCat };
  }

  function categoryById(id) {
    return CATEGORY_DEFS.find((c) => c.id === id) || CATEGORY_FALLBACK;
  }

  // ---------- Dificultad ----------
  // Difícil = multirespuesta, enunciado muy largo o pregunta que el jugador falla repetidamente.
  function isHard(q, qstat) {
    if ((q.correct || []).length > 1) return true;
    if ((q.prompt || "").length > 900) return true;
    if (qstat && qstat.w >= 2 && qstat.w > qstat.c) return true;
    return false;
  }

  // ---------- XP, monedas y combos ----------
  const XP = {
    BASE_CORRECT: 10,
    BASE_WRONG: 2,      // crédito por intentar: fallar nunca resta
    HARD_BONUS: 5,
    FAST_MS: 15000, FAST_BONUS: 5,
    OK_MS: 30000,  OK_BONUS: 2,
  };

  function comboMultiplier(combo) {
    if (combo >= 10) return 2;
    if (combo >= 5) return 1.5;
    if (combo >= 3) return 1.2;
    return 1;
  }

  /**
   * Calcula la recompensa de una respuesta.
   * @param {object} p {correct, hard, elapsedMs, combo (ya incrementado), doubleXp}
   * @returns {xp, coins, mult, speedBonus}
   */
  function scoreAnswer(p) {
    let base = p.correct ? XP.BASE_CORRECT : XP.BASE_WRONG;
    let speedBonus = 0;
    if (p.correct) {
      if (p.hard) base += XP.HARD_BONUS;
      const fast = p.hard ? XP.FAST_MS * 1.5 : XP.FAST_MS;
      const ok = p.hard ? XP.OK_MS * 1.5 : XP.OK_MS;
      if (p.elapsedMs <= fast) speedBonus = XP.FAST_BONUS;
      else if (p.elapsedMs <= ok) speedBonus = XP.OK_BONUS;
      base += speedBonus;
    }
    const mult = p.correct ? comboMultiplier(p.combo) : 1;
    let xp = Math.round(base * mult);
    if (p.doubleXp) xp *= 2;
    const coins = p.correct ? (p.hard ? 2 : 1) : 0;
    return { xp, coins, mult, speedBonus };
  }

  // ---------- Niveles y rangos ----------
  function xpNeededFor(level) {
    return Math.round(100 * Math.pow(level, 1.4));
  }

  function levelFromXp(totalXp) {
    let level = 1, rest = totalXp;
    while (rest >= xpNeededFor(level)) {
      rest -= xpNeededFor(level);
      level++;
    }
    return { level, into: rest, need: xpNeededFor(level) };
  }

  const RANKS = [
    { min: 1,  name: "Cloud Intern",        icon: "🎓" },
    { min: 5,  name: "Junior Architect",    icon: "🔧" },
    { min: 10, name: "Solutions Architect", icon: "🏗️" },
    { min: 18, name: "Principal Architect", icon: "🚀" },
    { min: 30, name: "AWS Legend",          icon: "👑" },
  ];

  function rankForLevel(level) {
    let r = RANKS[0];
    for (const rank of RANKS) if (level >= rank.min) r = rank;
    return r;
  }

  function nextRank(level) {
    for (const rank of RANKS) if (rank.min > level) return rank;
    return null;
  }

  // ---------- Repetición espaciada (cajas Leitner) ----------
  // box 0..4 → reintento a los 10 min, 1, 3, 7 y 14 días.
  const LEITNER_MS = [10 * 60e3, 86400e3, 3 * 86400e3, 7 * 86400e3, 14 * 86400e3];

  function scheduleReview(qstat, correct, now) {
    const s = qstat || { s: 0, c: 0, w: 0, box: 0, due: 0, flag: false };
    s.s += 1;
    if (correct) {
      s.c += 1;
      s.box = Math.min((s.box || 0) + 1, LEITNER_MS.length - 1);
    } else {
      s.w += 1;
      s.box = 0;
    }
    s.due = now + LEITNER_MS[s.box];
    return s;
  }

  function isDue(qstat, now) {
    return !!qstat && qstat.w > 0 && qstat.due <= now;
  }

  // ---------- Misiones diarias ----------
  // Deterministas por fecha: el mismo día genera siempre las mismas 3 misiones.
  const MISSION_TEMPLATES = [
    { kind: "answer",  make: (rng) => ({ n: 10 + Math.floor(rng() * 3) * 5 }), text: (m) => `Responde ${m.n} preguntas`, reward: (m) => ({ xp: 40 + m.n * 3, coins: 15 }) },
    { kind: "correct", make: (rng) => ({ n: 6 + Math.floor(rng() * 3) * 2 }),  text: (m) => `Acierta ${m.n} preguntas`,  reward: (m) => ({ xp: 50 + m.n * 5, coins: 20 }) },
    { kind: "combo",   make: (rng) => ({ n: rng() < 0.5 ? 5 : 7 }),            text: (m) => `Consigue una racha de ${m.n} seguidas`, reward: (m) => ({ xp: 60 + m.n * 8, coins: 25 }) },
    { kind: "hard",    make: (rng) => ({ n: 2 + Math.floor(rng() * 2) }),      text: (m) => `Vence ${m.n} preguntas difíciles`, reward: (m) => ({ xp: 90, coins: 25 }) },
    { kind: "xp",      make: (rng) => ({ n: 150 + Math.floor(rng() * 3) * 50 }), text: (m) => `Gana ${m.n} XP`, reward: (m) => ({ xp: 70, coins: 20 }) },
    { kind: "category", make: (rng) => ({ n: 4, catId: CATEGORY_DEFS[Math.floor(rng() * CATEGORY_DEFS.length)].id }), text: (m) => `Acierta ${m.n} de ${categoryById(m.catId).name}`, reward: (m) => ({ xp: 100, coins: 30 }) },
  ];

  function generateDailyMissions(dayKey) {
    const rng = mulberry32(hashStr("missions-" + dayKey));
    const pool = MISSION_TEMPLATES.slice();
    const missions = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const idx = Math.floor(rng() * pool.length);
      const tpl = pool.splice(idx, 1)[0];
      const params = tpl.make(rng);
      const m = Object.assign({ kind: tpl.kind, progress: 0, done: false }, params);
      m.text = tpl.text(m);
      m.reward = tpl.reward(m);
      missions.push(m);
    }
    return missions;
  }

  /**
   * Actualiza el progreso de las misiones con un evento de respuesta.
   * ev = {correct, hard, categoryId, xp, combo}
   * Devuelve las misiones recién completadas (para toasts y recompensas).
   */
  function applyEventToMissions(missions, ev) {
    const completed = [];
    for (const m of missions) {
      if (m.done) continue;
      switch (m.kind) {
        case "answer":   m.progress += 1; break;
        case "correct":  if (ev.correct) m.progress += 1; break;
        case "combo":    m.progress = Math.max(m.progress, ev.combo || 0); break;
        case "hard":     if (ev.correct && ev.hard) m.progress += 1; break;
        case "xp":       m.progress += ev.xp || 0; break;
        case "category": if (ev.correct && ev.categoryId === m.catId) m.progress += 1; break;
      }
      if (m.progress >= m.n) {
        m.progress = m.n;
        m.done = true;
        completed.push(m);
      }
    }
    return completed;
  }

  // ---------- Cofres ----------
  const CHEST_EVERY = 10; // un cofre cada 10 respuestas de la sesión

  function rollChest(rng) {
    const r = rng();
    if (r < 0.5) return { type: "coins", amount: 10 + Math.floor(rng() * 16), label: "Monedas" };
    if (r < 0.85) return { type: "xp", amount: 25 + Math.floor(rng() * 51), label: "XP extra" };
    return { type: "doubleXp", amount: 5, label: "XP doble ×5 preguntas" };
  }

  // ---------- Selección de preguntas ----------
  function shuffleInPlace(arr, rng) {
    const rand = rng || Math.random;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function accuracyOf(stats) {
    const t = (stats.c || 0) + (stats.w || 0);
    return t === 0 ? null : (stats.c || 0) / t;
  }

  /**
   * Construye la cola de preguntas de una sesión.
   * mode: quick | campaign | boss | sprint | survival | review
   * state.q: mapa qid -> {s,c,w,box,due,flag}
   */
  function buildQueue(mode, opts, questions, catIndex, stateQ, now, rng) {
    const rand = rng || Math.random;
    const byId = {};
    for (const q of questions) byId[q.id] = q;

    const inCategory = (q) => !opts.categoryId || catIndex.byQ[q.id] === opts.categoryId;

    if (mode === "review") {
      const due = questions.filter((q) => isDue(stateQ[q.id], now));
      const flagged = questions.filter((q) => stateQ[q.id] && stateQ[q.id].flag && !due.includes(q));
      let pool = due.concat(flagged);
      if (pool.length === 0) {
        pool = questions.filter((q) => stateQ[q.id] && stateQ[q.id].w > stateQ[q.id].c);
      }
      return shuffleInPlace(pool.slice(), rand).slice(0, opts.count || 15);
    }

    if (mode === "boss") {
      const catQs = questions.filter(inCategory);
      const hard = catQs.filter((q) => isHard(q, stateQ[q.id]));
      const rest = catQs.filter((q) => !hard.includes(q));
      shuffleInPlace(hard, rand);
      shuffleInPlace(rest, rand);
      return hard.concat(rest).slice(0, opts.count || 5);
    }

    if (mode === "campaign") {
      const catQs = questions.filter(inCategory);
      const unseen = catQs.filter((q) => !stateQ[q.id]);
      const due = catQs.filter((q) => isDue(stateQ[q.id], now));
      const seen = catQs.filter((q) => stateQ[q.id] && !due.includes(q));
      shuffleInPlace(unseen, rand);
      shuffleInPlace(due, rand);
      shuffleInPlace(seen, rand);
      return unseen.concat(due, seen).slice(0, opts.count || 10);
    }

    if (mode === "sprint" || mode === "survival") {
      // Cola larga: la sesión termina por tiempo o vidas, no por agotar preguntas.
      return shuffleInPlace(questions.slice(), rand);
    }

    // quick (adaptativo): prioriza repasos pendientes y categorías débiles.
    const count = opts.count || 10;
    const due = shuffleInPlace(questions.filter((q) => isDue(stateQ[q.id], now)), rand).slice(0, Math.ceil(count * 0.3));

    // Precisión por categoría para sesgar hacia las débiles.
    const catAcc = {};
    for (const [catId, ids] of Object.entries(catIndex.byCat)) {
      let c = 0, w = 0;
      for (const id of ids) {
        const s = stateQ[id];
        if (s) { c += s.c || 0; w += s.w || 0; }
      }
      catAcc[catId] = c + w === 0 ? null : c / (c + w);
    }

    const chosen = new Set(due.map((q) => q.id));
    const candidates = questions.filter((q) => !chosen.has(q.id));
    // Peso: no vistas > categoría débil > resto.
    const weighted = candidates.map((q) => {
      const s = stateQ[q.id];
      const acc = catAcc[catIndex.byQ[q.id]];
      let w = 1;
      if (!s) w += 2;
      if (acc !== null && acc < 0.7) w += 2;
      return { q, w: w * rand() };
    });
    weighted.sort((a, b) => b.w - a.w);
    const rest = weighted.slice(0, count - due.length).map((x) => x.q);
    return shuffleInPlace(due.concat(rest), rand);
  }

  // ---------- Comprobación de respuesta (misma semántica que el quiz clásico) ----------
  function checkAnswer(q, chosenLetters) {
    const correct = (q.correct || []).slice().sort();
    const chosen = (chosenLetters || []).slice().sort();
    if (correct.length !== chosen.length) return false;
    for (let i = 0; i < correct.length; i++) if (correct[i] !== chosen[i]) return false;
    return true;
  }

  // ---------- Racha diaria ----------
  function dayKey(d) {
    const dt = d instanceof Date ? d : new Date(d);
    return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
  }

  function updateDailyStreak(streak, todayKey) {
    const s = streak || { last: "", days: 0 };
    if (s.last === todayKey) return s;
    const yesterday = dayKey(new Date(new Date(todayKey + "T12:00:00").getTime() - 86400e3));
    s.days = s.last === yesterday ? s.days + 1 : 1;
    s.last = todayKey;
    return s;
  }

  return {
    hashStr, mulberry32,
    CATEGORY_DEFS, CATEGORY_FALLBACK, categorize, buildCategoryIndex, categoryById,
    isHard,
    XP, comboMultiplier, scoreAnswer,
    xpNeededFor, levelFromXp, RANKS, rankForLevel, nextRank,
    LEITNER_MS, scheduleReview, isDue,
    generateDailyMissions, applyEventToMissions,
    CHEST_EVERY, rollChest,
    buildQueue, checkAnswer, accuracyOf,
    dayKey, updateDailyStreak, shuffleInPlace,
  };
});
