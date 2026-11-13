// The To-Do list: homework the student adds, plus study-plan items loaded automatically from
// every nest (each day's lessons, mock exams, and test days). Plain functions, no React.
//
// Saved under "todos":
//   homework: [{ id, title, subject, dueDate, dueTime, done, doneAt, createdAt, remindedSoon, remindedOverdue }]
//   checked: ["<nestId>:<sectionId>" ...]  study items ticked off by hand (lessons also tick themselves when passed)
//   nudgedDays: ["YYYY-MM-DD" ...]         days the evening "you still have lessons" reminder was sent

import { addDays, daysBetween } from "@/lib/dates";
import { goalFraction, isPassed } from "@/lib/progress";

export const EMPTY_TODOS = { homework: [], checked: [], nudgedDays: [] };

// "Due soon" means within this long. Homework due later than this isn't flagged yet.
export const SOON_MS = 24 * 60 * 60 * 1000;
// After this hour (local time), unfinished lessons for today get one reminder.
export const EVENING_NUDGE_HOUR = 17;

export function withTodoDefaults(todos) {
  return { ...EMPTY_TODOS, ...todos };
}

function newId() {
  return `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// --- Homework ------------------------------------------------------------------

export function addHomework(todos, { title, subject, dueDate, dueTime }) {
  const t = withTodoDefaults(todos);
  const item = {
    id: newId(),
    title: title.trim(),
    subject: subject?.trim() || "",
    dueDate,
    dueTime: dueTime || "",
    done: false,
    doneAt: null,
    createdAt: Date.now(),
    remindedSoon: false,
    remindedOverdue: false,
  };
  return { ...t, homework: [...t.homework, item] };
}

export function toggleHomework(todos, id) {
  const t = withTodoDefaults(todos);
  return {
    ...t,
    homework: t.homework.map((h) => (h.id === id ? { ...h, done: !h.done, doneAt: h.done ? null : Date.now() } : h)),
  };
}

export function deleteHomework(todos, id) {
  const t = withTodoDefaults(todos);
  return { ...t, homework: t.homework.filter((h) => h.id !== id) };
}

// When it's due, as a timestamp. Without a time, it's due at the end of that day.
export function dueAt(homework) {
  return new Date(`${homework.dueDate}T${homework.dueTime || "23:59"}:00`).getTime();
}

// "done", "overdue", "soon" (due within a day), or "later".
export function homeworkStatus(homework, now) {
  if (homework.done) return "done";
  const left = dueAt(homework) - now;
  if (left < 0) return "overdue";
  if (left <= SOON_MS) return "soon";
  return "later";
}

// "in 3 hours", "in 25 minutes", "2 days ago"... for the item's meta line.
export function dueRelative(homework, now) {
  const diff = dueAt(homework) - now;
  const mins = Math.round(Math.abs(diff) / 60000);
  const text = mins < 60 ? `${mins} min` : mins < 48 * 60 ? `${Math.round(mins / 60)} hr` : `${Math.round(mins / 1440)} days`;
  return diff >= 0 ? `in ${text}` : `${text} ago`;
}

// --- Study-plan items ---------------------------------------------------------------

export function toggleChecked(todos, key) {
  const t = withTodoDefaults(todos);
  const checked = t.checked.includes(key) ? t.checked.filter((k) => k !== key) : [...t.checked, key];
  return { ...t, checked };
}

// Everything from the nests for one day: its lessons, mock exams, and tests.
// Each item: { key, kind: "lesson" | "mock" | "test", title, subject, minutes?, href?, done, auto }
// `auto` is true when the item is done because the app knows it is (e.g. the lesson was passed).
export function planItemsFor(nests, dateKey, todos) {
  const checked = new Set(withTodoDefaults(todos).checked);
  const items = [];
  for (const nest of nests ?? []) {
    const subject = nest.test.subject;
    const goal = goalFraction(nest.test);
    const day = nest.plan?.days.find((d) => d.date === dateKey);
    for (const section of day?.sections ?? []) {
      const key = `${nest.id}:${section.id}`;
      const passed = isPassed(section, goal);
      items.push({
        key,
        kind: "lesson",
        title: section.title,
        subject,
        minutes: section.minutes,
        href: `/nest/${nest.id}/${section.id}`,
        done: passed || checked.has(key),
        auto: passed,
      });
    }
    if (nest.plan?.mockExam?.date === dateKey) {
      const key = `${nest.id}:mock`;
      const taken = Boolean(nest.plan.mockExam.completed);
      items.push({ key, kind: "mock", title: "Mock exam", subject, href: `/nest/${nest.id}/exam`, done: taken || checked.has(key), auto: taken });
    }
    if (nest.test.testDate === dateKey) {
      const key = `${nest.id}:test`;
      items.push({ key, kind: "test", title: `${subject} test`, subject, done: checked.has(key), auto: false });
    }
  }
  return items;
}

// Lessons from earlier days that still aren't done (only for tests that haven't happened yet).
export function missedPlanItems(nests, today, todos) {
  const items = [];
  for (const nest of nests ?? []) {
    if (nest.test.testDate < today) continue;
    for (const day of nest.plan?.days ?? []) {
      if (day.date >= today) continue;
      for (const item of planItemsFor([nest], day.date, todos)) {
        if (item.kind === "lesson" && !item.done) items.push({ ...item, date: day.date });
      }
    }
  }
  return items;
}

// --- Reminders -------------------------------------------------------------------

// Reminders that should go out now. Each: { id, title, body, href, mark } where `mark(todos)`
// returns the todos with that reminder recorded, so it's only sent once.
export function remindersDue(todos, nests, now, today) {
  const t = withTodoDefaults(todos);
  const reminders = [];

  for (const h of t.homework) {
    const status = homeworkStatus(h, now);
    const what = h.subject ? `${h.subject}: ${h.title}` : h.title;
    if (status === "soon" && !h.remindedSoon) {
      reminders.push({
        id: `soon-${h.id}`,
        title: "Homework due soon",
        body: `"${what}" is due ${dueRelative(h, now)}. Peck away at it now!`,
        href: "/todo",
        mark: (x) => setHomework(x, h.id, { remindedSoon: true }),
      });
    }
    if (status === "overdue" && !h.remindedOverdue) {
      reminders.push({
        id: `overdue-${h.id}`,
        title: "Homework is overdue",
        body: `"${what}" was due ${dueRelative(h, now)}. Finish it before your chicks find out!`,
        href: "/todo",
        // Overdue also counts as "soon", so it isn't announced twice.
        mark: (x) => setHomework(x, h.id, { remindedOverdue: true, remindedSoon: true }),
      });
    }
  }

  const hour = new Date(now).getHours();
  if (hour >= EVENING_NUDGE_HOUR && !t.nudgedDays.includes(today)) {
    const left = planItemsFor(nests, today, t).filter((i) => i.kind === "lesson" && !i.done);
    if (left.length) {
      const subjects = [...new Set(left.map((i) => i.subject))].join(" and ");
      reminders.push({
        id: `nudge-${today}`,
        title: "Study eggs waiting",
        body: `You still have ${left.length} ${subjects} lesson${left.length === 1 ? "" : "s"} for today. Keep them warm before bedtime!`,
        href: "/todo",
        mark: (x) => ({ ...withTodoDefaults(x), nudgedDays: [...withTodoDefaults(x).nudgedDays, today].slice(-60) }),
      });
    }
  }
  return reminders;
}

function setHomework(todos, id, changes) {
  const t = withTodoDefaults(todos);
  return { ...t, homework: t.homework.map((h) => (h.id === id ? { ...h, ...changes } : h)) };
}

// --- Days to show ----------------------------------------------------------------------

// Today through the next two weeks, plus any later day with homework or a test.
export function daysToShow(nests, todos, today) {
  const days = new Set(Array.from({ length: 14 }, (_, i) => addDays(today, i)));
  for (const h of withTodoDefaults(todos).homework) if (h.dueDate > today) days.add(h.dueDate);
  for (const n of nests ?? []) if (n.test.testDate > today) days.add(n.test.testDate);
  return [...days].sort();
}

export function dayLabel(dateKey, today) {
  const diff = daysBetween(today, dateKey);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "long" });
}
