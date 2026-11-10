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
  chat: "chick.chat", // Chicken Coop conversation (text only; photos aren't saved)
  timer: "chick.timer", // Egg Timer state (see lib/timer.js)
  sessions: "chick.sessions", // finished focus sessions, for the daily log
  calendar: "chick.calendar", // synced calendar: { source, url, events, syncedAt } (the link stays in this browser)
  prefs: "chick.prefs", // small settings, e.g. { roostHintDismissed: true }
  flags: "chick.flags", // quiz questions the student flagged as wrong
  backup: "chick.backup", // the user's own data, saved while they try the demo
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

// Returns true if it saved. (It can fail if storage is blocked or full.)
export function save(name, value) {
  try {
    localStorage.setItem(KEYS[name], JSON.stringify(value));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    return true;
  } catch {
    // The app still works for this visit, it just won't remember.
    return false;
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

// --- Backup (used by demo mode) ---------------------------------------------

// Saves a copy of all the user's data. Returns false if it couldn't (then don't erase anything!).
export function backupAll() {
  const copy = {};
  for (const name of Object.keys(KEYS)) {
    if (name === "backup") continue;
    const raw = readRaw(name);
    if (raw !== null) copy[name] = raw;
  }
  return save("backup", copy);
}

export function hasBackup() {
  return readRaw("backup") !== null;
}

// Puts the backed-up data back (replacing whatever is there now) and deletes the backup.
export function restoreBackup() {
  const copy = load("backup") ?? {};
  try {
    for (const name of Object.keys(KEYS)) {
      if (name === "backup") continue;
      if (copy[name] !== undefined) localStorage.setItem(KEYS[name], copy[name]);
      else localStorage.removeItem(KEYS[name]);
    }
    localStorage.removeItem(KEYS.backup);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
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
