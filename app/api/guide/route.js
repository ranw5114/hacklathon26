// Turns study-guide PDFs into study notes for the Nest Builder (see lib/studyGuide.js).
//
// POST { mode: "read", file: { uri, name }, fileName, part, subject, topic } → { notes }
//   Reads one uploaded PDF (or one part of a big one), then deletes it from Google's storage.
// POST { mode: "merge", texts: [...], subject, topic } → { notes }
//   Combines the notes from many PDFs into one set short enough for the study plan.

import { generateText, PLAIN_TEXT_RULE } from "@/lib/gemini";

// Reading a long PDF can take a while.
export const maxDuration = 60;

const API = "https://generativelanguage.googleapis.com";
const FILE_PREFIX = `${API}/`;
const MAX_MERGE_CHARS = 400_000;

const SYSTEM = `You turn a student's class materials into clear study notes that a tutor will use to plan lessons and write quizzes. ${PLAIN_TEXT_RULE}`;

function readPrompt({ fileName, part, subject, topic }) {
  return `This is ${part ? `${part} of ` : ""}the student's study guide or class notes ("${fileName}") for ${subject || "their class"}${topic ? `, test on: ${topic}` : ""}.

Write study notes from it (up to about 700 words):
- The topics and subtopics it covers, in order, using the same names the class uses.
- Key definitions, formulas, rules, and facts, written out exactly.
- The kinds of problems or questions it shows, with one short worked example if there is one.
- Anything it marks as important, on the test, or as a common mistake.
Only include what is in the material. If it has nothing useful for studying (for example a blank or cover page), reply with nothing.`;
}

function mergePrompt({ texts, subject, topic }) {
  return `These are study notes from several of the student's study guides for ${subject || "their class"}${topic ? `, test on: ${topic}` : ""}.

Combine them into one set of study notes (up to about 5,000 words): every topic covered, in a sensible order, with the key definitions, formulas, facts, example problems, and anything marked important. Remove repeats.

${texts.map((t, i) => `Notes ${i + 1}:\n"""\n${t}\n"""`).join("\n\n")}`;
}

async function deleteUploaded(name) {
  if (!/^files\/[a-z0-9-]+$/i.test(name || "")) return;
  await fetch(`${API}/v1beta/${name}`, { method: "DELETE", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } }).catch(() => {});
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  if (body.mode === "merge") {
    const texts = Array.isArray(body.texts) ? body.texts.filter((t) => typeof t === "string" && t.trim()) : [];
    if (!texts.length) return Response.json({ notes: "" });
    const prompt = mergePrompt({ ...body, texts }).slice(0, MAX_MERGE_CHARS);
    const { data, error, status } = await generateText(prompt, SYSTEM, { slow: true });
    if (error) return Response.json({ error }, { status });
    return Response.json({ notes: data.trim() });
  }

  const file = body.file;
  if (typeof file?.uri !== "string" || !file.uri.startsWith(FILE_PREFIX)) {
    return Response.json({ error: "That file didn't upload. Please try again." }, { status: 400 });
  }
  const contents = [{ role: "user", parts: [{ fileData: { fileUri: file.uri, mimeType: "application/pdf" } }, { text: readPrompt(body) }] }];
  const { data, error, status } = await generateText(contents, SYSTEM, { slow: true });
  // Busy? Keep the file so the browser can ask again. Otherwise it's not needed any more.
  if (status !== 429 && status !== 503) await deleteUploaded(file.name);
  if (error) return Response.json({ error }, { status });
  return Response.json({ notes: data.trim() });
}
