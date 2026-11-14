// Practice mock exams (see lib/mockExam.js).
// POST { mode: "questions", test, format, type, count, topics, previous } → { questions }
//   Writes one batch of questions of one type, never repeating (or rewording) `previous`.
// POST { mode: "format", test } → { format }: a best guess at the real test's format.
import { subjectBriefText } from "@/lib/briefPrompt";
import { generateJSON, PLAIN_TEXT_RULE } from "@/lib/gemini";
import { DEFAULT_FORMAT, isRepeat, MAX_QUESTIONS, QUESTION_TYPES } from "@/lib/mockExam";

export const maxDuration = 60;

const MAX_PREVIOUS = 250; // earlier questions sent to the AI so it doesn't repeat them

function questionSchema(type, choices) {
  const props = {
    question: { type: "string" },
    explanation: { type: "string", description: "Why the answer is right, in 1-3 sentences (for written: what a full-credit answer includes)" },
    concept: { type: "string", description: "The concept tested, in 2-5 words" },
  };
  const required = ["question", "explanation", "concept"];
  if (type === "mc") {
    props.choices = { type: "array", items: { type: "string" }, minItems: choices, maxItems: choices };
    props.answerIndex = { type: "integer", description: `Index (0-${choices - 1}) of the correct choice` };
    required.push("choices", "answerIndex");
  } else if (type === "tf") {
    props.answerTrue = { type: "boolean", description: "true if the statement is true" };
    required.push("answerTrue");
  } else if (type === "short") {
    props.answers = { type: "array", items: { type: "string" }, description: "Every accepted answer (e.g. '0.5', '1/2')" };
    required.push("answers");
  } else {
    props.rubric = { type: "string", description: "What a full-credit answer must include, as a short checklist" };
    required.push("rubric");
  }
  return { type: "object", properties: { questions: { type: "array", items: { type: "object", properties: props, required } } }, required: ["questions"] };
}

const TYPE_RULES = {
  mc: (n) => `exactly ${n} answer choices and one correct answer; vary which position the correct answer is in`,
  tf: () => "a single statement to judge true or false; make about half true and half false, and avoid trick wording",
  short: () => "an answer that's a single number, word, or short phrase; list every accepted form of the answer",
  written: () => "a question that needs a few sentences or shown work (explain, justify, compare, solve and show steps), with a rubric",
};

async function suggestFormat(test) {
  const schema = {
    type: "object",
    properties: {
      mc: { type: "integer" },
      tf: { type: "integer" },
      short: { type: "integer" },
      written: { type: "integer" },
      mcChoices: { type: "integer", description: "4 or 5" },
      minutes: { type: "integer", description: "Time limit in minutes (0 if usually untimed)" },
      notes: { type: "string", description: "One or two sentences on the real test's format (calculator, sections, scoring)" },
    },
    required: ["mc", "tf", "short", "written", "mcChoices", "minutes", "notes"],
  };
  const prompt = `What is the usual format of a ${test.subject} test${test.topic ? ` on ${test.topic}` : ""} (a typical high school unit test for a class, or the real exam for a standardized test or competition)?
${subjectBriefText({ brief: test.brief })}
Give how many questions of each type it has, answer choices per multiple-choice question, and the time limit. Keep the total at ${MAX_QUESTIONS} or fewer (for a long real test, scale it down to one section or a shorter version and say so in the notes).`;
  const { data, error, status } = await generateJSON(prompt, schema);
  if (error) return Response.json({ error }, { status });
  const n = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const format = {
    mc: n(data.mc, MAX_QUESTIONS),
    tf: n(data.tf, 30),
    short: n(data.short, 30),
    written: n(data.written, 10),
    mcChoices: data.mcChoices === 5 ? 5 : 4,
    minutes: n(data.minutes, 240) || "",
    notes: String(data.notes ?? "").slice(0, 400),
  };
  if (!(format.mc + format.tf + format.short + format.written)) format.mc = DEFAULT_FORMAT.mc;
  return Response.json({ format });
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { test } = body;
  if (!test?.subject) return Response.json({ error: "Some test details are missing." }, { status: 400 });
  if (body.mode === "format") return suggestFormat(test);

  const type = QUESTION_TYPES[body.type] ? body.type : "mc";
  const count = Math.max(1, Math.min(10, Number(body.count) || 5));
  const format = { ...DEFAULT_FORMAT, ...(body.format ?? {}) };
  const choices = format.mcChoices === 5 ? 5 : 4;
  const previous = (Array.isArray(body.previous) ? body.previous : []).filter((p) => typeof p === "string").slice(-MAX_PREVIOUS);
  const topics = (Array.isArray(body.topics) ? body.topics : []).slice(0, 60).map((t) => `- ${String(t).slice(0, 120)}`).join("\n");

  async function write(n, avoid) {
    const prompt = `You are writing part of a realistic practice exam for a ${test.subject} test on: ${test.topic}.
It must feel like the student's REAL test: same difficulty, style, and format.
${format.notes ? `What the student said about their test: "${String(format.notes).slice(0, 500)}"\n` : ""}${topics ? `Topics the test covers:\n${topics}\n` : ""}${subjectBriefText(test)}
Write exactly ${n} ${QUESTION_TYPES[type].short} questions. Each has ${TYPE_RULES[type](choices)}.
- Spread them across the topics, from easier to harder, mixing recall with problem-solving the way the real test does.
${avoid.length ? `- These questions were already asked on the student's earlier practice exams. Do NOT repeat them, reword them, or ask the same thing with different numbers or names. Ask new questions: different ideas, angles, or skills, and different setups (a word problem, a graph or table described in words, finding a mistake, comparing two methods, working backwards, a real-world context):\n${avoid.map((q) => `  * ${q.slice(0, 160)}`).join("\n")}\n` : ""}- ${PLAIN_TEXT_RULE}`;
    return generateJSON(prompt, questionSchema(type, choices));
  }

  const { data, error, status } = await write(count, previous);
  if (error) return Response.json({ error }, { status });

  // Keep only well-formed questions that aren't repeats (of earlier exams or each other).
  const kept = [];
  const seen = [...previous];
  for (const q of data.questions ?? []) {
    const out = shape(q, type, choices);
    if (!out || isRepeat(out.question, seen)) continue;
    kept.push(out);
    seen.push(out.question);
  }
  // Too many repeats? Ask once more for the rest (unless that was a hiccup: then the browser retries).
  if (kept.length < count && kept.length > 0) {
    const more = await write(count - kept.length, seen);
    for (const q of more.data?.questions ?? []) {
      const out = shape(q, type, choices);
      if (!out || isRepeat(out.question, seen) || kept.length >= count) continue;
      kept.push(out);
      seen.push(out.question);
    }
  }
  if (!kept.length) return Response.json({ error: "The AI couldn't write new questions this time." }, { status: 503 });
  return Response.json({ questions: kept });
}

function shape(q, type, choices) {
  if (!q?.question?.trim()) return null;
  const base = { type, question: q.question.trim(), explanation: q.explanation ?? "", concept: q.concept ?? "" };
  if (type === "mc") {
    if (q.choices?.length !== choices || !(q.answerIndex >= 0 && q.answerIndex < choices)) return null;
    return { ...base, choices: q.choices, answerIndex: q.answerIndex };
  }
  if (type === "tf") return typeof q.answerTrue === "boolean" ? { ...base, choices: ["True", "False"], answerIndex: q.answerTrue ? 0 : 1 } : null;
  if (type === "short") return q.answers?.length ? { ...base, answers: q.answers.map(String).slice(0, 8) } : null;
  return { ...base, rubric: q.rubric ?? "" };
}
