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
