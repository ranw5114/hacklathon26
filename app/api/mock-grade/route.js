// Grades short answers worded differently from the answer key, and written responses.
// POST { test, items: [{ type, question, answers?, rubric?, explanation, response }] }
//   → { results: [{ score: 0-1, feedback }] } in the same order.
import { generateJSON, PLAIN_TEXT_RULE } from "@/lib/gemini";

export const maxDuration = 60;

const schema = {
  type: "object",
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        properties: {
          score: { type: "number", description: "0 to 1 (partial credit allowed for written responses; short answers are 0 or 1)" },
          feedback: { type: "string", description: "1-2 friendly sentences: what was right, what was missing" },
        },
        required: ["score", "feedback"],
      },
    },
  },
  required: ["results"],
};

export async function POST(request) {
  const { test, items } = await request.json().catch(() => ({}));
  if (!Array.isArray(items) || !items.length) return Response.json({ results: [] });
  const list = items.slice(0, 40).map((it, i) => {
    const key = it.type === "short" ? `Accepted answers: ${(it.answers ?? []).join(" | ")}` : `Rubric: ${it.rubric || it.explanation}`;
    return `${i + 1}. (${it.type === "short" ? "short answer" : "written response"}) ${String(it.question).slice(0, 800)}
${key}
Student's answer: """${String(it.response ?? "").slice(0, 3000)}"""`;
  });
  const prompt = `You are a fair, encouraging teacher grading a ${test?.subject ?? ""} practice exam.
Grade each answer below. Short answers: 1 if it means the same as an accepted answer (equivalent forms, units, or spelling slips are fine), else 0. Written responses: a score from 0 to 1 using the rubric, with partial credit.
${list.join("\n\n")}

Return exactly ${list.length} results, in order. ${PLAIN_TEXT_RULE}`;
  const { data, error, status } = await generateJSON(prompt, schema);
  if (error) return Response.json({ error }, { status });
  const results = list.map((_, i) => {
    const r = data.results?.[i];
    return { score: Math.max(0, Math.min(1, Number(r?.score) || 0)), feedback: String(r?.feedback ?? "") };
  });
  return Response.json({ results });
}
