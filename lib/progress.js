// Progress through the nest: cooked levels, unlocking levels, points, and the predicted grade.
// These are plain functions (no React), so the rules live in one place.

// Quiz score (0 to 1) → how "cooked" a level is. Emoji are placeholders for custom graphics.
export const COOK_LEVELS = [
  { min: 0, name: "Soft-boiled", emoji: "🥚", color: "oklch(0.95 0.04 90)" },
  { min: 0.6, name: "Hard-boiled", emoji: "🥚", color: "oklch(0.93 0.09 95)" },
  { min: 0.8, name: "Sunny-side up", emoji: "🍳", color: "oklch(0.88 0.14 90)" },
  { min: 1, name: "Golden fried", emoji: "🌟", color: "oklch(0.8 0.16 75)" },
];

export function cookLevel(score) {
  return [...COOK_LEVELS].reverse().find((level) => score >= level.min);
}

export const POINTS_PER_CORRECT = 10;

// A corn chest appears after every few levels (but not right before the mock exam).
export const CHEST_EVERY = 3;
const CHEST_MIN_CORN = 15;
const CHEST_MAX_CORN = 30;

export function hasChestAfter(levelNumber, totalLevels) {
  return levelNumber % CHEST_EVERY === 0 && levelNumber < totalLevels;
}

export function randomChestCorn() {
  return CHEST_MIN_CORN + Math.floor(Math.random() * (CHEST_MAX_CORN - CHEST_MIN_CORN + 1));
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

// The first section not finished yet (null when everything is done).
export function currentSectionId(plan) {
  return allSections(plan).find((s) => !s.completed)?.id ?? null;
}

// A section can be played once it's finished or it's the next one up.
export function isUnlocked(plan, id) {
  const section = findSection(plan, id);
  return Boolean(section?.completed || currentSectionId(plan) === id);
}

// Returns a NEW plan with the section marked done. Keeps the best score if replayed.
export function completeSection(plan, id, score) {
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      sections: day.sections.map((s) =>
        s.id === id ? { ...s, completed: true, score: Math.max(score, s.score ?? 0) } : s
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
