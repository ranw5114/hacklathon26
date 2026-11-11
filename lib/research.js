// Server-only: before a study plan is made, gather real information about the class or test, so
// the plan, lessons, quizzes and mock exam match it (e.g. AMC 10: 25 questions, 75 minutes, no
// calculator, 6 / 1.5 / 0 scoring, competition-style problems).
//
// Sources, in order:
//   1. The built-in guide for subjects in the menu (lib/subjects.js). Always available.
//   2. Google Search through Gemini, when the API key's plan includes it (free keys often don't).
//   3. The AI's own knowledge, written up as a short brief grounded on 1 and 2.
// Research never blocks a plan: if a step fails, the plan is made with whatever was found.

import { ai, generateText, MODEL } from "@/lib/gemini";
import { findSubject } from "@/lib/subjects";

const SEARCH_TIMEOUT_MS = 15_000;
// Once Google Search is refused (no quota on this key), stop trying until the server restarts.
let searchUnavailable = false;

// Returns { brief, sources: [{ title, url }], basis: [strings saying what the brief is based on] }.
export async function researchSubject(test) {
  const subject = findSubject(test.subjectId) ?? findSubject(test.subject);
  const basis = [];
  if (subject) basis.push(`Built-in ${subject.label} guide`);

  const web = await searchTheWeb(test);
  if (web) basis.push("Google Search");

  const reference = [subject && `Built-in guide: ${subject.guide}`, web && `From a web search: ${web.text}`]
    .filter(Boolean)
    .join("\n\n");

  const { data } = await generateText(
    briefPrompt(test, reference),
    "You write short, accurate study briefs. Only state facts you are confident about. Plain text, no Markdown."
  );

  if (data?.trim()) {
    basis.push(reference ? "AI summary of these sources" : "The AI's own knowledge");
    return { brief: data.trim().slice(0, 2500), sources: web?.sources ?? [], basis };
  }
  // The AI couldn't write a brief: use the built-in guide on its own (or nothing).
  return { brief: subject?.guide ?? "", sources: web?.sources ?? [], basis };
}

function briefPrompt(test, reference) {
  return `Write a factual study brief (at most 200 words) for a student preparing for:
- Subject / test: ${test.subject}
- What's on it: ${test.topic}

Cover, as it applies:
1. What this test or class is: for a standardized test or competition, its format, timing, scoring, and calculator rules.
2. The specific topics it covers that matter for "${test.topic}", and roughly how much each one counts.
3. What the questions look like (style and difficulty), so practice problems can match them.
4. Two or three common mistakes students make.

If you aren't sure of a detail, leave it out rather than guess.
${reference ? `\nReference information (trust it over your memory):\n${reference}` : ""}`;
}

// Asks Gemini to search Google. Returns { text, sources } or null if it isn't available.
async function searchTheWeb(test) {
  if (searchUnavailable) return null;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Using current official sources, summarize in under 150 words what students need to know to prepare for "${test.subject}" (focus: ${test.topic}): format, timing, scoring, topics and their weights, and question style.`,
      config: { tools: [{ googleSearch: {} }], httpOptions: { timeout: SEARCH_TIMEOUT_MS } },
    });
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
      .map((c) => c.web)
      .filter((w) => w?.uri)
      .slice(0, 5)
      .map((w) => ({ title: w.title || w.uri, url: w.uri }));
    return response.text?.trim() ? { text: response.text.trim(), sources } : null;
  } catch (err) {
    if (err.status === 429 || err.status === 403 || err.status === 400) searchUnavailable = true;
    return null;
  }
}
