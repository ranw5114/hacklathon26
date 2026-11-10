// Generates the demo student's content (study plan, every lesson + quiz, and the mock exam)
// using our own AI routes, and saves it to data/demo.json. Run it once; the app then loads
// the saved file, so the demo never waits on the AI or uses up AI requests.
//
// Usage (with the dev server running on localhost:3000):
//   node scripts/generate-demo.mjs

import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const PAUSE_MS = 6000; // wait between AI requests so we stay under the free per-minute limit

const learner = { name: "Demo Chick", learningStyle: "examples" };
const test = {
  subject: "Algebra II",
  topic: "Quadratic functions: factoring, vertex form, and the quadratic formula",
  currentGrade: 76,
  goalGrade: 90,
  hoursPerDay: 1,
  notes: "",
};
// The plan is generated as if the test were 5 days away. The app shifts all dates to "now" when loading.
const TODAY = "2026-01-05";
const TEST_DATE = "2026-01-10";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function post(path, body) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) return data;
    console.warn(`  ${path} failed (${data.error}), retrying in 20s…`);
    await sleep(20000);
  }
  throw new Error(`${path} kept failing`);
}

console.log("Generating study plan…");
const plan = await post("/api/plan", { learner, test: { ...test, testDate: TEST_DATE }, today: TODAY });
const sections = plan.days.flatMap((d) => d.sections);
console.log(`  ${plan.days.length} days, ${sections.length} levels: "${plan.title}"`);

const levels = {};
for (const [i, section] of sections.entries()) {
  await sleep(PAUSE_MS);
  console.log(`Generating level ${i + 1}/${sections.length}: ${section.title}`);
  levels[section.id] = await post("/api/level", { learner, test, section });
}

await sleep(PAUSE_MS);
console.log("Generating mock exam…");
const { questions: exam } = await post("/api/exam", { test, sections });

// Dates are saved as "days from today" so the demo always looks current.
const offset = (date) => Math.round((Date.parse(date) - Date.parse(TODAY)) / 86_400_000);
const demo = {
  learner,
  test: { ...test, testDayOffset: offset(TEST_DATE) },
  plan: {
    title: plan.title,
    overview: plan.overview,
    days: plan.days.map((d) => ({ dayOffset: offset(d.date), focus: d.focus, sections: d.sections })),
    mockExamDayOffset: offset(plan.mockExam.date),
  },
  levels,
  exam,
};

writeFileSync(new URL("../data/demo.json", import.meta.url), JSON.stringify(demo, null, 2) + "\n");
console.log("Saved data/demo.json");
