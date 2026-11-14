// Practice mock exams (as many as you like): the test format the student describes, and the
// rules shared by the exam page and the AI routes. Saved on the nest:
//   nest.examFormat   = { mc, tf, short, written, mcChoices, minutes, notes }
//   nest.mockExams    = [{ id, at, questions, answers, results, score }]   (finished exams)
//   nest.mockInProgress = { id, questions, answers, secondsLeft, startedAt }  (the one being taken)
// A question: { type: "mc" | "tf" | "short" | "written", question, choices?, answerIndex?,
//               answers? (accepted short answers), rubric? (written), explanation, concept }

export const QUESTION_TYPES = {
  mc: { label: "Multiple choice", short: "multiple choice" },
  tf: { label: "True / false", short: "true/false" },
  short: { label: "Short answer", short: "short answer", hint: "A word, number, or phrase" },
  written: { label: "Written response", short: "written response", hint: "Explain or show your work" },
};

export const DEFAULT_FORMAT = { mc: 20, tf: 0, short: 0, written: 0, mcChoices: 4, minutes: "", notes: "" };
export const MAX_QUESTIONS = 60;

export function totalQuestions(format) {
  return Object.keys(QUESTION_TYPES).reduce((n, t) => n + (Number(format?.[t]) || 0), 0);
}

// "20 multiple choice + 2 written response · 45 minutes"
export function formatSummary(format) {
  const parts = Object.entries(QUESTION_TYPES)
    .filter(([t]) => Number(format[t]) > 0)
    .map(([t, info]) => `${format[t]} ${info.short}`);
  const time = Number(format.minutes) > 0 ? `${format.minutes} minutes` : "untimed";
  return `${parts.join(" + ") || "No questions"} · ${time}`;
}

// The order questions are written in: batches of one type, small enough to write quickly.
export function examBatches(format) {
  const batches = [];
  for (const type of Object.keys(QUESTION_TYPES)) {
    let left = Math.max(0, Number(format[type]) || 0);
    const size = type === "written" ? 3 : 10;
    while (left > 0) {
      batches.push({ type, count: Math.min(size, left) });
      left -= size;
    }
  }
  return batches;
}

// ---- No repeats ---------------------------------------------------------------------------

const STOP = new Set("the a an of to in and or is are be for on with what which that this by as at from it its how why does do find".split(" "));

// The question's words. `wordsOnly` leaves out numbers and math, to spot the same question
// asked again with different numbers.
function words(text, wordsOnly = false) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(wordsOnly ? /[^a-z\s]/g : /[^a-z0-9.\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > (wordsOnly ? 2 : 1) && !STOP.has(w))
  );
}

function overlap(A, B) {
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / (A.size + B.size - shared);
}

// How alike two questions are, 0 to 1 (shared words / all words).
export function similarity(a, b) {
  return overlap(words(a), words(b));
}

// True if a question is the same as one asked before, a rewording of it, or the same question
// with only the numbers changed.
export function isRepeat(question, previous) {
  const plain = words(question, true);
  return previous.some((p) => {
    if (similarity(question, p) >= 0.5) return true;
    const other = words(p, true);
    return plain.size >= 3 && other.size >= 3 && overlap(plain, other) >= 0.75;
  });
}

// ---- Grading ------------------------------------------------------------------------------

const clean = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9./-]/g, "");

// Grades what the app can on its own. Returns { score: 0-1, needsAI } for one question.
export function gradeLocally(q, response) {
  if (q.type === "mc" || q.type === "tf") return { score: response === q.answerIndex ? 1 : 0, needsAI: false };
  const text = String(response ?? "").trim();
  if (!text) return { score: 0, needsAI: false };
  if (q.type === "short" && (q.answers ?? []).some((a) => clean(a) === clean(text))) return { score: 1, needsAI: false };
  return { score: 0, needsAI: true }; // a different wording, or a written response: the AI decides
}

// The exam's score (0-1) from each question's result (written ones can be partly right).
export function examScore(results) {
  if (!results.length) return 0;
  return results.reduce((sum, r) => sum + (r.score ?? 0), 0) / results.length;
}
