import { generateJSON, PLAIN_TEXT_RULE, questionSchema } from "@/lib/gemini";
import { LEARNING_STYLES } from "@/lib/learningStyles";

// AI requests can take a while (with retries), so allow up to 60 seconds on Vercel.
export const maxDuration = 60;

const QUESTIONS_PER_LEVEL = 5;

// How the lesson changes for each learning style.
const STYLE_INSTRUCTIONS = {
  visual:
    "Make it visual: use vivid mental pictures and analogies, and use the 'steps' list as a step-by-step flow (like a diagram in words, with arrows →).",
  lecture:
    "Teach it like a great lecture: clear, thorough explanations in a logical order, building each idea on the last.",
  examples:
    "Teach mostly through examples: keep explanations short and make the worked example detailed, with every step shown.",
};

// One level = a short lesson followed by a quiz. Both come from a single AI request.
const levelSchema = {
  type: "object",
  properties: {
    lesson: {
      type: "object",
      properties: {
        hook: { type: "string", description: "One friendly sentence on why this matters" },
        sections: {
          type: "array",
          description: "2-3 short teaching sections",
          items: {
            type: "object",
            properties: { heading: { type: "string" }, body: { type: "string" } },
            required: ["heading", "body"],
          },
        },
        example: {
          type: "object",
          properties: {
            problem: { type: "string" },
            steps: { type: "array", items: { type: "string" } },
            answer: { type: "string" },
          },
          required: ["problem", "steps", "answer"],
        },
        keyPoints: { type: "array", items: { type: "string" }, description: "3-4 things to remember" },
        videoSearch: { type: "string", description: "A short YouTube search phrase for this exact topic" },
      },
      required: ["hook", "sections", "example", "keyPoints", "videoSearch"],
    },
    quiz: { type: "array", items: questionSchema },
  },
  required: ["lesson", "quiz"],
};

export async function POST(request) {
  const { learner, test, section } = await request.json();

  if (!section?.title || !test?.subject || !LEARNING_STYLES[learner?.learningStyle]) {
    return Response.json({ error: "Some level details are missing." }, { status: 400 });
  }

  const prompt = `You are a friendly, expert tutor. Teach one short lesson, then write a quiz on it.

Student: studying ${test.subject} (test on: ${test.topic}). They are ${LEARNING_STYLES[learner.learningStyle].prompt}.
Lesson: "${section.title}". Goal: ${section.goal}

Rules:
- ${STYLE_INSTRUCTIONS[learner.learningStyle]}
- Keep the lesson short enough to read in about 5 minutes. Use a warm, encouraging tone.
- Write exactly ${QUESTIONS_PER_LEVEL} multiple-choice questions that test the lesson's goal, from easier to harder.
- Each question has exactly 4 choices and one correct answer. Vary which position the correct answer is in.
- ${PLAIN_TEXT_RULE}`;

  const { data, error, status } = await generateJSON(prompt, levelSchema);
  if (error) return Response.json({ error }, { status });

  // Drop any malformed questions so the quiz never breaks.
  const quiz = data.quiz.filter((q) => q.choices?.length === 4 && q.answerIndex >= 0 && q.answerIndex < 4);
  if (!quiz.length) return Response.json({ error: "The AI made a broken quiz. Please try again." }, { status: 500 });

  return Response.json({ lesson: data.lesson, quiz });
}
