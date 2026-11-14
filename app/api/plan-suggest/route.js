// Suggests new eggs (lessons) for a nest from study material added after it was built.
// POST { test: { subject, topic }, titles: [existing egg titles], notes } → { sections: [{ title, goal, minutes }] }
import { generateJSON } from "@/lib/gemini";

export const maxDuration = 60;

const MAX_NOTES = 30_000;

const schema = {
  type: "object",
  properties: {
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short lesson title" },
          goal: { type: "string", description: "One sentence: what the student will be able to do afterwards" },
          minutes: { type: "integer" },
        },
        required: ["title", "goal", "minutes"],
      },
    },
  },
  required: ["sections"],
};

export async function POST(request) {
  const { test, titles, notes } = await request.json().catch(() => ({}));
  if (!test?.subject || !String(notes ?? "").trim()) return Response.json({ error: "Add some study material first." }, { status: 400 });
  const existing = (Array.isArray(titles) ? titles : []).slice(0, 80).map((t) => `- ${String(t).slice(0, 120)}`).join("\n");

  const prompt = `A student is studying for ${test.subject}${test.topic ? ` (test on: ${test.topic})` : ""}. Their study plan already has these lessons:
${existing || "(none)"}

They just added this new study material:
"""
${String(notes).slice(0, MAX_NOTES)}
"""

Suggest up to 6 NEW lessons for topics in the new material that the existing lessons don't already cover. Each lesson covers one testable idea and takes 15-40 minutes. Use the material's own names for topics. If everything is already covered, return an empty list.`;

  const { data, error, status } = await generateJSON(prompt, schema);
  if (error) return Response.json({ error }, { status });
  const sections = (data.sections ?? [])
    .filter((s) => s?.title?.trim())
    .slice(0, 6)
    .map((s) => ({ title: s.title.trim().slice(0, 120), goal: String(s.goal ?? "").trim().slice(0, 240), minutes: Math.min(60, Math.max(10, Number(s.minutes) || 20)) }));
  return Response.json({ sections });
}
