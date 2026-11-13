// Server-only: downloads a calendar (.ics) file from a private link (Google Calendar, Schoology,
// Apple iCloud, Outlook...). Used by the Roost's calendar sync and the To-Do list's assignment sync.
// The link is only used for the request; it's never stored on the server.

const MAX_BYTES = 3_000_000;

// Only fetch public web addresses, never things inside our own server's network.
function isAllowedUrl(url) {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  const blocked = [/^localhost$/, /\.local$/, /\.internal$/, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./, /^0\./, /^172\.(1[6-9]|2\d|3[01])\./, /^\[?::1\]?$/, /^\[?f[cd]/];
  return !blocked.some((pattern) => pattern.test(host));
}

// Returns { text } or { error } (a message to show the student).
export async function fetchCalendarFile(rawUrl) {
  let url;
  try {
    // Apple and Schoology share links as webcal://, which is just https:// for calendars.
    url = new URL(String(rawUrl ?? "").trim().replace(/^webcal:\/\//i, "https://"));
  } catch {
    return { error: "That doesn't look like a calendar link. It should start with https:// or webcal://" };
  }
  if (!isAllowedUrl(url)) return { error: "That calendar link isn't allowed." };

  let text;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers: { Accept: "text/calendar" } });
    if (!res.ok) return { error: "Couldn't open that calendar. Check the link and that it's the private/secret iCal address." };
    text = await res.text();
  } catch {
    return { error: "Couldn't reach that calendar. Please check the link and try again." };
  }

  if (text.length > MAX_BYTES) return { error: "That calendar is too big to load." };
  if (!text.includes("BEGIN:VCALENDAR")) {
    return { error: "That link isn't a calendar file. Use the iCal (.ics) address, not the normal calendar web page." };
  }
  return { text };
}
