import { generateText, PLAIN_TEXT_RULE } from "@/lib/gemini";
import { LEARNING_STYLES } from "@/lib/learningStyles";

// AI requests can take a while (with retries), so allow up to 60 seconds on Vercel.
export const maxDuration = 60;

// Only send the most recent messages, to keep requests small and fast.
const MAX_HISTORY = 12;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// The tutor's personality and rules, personalized to the student.
function buildInstructions(learner, test, currentLevel) {
  const style = LEARNING_STYLES[learner?.learningStyle];
  return `You are Scholar, a friendly chick tutor in the Chick Study Buddy app. You help students understand their schoolwork.

About the student:
- Name: ${learner?.name || "the student"}
${style ? `- Learning style: ${style.prompt}. Explain things that way.` : ""}
${test ? `- Currently studying ${test.subject} for a test on: ${test.topic}` : ""}
${currentLevel ? `- Their current lesson: "${currentLevel}"` : ""}

How to help:
- Be warm, encouraging, and concise. Use short paragraphs and numbered steps for problems.
- Help with ANY school subject or homework, not only the test they're studying for. Never refuse schoolwork.
- For homework problems (typed or in a photo), explain step by step so they learn the method, then give the answer.
- If a photo is unclear, say what you can read and ask them to retake it.
- Only redirect chats that have nothing to do with school. A light chicken pun now and then is welcome.
- ${PLAIN_TEXT_RULE}`;
}

// Turn our chat messages into Gemini's format: { role: "user" | "model", parts: [...] }.
function toGeminiContents(messages) {
  return messages.map((message) => {
    const parts = [];
    if (message.image) {
      parts.push({ inlineData: { mimeType: message.image.mimeType, data: message.image.data } });
    }
    parts.push({ text: message.text || "Please help me with this problem." });
    return { role: message.role === "user" ? "user" : "model", parts };
  });
}

export async function POST(request) {
  const { messages, learner, test, currentLevel } = await request.json();

  const recent = Array.isArray(messages) ? messages.slice(-MAX_HISTORY) : [];
  if (!recent.length || recent.at(-1).role !== "user") {
    return Response.json({ error: "Send a message first." }, { status: 400 });
  }
  if (recent.some((m) => m.image && !ALLOWED_IMAGE_TYPES.includes(m.image.mimeType))) {
    return Response.json({ error: "Photos must be JPG, PNG, or WebP." }, { status: 400 });
  }

  const { data, error, status } = await generateText(
    toGeminiContents(recent),
    buildInstructions(learner, test, currentLevel)
  );
  if (error) return Response.json({ error }, { status });

  return Response.json({ reply: data });
}
