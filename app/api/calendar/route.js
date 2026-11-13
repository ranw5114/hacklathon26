import { fetchCalendarFile } from "@/lib/fetchCalendar";
import { readEvents } from "@/lib/ics";

// Reads a calendar from a private iCal link (Google Calendar, Apple iCloud, Outlook...)
// and returns its events as a simple list. Repeating events (like classes) are expanded
// into individual dates. The link is only used for this request; it's never stored here.

export async function POST(request) {
  const { url } = await request.json();
  const { text, error } = await fetchCalendarFile(url);
  if (error) return Response.json({ error }, { status: 400 });

  try {
    return Response.json({ events: readEvents(text) });
  } catch (err) {
    console.error("Calendar parse failed:", err);
    return Response.json({ error: "Couldn't read that calendar file." }, { status: 500 });
  }
}
