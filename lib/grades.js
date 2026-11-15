import { findSubject } from "@/lib/subjects";

// Classes use a grade (0-100%). Tests with their own scoring (SAT, ACT, AMC...) use a score in that
// test's scale instead (lib/subjects.js). A test's scores are saved as test.currentScore and
// test.goalScore, and ALSO as a percent of the max in test.currentGrade and test.goalGrade, which
// the rest of the app uses (egg colors, mock exams). The current score can be left blank when no
// practice test has been taken yet; then currentScore and currentGrade are null.

// The test's score scale ({ min, max, step, range, examples }), or null for a class.
export function scoreScale(test) {
  return findSubject(test?.subjectId)?.score ?? null;
}

// A score as a percent of the max, to one decimal (1400 on the SAT → 87.5).
export function toPercent(score, scale) {
  return Math.round((score / scale.max) * 1000) / 10;
}

// A percent in the test's own scale, rounded like real scores (85% of the SAT → 1360).
export function fromPercent(percent, scale) {
  const score = Math.round(((percent / 100) * scale.max) / scale.step) * scale.step;
  return Math.min(scale.max, Math.max(scale.min, score));
}

// The current or goal ("current" | "goal") as shown to the student: "1400" for a test with a score
// scale, "90%" for a class. Nests made before score scales show their percent.
export function gradeText(test, which) {
  const score = test[`${which}Score`];
  if (scoreScale(test) && score !== undefined) return score === null ? "No score yet" : String(score);
  return `${test[`${which}Grade`]}%`;
}

// The fields to save on a test, from what was typed in the form.
export function gradeFields(scale, currentRaw, goalRaw) {
  if (!scale) return { currentGrade: Number(currentRaw), goalGrade: Number(goalRaw) };
  const currentScore = String(currentRaw).trim() === "" ? null : Number(currentRaw);
  const goalScore = Number(goalRaw);
  return {
    currentScore,
    goalScore,
    currentGrade: currentScore === null ? null : toPercent(currentScore, scale),
    goalGrade: toPercent(goalScore, scale),
  };
}

// What the form should start with when editing: scores for a test, grades for a class.
export function gradeInputs(test) {
  const scale = scoreScale(test);
  if (!scale) return { current: String(test.currentGrade ?? ""), goal: String(test.goalGrade ?? "") };
  const pick = (score, percent) => (score !== undefined ? score : percent == null ? null : fromPercent(percent, scale));
  const current = pick(test.currentScore, test.currentGrade);
  const goal = pick(test.goalScore, test.goalGrade);
  return { current: current === null ? "" : String(current), goal: goal === null ? "" : String(goal) };
}

// The student's grades for the AI's prompt.
export function gradePromptLines(test) {
  const scale = scoreScale(test);
  if (scale && test.goalScore !== undefined) {
    const current = test.currentScore === null ? "none yet (no practice test taken)" : test.currentScore;
    return `- Current ${test.subject} score: ${current} (scored ${scale.range})\n- Goal score: ${test.goalScore}`;
  }
  return `- Current grade in the class: ${test.currentGrade}%\n- Goal grade: ${test.goalGrade}%`;
}

// Checks a current and goal grade (as typed, so they may be strings). Pass the test's score scale
// to check scores instead; then the current score may be left blank.
// Returns { error: "" } if they're fine, or { error, canSwap } if not.
// canSwap means the goal is lower than the current grade, which is usually a mix-up.
export function checkGrades(currentRaw, goalRaw, scale = null) {
  const current = Number(currentRaw);
  const goal = Number(goalRaw);
  const blank = (raw) => String(raw).trim() === "";
  const min = scale?.min ?? 0;
  const max = scale?.max ?? 100;
  const outside = (n) => Number.isNaN(n) || n < min || n > max;

  if (scale) {
    if (!blank(currentRaw) && outside(current)) return { error: `Enter your current score (${scale.range}), or leave it blank.` };
    if (blank(goalRaw) || outside(goal)) return { error: `Enter your goal score (${scale.range}).` };
    if (!blank(currentRaw) && goal < current) {
      return { error: `Your goal (${goal}) is lower than your current score (${current}). Did you mix them up?`, canSwap: true };
    }
    return { error: "" };
  }

  if (blank(currentRaw) || outside(current)) {
    return { error: "Enter your current grade (0-100)." };
  }
  if (blank(goalRaw) || outside(goal)) {
    return { error: "Enter your goal grade (0-100)." };
  }
  if (goal < current) {
    return {
      error: `Your goal (${goal}%) is lower than your current grade (${current}%). Did you mix them up?`,
      canSwap: true,
    };
  }
  return { error: "" };
}
