// Changes the student makes to a nest's study plan (Edit plan on the nest page), plus their
// feedback on lessons. Plain functions that return NEW nests, like lib/progress.js.

import { allSections } from "@/lib/progress";

const MAX_TITLE = 120;
const MAX_GOAL = 240;
const MAX_NOTE = 400;

// Forgets a lesson's saved lesson and paused place (when the egg is deleted or changed).
function forget(nest, id) {
  const levels = { ...nest.levels };
  const paused = { ...nest.paused };
  delete levels[id];
  delete paused[id];
  return { ...nest, levels, paused };
}

function mapSections(nest, change) {
  return {
    ...nest,
    plan: { ...nest.plan, days: nest.plan.days.map((day) => ({ ...day, sections: change(day.sections, day) })) },
  };
}

// Deletes one egg. A day left with no eggs is dropped too (it becomes a free day).
// The last egg in a plan can't be deleted.
export function deleteSection(nest, id) {
  if (allSections(nest.plan).length <= 1) return nest;
  const next = forget(mapSections(nest, (sections) => sections.filter((s) => s.id !== id)), id);
  return { ...next, plan: { ...next.plan, days: next.plan.days.filter((d) => d.sections.length) } };
}

// Renames an egg or changes what it teaches. Its saved lesson is made again (on next open) so it
// matches, but its score stays.
export function editSection(nest, id, { title, goal }) {
  const clean = (text, max, fallback) => (text?.trim() ? text.trim().slice(0, max) : fallback);
  let changed = false;
  const next = mapSections(nest, (sections) =>
    sections.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, title: clean(title, MAX_TITLE, s.title), goal: clean(goal, MAX_GOAL, s.goal) };
      changed = updated.title !== s.title || updated.goal !== s.goal;
      return updated;
    })
  );
  if (!changed) return nest;
  return forget(next, id);
}

export function editDayFocus(nest, date, focus) {
  const text = focus.trim().slice(0, MAX_TITLE);
  if (!text) return nest;
  return { ...nest, plan: { ...nest.plan, days: nest.plan.days.map((d) => (d.date === date ? { ...d, focus: text } : d)) } };
}

// Adds the student's own egg to the end of a day. Its lesson is made the first time it's opened.
export function addSection(nest, date, { title, goal }) {
  const name = title.trim().slice(0, MAX_TITLE);
  if (!name) return nest;
  const section = {
    id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    title: name,
    goal: goal.trim().slice(0, MAX_GOAL) || `Understand ${name} well enough to answer test questions on it.`,
    minutes: 20,
    completed: false,
    score: null,
    custom: true,
  };
  return mapSections(nest, (sections, day) => (day.date === date ? [...sections, section] : sections));
}

// ---- Lesson feedback ----------------------------------------------------------------------

export const DIFFICULTIES = {
  easy: { label: "Too easy", mood: "squint" },
  right: { label: "Just right", mood: "happy" },
  hard: { label: "Too hard", mood: "dizzy" },
};

// Saves what the student thought of one lesson: nest.feedback[sectionId] = { difficulty, note, at }.
export function saveFeedback(nest, id, { difficulty, note }) {
  if (!DIFFICULTIES[difficulty]) return nest;
  return { ...nest, feedback: { ...nest.feedback, [id]: { difficulty, note: (note ?? "").trim().slice(0, MAX_NOTE), at: Date.now() } } };
}

// The latest feedback in this nest, for the AI making the next lessons: [{ lesson, difficulty, note }].
export function recentFeedback(nest, limit = 6) {
  const titles = Object.fromEntries(allSections(nest.plan).map((s) => [s.id, s.title]));
  return Object.entries(nest.feedback ?? {})
    .sort(([, a], [, b]) => b.at - a.at)
    .slice(0, limit)
    .map(([id, f]) => ({ lesson: titles[id] ?? "an earlier lesson", difficulty: DIFFICULTIES[f.difficulty].label, note: f.note }));
}
