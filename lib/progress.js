// Progress through the nest: egg results, unlocking levels, chests, and the predicted grade.
// These are plain functions (no React), so the rules live in one place.

// Each level is an egg. Its best quiz score (0 to 1) decides what it becomes:
//   100%                 → it hatches (and a chick joins your coop)
//   your goal grade or up → a golden egg (and you earn corn)
//   below your goal grade → a fried egg (retry to fix it)
export const EGG_RESULTS = {
  hatched: { id: "hatched", name: "Hatched!", emoji: "🐣" },
  golden: { id: "golden", name: "Golden egg", emoji: "🌟" },
  fried: { id: "fried", name: "Fried", emoji: "🍳" },
};

// The goal grade as a fraction (90% → 0.9). Falls back to 80% if there's no test yet.
export function goalFraction(test) {
  return (test?.goalGrade ?? 80) / 100;
}

export function eggResult(score, goal) {
  if (score >= 1) return EGG_RESULTS.hatched;
  if (score >= goal) return EGG_RESULTS.golden;
  return EGG_RESULTS.fried;
}

// A corn chest appears after every few levels (but not right before the mock exam).
// How much corn it holds is in lib/flock.js.
export const CHEST_EVERY = 3;

export function hasChestAfter(levelNumber, totalLevels) {
  return levelNumber % CHEST_EVERY === 0 && levelNumber < totalLevels;
}

// Returns a NEW plan with the chest after `sectionId` marked open, remembering how much corn it held.
export function openChest(plan, sectionId, corn) {
  return { ...plan, chests: { ...plan.chests, [sectionId]: corn } };
}

// All sections in order, across all days.
export function allSections(plan) {
  return plan.days.flatMap((day) => day.sections);
}

export function findSection(plan, id) {
  return allSections(plan).find((s) => s.id === id);
}

// A level is passed once its best quiz score reaches the goal grade (`goal` is a fraction, 0.9 = 90%).
export function isPassed(section, goal) {
  return Boolean(section.completed && section.score >= goal);
}

// The first level not passed yet (null when every level is passed). The next egg stays locked
// until this one is passed, so a fried egg has to be retried before moving on.
export function currentSectionId(plan, goal) {
  return allSections(plan).find((s) => !isPassed(s, goal))?.id ?? null;
}

// A level can be played once it's been tried before, or it's the one up next.
export function isUnlocked(plan, id, goal) {
  const section = findSection(plan, id);
  return Boolean(section?.completed || currentSectionId(plan, goal) === id);
}

// Groups a quiz's questions by concept. A concept is understood when every counted question on it
// was right. answers[i] = { correct, flagged } (from the Quiz). Older quizzes have no concept tags,
// so each of their questions becomes its own "concept", named after the question.
export function conceptSummary(questions, answers) {
  const byConcept = new Map();
  questions.forEach((q, i) => {
    if (answers[i]?.flagged) return; // flagged questions don't count
    const name = q.concept?.trim() || shorten(q.question);
    const key = name.toLowerCase();
    const entry = byConcept.get(key) ?? { name, right: 0, total: 0 };
    entry.total += 1;
    if (answers[i]?.correct) entry.right += 1;
    byConcept.set(key, entry);
  });
  const concepts = [...byConcept.values()];
  return {
    understood: concepts.filter((c) => c.right === c.total).map((c) => c.name),
    missed: concepts.filter((c) => c.right < c.total).map((c) => c.name),
  };
}

function shorten(text) {
  const words = text.replace(/[?.!]+$/, "").split(/\s+/);
  return words.length > 7 ? `${words.slice(0, 7).join(" ")}…` : words.join(" ");
}

// Returns a NEW plan with the section marked done. Keeps the best score if replayed, and
// remembers which concepts have already earned corn (`earnedConcepts`, lowercase names).
export function completeSection(plan, id, score, earnedConcepts = []) {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      sections: day.sections.map((s) =>
        s.id === id
          ? {
              ...s,
              completed: true,
              score: Math.max(score, s.score ?? 0),
              earnedConcepts: [...new Set([...(s.earnedConcepts ?? []), ...earnedConcepts])],
            }
          : s
      ),
    })),
  };
}

export function quizAverage(plan) {
  const done = allSections(plan).filter((s) => s.completed);
  if (!done.length) return null;
  return done.reduce((sum, s) => sum + s.score, 0) / done.length;
}

// Predicted test grade (0-100): mostly the mock exam, partly the level quizzes.
export function predictedGrade(mockScore, quizAvg) {
  const blended = quizAvg === null ? mockScore : 0.7 * mockScore + 0.3 * quizAvg;
  return Math.round(blended * 100);
}
