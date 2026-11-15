// Suggests how to change a nest's study plan from the student's mock exam results: new eggs for
// what they're missing, and eggs they haven't started that cover what they've already mastered.
// POST { test, sections: [{ id, title, goal, completed, score }], stats: [{ concept, percent }], goal }
//   → { summary, add: [{ title, goal, minutes, reason }], remove: [{ id, reason }] }
import { generateJSON, PLAIN_TEXT_RULE } from "@/lib/gemini";

export const maxDuration = 60;

const schema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "1-2 friendly sentences to the student about what you changed and why" },
    add: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          goal: { type: "string", description: "One sentence: what the student will be able to do afterwards" },
          minutes: { type: "integer" },
          reason: { type: "string", description: "Short reason, e.g. 'You got 1 of 4 on this'" },
        },
        required: ["title", "goal", "minutes", "reason"],
      },
    },
    remove: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, reason: { type: "string" } },
        required: ["id", "reason"],
      },
    },
  },
  required: ["summary", "add", "remove"],
};

export async function POST(request) {
  const { test, sections, stats, goal } = await request.json().catch(() => ({}));
  if (!test?.subject || !Array.isArray(sections) || !Array.isArray(stats) || !stats.length) {
    return Response.json({ error: "Take a mock exam first." }, { status: 400 });
  }
  const lessonList = sections
    .slice(0, 80)
    .map((s) => `- [${s.id}] ${String(s.title).slice(0, 120)}${s.completed ? ` (done, quiz ${Math.round((s.score ?? 0) * 100)}%)` : " (not started)"}${s.goal ? `: ${String(s.goal).slice(0, 160)}` : ""}`)
    .join("\n");
  const statList = stats
    .slice(0, 40)
    .map((s) => `- ${String(s.concept).slice(0, 80)}: ${s.percent}%`)
    .join("\n");

  const prompt = `A student is studying for a ${test.subject} test on: ${test.topic}. Their goal is ${goal ?? test.goalGrade}%.
Their study plan's lessons ([id] title):
${lessonList}

How they did on each concept in their recent mock exams (weakest first):
${statList}

Adjust the plan to fit what they need:
- ADD lessons for concepts below the goal that the plan doesn't already teach well (or a focused review/practice lesson if they did the lesson but still miss it on mock exams). Weakest concepts first. Up to 6.
- REMOVE only lessons marked "not started" where EVERY concept the lesson teaches is clearly mastered on the mock exams (90% or higher). If a lesson teaches any concept they're below their goal on, even as part of it, keep it. Never remove "done" lessons. It's fine to remove none.
- If they're doing great overall, the plan can get shorter; if they're far from their goal, it can get longer.
- Use the lesson ids exactly as given. Reasons should mention their mock exam results.
- ${PLAIN_TEXT_RULE}`;

  const { data, error, status } = await generateJSON(prompt, schema);
  if (error) return Response.json({ error }, { status });

  // Safety check: only skip a lesson that's clearly about something they aced (90%+), and never
  // one that teaches anything they're still missing.
  const target = goal ?? test.goalGrade ?? 80;
  const weak = stats.filter((st) => st.percent < target).map((st) => keywords(st.concept));
  const mastered = stats.filter((st) => st.percent >= 90).map((st) => keywords(st.concept));
  const mentions = (list, s) => {
    const words = keywords(`${s.title} ${s.goal ?? ""}`);
    return list.some((concept) => [...concept].some((w) => words.has(w)));
  };
  const removable = new Set(sections.filter((s) => !s.completed && mentions(mastered, s) && !mentions(weak, s)).map((s) => s.id));
  return Response.json({
    summary: String(data.summary ?? "").slice(0, 400),
    // Nothing below the goal? Then there's nothing to add.
    add: (weak.length ? data.add ?? [] : [])
      .filter((a) => a?.title?.trim())
      .slice(0, 6)
      .map((a) => ({ title: a.title.trim().slice(0, 120), goal: String(a.goal ?? "").slice(0, 240), minutes: Math.min(60, Math.max(10, Number(a.minutes) || 20)), reason: String(a.reason ?? "").slice(0, 160) })),
    remove: (data.remove ?? []).filter((r) => removable.has(r.id)).slice(0, 10).map((r) => ({ id: r.id, reason: String(r.reason ?? "").slice(0, 160) })),
  });
}

// The meaningful words in a concept or lesson title ("Completing the square" → complet, square).
const SKIP = new Set("the and for with from into using use how what your their this that skills skill practice review basics basic intro introduction understanding finding find solving solve problems problem".split(" "));
function keywords(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !SKIP.has(w))
      .map((w) => w.slice(0, 7))
  );
}
