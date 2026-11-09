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
  const attempts = [MODEL, MODEL, BACKUP_MODEL];

  for (let i = 0; i < attempts.length; i++) {
    try {
      const response = await ai.models.generateContent({
        model: attempts[i],
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          httpOptions: { timeout: ATTEMPT_TIMEOUT_MS },
        },
      });
      return { data: JSON.parse(response.text) };
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
  },
  required: ["question", "choices", "answerIndex", "explanation"],
};

// Formatting rule for every prompt: our pages show plain text, not LaTeX or Markdown.
export const PLAIN_TEXT_RULE =
  "Write plain text only: no Markdown, no LaTeX. Use Unicode for math and science (x², √, →, H₂O, ≤).";
