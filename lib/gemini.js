import { GoogleGenAI } from "@google/genai";

// Server-only: the API key is read from .env.local and never sent to the browser.
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// A lightweight model keeps us inside the free tier's limits.
export const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

// If Google's servers are busy, we wait and try again; the last try uses a backup model.
const BACKUP_MODEL = "gemini-flash-latest";
const RETRY_DELAYS_MS = [1000, 2500];
// Give up on one attempt after 18s, so all 3 attempts fit in the 60s server limit (maxDuration).
const ATTEMPT_TIMEOUT_MS = 18_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Errors that usually go away on their own: 503 = overloaded, 500 = hiccup, no status = timeout/network.
const isTemporary = (err) => !err.status || err.status === 503 || err.status === 500;

// Ask Gemini for JSON in an exact shape (schema). Returns { data } or { error, status }.
export async function generateJSON(prompt, schema) {
  return generate(prompt, { responseMimeType: "application/json", responseJsonSchema: schema }, (text) =>
    JSON.parse(text)
  );
}

// Ask Gemini for a normal text reply (used by the tutor chat). Returns { data } or { error, status }.
// `contents` can be a whole conversation, including photos and uploaded files.
// `slow: true` (big files): one long try instead of three short ones, to fit the 60-second limit.
export async function generateText(contents, systemInstruction, { slow = false } = {}) {
  return generate(contents, { systemInstruction }, (text) => text, slow ? SLOW_PLAN : undefined);
}

// Reading a big PDF or video takes longer than a normal reply.
const SLOW_PLAN = { attempts: [MODEL], timeoutMs: 55_000 };
const NORMAL_PLAN = { attempts: [MODEL, MODEL, BACKUP_MODEL], timeoutMs: ATTEMPT_TIMEOUT_MS };

// The shared part: send the request, retrying when Google is busy.
async function generate(contents, config, readResult, plan = NORMAL_PLAN) {
  const { attempts, timeoutMs } = plan;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await ai.models.generateContent({
        model: attempts[i],
        contents,
        config: { ...config, httpOptions: { timeout: timeoutMs } },
      });
      return { data: readResult(response.text) };
    } catch (err) {
      const isLastTry = i === attempts.length - 1;
      if (isTemporary(err) && !isLastTry) {
        await sleep(RETRY_DELAYS_MS[i]);
        continue;
      }
      if (err.status === 429) {
        return { error: "The AI is at its free usage limit right now. Please try again in a minute.", status: 429 };
      }
      console.error("Gemini request failed:", err);
      // A file the AI can't take in all at once (too many pages, too long a video...).
      if (err.status === 400 && /token|too (large|long|big)|exceed|page/i.test(String(err.message))) {
        return { error: "That file is too big for the AI to read in one go. Try a shorter part of it (for example, just the pages you need).", status: 400 };
      }
      if (err.status === 400 && /file|mime|unsupported/i.test(String(err.message))) {
        return { error: "The AI couldn't open that file. Try saving it as a PDF and sending it again.", status: 400 };
      }
      if (plan === SLOW_PLAN && !err.status) {
        return { error: "That file took too long for the AI to read. Try a smaller part of it, or ask again.", status: 504 };
      }
      if (isTemporary(err)) {
        return { error: "The AI is very busy right now. Please try again in a moment.", status: 503 };
      }
      return { error: "Something went wrong with the AI. Please try again.", status: 500 };
    }
  }
}

// Shared schema for multiple-choice questions (used by level quizzes and the mock exam).
export const questionSchema = {
  type: "object",
  properties: {
    question: { type: "string" },
    choices: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
    answerIndex: { type: "integer", description: "Index (0-3) of the correct choice" },
    explanation: { type: "string", description: "1-2 sentences explaining why the answer is correct" },
    concept: { type: "string", description: "The concept this question tests, in 2-5 words (e.g. 'Finding the vertex')" },
  },
  required: ["question", "choices", "answerIndex", "explanation"],
};

// Formatting rule for every prompt: our pages show plain text, not LaTeX or Markdown.
export const PLAIN_TEXT_RULE =
  "Write plain text only: no Markdown, no LaTeX, and no emoji. Use Unicode for math and science (x², √, →, H₂O, ≤).";
