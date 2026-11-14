// Names a Coop chat from how it started, like most AI chat apps do ("Finding a Parabola's Vertex"
// instead of the whole first question). The student can still rename it.
//
// POST { question, reply } → { title }

import { generateText } from "@/lib/gemini";

const MAX_INPUT_CHARS = 1500;
const MAX_TITLE_CHARS = 40;

const SYSTEM = `You name a student's chat with a tutor. Reply with ONLY the title: 2 to 5 words in Title Case that describe the topic broadly (for example "Finding a Parabola's Vertex", "Photosynthesis Basics", "Essay Outline Help"). No quotes, no ending punctuation, no LaTeX, no emoji.`;

export async function POST(request) {
  const { question, reply } = await request.json();
  if (typeof question !== "string" || !question.trim()) {
    return Response.json({ error: "Send the first question." }, { status: 400 });
  }

  const prompt = `The student asked:\n${question.slice(0, MAX_INPUT_CHARS)}\n\nThe tutor answered:\n${String(reply ?? "").slice(0, MAX_INPUT_CHARS)}`;
  const { data, error, status } = await generateText([{ role: "user", parts: [{ text: prompt }] }], SYSTEM);
  if (error) return Response.json({ error }, { status });

  return Response.json({ title: cleanTitle(data) });
}

// Just the title: the first line, without quotes, "Title:", math marks, or a trailing period.
function cleanTitle(text) {
  const title = String(text ?? "")
    .split("\n")
    .find((line) => line.trim())
    ?.replace(/^\s*(title\s*:)?\s*/i, "")
    .replace(/[*_`$#"“”]/g, "")
    .replace(/[.!?:;,\s]+$/, "")
    .trim();
  return title ? title.slice(0, MAX_TITLE_CHARS) : "";
}
