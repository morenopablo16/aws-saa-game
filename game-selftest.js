/*
 * game-selftest.js — Validaciones del modo juego (sin navegador).
 * Uso: node game-selftest.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const GC = require("./game-core.js");

// Carga quiz-data-all.js simulando el entorno del navegador.
function loadQuestions() {
  // Evalúa el archivo de datos local igual que haría un <script> del navegador.
  const src = fs.readFileSync(path.join(__dirname, "quiz-data-all.js"), "utf8");
  const fn = new Function("window", src + "\n;return QUESTIONS_ALL;");
  return fn({});
}

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log("  ok  " + name);
  } else {
    failures++;
    console.error("  FAIL " + name);
  }
}

console.log("== Datos ==");
const QUESTIONS = loadQuestions();
check("carga de preguntas (>600)", Array.isArray(QUESTIONS) && QUESTIONS.length > 600);
check("todas tienen id, prompt, opciones y respuesta", QUESTIONS.every(
  (q) => q.id && q.prompt && Array.isArray(q.options) && q.options.length >= 2 && Array.isArray(q.correct) && q.correct.length >= 1
));
check("ids únicos", new Set(QUESTIONS.map((q) => q.id)).size === QUESTIONS.length);
check("respuestas correctas existen entre las opciones", QUESTIONS.every(
  (q) => q.correct.every((k) => q.options.some((o) => o.k === k))
));

console.log("== Integridad del texto (errores de parseo del PDF) ==");
// Pegados por borrado de marcadores "X. " a mitad de frase (ALB. Use -> ALUse).
const GLUE_RX = /\b(ALUse|DynamoDUse|DynamoDProvision|NLProcess|VPUpdate|VPModify|CImport)\b/;
const glued = QUESTIONS.filter((q) =>
  GLUE_RX.test(q.prompt || "") || GLUE_RX.test(q.explanation || "") ||
  (q.options || []).some((o) => GLUE_RX.test(o.html || ""))
);
check("sin marcadores de opción borrados a mitad de frase", glued.length === 0);
// Opciones cortadas a mitad de frase (paréntesis sin cerrar o final colgante).
const DANGLING_RX = /\([^)]*$|[,]$|\b(the|a|an|to|of|with|for|and|or|in|on|by|from|that|is|are|use|each)$/i;
const truncated = QUESTIONS.filter((q) =>
  (q.options || []).some((o) => DANGLING_RX.test((o.html || "").trim()))
);
check("sin opciones truncadas a mitad de frase (" + truncated.map((q) => q.id).join(",") + ")", truncated.length === 0);

console.log("== Categorías ==");
const idx = GC.buildCategoryIndex(QUESTIONS);
check("toda pregunta tiene categoría", QUESTIONS.every((q) => idx.byQ[q.id]));
const generalPct = (idx.byCat.general || []).length / QUESTIONS.length;
check(`categoría fallback < 15% (actual ${(generalPct * 100).toFixed(1)}%)`, generalPct < 0.15);

console.log("== XP y niveles ==");
const fastHard = GC.scoreAnswer({ correct: true, hard: true, elapsedMs: 5000, combo: 10 });
const slowEasy = GC.scoreAnswer({ correct: true, hard: false, elapsedMs: 60000, combo: 0 });
const wrong = GC.scoreAnswer({ correct: false, hard: false, elapsedMs: 5000, combo: 0 });
check("respuesta difícil+rápida+combo da más XP que lenta sin combo", fastHard.xp > slowEasy.xp);
check("fallar da XP simbólica, nunca negativa", wrong.xp > 0 && wrong.xp < slowEasy.xp);
check("fallar no da monedas", wrong.coins === 0);
check("doble XP duplica", GC.scoreAnswer({ correct: true, hard: false, elapsedMs: 60000, combo: 0, doubleXp: true }).xp === slowEasy.xp * 2);
let monotonic = true;
for (let l = 1; l < 40; l++) if (GC.xpNeededFor(l + 1) <= GC.xpNeededFor(l)) monotonic = false;
check("curva de nivel monótona creciente", monotonic);
check("levelFromXp(0) = nivel 1", GC.levelFromXp(0).level === 1);
const lv = GC.levelFromXp(100);
check("100 XP sube a nivel 2", lv.level === 2 && lv.into === 0);
check("rango nivel 1 = Cloud Intern", GC.rankForLevel(1).name === "Cloud Intern");
check("rango nivel 30 = AWS Legend", GC.rankForLevel(30).name === "AWS Legend");

console.log("== Misiones diarias ==");
const m1 = GC.generateDailyMissions("2026-07-02");
const m2 = GC.generateDailyMissions("2026-07-02");
const m3 = GC.generateDailyMissions("2026-07-03");
check("3 misiones por día", m1.length === 3);
check("deterministas para el mismo día", JSON.stringify(m1) === JSON.stringify(m2));
check("distintas entre días (o al menos plausible)", JSON.stringify(m1) !== JSON.stringify(m3));
check("tipos de misión sin repetir", new Set(m1.map((m) => m.kind)).size === 3);
const missions = GC.generateDailyMissions("2026-07-02");
const done = GC.applyEventToMissions(missions, { correct: true, hard: true, categoryId: "ec2", xp: 20, combo: 1 });
check("aplicar evento no rompe misiones", Array.isArray(done) && missions.every((m) => m.progress >= 0));

console.log("== Refrescar misiones (uso de monedas) ==");
const repl = GC.generateReplacementMission(["answer", "correct", "combo"], () => 0.5);
check("misión de reemplazo es válida", repl && repl.text && repl.reward && repl.progress === 0 && repl.done === false);
check("evita los tipos ya presentes", !["answer", "correct", "combo"].includes(repl.kind));
const allKinds = GC.generateReplacementMission(["answer","correct","combo","hard","xp","category"], () => 0.5);
check("si todos los tipos están, aún genera una", !!allKinds && !!allKinds.text);
check("coste base = 20", GC.refreshCost(0) === 20);
check("coste sube con cada refresco", GC.refreshCost(1) === 35 && GC.refreshCost(3) === 65);
check("coste monótono creciente", GC.refreshCost(5) > GC.refreshCost(4));

console.log("== Repetición espaciada ==");
const now = Date.now();
let qs = GC.scheduleReview(null, false, now);
check("fallo → caja 0, repaso en 10 min", qs.box === 0 && qs.due === now + GC.LEITNER_MS[0]);
qs = GC.scheduleReview(qs, true, now);
check("acierto → sube de caja", qs.box === 1 && qs.due === now + GC.LEITNER_MS[1]);
check("isDue detecta pendiente", GC.isDue({ w: 1, due: now - 1000 }, now) === true);
check("isDue ignora futuras", GC.isDue({ w: 1, due: now + 99999 }, now) === false);

console.log("== Selección de preguntas ==");
const stateQ = {};
const quick = GC.buildQueue("quick", { count: 10 }, QUESTIONS, idx, stateQ, now);
check("ronda rápida devuelve 10", quick.length === 10);
check("sin duplicados en ronda rápida", new Set(quick.map((q) => q.id)).size === 10);
const catId = GC.CATEGORY_DEFS[0].id;
const camp = GC.buildQueue("campaign", { categoryId: catId, count: 10 }, QUESTIONS, idx, stateQ, now);
check("campaña respeta la categoría", camp.every((q) => idx.byQ[q.id] === catId));
const boss = GC.buildQueue("boss", { categoryId: catId, count: 5 }, QUESTIONS, idx, stateQ, now);
check("boss devuelve 5 de la categoría", boss.length === 5 && boss.every((q) => idx.byQ[q.id] === catId));

console.log("== Filtro por packs de examen ==");
const onlyExam2 = QUESTIONS.filter((q) => q.exam === "Exam 2");
check("el banco tiene Exam 2", onlyExam2.length > 0);
const q2quick = GC.buildQueue("quick", { count: 10 }, onlyExam2, idx, stateQ, now);
check("con pool filtrado la ronda solo saca de ese pack", q2quick.every((q) => q.exam === "Exam 2"));
const q2surv = GC.buildQueue("survival", {}, onlyExam2, idx, stateQ, now);
check("supervivencia respeta el pool filtrado", q2surv.length === onlyExam2.length && q2surv.every((q) => q.exam === "Exam 2"));

console.log("== Modo en orden ==");
const ord = GC.buildQueue("ordered", { offset: 16 }, QUESTIONS, idx, stateQ, now);
check("empieza en la posición del offset (16 -> saa-16)", ord[0].id === "saa-16");
check("recorre en orden sin saltos", ord[1].id === "saa-17" && ord[2].id === "saa-18");
check("llega hasta el final del pool", ord.length === QUESTIONS.length - 15);
const ordClamp = GC.buildQueue("ordered", { offset: 99999 }, QUESTIONS, idx, stateQ, now);
check("offset fuera de rango se acota", ordClamp.length === 1);

console.log("== Repaso incluye falladas ==");
const reviewState = {
  "saa-1": { s: 1, c: 0, w: 1, box: 0, due: now + 999999, flag: false }, // fallada, aún no due
  "saa-2": { s: 2, c: 1, w: 1, box: 0, due: now - 1000, flag: false },   // due
  "saa-3": { s: 1, c: 1, w: 0, box: 1, due: now + 999999, flag: true },  // marcada
  "saa-4": { s: 1, c: 1, w: 0, box: 1, due: now + 999999, flag: false }, // acertada: fuera
};
const rev = GC.buildQueue("review", { count: 15 }, QUESTIONS, idx, reviewState, now);
const revIds = new Set(rev.map((q) => q.id));
check("incluye la fallada aunque no toque aún", revIds.has("saa-1"));
check("incluye la programada (due)", revIds.has("saa-2"));
check("incluye la marcada ★", revIds.has("saa-3"));
check("excluye la acertada sin marcar", !revIds.has("saa-4"));

console.log("== Corrección de respuestas (igual que el quiz clásico) ==");
const qMulti = { correct: ["A", "C"] };
check("multirespuesta exacta", GC.checkAnswer(qMulti, ["C", "A"]) === true);
check("parcial no cuenta", GC.checkAnswer(qMulti, ["A"]) === false);
check("de más no cuenta", GC.checkAnswer(qMulti, ["A", "B", "C"]) === false);

console.log("== Racha diaria ==");
let streak = GC.updateDailyStreak(null, "2026-07-01");
check("primer día = 1", streak.days === 1);
streak = GC.updateDailyStreak(streak, "2026-07-02");
check("día consecutivo suma", streak.days === 2);
streak = GC.updateDailyStreak(streak, "2026-07-02");
check("mismo día no duplica", streak.days === 2);
streak = GC.updateDailyStreak(streak, "2026-07-05");
check("hueco resetea a 1", streak.days === 1);

console.log("");
if (failures > 0) {
  console.error(`${failures} comprobaciones fallidas.`);
  process.exit(1);
}
console.log("Todas las comprobaciones pasan ✔");
