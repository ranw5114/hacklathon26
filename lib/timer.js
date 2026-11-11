// Egg Timer rules. The key idea: while running we save WHEN the timer ends (endsAt),
// not how many seconds are left. Then the time is always right, even if the tab was
// in the background, the user switched pages, or the browser was closed.

const MINUTE = 60_000;

export const PRESETS = {
  classic: { label: "Classic", focusMin: 25, breakMin: 5 },
  long: { label: "Long", focusMin: 50, breakMin: 10 },
  custom: { label: "Custom" },
};

// A paused focus session can wait this long. After that the egg goes cold and gets fried.
export const PAUSE_LIMIT_MS = 5 * MINUTE;

export const DEFAULT_TIMER = {
  preset: "classic",
  focusMin: 25,
  breakMin: 5,
  mode: "focus", // "focus" or "break"
  status: "idle", // "idle", "running", or "paused"
  endsAt: null, // timestamp (ms) when the running timer reaches 0
  remainingMs: 25 * MINUTE, // time left while idle or paused
  pausedAt: null, // timestamp (ms) when it was paused, for the 5-minute limit
  level: null, // the nest level this focus session is for (optional)
  notice: null, // a message to show, e.g. "Focus session done!"
};

export function durationMs(timer, mode = timer.mode) {
  return (mode === "focus" ? timer.focusMin : timer.breakMin) * MINUTE;
}

export function timeLeft(timer, now) {
  if (timer.status !== "running") return timer.remainingMs;
  // Clamp to the session length, since `now` can be up to a second old.
  return Math.min(durationMs(timer), Math.max(0, timer.endsAt - now));
}

// 0 at the start, 1 when time is up. Used for the progress ring and the egg's cracks.
export function progress(timer, now) {
  return 1 - timeLeft(timer, now) / durationMs(timer);
}

export function startTimer(timer, level = timer.level) {
  return { ...timer, status: "running", endsAt: Date.now() + timer.remainingMs, pausedAt: null, level, notice: null };
}

export function pauseTimer(timer) {
  const now = Date.now();
  return { ...timer, status: "paused", remainingMs: Math.max(0, timer.endsAt - now), endsAt: null, pausedAt: now };
}

export function resetTimer(timer) {
  return {
    ...timer,
    status: "idle",
    mode: "focus",
    endsAt: null,
    pausedAt: null,
    remainingMs: durationMs(timer, "focus"),
    notice: null,
  };
}

export function setDurations(timer, preset, focusMin, breakMin) {
  return resetTimer({ ...timer, preset, focusMin, breakMin });
}

// Called when a running timer hits 0. Focus → break starts automatically. Break → back to focus, waiting.
// The break is timed from when focus ended (not "now"), so it stays correct if the user was away.
export function advance(timer) {
  if (timer.mode === "focus") {
    return { ...timer, mode: "break", endsAt: timer.endsAt + durationMs(timer, "break") };
  }
  return { ...timer, mode: "focus", status: "idle", endsAt: null, remainingMs: durationMs(timer, "focus") };
}

// 1500000 ms → "25:00"
export function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// True while an egg is being kept warm: a focus session that has started but not finished.
export function hasEgg(timer) {
  return timer.mode === "focus" && timer.status !== "idle";
}

// For a paused focus session: how long until the egg goes cold (ms). Null if not paused in focus.
export function coldIn(timer, now) {
  if (timer.status !== "paused" || timer.mode !== "focus" || !timer.pausedAt) return null;
  return Math.max(0, timer.pausedAt + PAUSE_LIMIT_MS - now);
}

// The egg slowly gets ready to hatch as the chick keeps it warm. `cracks` (0-3) is for the drawing.
export function broodStage(fraction) {
  if (fraction < 0.34) return { name: "Keeping it warm", cracks: 0 };
  if (fraction < 0.67) return { name: "Something's moving…", cracks: 1 };
  if (fraction < 0.9) return { name: "A tiny crack!", cracks: 2 };
  if (fraction < 1) return { name: "Almost hatching!", cracks: 3 };
  return { name: "Hatched!", cracks: 3 };
}
