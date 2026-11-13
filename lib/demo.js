// Demo mode: loads a ready-made student so anyone (like hackathon judges) can explore
// the app instantly. The lessons and quizzes come from data/demo.json, which was generated
// once by scripts/generate-demo.mjs, so browsing the demo uses no AI requests.
// To remove demo mode later: delete this file, data/demo.json, and the "Try the demo" button.

import { addDays, localDateString, todayString } from "@/lib/dates";
import { CORN_PER_CONCEPT, EMPTY_FLOCK, fryEgg, hatchChicks } from "@/lib/flock";
import { backupAll, clearAll, hasBackup, load, remove, restoreBackup, save } from "@/lib/storage";
import { sampleEvents } from "@/lib/sampleCalendar";

// Which plan day is "today" in the demo (0 = first day). Earlier days are already finished.
const TODAY_INDEX = 2;
// Quiz scores for the finished levels, so the path shows every kind of egg
// (the demo goal is 90%): hatched, golden, fried, golden, hatched, fried.
const FINISHED_SCORES = [1, 0.9, 0.6, 0.9, 1, 0.6];

const DEMO_CHAT = [
  { role: "user", text: "Why does the quadratic formula have a ± in it?" },
  {
    role: "model",
    text: `Great question! The ± is there because most quadratics have TWO answers. Let's see it with an example.

Example: x² − 5x + 6 = 0
Here a = 1, b = −5, c = 6.

1. Plug into the formula: x = (5 ± √(25 − 24)) / 2
2. Simplify the square root: √1 = 1
3. Now use the + and the − separately:
   x = (5 + 1) / 2 = 3
   x = (5 − 1) / 2 = 2

So x = 3 or x = 2. On a graph, those are the two places the parabola crosses the x-axis. The ± gives you both crossing points at once. Egg-cellent thing to wonder about!`,
  },
];

// Loads the demo student. If the user has their own data, it's backed up first and comes back
// when they exit the demo. Returns false (and changes nothing) if the backup couldn't be saved.
export async function loadDemo() {
  // Loaded only when someone clicks "Try the demo", so it doesn't slow down other pages.
  const { default: demo } = await import("@/data/demo.json");

  const current = load("profile");
  const hasOwnData = current && !current.demo;
  if (hasOwnData && !backupAll()) return false;

  const today = todayString();
  const dateFor = (dayOffset) => addDays(today, dayOffset - demo.plan.days[TODAY_INDEX].dayOffset);

  // Mark the first few days' levels as finished, with a mix of scores.
  let finished = 0;
  const days = demo.plan.days.map((day, dayIndex) => ({
    date: dateFor(day.dayOffset),
    focus: day.focus,
    sections: day.sections.map((section) => {
      const done = dayIndex < TODAY_INDEX;
      const score = done ? FINISHED_SCORES[finished++ % FINISHED_SCORES.length] : null;
      return { ...section, completed: done, score };
    }),
  }));

  // A few past Egg Timer sessions. There's deliberately none on the plan's first day (2 days ago),
  // so when the demo opens, the missed-day rule fries one chick into a drumstick for visitors to see.
  const sessions = [
    { daysAgo: 3, minutes: 10 },
    { daysAgo: 1, minutes: 25 },
    { daysAgo: 1, minutes: 25 },
  ].map(({ daysAgo, minutes }, i) => {
    const endedAt = new Date(`${addDays(today, -daysAgo)}T16:${String(30 + i * 5).padStart(2, "0")}:00`).getTime();
    return { endedAt, date: localDateString(endedAt), minutes, level: null };
  });

  // The flock so far: a chick per perfect quiz, one per timer session, corn for each golden egg
  // (plus some spending money), a few things already bought, and one fried timer egg.
  const finishedLevels = days.flatMap((d) => d.sections).filter((s) => s.completed);
  const perfect = finishedLevels.filter((s) => s.score === 1).length;
  const golden = finishedLevels.filter((s) => s.score >= 0.9 && s.score < 1).length;
  let flock = hatchChicks(EMPTY_FLOCK, perfect, "quiz", sessions[0].endedAt);
  flock = hatchChicks(flock, sessions.length, "timer", sessions.at(-1).endedAt);
  flock = fryEgg(flock, "stopped", sessions.at(-1).endedAt + 60 * 60_000);
  flock = { ...flock, corn: golden * 2 * CORN_PER_CONCEPT + 60, owned: ["head:party", "face:glasses"] };
  flock.chicks[0] = { ...flock.chicks[0], name: "Nugget", wear: { head: "party" } };
  flock.chicks[1] = { ...flock.chicks[1], name: "Professor Peep", wear: { face: "glasses" } };

  // Clear everything except the backup.
  const backup = load("backup");
  clearAll();
  if (backup) save("backup", backup);

  save("profile", { ...demo.learner, avatar: "mint", videoSources: "Khan Academy", demo: true });
  // The demo student has one nest (they can build more to try multiple nests).
  const plan = {
    title: demo.plan.title,
    overview: demo.plan.overview,
    createdOn: days[0].date,
    days,
    mockExam: { date: dateFor(demo.plan.mockExamDayOffset), completed: false, score: null },
    chests: {},
    demo: true, // unlocks the mock exam early, so visitors can try it
  };
  save("nests", [
    {
      id: "demo-algebra",
      createdAt: Date.now(),
      test: { ...demo.test, testDate: dateFor(demo.test.testDayOffset) },
      plan,
      levels: demo.levels,
      exam: demo.exam,
    },
  ]);
  save("flock", flock);
  save("sessions", sessions);
  save("calendar", { source: "sample", url: null, events: sampleEvents(), syncedAt: Date.now() });
  save(
    "chat",
    DEMO_CHAT.map((m, i) => ({ ...m, id: i + 1 }))
  );
  return true;
}

// Leaves the demo: brings back the user's own data if there was any.
// Returns true if their data was restored (go to the Barn), false if not (go to the start screen).
export function exitDemo() {
  if (hasBackup()) {
    restoreBackup();
    return true;
  }
  clearAll();
  remove("backup");
  return false;
}
