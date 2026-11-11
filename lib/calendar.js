// Calendar helpers for the Roost: what happens on each day, month/week grids, and free study time.
// Days are "YYYY-MM-DD" strings in the student's own time zone (same as the rest of the app).

import { addDays, daysBetween, localDateString } from "@/lib/dates";

export const DAY_START_HOUR = 0; // the Day view timeline shows the whole day, midnight ...
export const DAY_END_HOUR = 24; // ... to midnight (it scrolls)

// --- Grids -----------------------------------------------------------------

// The 7 days (Sunday first) of the week containing `dateKey`.
export function weekDays(dateKey) {
  const weekday = new Date(`${dateKey}T12:00:00`).getDay(); // 0 = Sunday
  const sunday = addDays(dateKey, -weekday);
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

// All the weeks shown in a month grid (includes a few days from the months around it).
export function monthWeeks(dateKey) {
  const first = `${dateKey.slice(0, 7)}-01`;
  const weeks = [];
  let weekStart = weekDays(first)[0];
  do {
    weeks.push(weekDays(weekStart));
    weekStart = addDays(weekStart, 7);
  } while (weekStart.slice(0, 7) === first.slice(0, 7));
  return weeks;
}

export function addMonths(dateKey, months) {
  const date = new Date(`${dateKey.slice(0, 7)}-01T12:00:00`);
  date.setMonth(date.getMonth() + months);
  return localDateString(date);
}

// --- What's on each day ------------------------------------------------------

// Synced events that happen on `dateKey`. All-day events have start/end as "YYYY-MM-DD" (end is exclusive).
export function eventsOn(events, dateKey) {
  return (events ?? [])
    .filter((e) =>
      e.allDay ? e.start <= dateKey && dateKey < e.end : localDateString(e.start) === dateKey
    )
    .sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
}

// Everything for one day, gathered from the study plan, synced events, and timer sessions.
export function dayInfo(dateKey, { plan, test, events, sessions }) {
  const planDay = plan?.days.find((d) => d.date === dateKey) ?? null;
  return {
    date: dateKey,
    planDay,
    planDayNumber: planDay ? plan.days.indexOf(planDay) + 1 : null,
    studyMinutes: planDay ? planDay.sections.reduce((sum, s) => sum + s.minutes, 0) : 0,
    planDone: planDay ? planDay.sections.every((s) => s.completed) : false,
    isTest: test?.testDate === dateKey,
    isMock: plan?.mockExam?.date === dateKey,
    events: eventsOn(events, dateKey),
    studiedMinutes: (sessions ?? []).filter((s) => s.date === dateKey).reduce((sum, s) => sum + s.minutes, 0),
  };
}

// A hatched chick on each calendar day you finished an Egg Timer session.
export function studyEgg(minutes) {
  if (!minutes) return null;
  return { emoji: "🐣", label: `Egg hatched: ${minutes} min studied` };
}

// --- Free study time ---------------------------------------------------------

const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes();

// Turns minutes-since-midnight into a Date on `dateKey` (local time).
export function atMinutes(dateKey, minutes) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setMinutes(minutes);
  return date;
}

// Finds the first free gap that fits the day's study time, avoiding synced events.
// Weekdays start after school (3:30 PM); weekends start at 10 AM. Nothing after 9:30 PM.
// Returns { start, end, minutes, fits } as Dates, or null if there's no gap of at least 20 minutes.
export function suggestStudySlot(dateKey, neededMinutes, events, now = new Date()) {
  if (!neededMinutes) return null;
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  let earliest = isWeekend ? 10 * 60 : 15 * 60 + 30;
  const latest = 21 * 60 + 30;
  const daysAway = daysBetween(localDateString(now), dateKey);
  if (daysAway < 0) return null; // no suggestions for the past
  if (daysAway === 0) earliest = Math.max(earliest, Math.ceil((minutesOfDay(now) + 5) / 15) * 15);

  // Busy times that day, as [start, end] minute ranges, sorted.
  const busy = eventsOn(events, dateKey)
    .filter((e) => !e.allDay)
    .map((e) => [minutesOfDay(new Date(e.start)), minutesOfDay(new Date(e.end)) || 24 * 60])
    .sort((a, b) => a[0] - b[0]);

  // Walk through the day, looking at the gaps between busy times.
  let best = null;
  let cursor = earliest;
  for (const [start, end] of [...busy, [latest, latest]]) {
    const gapEnd = Math.min(start, latest);
    const gap = gapEnd - cursor;
    if (gap >= neededMinutes) {
      return { start: atMinutes(dateKey, cursor), end: atMinutes(dateKey, cursor + neededMinutes), minutes: neededMinutes, fits: true };
    }
    if (gap >= 20 && (!best || gap > best.minutes)) {
      best = { start: atMinutes(dateKey, cursor), end: atMinutes(dateKey, gapEnd), minutes: gap, fits: false };
    }
    cursor = Math.max(cursor, end);
    if (cursor >= latest) break;
  }
  return best;
}

// --- Formatting --------------------------------------------------------------

// Date or ISO string → "4:30 PM"
export function formatClock(value) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// "2026-11" → "November 2026"
export function formatMonth(dateKey) {
  return new Date(`${dateKey.slice(0, 7)}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// "2026-11-10" → "Tuesday, November 10"
export function formatLongDate(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
