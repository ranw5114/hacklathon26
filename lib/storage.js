// Saves app data in the browser (localStorage), so we don't need accounts or a database.
// Each visitor's data stays on their own device.

import { useMemo, useSyncExternalStore } from "react";

const KEYS = {
  profile: "chick.profile", // name, avatar, learning style
  test: "chick.test", // the test the current nest (study plan) is for
  plan: "chick.plan", // the AI-generated study plan
  levels: "chick.levels", // saved lessons + quizzes by section id, so each is generated only once
  exam: "chick.exam", // the saved mock exam questions
  points: "chick.points", // corn earned from quizzes (and later the timer)
};

const CHANGE_EVENT = "chick-storage";

function readRaw(name) {
  try {
    return localStorage.getItem(KEYS[name]);
  } catch {
    // Storage can be blocked (e.g. private browsing). Act as if nothing is saved.
    return null;
  }
}

function parse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function load(name) {
  return parse(readRaw(name));
}

export function save(name, value) {
  try {
    localStorage.setItem(KEYS[name], JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Ignore: the app still works for this visit, it just won't remember.
  }
}

// remove("plan") deletes one item; clearAll() deletes everything.
export function remove(...names) {
  try {
    names.forEach((name) => localStorage.removeItem(KEYS[name]));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {}
}

// Deletes the current nest (plan) and everything generated for it, but keeps the profile and points.
export function resetNest() {
  remove("test", "plan", "levels", "exam");
}

export function clearAll() {
  remove(...Object.keys(KEYS));
}

// Re-render when saved data changes, in this tab ("chick-storage") or another tab ("storage").
function subscribe(callback) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// React hook: const plan = useStored("plan");
// Returns undefined while the page is still loading, null if nothing is saved, otherwise the data.
export function useStored(name) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(name),
    () => undefined // on the server there's no localStorage yet
  );
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw]);
}
