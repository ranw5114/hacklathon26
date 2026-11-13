// Accounts: sign up, log in, log out, and keeping your progress the same on every device.
//
// The app still saves everything in the browser (lib/storage.js), so it's fast and works offline.
// When you're logged in, every change is also copied to your account a moment later, and opening
// the app (or coming back to the tab) brings down what you did on your other devices.
// The server side is app/api/auth/* and app/api/sync (see docs/accounts-setup.md).

import { useSyncExternalStore } from "react";
import { CHANGE_EVENT, clearAll, load, loadRaw, save, saveFromSync, useStored } from "@/lib/storage";
import { SYNC_KEYS } from "@/lib/syncKeys";

const PUSH_DELAY_MS = 1500;

// ---- Is the accounts database set up? (asked once) -----------------------------------------

let available; // undefined = still asking
const listeners = new Set();
let asked = false;

function askServer() {
  if (asked || typeof window === "undefined") return;
  asked = true;
  fetch("/api/auth/me")
    .then((r) => r.json())
    .then((me) => {
      available = me.available !== false;
      // Logged out on the server (e.g. the session ran out)? Ask to log in again.
      const account = load("account");
      if (account && available && !me.user && !me.error) save("account", { ...account, expired: true });
      listeners.forEach((l) => l());
    })
    .catch(() => {
      available = false;
      listeners.forEach((l) => l());
    });
}

// true / false, or undefined while checking.
export function useAccountsAvailable() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      askServer();
      return () => listeners.delete(l);
    },
    () => available,
    () => undefined
  );
}

export function useAccount() {
  return useStored("account");
}

// ---- Talking to the server --------------------------------------------------------------

async function call(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    err.notConfigured = data.notConfigured;
    throw err;
  }
  return data;
}

// Makes an account and copies everything saved on this device into it.
export async function signUp({ email, username, password }) {
  const { user } = await call("/api/auth/signup", { method: "POST", body: JSON.stringify({ email, username, password }) });
  save("account", user);
  markDirty(SYNC_KEYS);
  await flush();
  return user;
}

// Logs in and brings down the account's progress (replacing what's on this device).
export async function logIn({ login, password }) {
  const { user } = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ login, password }) });
  setDirty([]);
  const { data } = await call("/api/sync");
  saveFromSync(Object.fromEntries(SYNC_KEYS.map((k) => [k, data[k] ?? null])));
  save("account", user);
  return user;
}

// Saves anything not copied yet, logs out, and clears this device.
export async function logOut() {
  await flush().catch(() => {});
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  clearAll();
}

// Deletes the account's saved progress (for "Delete everything").
export async function deleteAccountData() {
  setDirty([]);
  await call("/api/sync", { method: "DELETE" });
}

// ---- Keeping devices in step ------------------------------------------------------------

function getDirty() {
  return load("sync")?.dirty ?? [];
}
function setDirty(names) {
  // Written straight to the browser (not with save), so it doesn't count as a change itself.
  try {
    localStorage.setItem("chick.sync", JSON.stringify({ dirty: names }));
  } catch {}
}
function markDirty(names) {
  setDirty([...new Set([...getDirty(), ...names])]);
}

function syncing() {
  const account = load("account");
  return Boolean(account && !account.expired && !load("profile")?.demo);
}

let pushing = null;
// Sends every change not copied yet. Resolves when done (or throws if it couldn't).
export async function flush() {
  if (pushing) await pushing.catch(() => {});
  const names = getDirty();
  if (!names.length || !load("account")) return;
  pushing = (async () => {
    const changes = Object.fromEntries(names.map((n) => [n, loadRaw(n)]));
    try {
      const result = await call("/api/sync", { method: "PUT", body: JSON.stringify({ changes }) });
      // Anything changed again while sending stays on the list.
      setDirty(getDirty().filter((n) => !names.includes(n) || loadRaw(n) !== changes[n]));
      if (result.tooBig?.length) console.warn("Too big to save to the account:", result.tooBig);
    } catch (err) {
      if (err.status === 401) save("account", { ...load("account"), expired: true });
      throw err;
    }
  })();
  try {
    await pushing;
  } finally {
    pushing = null;
  }
}

// Brings down changes made on other devices (keeps anything here that hasn't been sent yet).
export async function pull() {
  if (!syncing()) return;
  await flush();
  const { data } = await call("/api/sync");
  const dirty = getDirty();
  const changes = {};
  for (const key of SYNC_KEYS) {
    if (dirty.includes(key)) continue;
    const value = data[key] ?? null;
    if (value !== loadRaw(key)) changes[key] = value;
  }
  if (Object.keys(changes).length) saveFromSync(changes);
}

// Started once by components/SyncWatcher.js.
export function startSync() {
  let timer = null;
  const pushSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => flush().catch(() => {}), PUSH_DELAY_MS);
  };
  const onChange = (e) => {
    const { names, fromSync } = e.detail ?? {};
    if (!names || fromSync || !syncing()) return;
    const changed = names.filter((n) => SYNC_KEYS.includes(n));
    if (!changed.length) return;
    markDirty(changed);
    pushSoon();
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") pull().catch(() => {});
    else flush().catch(() => {});
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  document.addEventListener("visibilitychange", onVisible);
  pull().catch(() => {});
  return () => {
    clearTimeout(timer);
    window.removeEventListener(CHANGE_EVENT, onChange);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
