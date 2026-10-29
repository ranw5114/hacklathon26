import { ai, MODEL } from "@/lib/gemini";
import { addDays, daysBetween } from "@/lib/dates";

// Keep plans short enough to read and to stay inside the free AI limits.
const MAX_STUDY_DAYS = 14;
const MAX_NOTES_CHARS = 15_000;

const LEARNING_STYLES = {
  visual: "a visual learner who understands best through diagrams, charts, and pictures",
  lecture: "a learner who prefers clear step-by-step explanations, like a teacher's lecture",
  examples: "a learner who understands best by working through examples and practice problems",
};

// The exact JSON shape we want back from Gemini.
const planSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "Short, motivating plan title" },
    overview: {
      type: "string",
      description: "2-3 sentences explaining the strategy, written to the student",
    },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          focus: { type: "string", description: "The theme of the day in a few words" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                goal: {
                  type: "string",
                  description: "One sentence: what the student will be able to do afterwards",
                },
                minutes: { type: "integer" },
              },
              required: ["title", "goal", "minutes"],
            },
          },
        },
        required: ["focus", "sections"],
      },
    },
  },
  required: ["title", "overview", "days"],
};

function buildPrompt(profile, lessonDays) {
  const notes = profile.notes?.trim().slice(0, MAX_NOTES_CHARS);

  return `You are an expert tutor creating a day-by-day study plan for an upcoming test.

Student:
- Subject: ${profile.subject}
- Test topic(s): ${profile.topic}
- Current grade in the class: ${profile.currentGrade}%
- Goal grade: ${profile.goalGrade}%
- Study time available: about ${profile.hoursPerDay} hour(s) per day
- Learning style: ${LEARNING_STYLES[profile.learningStyle]}
${notes ? `\nThe student's class notes (use these to decide what to cover):\n"""\n${notes}\n"""\n` : ""}
Rules:
- Create exactly ${lessonDays} day(s). A mock exam is scheduled separately after the last day, so don't include one.
- Each day has 2-4 sections. Each section's minutes add up to about ${profile.hoursPerDay * 60} minutes per day.
- Start with the basic concepts and build up to harder material. Use the last day for review.
- Every section ends with a short quiz, so each one should cover a single, testable idea.
- The bigger the gap between the current grade and goal grade, the more practice-heavy the plan should be.`;
}

function errorResponse(message, status) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  const { profile, today } = await request.json();

  if (!profile?.subject || !profile?.topic || !profile?.testDate || !LEARNING_STYLES[profile?.learningStyle]) {
    return errorResponse("Some setup answers are missing.", 400);
  }

  const daysUntilTest = daysBetween(today, profile.testDate);
  if (daysUntilTest < 1) {
    return errorResponse("The test date needs to be after today.", 400);
  }

  // Study every day until the test (up to the max). The last day ends with the mock exam.
  const studyDays = Math.min(daysUntilTest, MAX_STUDY_DAYS);

  let aiPlan;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(profile, studyDays),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: planSchema,
      },
    });
    aiPlan = JSON.parse(response.text);
  } catch (err) {
    if (err.status === 429) {
      return errorResponse("The AI is at its free usage limit right now. Please try again in a minute.", 429);
    }
    console.error("Plan generation failed:", err);
    return errorResponse("Something went wrong while creating your plan. Please try again.", 500);
  }

  if (!aiPlan.days?.length) {
    return errorResponse("The AI returned an empty plan. Please try again.", 500);
  }

  // Our code (not the AI) assigns dates and IDs, so they're always correct.
  const days = aiPlan.days.slice(0, studyDays).map((day, i) => ({
    date: addDays(today, i),
    focus: day.focus,
    sections: day.sections.map((section, j) => ({
      id: `d${i + 1}-s${j + 1}`,
      title: section.title,
      goal: section.goal,
      minutes: section.minutes,
      completed: false,
      score: null,
    })),
  }));

  return Response.json({
    title: aiPlan.title,
    overview: aiPlan.overview,
    createdOn: today,
    days,
    mockExam: { date: days.at(-1).date, completed: false, score: null },
  });
}
