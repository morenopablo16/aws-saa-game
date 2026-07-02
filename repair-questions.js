/*
 * repair-questions.js — Detecta y repara errores de parseo en quiz-data-all.js.
 *
 * Clases de error:
 *   1. "glue": el extractor del PDF borró marcadores "X. " en mitad de una frase
 *      ("ALB. Use" -> "ALUse", "DynamoDB. Use" -> "DynamoDUse").
 *   2. "truncated": opciones cortadas a mitad de frase porque el texto seguía
 *      en la línea siguiente del PDF ("...EventBridge (Amazon" sin el resto).
 *
 * Uso:
 *   node repair-questions.js           -> informe (dry-run, no toca nada)
 *   node repair-questions.js --apply   -> reescribe quiz-data-all.js y guarda
 *                                         el log en quiz-parse-fixes.json
 */
"use strict";

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");
const DIR = __dirname;

// ---------- Carga de datos ----------
function loadQuestions() {
  const src = fs.readFileSync(path.join(DIR, "quiz-data-all.js"), "utf8");
  const fn = new Function("window", src + "\n;return QUESTIONS_ALL;");
  return fn({});
}

// Fuente extraída del PDF: se usa para recuperar texto truncado.
// Se normaliza a una sola línea por bloque lógico.
function loadSourceText() {
  const raw = fs.readFileSync(path.join(DIR, "AWS_SAA_C03_preguntas_extraidas.txt"), "utf8");
  return raw
    .split(/\r?\n/)
    .filter((l) => !/^=====\s*PAGINA/.test(l))
    .join("\n");
}

const norm = (s) => s.replace(/\s+/g, " ").trim();

// ---------- Detector 1: pegados por borrado de "X. " ----------
// El texto pegado une el final de una frase con el inicio de la siguiente:
// "...to the ALUse the managed..." (falta "B. ").
// Detectamos verbo imperativo pegado a una palabra que no termina como palabra inglesa normal.
const GLUE_VERBS = "(Use|Turn|Create|Configure|Rotate|Attach|Store|Save|Set|Enable|Add|Update|Deploy|Choose|Select|Launch|Modify|Associate|Monitor|Verify|Import|Export|Point|Route|Install|Migrate|Then|Apply|Run|Move|Copy|Take|Restore|Place|Write|Read|Query|Publish|Subscribe|Provision|Order|Schedule|Process|Mount|Host|Serve|Redirect|Forward|Grant|Allow|Deny|Block|Encrypt|Decrypt|Upload|Download|Replicate|Sync|Stream|Invoke|Trigger|Connect|Register|Define|Build|Test|Review|Analyze|Scan|Filter|Sort|Group|Join|Split|Merge)";
// Palabras legítimas que terminan en mayúscula+verbo y no deben tocarse (CamelCase de AWS).
const GLUE_RX = new RegExp("\\b([A-Za-z0-9]*[A-Za-z])" + GLUE_VERBS + "\\b", "g");

// Un candidato es real si el prefijo termina en una letra que sugiere palabra cortada
// por el marcador borrado (p.ej. "AL" de "ALB", "DynamoD" de "DynamoDB").
// Lista blanca de prefijos conocidos como corruptos (letra borrada -> reconstrucción).
// Se rellena tras revisar el informe del dry-run.
const KNOWN_GLUE_FIXES = [
  // [regex sobre el texto, reemplazo] — todas verificadas contra el contexto real
  [/\bALUse\b/g, "ALB. Use"],                       // "to the ALB. Use the managed renewal…"
  [/\bDynamoDUse\b/g, "DynamoDB. Use"],             // "Amazon DynamoDB. Use the DynamoDB Streams…"
  [/\bDynamoDProvision\b/g, "DynamoDB. Provision"], // "to Amazon DynamoDB. Provision a DAX cluster…"
  [/\bNLProcess\b/g, "NLB. Process"],               // "target for the NLB. Process the data…"
  [/\bVPUpdate\b/g, "VPC. Update"],                 // "…VPC. Update the routes / route tables…"
  [/\bVPModify\b/g, "VPC. Modify"],                 // "attach it to the VPC. Modify the private subnet…"
  [/\bCImport\b/g, "CA. Import"],                   // "third-party CA. Import the certificate…"
];

function scanGlue(text) {
  const hits = [];
  let m;
  GLUE_RX.lastIndex = 0;
  while ((m = GLUE_RX.exec(text)) !== null) {
    hits.push(m[0]);
  }
  return hits;
}

function fixGlue(text) {
  let out = text;
  const applied = [];
  for (const [rx, rep] of KNOWN_GLUE_FIXES) {
    if (rx.test(out)) {
      out = out.replace(rx, rep);
      applied.push(rx.source + " -> " + rep);
    }
    rx.lastIndex = 0;
  }
  return { out, applied };
}

// ---------- Detector 2: opciones truncadas ----------
// Una opción está truncada si no termina en puntuación razonable
// o tiene paréntesis sin cerrar.
function looksTruncated(text) {
  const t = text.trim();
  if (!t) return false;
  const open = (t.match(/\(/g) || []).length;
  const close = (t.match(/\)/g) || []).length;
  if (open > close) return true;
  // Termina a mitad de frase: sin . ? ! " ) o cifra/unidad al final
  if (!/[.?!)"”%]$|\d$|\betc\b$/.test(t)) return true;
  return false;
}

// Busca el texto completo de una opción truncada en la fuente del PDF.
// Localiza el inicio de la opción y la extiende hasta el siguiente marcador.
function recoverFromSource(source, optionText) {
  const probe = norm(optionText).slice(0, 60);
  if (probe.length < 30) return null;
  // La fuente tiene saltos de línea arbitrarios: buscar con \s+ flexible.
  const rx = new RegExp(
    probe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"),
    ""
  );
  const m = rx.exec(source);
  if (!m) return null;
  const start = m.index;
  // Fin: siguiente "X. " a inicio de línea, "Question #", o doble salto.
  const rest = source.slice(start);
  const endRx = /\n(?=[A-H]\.\s)|\nQuestion\s*#|\n\s*\n/;
  const endM = endRx.exec(rest);
  const chunk = endM ? rest.slice(0, endM.index) : rest.slice(0, 1200);
  const full = norm(chunk);
  // Solo válido si extiende el texto truncado y empieza igual.
  const current = norm(optionText);
  if (full.length > current.length + 3 && full.startsWith(current.slice(0, Math.min(current.length, 80)))) {
    return full;
  }
  return null;
}

// Recuperación alternativa: la explicación suele contener la opción correcta completa.
function recoverFromExplanation(q, letter, optionText) {
  if (!q.explanation || !(q.correct || []).includes(letter)) return null;
  const expl = norm(q.explanation);
  const current = norm(optionText);
  const probe = current.slice(0, Math.min(current.length, 80));
  if (expl.startsWith(probe) && expl.length > current.length + 3) {
    return expl;
  }
  return null;
}

// ---------- Main ----------
const questions = loadQuestions();
const source = loadSourceText();

const report = { glue: [], truncated: [], unresolved: [], glueCandidates: new Set() };

for (const q of questions) {
  // 1) Pegados en prompt, explicación y opciones
  for (const field of ["prompt", "explanation"]) {
    for (const hit of scanGlue(q[field] || "")) report.glueCandidates.add(hit);
    const { out, applied } = fixGlue(q[field] || "");
    if (applied.length) {
      report.glue.push({ id: q.id, exam: q.exam, index: q.index, field, applied });
      q[field] = out;
    }
  }
  for (const opt of q.options || []) {
    for (const hit of scanGlue(opt.html || "")) report.glueCandidates.add(hit);
    const { out, applied } = fixGlue(opt.html || "");
    if (applied.length) {
      report.glue.push({ id: q.id, exam: q.exam, index: q.index, field: "option " + opt.k, applied });
      opt.html = out;
    }
  }

  // 2) Opciones truncadas
  for (const opt of q.options || []) {
    if (!looksTruncated(opt.html)) continue;
    let full = recoverFromSource(source, opt.html);
    let via = "source";
    if (!full) {
      full = recoverFromExplanation(q, opt.k, opt.html);
      via = "explanation";
    }
    if (full) {
      // Aplicar también las correcciones de pegado al texto recuperado.
      full = fixGlue(full).out;
      report.truncated.push({
        id: q.id, exam: q.exam, index: q.index, option: opt.k, via,
        before: opt.html.slice(-70),
        after: full.slice(-70),
      });
      opt.html = full;
    } else {
      report.unresolved.push({
        id: q.id, exam: q.exam, index: q.index, option: opt.k,
        tail: opt.html.slice(-60),
      });
    }
  }
}

// ---------- Salida ----------
console.log("== Candidatos de pegado detectados (revisar lista blanca) ==");
console.log([...report.glueCandidates].sort().join(", ") || "(ninguno)");
console.log("\n== Pegados corregidos: " + report.glue.length + " ==");
for (const g of report.glue) console.log(`  ${g.id} (${g.exam} #${g.index}) ${g.field}: ${g.applied.join("; ")}`);
console.log("\n== Opciones truncadas reparadas: " + report.truncated.length + " ==");
for (const t of report.truncated) console.log(`  ${t.id} (${t.exam} #${t.index}) opción ${t.option} [${t.via}]\n    antes: …${t.before}\n    ahora: …${t.after}`);
// La mayoría de "sin resolver" son benignas (el dump original no termina las
// opciones con punto). Solo son sospechosas las que cortan a mitad de frase.
const STRONG_RX = /(\(|\((?:Amazon|AWS)|\b(?:the|a|an|to|of|with|for|and|or|in|on|by|from|that|is|are|use|each)|,)$/i;
const strong = report.unresolved.filter((u) => {
  const t = u.tail.trim();
  return /\([^)]*$/.test(t) || STRONG_RX.test(t);
});
console.log("\n== Truncadas SIN resolver (benignas, sin punto final): " + (report.unresolved.length - strong.length) + " ==");
console.log("== Truncadas SIN resolver SOSPECHOSAS: " + strong.length + " ==");
for (const u of strong) console.log(`  ${u.id} (${u.exam} #${u.index}) opción ${u.option}: …${u.tail}`);

if (APPLY) {
  const header =
    "// AWS Solutions Architect Associate (SAA-C03) - Complete Question Bank\n" +
    "// Total: " + questions.length + " questions\n" +
    "// Auto-generated by process-questions-v2.js — do not edit by hand.\n" +
    "// Parse repairs applied by repair-questions.js (see quiz-parse-fixes.json).\n\n";
  const body = "const QUESTIONS_ALL = " + JSON.stringify(questions, null, 2) + ";\n\n" +
    "// Assign to global QUESTIONS if not already defined\n" +
    "if (typeof QUESTIONS === 'undefined') {\n" +
    "  window.QUESTIONS = QUESTIONS_ALL;\n" +
    "} else {\n" +
    "  QUESTIONS.push(...QUESTIONS_ALL);\n" +
    "}\n";
  fs.writeFileSync(path.join(DIR, "quiz-data-all.js"), header + body, "utf8");
  fs.writeFileSync(
    path.join(DIR, "quiz-parse-fixes.json"),
    JSON.stringify({ appliedAt: new Date().toISOString(), glue: report.glue, truncated: report.truncated, unresolved: report.unresolved }, null, 2),
    "utf8"
  );
  console.log("\nAplicado: quiz-data-all.js reescrito y log en quiz-parse-fixes.json");
} else {
  console.log("\nDry-run: nada modificado. Ejecuta con --apply para aplicar.");
}
