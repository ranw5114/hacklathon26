import { ai, MODEL } from "@/lib/gemini";

// Test route: visit /api/hello to check that the Gemini key works.
export async function GET() {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "GEMINI_API_KEY is missing. Add it to .env.local." },
      { status: 500 }
    );
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: "In one sentence, give a student an encouraging study tip.",
    });
    return Response.json({ model: MODEL, reply: response.text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
