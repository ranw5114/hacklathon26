import { generateJSON, PLAIN_TEXT_RULE, questionSchema } from "@/lib/gemini";

// AI requests can take a while (with retries), so allow up to 60 seconds on Vercel.
export const maxDuration = 60;

const EXAM_QUESTIONS = 10;

const examSchema = {
  type: "object",
  properties: { questions: { type: "array", items: questionSchema } },
  required: ["questions"],
};

// The mock exam: a practice test covering every section of the plan.
export async function POST(request) {
  const { test, sections } = await request.json();

  if (!test?.subject || !sections?.length) {
    return Response.json({ error: "Some exam details are missing." }, { status: 400 });
  }

  // Tell the AI which topics the student struggled with, so the exam checks those more.
  const topicList = sections
    .map((s) => `- ${s.title}${s.score !== null && s.score < 0.8 ? " (student found this hard)" : ""}`)
    .join("\n");

  const prompt = `You are writing a realistic practice exam for a ${test.subject} test on: ${test.topic}.

Topics covered:
${topicList}

Rules:
- Write exactly ${EXAM_QUESTIONS} multiple-choice questions, like a real class test at this level.
- Cover all the topics, with a few extra questions on topics marked "student found this hard".
- Mix recall questions with problem-solving questions. Order them from easier to harder.
- Each question has exactly 4 choices and one correct answer. Vary which position the correct answer is in.
- ${PLAIN_TEXT_RULE}`;

  const { data, error, status } = await generateJSON(prompt, examSchema);
  if (error) return Response.json({ error }, { status });

  const questions = data.questions.filter(
    (q) => q.choices?.length === 4 && q.answerIndex >= 0 && q.answerIndex < 4
  );
  if (!questions.length) {
    return Response.json({ error: "The AI made a broken exam. Please try again." }, { status: 500 });
  }

  return Response.json({ questions });
}
