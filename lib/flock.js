// Your flock: the chicks you've hatched by studying. Chicks replaced corn as the app's reward.
//   - Finish an Egg Timer focus session → the egg hatches into a chick.
//   - Stop a focus session early, or leave it paused too long → the egg gets fried.
//   - A study-plan day passes with no egg hatched → one chick gets fried into a drumstick.
// Quizzes, chests on the Nest path, and the mock exam also hatch chicks.
// These are plain functions (no React), so the rules live in one place.

// Baby chicks come in the avatar colors (Berry keeps her bow).
export const BABY_COLORS = ["sunny", "peach", "mint", "berry"];

export const EMPTY_FLOCK = {
  chicks: [], // [{ id, color, hatchedAt, from: "timer" | "quiz" | "chest" | "exam" }]
  drumsticks: [], // [{ date, color, at }]: a chick lost on a missed study-plan day
  friedEggs: [], // [{ at, reason: "stopped" | "cold" }]
  judgedDays: [], // study-plan days already checked, so each one is only judged once
};

// Rewards outside the timer.
export const CHICKS_FOR_FIRST_FINISH = 1; // finishing a Nest level for the first time
export const CHICKS_FOR_FIRST_PERFECT = 1; // first time getting every quiz question right
export const CHEST_MIN_CHICKS = 1;
export const CHEST_MAX_CHICKS = 2;

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

export function randomChestChicks() {
  return CHEST_MIN_CHICKS + Math.floor(Math.random() * (CHEST_MAX_CHICKS - CHEST_MIN_CHICKS + 1));
}

// Chicks for a Nest level quiz. Like corn before, replaying can't farm them:
// you only get chicks the first time you finish a level, and the first time you ace it.
export function chicksForQuiz(section, correct, total) {
  const firstFinish = !section.completed ? CHICKS_FOR_FIRST_FINISH : 0;
  const firstPerfect = correct === total && (section.score ?? 0) < 1 ? CHICKS_FOR_FIRST_PERFECT : 0;
  return firstFinish + firstPerfect;
}

// Chicks for the first try at the mock exam, based on the score (0 to 1).
export function chicksForExam(score) {
  if (score >= 0.8) return 3;
  if (score >= 0.6) return 2;
  return 1;
}

// Checks every study-plan day before today that hasn't been judged yet. A day with no
// finished focus session costs one chick (the newest), which becomes a drumstick.
// Returns { flock, missed: [dates], lost: number }. `flock` is unchanged if nothing new was judged.
export function judgeMissedDays(flock, plan, sessions, today, at = Date.now()) {
  const f = withDefaults(flock);
  if (!plan?.days?.length) return { flock: f, missed: [], lost: 0 };

  const studied = new Set((sessions ?? []).map((s) => s.date));
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
// had at least one finished focus session.
export function hatchStreak(sessions, today, addDays) {
  const studied = new Set((sessions ?? []).map((s) => s.date));
  let day = studied.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
