// Your flock: the chicks you've hatched by studying, plus the corn you spend on them.
//   - Finish an Egg Timer focus session → the egg hatches into a chick.
//   - Get 100% on a Nest level quiz → a chick. Get your goal grade or higher → corn.
//   - Stop a focus session early, or leave it paused too long → the egg gets fried.
//   - A study-plan day passes with no egg hatched → one chick gets fried into a drumstick.
// Chests on the Nest path give corn; the mock exam hatches chicks. Corn buys colors and
// clothes in the Henhouse (lib/henhouse.js).
// These are plain functions (no React), so the rules live in one place.

import { MIN_FOCUS_MIN } from "@/lib/timer";

// Only focus sessions long enough to hatch an egg count for streaks and study-plan days.
const hatchedDates = (sessions) =>
  new Set((sessions ?? []).filter((s) => s.minutes >= MIN_FOCUS_MIN).map((s) => s.date));

// Baby chicks come in the avatar colors (Berry keeps her bow).
export const BABY_COLORS = ["sunny", "peach", "mint", "berry"];

export const EMPTY_FLOCK = {
  chicks: [], // [{ id, color, hatchedAt, from: "timer" | "quiz" | "exam", name?, wear? }]
  corn: 0, // spent in the Henhouse shop
  owned: [], // shop item ids bought with corn (usable on every chick)
  drumsticks: [], // [{ date, color, at }]: a chick lost on a missed study-plan day
  friedEggs: [], // [{ at, reason: "stopped" | "cold" }]
  judgedDays: [], // study-plan days already checked, so each one is only judged once
};

// Rewards outside the timer.
export const CORN_FOR_GOAL = 25; // first time a level reaches the goal grade (but not 100%)
export const CHEST_MIN_CORN = 15;
export const CHEST_MAX_CORN = 30;

export function chickCount(flock) {
  return flock?.chicks?.length ?? 0;
}

// Always fill in missing fields, so older saved flocks keep working.
export function withDefaults(flock) {
  return { ...EMPTY_FLOCK, ...flock };
}

// Returns a NEW flock with `count` chicks added.
export function hatchChicks(flock, count, from, at = Date.now()) {
  const f = withDefaults(flock);
  const babies = Array.from({ length: count }, (_, i) => ({
    id: `${at}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    color: BABY_COLORS[Math.floor(Math.random() * BABY_COLORS.length)],
    hatchedAt: at,
    from,
  }));
  return { ...f, chicks: [...f.chicks, ...babies] };
}

// Returns a NEW flock with one more fried egg.
export function fryEgg(flock, reason, at = Date.now()) {
  const f = withDefaults(flock);
  return { ...f, friedEggs: [...f.friedEggs, { at, reason }] };
}

// Returns a NEW flock with `amount` corn added (or spent, if negative).
export function addCorn(flock, amount) {
  const f = withDefaults(flock);
  return { ...f, corn: Math.max(0, f.corn + amount) };
}

export function randomChestCorn() {
  return CHEST_MIN_CORN + Math.floor(Math.random() * (CHEST_MAX_CORN - CHEST_MIN_CORN + 1));
}

// What a Nest level quiz earns. Replaying can't farm rewards: a chick only the first time
// the level hits 100%, corn only the first time it reaches the goal grade without being perfect.
export function quizRewards(section, score, goal) {
  const bestBefore = section.score ?? 0;
  if (score >= 1) return { chicks: bestBefore < 1 ? 1 : 0, corn: 0 };
  if (score >= goal) return { chicks: 0, corn: bestBefore < goal ? CORN_FOR_GOAL : 0 };
  return { chicks: 0, corn: 0 };
}

// Chicks for the first try at the mock exam, based on the score (0 to 1).
export function chicksForExam(score) {
  if (score >= 0.8) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

// Checks every study-plan day before today that hasn't been judged yet. A day with no
// hatched egg costs one chick (the newest), which becomes a drumstick.
// Returns { flock, missed: [dates], lost: number }. `flock` is unchanged if nothing new was judged.
export function judgeMissedDays(flock, plan, sessions, today, at = Date.now()) {
  const f = withDefaults(flock);
  if (!plan?.days?.length) return { flock: f, missed: [], lost: 0 };

  const studied = hatchedDates(sessions);
  const judged = new Set(f.judgedDays);
  const toJudge = plan.days.map((d) => d.date).filter((date) => date && date < today && !judged.has(date));
  if (!toJudge.length) return { flock: f, missed: [], lost: 0 };

  const chicks = [...f.chicks];
  const drumsticks = [...f.drumsticks];
  const missed = toJudge.filter((date) => !studied.has(date)).sort();
  for (const date of missed) {
    const lostChick = chicks.pop();
    if (lostChick) drumsticks.push({ date, color: lostChick.color, at });
  }
  return {
    flock: {
      ...f,
      chicks,
      drumsticks,
      judgedDays: [...f.judgedDays, ...toJudge].slice(-400),
    },
    missed,
    lost: drumsticks.length - f.drumsticks.length,
  };
}

// How many days in a row (ending today, or yesterday if nothing is hatched yet today)
// had at least one egg hatched.
export function hatchStreak(sessions, today, addDays) {
  const studied = hatchedDates(sessions);
  let day = studied.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
