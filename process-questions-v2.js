// Script to process SAA-C03 questions and merge with solutions - Version 2
const fs = require('fs');

// Read files
const questionsFile = fs.readFileSync('AWS_SAA_C03_preguntas_extraidas.txt', 'utf8');
const solutionsFile = fs.readFileSync('AWS SAA-03 Solution.txt', 'utf8');

// Parse questions from the extracted text
function parseQuestions(content) {
  const questions = [];
  const lines = content.split('\n');
  let currentQuestion = null;
  let currentText = [];
  let currentOptions = [];
  let lastOptionLetter = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Match Question #N
    const questionMatch = trimmed.match(/^Question\s+#(\d+)$/i);
    if (questionMatch) {
      if (currentQuestion && currentOptions.length >= 2) {
        questions.push({
          num: parseInt(currentQuestion),
          text: currentText.join(' ').trim(),
          options: currentOptions
        });
      }
      currentQuestion = questionMatch[1];
      currentText = [];
      currentOptions = [];
      lastOptionLetter = null;
      continue;
    }
    
    // Skip page markers and headers
    if (trimmed.startsWith('=====') || 
        trimmed.startsWith('Preguntas extraidas') ||
        trimmed.startsWith('Paginas con texto') ||
        trimmed.startsWith('Nota: texto extraido')) {
      continue;
    }
    
    // Match options A, B, C, D, E, F - must start at beginning of line
    const optionMatch = line.match(/^([A-F])\.\s*(.+)$/);
    if (optionMatch && currentQuestion) {
      currentOptions.push({
        letter: optionMatch[1],
        text: optionMatch[2].trim()
      });
      lastOptionLetter = optionMatch[1];
      continue;
    }
    
    // If line is not empty and not a new option, check if it's a continuation
    if (currentQuestion && trimmed) {
      // Check if this looks like a continuation of the last option
      // (doesn't start with a letter+dot pattern)
      if (lastOptionLetter && !trimmed.match(/^[A-F]\./) && !trimmed.match(/^Question/i)) {
        // Check if next line starts with next option letter or is Question
        const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
        const isNextOption = nextLine.match(/^[B-F]\./) || nextLine.match(/^Question/i) || nextLine.startsWith('=====');
        const isContinuation = !trimmed.match(/^[A-Z][a-z]/); // Doesn't start with capital letter (sentence)
        
        // If we have options and this line looks like continuation, append to last option
        if (currentOptions.length > 0 && (isNextOption || isContinuation || trimmed.length < 100)) {
          const lastOpt = currentOptions[currentOptions.length - 1];
          lastOpt.text += ' ' + trimmed;
          continue;
        }
      }
      
      // Otherwise add to question text (but only if we haven't started collecting options yet)
      if (currentOptions.length === 0) {
        currentText.push(trimmed);
      }
    }
  }
  
  // Don't forget the last question
  if (currentQuestion && currentOptions.length >= 2) {
    questions.push({
      num: parseInt(currentQuestion),
      text: currentText.join(' ').trim(),
      options: currentOptions
    });
  }
  
  return questions;
}

// Parse solutions - read line by line to handle various formats
function parseSolutions(content) {
  const solutions = {};
  const lines = content.split('\n');
  
  let currentNum = null;
  let currentBlock = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Try multiple patterns for question number at start of line:
    // Pattern 1: "N] " (bracket with space) - Q1-50
    // Pattern 2: "N.Text" or "N]Text" (no space) - Q51+
    // Pattern 3: "N]" at end of line
    let numMatch = line.match(/^(\d+)\]\s+/);  // Standard format: "46] "
    
    if (!numMatch) {
      numMatch = line.match(/^(\d+)\.([A-Z])/);  // No space format: "51.A company..."
    }
    
    if (!numMatch) {
      numMatch = line.match(/^(\d+)\]([A-Z])/);  // Bracket no space: "51]A company..."
    }
    
    if (numMatch) {
      // Process previous block if exists
      if (currentNum && currentBlock.length > 0) {
        const result = extractAnswerAndExplanation(currentBlock.join('\n'));
        if (result.answer || result.answerTextHint) {
          solutions[currentNum] = result;
        }
      }
      
      // Start new block
      currentNum = parseInt(numMatch[1]);
      // Keep rest of line after the matched pattern
      currentBlock = [line.substring(numMatch[0].length - (numMatch[2] ? 1 : 0))];
    } else if (currentNum !== null) {
      currentBlock.push(line);
    }
  }
  
  // Process last block
  if (currentNum && currentBlock.length > 0) {
    const result = extractAnswerAndExplanation(currentBlock.join('\n'));
    if (result.answer || result.answerTextHint) {
      solutions[currentNum] = result;
    }
  }
  
  return solutions;
}

function extractAnswerAndExplanation(text) {
  const trimmed = text.trim();
  let answer = null;
  let answers = [];
  let explanation = '';
  
  // Pattern 1: "Correct answer X:" or "Correct answer is X" - most reliable
  const correctMatch = trimmed.match(/[Cc]orrect\s+[Aa]nswer\s*(?:[Ii]s\s+)?([A-F])[:\.\s]/);
  if (correctMatch) {
    answer = correctMatch[1];
    answers = [answer];
    const idx = trimmed.indexOf(correctMatch[0]);
    const after = trimmed.substring(idx + correctMatch[0].length);
    explanation = cleanExplanation(after);
  }
  
  // Pattern 2: "Answer(s): X)" or "Answer: X)" - single or multiple
  if (!answer) {
    const answerPattern = trimmed.match(/[Aa]nswers?:\s*([A-F](?:\s*[,+&]\s*[A-F])*)[:\)]/);
    if (answerPattern) {
      const letters = answerPattern[1].match(/[A-F]/g);
      if (letters) {
        answers = letters;
        answer = letters[0];
      }
      const idx = trimmed.indexOf(answerPattern[0]);
      const after = trimmed.substring(idx + answerPattern[0].length);
      explanation = cleanExplanation(after);
    }
  }
  
  // Pattern 3: "ans-X." or "ans- X" where X is an uppercase letter A-F
  if (!answer) {
    const ansMatch = trimmed.match(/\bans[-:]?\s*([A-F])[\.\s]/);
    if (ansMatch) {
      answer = ansMatch[1];
      answers = [answer];
      const afterAns = trimmed.substring(trimmed.indexOf(ansMatch[0]) + ansMatch[0].length);
      explanation = cleanExplanation(afterAns);
    }
  }
  
  // Pattern 4: A line starting with "X. <text>" where X is A-F (answer option format)
  // Search all lines, skip lines that are clearly the restated question text
  if (!answer) {
    const lines = trimmed.split('\n');
    for (const line of lines) {
      const directMatch = line.match(/^\s*([A-F])\.\s*(.+)/);
      if (directMatch) {
        const afterDot = directMatch[2].trim();
        // Only skip if the text immediately starts like a question: "A company wants...", "A solutions architect..."
        // These are question-restating lines, not answer options
        if (directMatch[1] === 'A' && afterDot.match(/^(company|solutions?\s+architect|developer|user|team|business|startup|financial|global|media|retail)\b/i)) {
          continue; // Likely restated question text, not an answer
        }
        answer = directMatch[1];
        answers = [answer];
        explanation = cleanExplanation(afterDot);
        break;
      }
    }
  }
  
  // Pattern 5: "Option X:" or "Option X," or "X) " or "X - "
  if (!answer) {
    const optionMatch = trimmed.match(/[Oo]ption\s+([A-F])[\s,:-]/);
    if (optionMatch) {
      answer = optionMatch[1];
      answers = [answer];
      const after = trimmed.substring(trimmed.indexOf(optionMatch[0]) + optionMatch[0].length);
      explanation = cleanExplanation(after);
    }
  }
  
  // Pattern 6: A line starting with just a letter followed by space and uppercase word
  // (e.g. "  B Create an AWS..." but NOT "A company..." which is a sentence)
  if (!answer) {
    const lines = trimmed.split('\n');
    for (const line of lines) {
      const simpleMatch = line.match(/^\s*([A-F])\s+([A-Z][a-z])/);
      if (simpleMatch) {
        // Skip common sentence starters: "A company", "A solutions", "A developer", etc.
        if (line.match(/^\s*A\s+(company|solutions|developer|user|team|business|startup|financial|global|media|retail)/i)) {
          continue;
        }
        answer = simpleMatch[1];
        answers = [answer];
        explanation = cleanExplanation(line.substring(line.indexOf(simpleMatch[1]) + 2));
        break;
      }
    }
  }
  
  // Pattern 7: Look for "X) description" pattern anywhere
  if (!answer) {
    const anyMatch = trimmed.match(/\b([A-F])\)\s+.{10,100}/);
    if (anyMatch) {
      answer = anyMatch[1];
      answers = [answer];
      explanation = cleanExplanation(trimmed);
    }
  }
  
  // Pattern 8: "ans-" followed by answer text (no letter) - store text for option matching during merge
  let answerTextHint = null;
  if (!answer) {
    const ansTextMatch = trimmed.match(/\bans[-:]?\s*\.?\s*(.+?)(?:\n\n|\n|$)/);
    if (ansTextMatch && ansTextMatch[1].length > 5) {
      answerTextHint = ansTextMatch[1].trim();
      explanation = cleanExplanation(answerTextHint);
    }
  }
  
  return { answer, answers, explanation, answerTextHint };
}

function cleanExplanation(text) {
  // Remove separator lines and limit length
  return text
    .split('\n')
    .filter(l => !l.match(/^[-=]+$/))
    .join(' ')
    .trim()
    .substring(0, 800);
}

console.log('Parsing questions...');
const questions = parseQuestions(questionsFile);
console.log(`Found ${questions.length} questions`);

console.log('Parsing solutions...');
const solutions = parseSolutions(solutionsFile);
console.log(`Found ${Object.keys(solutions).length} solutions`);

// Debug: show sample solutions
console.log('\nSample solutions (first 20):');
for (let i = 1; i <= 20; i++) {
  if (solutions[i]) {
    const ans = solutions[i].answers ? solutions[i].answers.join(',') : solutions[i].answer;
    console.log(`Q${i}: ${ans} - ${solutions[i].explanation.substring(0, 40)}...`);
  } else {
    console.log(`Q${i}: NOT FOUND`);
  }
}

// Debug: show missing in range 680-684
console.log('\nLast 5 solutions check:');
for (let i = 680; i <= 684; i++) {
  if (solutions[i]) {
    const ans = solutions[i].answers ? solutions[i].answers.join(',') : solutions[i].answer;
    console.log(`Q${i}: FOUND - ${ans}`);
  } else {
    console.log(`Q${i}: NOT FOUND - checking block content...`);
    // Find this block in raw content
    const blockMatch = solutionsFile.match(new RegExp(`${i}\\][\\s\\S]{0,200}`));
    if (blockMatch) {
      console.log(`  Raw start: ${blockMatch[0].substring(0, 80)}...`);
    }
  }
}

// Find all missing questions
console.log('\nAnalyzing missing questions...');
const missingQuestions = [];
const questionNumbers = questions.map(q => q.num);
for (let i = 1; i <= 684; i++) {
  const hasQuestion = questionNumbers.includes(i);
  const hasSolution = !!solutions[i];
  if (hasQuestion && !hasSolution) {
    missingQuestions.push(i);
  }
}
console.log(`Questions with no solution: ${missingQuestions.length}`);
console.log(`Missing question numbers: ${missingQuestions.slice(0, 30).join(', ')}${missingQuestions.length > 30 ? '...' : ''}`);

// Merge data
const merged = [];
let resolvedByHint = 0;
for (const q of questions) {
  const sol = solutions[q.num];
  if (!sol) continue;
  
  // If no answer letter but we have a text hint, try matching against options
  if (!sol.answer && sol.answerTextHint) {
    const hint = sol.answerTextHint.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;
    for (const opt of q.options) {
      const optText = opt.text.toLowerCase();
      // Check if the hint is a substantial substring of the option or vice versa
      if (optText.includes(hint) || hint.includes(optText)) {
        const score = Math.min(hint.length, optText.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = opt.letter;
        }
      } else {
        // Check word overlap
        const hintWords = hint.split(/\s+/).filter(w => w.length > 3);
        const optWords = optText.split(/\s+/).filter(w => w.length > 3);
        const overlap = hintWords.filter(w => optWords.includes(w)).length;
        const score = overlap / Math.max(hintWords.length, 1);
        if (score > 0.4 && score > bestScore) {
          bestScore = score;
          bestMatch = opt.letter;
        }
      }
    }
    if (bestMatch) {
      sol.answer = bestMatch;
      sol.answers = [bestMatch];
      resolvedByHint++;
    }
  }
  
  if (!(sol.answer || (sol.answers && sol.answers.length > 0))) continue;
  
  // Ensure we have all options (A-F for multi-choice questions)
  const options = [];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (const letter of letters) {
    const opt = q.options.find(o => o.letter === letter);
    if (opt) {
      options.push({ k: letter, html: opt.text });
    }
  }
  
  // Only include if we have at least 2 options
  if (options.length >= 2) {
    // Use answers array if available, otherwise single answer
    const correctAnswers = (sol.answers && sol.answers.length > 0) ? sol.answers : [sol.answer];
    
    merged.push({
      id: `saa-${q.num}`,
      exam: `Exam ${Math.ceil(q.num / 65)}`,
      index: ((q.num - 1) % 65) + 1,
      tags: ['SAA-C03'],
      prompt: q.text,
      options: options,
      correct: correctAnswers,
      explanation: sol.explanation || 'No explanation available.'
    });
  }
}
console.log(`Resolved ${resolvedByHint} questions by matching answer text hint to options`);

// Apply manually-verified corrections (overrides parser answers for known cases,
// e.g. multi-answer questions the parser cannot fully detect)
const CORRECTIONS_FILE = 'quiz-corrections-log.json';
if (fs.existsSync(CORRECTIONS_FILE)) {
  try {
    const corrections = JSON.parse(fs.readFileSync(CORRECTIONS_FILE, 'utf8'));
    const byId = new Map(merged.map(q => [q.id, q]));
    let applied = 0;
    let notFound = 0;
    for (const corr of corrections) {
      const q = byId.get(corr.id);
      if (!q) { notFound++; continue; }
      const newAnswers = corr.new_correct.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
      if (newAnswers.length > 0) {
        q.correct = newAnswers;
        applied++;
      }
    }
    console.log(`Applied ${applied} manual corrections (${notFound} correction IDs not found in merged set)`);
  } catch (e) {
    console.warn(`Warning: could not apply corrections: ${e.message}`);
  }
} else {
  console.log('No corrections file found, skipping corrections step');
}

console.log(`\n✅ Successfully merged ${merged.length} questions with solutions`);

// Generate the single consolidated data file used by quiz.html
const allOutput = `// AWS Solutions Architect Associate (SAA-C03) - Complete Question Bank
// Total: ${merged.length} questions
// Auto-generated by process-questions-v2.js — do not edit by hand.

const QUESTIONS_ALL = ${JSON.stringify(merged, null, 2)};

// Assign to global QUESTIONS if not already defined
if (typeof QUESTIONS === 'undefined') {
  window.QUESTIONS = QUESTIONS_ALL;
} else {
  QUESTIONS.push(...QUESTIONS_ALL);
}
`;

fs.writeFileSync('quiz-data-all.js', allOutput);
console.log(`\n✓ Created quiz-data-all.js with all ${merged.length} questions`);
console.log('Load it in quiz.html with: <script src="quiz-data-all.js"></script>');
