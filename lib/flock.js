// Your flock: the chicks you've hatched by studying, plus the corn you spend on them.
//   - Finish an Egg Timer focus session → the egg hatches into a chick.
//   - Get 100% on a Nest level quiz → a chick. Each concept understood on a quiz → corn.
//   - Fail a Nest quiz (below the goal grade) → one chick gets fried into a drumstick.
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
  drumsticks: [], // [{ date, color, at, reason?: "quiz" }]: a chick lost on a missed plan day or failed quiz
  friedEggs: [], // [{ at, reason: "stopped" | "cold" }]
  judgedDays: [], // study-plan days already checked, so each one is only judged once
};

// Corn rewards.
export const CORN_PER_SESSION = 5; // each Egg Timer focus session that hatches an egg
export const CORN_PER_CONCEPT = 10; // each concept understood on a level's quiz (first time only)
export const CHEST_MIN_CORN = 15;
export const CHEST_MAX_CORN = 30;

// Every way to earn corn, for the corn guide (components/CornGuide.js) and the Henhouse shop.
export const CORN_WAYS = [
  { icon: "egg", text: `Finish an Egg Timer focus session (${MIN_FOCUS_MIN}+ minutes)`, amount: `+${CORN_PER_SESSION}` },
  { icon: "target", text: "Understand a concept on a Nest quiz (first time)", amount: `+${CORN_PER_CONCEPT} each` },
  { icon: "chest", text: "Open a chest on your Nest path", amount: `+${CHEST_MIN_CORN}–${CHEST_MAX_CORN}` },
];

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

// What a Nest level quiz earns. Replaying can't farm rewards: a chick only the first time the
// level hits 100%, and corn only for concepts understood for the first time on this level.
// A failed quiz (below the goal grade) costs a chick.
// Returns { chicks, corn, newConcepts (lowercase names that just earned corn), loseChick }.
export function quizRewards(section, score, goal, understood) {
  const already = new Set(section.earnedConcepts ?? []);
  const newConcepts = understood.map((c) => c.toLowerCase()).filter((c) => !already.has(c));
  return {
    chicks: score >= 1 && (section.score ?? 0) < 1 ? 1 : 0,
    corn: newConcepts.length * CORN_PER_CONCEPT,
    newConcepts,
    loseChick: score < goal,
  };
}

// A failed quiz fries the newest chick into a drumstick. Returns the NEW flock (unchanged if no chicks).
export function loseChickToQuiz(flock, today, at = Date.now()) {
  const f = withDefaults(flock);
  if (!f.chicks.length) return f;
  const { chicks, lost } = takeLosableChick(f.chicks);
  return { ...f, chicks, drumsticks: [...f.drumsticks, { date: today, color: lost.color, at, reason: "quiz" }] };
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

  let chicks = f.chicks;
  const drumsticks = [...f.drumsticks];
  const missed = toJudge.filter((date) => !studied.has(date)).sort();
  for (const date of missed) {
    if (!chicks.length) break;
    const taken = takeLosableChick(chicks);
    chicks = taken.chicks;
    drumsticks.push({ date, color: taken.lost.color, at });
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

// The chick that gets fried into a drumstick: the newest one that isn't a favorite (favorites
// are only lost when there's nothing else). Returns { chicks (without it), lost }.
function takeLosableChick(chicks) {
  const index = chicks.findLastIndex((c) => !c.favorite);
  const i = index === -1 ? chicks.length - 1 : index;
  return { chicks: chicks.filter((_, j) => j !== i), lost: chicks[i] };
}

// --- A big flock -----------------------------------------------------------------
// Favorite chicks sit on the coop's perch. Everyone else lives out in the yard, where every
// 10 chicks grow into a hen and every 5 hens into a golden rooster, so 100 chicks stay tidy.

export const MAX_FAVORITES = 10;
export const CHICKS_PER_HEN = 10;
export const HENS_PER_ROOSTER = 5;

// Returns a NEW flock with the chick's favorite star switched, or null if there are already
// MAX_FAVORITES favorites.
export function toggleFavorite(flock, chickId) {
  const f = withDefaults(flock);
  const chick = f.chicks.find((c) => c.id === chickId);
  if (!chick) return f;
  if (!chick.favorite && f.chicks.filter((c) => c.favorite).length >= MAX_FAVORITES) return null;
  return { ...f, chicks: f.chicks.map((c) => (c.id === chickId ? { ...c, favorite: !c.favorite } : c)) };
}

// The chicks on the perch: the favorites, or the newest few if none are picked yet.
export function perchChicks(flock) {
  const chicks = withDefaults(flock).chicks;
  const favorites = chicks.filter((c) => c.favorite);
  return favorites.length ? favorites : chicks.slice(-MAX_FAVORITES);
}

// How `count` chicks in the yard look once grown up: { roosters, hens, chicks }.
export function yardGroups(count) {
  const perRooster = CHICKS_PER_HEN * HENS_PER_ROOSTER;
  const rest = count % perRooster;
  return { roosters: Math.floor(count / perRooster), hens: Math.floor(rest / CHICKS_PER_HEN), chicks: rest % CHICKS_PER_HEN };
}
