import { fetchCalendarFile } from "@/lib/fetchCalendar";
import { readAssignments } from "@/lib/ics";

// Reads homework from a Schoology or Google Classroom calendar link, for the To-Do list.
// Body: { url, kind: "schoology" | "classroom", sinceDays }. The link is never stored here.
export async function POST(request) {
  const { url, kind, sinceDays = 1 } = await request.json();
  const { text, error } = await fetchCalendarFile(url);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    // Schoology's calendar mixes assignments with school events; keep the schoolwork,
    // unless nothing in it looks like schoolwork (then keep everything).
    let result = readAssignments(text, { sinceDays, onlySchoolwork: kind === "schoology" });
    if (kind === "schoology" && result.items.length === 0 && result.skipped > 0) {
      result = readAssignments(text, { sinceDays });
    }
    return Response.json(result);
  } catch (err) {
    console.error("Assignment calendar parse failed:", err);
    return Response.json({ error: "Couldn't read that calendar file." }, { status: 500 });
  }
}
