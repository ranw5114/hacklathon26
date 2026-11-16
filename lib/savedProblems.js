"use client";

// Problems the student starred to look at again later (the ☆ on quiz questions, practice problems,
// and mock exam questions). Each is saved as a full copy, so it stays even if the lesson is remade
// or deleted:
//   { id, kind: "quiz" | "practice" | "mock", nestId, subject, lesson,
//     question, choices?, answerIndex?, pick?, answer?, yours?, explanation?, savedAt }
// pick is the index of the choice they picked. For problems without choices, answer is the right
// answer (a practice solution, a short answer, or a written question's rubric) and yours is theirs.

import { createContext, useContext } from "react";
import { load, save, useStored } from "@/lib/storage";

const MAX_SAVED = 300;

// The nest and lesson a star belongs to. The level and mock exam pages wrap their problems in it,
// so every star inside knows where it came from: { nestId, subject, lesson }.
export const SaveSpot = createContext(null);

export function useSaveSpot() {
  return useContext(SaveSpot);
}

export function useSavedProblems() {
  const saved = useStored("saved");
  return saved === undefined ? undefined : (saved ?? []);
}

// The same problem in the same nest always gets the same id, so starring it twice doesn't save it twice.
export function problemId(nestId, question) {
  let hash = 0;
  for (const ch of `${nestId}|${question}`) hash = (hash * 31 + ch.codePointAt(0)) | 0;
  return `p${(hash >>> 0).toString(36)}`;
}

// Stars the problem, or un-stars it if it's already saved. Returns true if it's now saved.
export function toggleSaved(problem) {
  const list = load("saved") ?? [];
  if (list.some((p) => p.id === problem.id)) {
    save("saved", list.filter((p) => p.id !== problem.id));
    return false;
  }
  save("saved", [{ ...problem, savedAt: Date.now() }, ...list].slice(0, MAX_SAVED));
  return true;
}

export function removeSaved(id) {
  save("saved", (load("saved") ?? []).filter((p) => p.id !== id));
}

// ---- Ask the Coop about a saved problem -------------------------------------------------

const COOP_DRAFT = "chick.coopDraft";

// The question the Coop's message box should start with, for the student to send or change.
export function coopQuestion(problem) {
  const lines = [`Can you help me understand this problem? I got stuck on it.`, "", problem.question];
  if (problem.choices) {
    lines.push("", ...problem.choices.map((c, i) => `${"ABCDEFGH"[i]}. ${c}`));
    if (problem.pick != null && problem.pick !== problem.answerIndex) lines.push("", `I picked ${"ABCDEFGH"[problem.pick]}.`);
    if (problem.answerIndex != null) lines.push(`The answer is ${"ABCDEFGH"[problem.answerIndex]}. Why?`);
  }
  return lines.join("\n");
}

// Leaves the question for the Coop page to pick up once (only for this tab, so it's not synced).
// The Coop reads it with peekCoopDraft, then clears it.
export function leaveCoopDraft(text) {
  try {
    sessionStorage.setItem(COOP_DRAFT, text);
  } catch {}
}

export function peekCoopDraft() {
  try {
    return typeof window === "undefined" ? null : sessionStorage.getItem(COOP_DRAFT);
  } catch {
    return null;
  }
}

export function clearCoopDraft() {
  try {
    sessionStorage.removeItem(COOP_DRAFT);
  } catch {}
}
