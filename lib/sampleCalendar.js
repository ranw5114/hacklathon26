// A made-up school schedule so judges (or anyone without a calendar link) can try the Roost.
// Events are created in the visitor's own time zone, around today's date.

import { addDays, todayString } from "@/lib/dates";

// Weekly schedule: [weekday (0 = Sun), title, start "HH:MM", end "HH:MM", location]
const WEEKLY = [
  [1, "AP Chemistry", "08:30", "09:50", "Room 214"],
  [3, "AP Chemistry", "08:30", "09:50", "Room 214"],
  [5, "AP Chemistry", "08:30", "09:50", "Room 214"],
  [1, "Algebra II", "10:00", "11:20", "Room 108"],
  [2, "Algebra II", "10:00", "11:20", "Room 108"],
  [4, "Algebra II", "10:00", "11:20", "Room 108"],
  [2, "English Lit", "12:30", "13:50", "Room 301"],
  [4, "English Lit", "12:30", "13:50", "Room 301"],
  [1, "Soccer practice", "15:45", "17:30", "Field B"],
  [3, "Soccer practice", "15:45", "17:30", "Field B"],
  [2, "Robotics club", "16:00", "17:00", "Lab 2"],
  [4, "Piano lesson", "18:00", "19:00", ""],
  [6, "Soccer game", "10:00", "12:00", "Away"],
  [0, "Family dinner", "18:00", "19:30", ""],
];

function at(dateKey, time) {
  return new Date(`${dateKey}T${time}:00`).toISOString();
}

// Events from 2 weeks ago to 8 weeks ahead, in the same shape the calendar sync API returns.
export function sampleEvents() {
  const today = todayString();
  const events = [];
  for (let offset = -14; offset <= 56; offset++) {
    const day = addDays(today, offset);
    const weekday = new Date(`${day}T12:00:00`).getDay();
    for (const [dow, title, start, end, location] of WEEKLY) {
      if (dow === weekday) {
        events.push({ id: `${day}-${title}`, title, start: at(day, start), end: at(day, end), allDay: false, location });
      }
    }
  }
  // A one-off all-day event to show how those look.
  const friday = addDays(today, ((5 - new Date(`${today}T12:00:00`).getDay() + 7) % 7) + 7);
  events.push({ id: "spirit-day", title: "School spirit day", start: friday, end: addDays(friday, 1), allDay: true, location: "" });
  return events;
}
