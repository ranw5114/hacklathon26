import ICAL from "ical.js";

// Reads an iCal (.ics) calendar file into a simple list of events.
// Repeating events (like classes) are expanded into individual dates.

const DAY = 86_400_000;
const PAST_DAYS = 14;
const FUTURE_DAYS = 90;
const MAX_EVENTS = 2000;

// One occurrence → { id, title, start, end, allDay, location }.
// All-day events use "YYYY-MM-DD" dates (end is the day after); timed events use exact times.
function toEvent(item, start, end, key) {
  const allDay = start.isDate;
  const endTime = end ?? start;
  return {
    id: key,
    title: item.summary || "Busy",
    location: item.location || "",
    allDay,
    start: allDay ? start.toString() : start.toJSDate().toISOString(),
    end: allDay
      ? (end ? end : start.clone().adjust(1, 0, 0, 0)).toString()
      : endTime.toJSDate().toISOString(),
  };
}

export function readEvents(icsText, now = Date.now()) {
  const calendar = new ICAL.Component(ICAL.parse(icsText));
  // Time zone info inside the file, so "9:00 AM Pacific" converts correctly.
  for (const zone of calendar.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(zone);

  const rangeStart = ICAL.Time.fromJSDate(new Date(now - PAST_DAYS * DAY), true);
  const rangeEnd = ICAL.Time.fromJSDate(new Date(now + FUTURE_DAYS * DAY), true);

  // Separate normal events from "this one time it moved" exceptions to repeating events.
  const all = calendar
    .getAllSubcomponents("vevent")
    .filter((v) => v.getFirstPropertyValue("status") !== "CANCELLED")
    .map((v) => new ICAL.Event(v));
  const repeating = new Map(all.filter((e) => e.isRecurring()).map((e) => [e.uid, e]));
  const standalone = [];
  for (const event of all) {
    if (event.isRecurrenceException() && repeating.has(event.uid)) repeating.get(event.uid).relateException(event);
    else if (!event.isRecurring()) standalone.push(event);
  }

  const events = [];
  for (const event of standalone) {
    const end = event.endDate ?? event.startDate;
    if (end.compare(rangeStart) >= 0 && event.startDate.compare(rangeEnd) <= 0) {
      events.push(toEvent(event, event.startDate, event.endDate, event.uid));
    }
  }

  for (const event of repeating.values()) {
    const iterator = event.iterator();
    let next;
    let safety = 0;
    while ((next = iterator.next()) && safety++ < 5000 && events.length < MAX_EVENTS) {
      if (next.compare(rangeEnd) > 0) break;
      const details = event.getOccurrenceDetails(next);
      if ((details.endDate ?? details.startDate).compare(rangeStart) < 0) continue;
      events.push(toEvent(details.item, details.startDate, details.endDate, `${event.uid}-${next.toString()}`));
    }
  }

  return events.slice(0, MAX_EVENTS).sort((a, b) => a.start.localeCompare(b.start));
}

// --- Assignments (Schoology and Google Classroom calendar links) -------------------------

// Schoology's calendar also has school events; assignment links contain one of these paths.
const SCHOOLOGY_WORK = /\/(assignment|assessment|discussion|course\/\d+\/materials|page)\//i;

// Reads assignments from a calendar file: each event becomes { uid, title, dueDate, dueAt, link, className }.
// All-day items have only `dueDate` ("YYYY-MM-DD"). Timed items also have `dueAt` (an exact ISO time),
// which the browser turns into the student's own local date and time (the server may be in UTC).
// Only items due from `sinceDays` ago onward are returned.
// Returns { calendarName, items, skipped } where `skipped` counts events that didn't look like schoolwork.
export function readAssignments(icsText, { now = Date.now(), sinceDays = 1, onlySchoolwork = false } = {}) {
  const calendar = new ICAL.Component(ICAL.parse(icsText));
  for (const zone of calendar.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(zone);
  const calendarName = calendar.getFirstPropertyValue("x-wr-calname") || "";
  const since = new Date(now - sinceDays * DAY);
  const sinceKey = localDay(since);

  let skipped = 0;
  const items = [];
  for (const v of calendar.getAllSubcomponents("vevent")) {
    if (v.getFirstPropertyValue("status") === "CANCELLED") continue;
    const event = new ICAL.Event(v);
    const start = event.startDate;
    if (!start) continue;
    const description = event.description || "";
    const link = (v.getFirstPropertyValue("url") || description.match(/https?:\/\/\S+/)?.[0] || "").replace(/[)>\].,]+$/, "");
    if (onlySchoolwork && !SCHOOLOGY_WORK.test(link) && !SCHOOLOGY_WORK.test(description)) {
      skipped++;
      continue;
    }
    const allDay = start.isDate;
    const due = allDay ? null : start.toJSDate();
    const dueDate = allDay ? start.toString() : localDay(due);
    if (dueDate < sinceKey) continue;
    items.push({
      uid: event.uid || `${event.summary}-${dueDate}`,
      title: (event.summary || "Assignment").trim(),
      dueDate,
      dueAt: allDay ? null : due.toISOString(),
      link: /^https?:\/\//.test(link) ? link : "",
      className: courseFrom(description) || calendarName,
    });
  }
  items.sort((a, b) => (a.dueAt ?? a.dueDate).localeCompare(b.dueAt ?? b.dueDate));
  return { calendarName, items: items.slice(0, 500), skipped };
}

// "YYYY-MM-DD" in the server's local time zone.
function localDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Some feeds put the class in the description, e.g. "Course: AP Chemistry".
function courseFrom(description) {
  return description.match(/(?:course|class|section)\s*:\s*([^\n\r]+)/i)?.[1]?.trim() || "";
}
