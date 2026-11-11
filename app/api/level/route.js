import { generateJSON, PLAIN_TEXT_RULE, questionSchema } from "@/lib/gemini";
import { GRAPH_RULES, SVG_RULES } from "@/lib/drawingRules";
import { LEARNING_STYLES } from "@/lib/learningStyles";

// AI requests can take a while (with retries), so allow up to 60 seconds on Vercel.
export const maxDuration = 60;

const QUESTIONS_PER_LEVEL = 5;

// How the lesson changes for each learning style. The lesson page draws each section's
// "graph" (to scale) and "svg" (a diagram), and shows "practice" problems with hidden solutions.
const STYLE_INSTRUCTIONS = {
  visual: `This student learns through pictures, so TEACH WITH DRAWINGS.
- Give EVERY section a picture: a "graph" for anything about an equation or function, otherwise an "svg" diagram (labeled diagram, flowchart, number line, table, before/after picture). Keep each section's "body" to 2-3 short sentences that say what to look at in the picture.
- "graph": the app draws it perfectly to scale from your description. ${GRAPH_RULES}
- "svg": one complete <svg xmlns="http://www.w3.org/2000/svg" …>…</svg> string. ${SVG_RULES}
- Give 1 practice problem.`,
  lecture: `This student wants a thorough lecture, so EXPLAIN FULLY.
- Write 3-4 sections in a logical order: the big picture first, then each key idea one at a time, building on the last.
- Each "body" is 2-3 full paragraphs: explain WHY each idea works, not just what to do, define every new term, and point out common mistakes.
- Make the worked example's steps explain the reasoning behind each move.
- Give 1 practice problem. No "graph" or "svg".`,
  examples: `This student learns from examples, so SHOW, THEN LET THEM TRY.
- Keep each section's "body" short (2-4 sentences), and include a small worked example inside each body.
- Make the main worked example detailed, with every step shown.
- Give exactly 3 practice problems from easier to harder, each with a full step-by-step solution ending in the answer. No "graph" or "svg".`,
};

// A graph the app draws to scale (see components/Graph.js).
const graphSchema = {
  type: "object",
  properties: {
    curves: {
      type: "array",
      items: {
        type: "object",
        properties: { expr: { type: "string" }, label: { type: "string" } },
        required: ["expr"],
      },
    },
    points: {
      type: "array",
      items: {
        type: "object",
        properties: { x: { type: "number" }, y: { type: "number" }, label: { type: "string" } },
        required: ["x", "y"],
      },
    },
    verticals: {
      type: "array",
      description: "Vertical lines, like an axis of symmetry",
      items: {
        type: "object",
        properties: { x: { type: "number" }, label: { type: "string" } },
        required: ["x"],
      },
    },
    x: { type: "array", items: { type: "number" }, description: "Visible x range [min, max]" },
    y: { type: "array", items: { type: "number" }, description: "Visible y range [min, max]" },
  },
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
          description: "2-4 teaching sections",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              body: { type: "string" },
              graph: { ...graphSchema, description: "Optional: a graph for this section (visual learners)" },
              svg: { type: "string", description: "Optional: an SVG diagram for this section (visual learners)" },
            },
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
        practice: {
          type: "array",
          description: "Practice problems to try before the quiz",
          items: {
            type: "object",
            properties: {
              problem: { type: "string" },
              solution: { type: "string", description: "Numbered steps, then the final answer" },
            },
            required: ["problem", "solution"],
          },
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
- Keep the lesson short enough to work through in about 5-10 minutes. Use a warm, encouraging tone.
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
