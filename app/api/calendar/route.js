import { readEvents } from "@/lib/ics";

// Reads a calendar from a private iCal link (Google Calendar, Apple iCloud, Outlook...)
// and returns its events as a simple list. Repeating events (like classes) are expanded
// into individual dates. The link is only used for this request; it's never stored here.

const MAX_BYTES = 3_000_000;

// Only fetch public web addresses, never things inside our own server's network.
function isAllowedUrl(url) {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  const blocked = [/^localhost$/, /\.local$/, /\.internal$/, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^0\./, /^172\.(1[6-9]|2\d|3[01])\./, /^\[?::1\]?$/, /^\[?f[cd]/];
  return !blocked.some((pattern) => pattern.test(host));
}

function errorResponse(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function POST(request) {
  const { url: rawUrl } = await request.json();

  let url;
  try {
    // Apple shares links as webcal://, which is just https:// for calendars.
    url = new URL(String(rawUrl ?? "").trim().replace(/^webcal:\/\//i, "https://"));
  } catch {
    return errorResponse("That doesn't look like a calendar link. It should start with https:// or webcal://");
  }
  if (!isAllowedUrl(url)) return errorResponse("That calendar link isn't allowed.");

  let text;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { Accept: "text/calendar" } });
    if (!res.ok) return errorResponse("Couldn't open that calendar. Check the link and that it's the private/secret iCal address.");
    text = await res.text();
  } catch {
    return errorResponse("Couldn't reach that calendar. Please check the link and try again.");
  }

  if (text.length > MAX_BYTES) return errorResponse("That calendar is too big to load.");
  if (!text.includes("BEGIN:VCALENDAR")) {
    return errorResponse("That link isn't a calendar file. Use the iCal (.ics) address, not the normal calendar web page.");
  }

  try {
    return Response.json({ events: readEvents(text) });
  } catch (err) {
    console.error("Calendar parse failed:", err);
    return errorResponse("Couldn't read that calendar file.", 500);
  }
}
