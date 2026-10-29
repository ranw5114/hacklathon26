// Date helpers. Dates are plain "YYYY-MM-DD" strings, the same format as <input type="date">.

// Parse at noon UTC so time zones and daylight saving never shift the day.
function toUTC(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`);
}

// Number of days from `from` to `to` (e.g. today → test date).
export function daysBetween(from, to) {
  return Math.round((toUTC(to) - toUTC(from)) / 86_400_000);
}

export function addDays(dateStr, days) {
  const date = toUTC(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// Today's date in the visitor's own time zone.
export function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

// "2026-10-29" → "Thu, Oct 29"
export function formatDate(dateStr) {
  return toUTC(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
