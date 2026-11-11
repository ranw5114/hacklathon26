// Nests: one per test. A student can have as many as they like (several tests in a week, or on
// the same day). Each nest holds its test details, AI study plan, generated lessons, and mock exam:
//   { id, createdAt, test, plan, levels: { [sectionId]: lesson + quiz }, exam: questions | null }
// They're all saved together under the "nests" key (see lib/storage.js).

import { useEffect } from "react";
import { load, remove, update, useStored } from "@/lib/storage";

function newNestId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// React hook: every nest (undefined while loading, [] if none).
export function useNests() {
  const nests = useStored("nests");
  return nests === undefined ? undefined : (nests ?? []);
}

// React hook: one nest by id (undefined while loading, null if it doesn't exist).
export function useNest(id) {
  const nests = useNests();
  if (nests === undefined) return undefined;
  return nests.find((n) => n.id === id) ?? null;
}

// Saves a brand-new nest and returns its id.
export function addNest(test, plan) {
  const id = newNestId();
  update("nests", (nests) => [...(nests ?? []), { id, createdAt: Date.now(), test, plan, levels: {}, exam: null }]);
  return id;
}

// Changes one nest, based on the latest saved data, e.g.
// updateNest(id, (nest) => ({ ...nest, plan: newPlan })).
export function updateNest(id, change) {
  update("nests", (nests) => (nests ?? []).map((n) => (n.id === id ? change(n) : n)));
}

export function deleteNest(id) {
  update("nests", (nests) => (nests ?? []).filter((n) => n.id !== id));
}

// Nests in the order to show them: upcoming tests first (soonest first), then past ones (newest first).
export function sortNests(nests, today) {
  const upcoming = nests.filter((n) => n.test.testDate >= today).sort((a, b) => a.test.testDate.localeCompare(b.test.testDate));
  const past = nests.filter((n) => n.test.testDate < today).sort((a, b) => b.test.testDate.localeCompare(a.test.testDate));
  return [...upcoming, ...past];
}

// The nest to focus on right now (for the Coop's suggestions and the Egg Timer): the one with the
// soonest upcoming test, or the most recent one if every test has passed. Null if there are none.
export function focusNest(nests, today) {
  return sortNests(nests ?? [], today)[0] ?? null;
}

// Every study-plan day across all nests, as one combined plan (for the missed-day rule).
export function allPlanDays(nests) {
  return { days: (nests ?? []).flatMap((n) => n.plan?.days ?? []) };
}

// Before multiple nests existed, the single nest was saved under "test", "plan", "levels" and "exam".
// This moves it into "nests" once, so nobody loses their plan. Runs in the shared app layout.
export function useMoveOldNest() {
  useEffect(() => {
    const plan = load("plan");
    const test = load("test");
    if (!plan || !test) return;
    const levels = load("levels") ?? {};
    const exam = load("exam");
    update("nests", (nests) => [...(nests ?? []), { id: newNestId(), createdAt: Date.now(), test, plan, levels, exam }]);
    remove("plan", "test", "levels", "exam");
  }, []);
}

// --- What the chick wears for each subject -----------------------------------

// Checked in order; the first rule whose words appear in the subject wins.
const SUBJECT_OUTFITS = [
  { words: ["computer", "coding", "programming", "cs ", "software"], wear: { head: "headphones", face: "glasses" } },
  { words: ["chem"], wear: { body: "labcoat", face: "goggles", prop: "flask" } },
  { words: ["bio", "anatomy", "life science", "ecology"], wear: { body: "labcoat", face: "glasses", prop: "leaf" } },
  { words: ["physic", "astro", "earth science", "science"], wear: { body: "labcoat", face: "goggles", prop: "apple" } },
  { words: ["math", "algebra", "geometry", "calc", "statistic", "trig", "precalc", "amc", "aime", "sat", "psat"], wear: { face: "glasses", prop: "pencil" } },
  { words: ["english", "literature", "writing", "reading", "essay", "poetry"], wear: { head: "beret", prop: "book" } },
  { words: ["history", "government", "civics", "geograph", "social studies", "politic"], wear: { head: "explorer", prop: "scroll" } },
  { words: ["spanish", "french", "german", "chinese", "japanese", "latin", "language", "italian", "korean"], wear: { head: "beret", neck: "scarf" } },
  { words: ["art", "drawing", "design", "paint"], wear: { head: "beret", prop: "paintbrush" } },
  { words: ["music", "band", "choir", "orchestra"], wear: { head: "headphones" } },
  { words: ["econ", "macroecon", "microecon", "business", "finance", "accounting"], wear: { neck: "bowtie", face: "glasses" } },
  { words: ["psych", "philosophy", "sociology"], wear: { face: "glasses", prop: "book" } },
  { words: ["gym", "pe", "health", "sport", "fitness"], wear: { head: "headband" } },
];

const DEFAULT_OUTFIT = { head: "cap", prop: "book" };

// The outfit (for <Chick wear={...} />) that matches a subject, e.g. "AP Chemistry" → lab coat.
export function subjectOutfit(subject) {
  const text = String(subject ?? "").toLowerCase();
  // Words match at the start of a word ("bio" → "Biology"); 1-2 letter words must match exactly ("PE").
  const matches = (word) => {
    const w = word.trim();
    return new RegExp(w.length <= 2 ? `\\b${w}\\b` : `\\b${w}`).test(text);
  };
  const match = SUBJECT_OUTFITS.find((rule) => rule.words.some(matches));
  return { head: "none", ...(match?.wear ?? DEFAULT_OUTFIT) };
}
