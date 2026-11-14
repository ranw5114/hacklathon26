"use client";

import PageIcon from "@/components/PageIcon";
import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import PageTour from "@/components/PageTour";
import { SyncButton, SyncedSources } from "@/components/AssignmentSync";
import { askForNotifications, notificationsSupported } from "@/lib/alerts";
import { addDays, daysBetween, formatDate, todayString } from "@/lib/dates";
import { useNests } from "@/lib/nests";
import { update, useStored } from "@/lib/storage";
import {
  addHomework,
  dayLabel,
  daysToShow,
  deleteHomework,
  dueAt,
  dueRelative,
  homeworkStatus,
  missedPlanItems,
  planItemsFor,
  toggleChecked,
  toggleHomework,
  withTodoDefaults,
} from "@/lib/todos";
import { useNow } from "@/lib/useNow";
import { formatClock } from "@/lib/calendar";

const KIND_ICONS = { lesson: "egg", mock: "trophy", test: "target", homework: "homework" };

// The To-Do list: every day's study lessons (loaded from the nests automatically) and homework.
export default function TodoPage() {
  const nests = useNests();
  const stored = useStored("todos");
  const now = useNow();
  const [showAdd, setShowAdd] = useState(false);
  const [, setPermissionAsked] = useState(0); // re-render after the browser's permission prompt

  if (nests === undefined || stored === undefined) return null;
  const todos = withTodoDefaults(stored);
  const today = todayString();

  const overdueHomework = todos.homework.filter((h) => homeworkStatus(h, now) === "overdue");
  const missedLessons = missedPlanItems(nests, today, todos);
  const days = daysToShow(nests, todos, today);
  const tomorrow = addDays(today, 1);

  // A day's study lessons and (not overdue) homework, and how many are done.
  function itemsFor(date) {
    const plan = planItemsFor(nests, date, todos);
    const homework = todos.homework
      .filter((h) => h.dueDate === date && homeworkStatus(h, now) !== "overdue")
      .sort((a, b) => (a.dueTime || "99").localeCompare(b.dueTime || "99"));
    const done = plan.filter((i) => i.done).length + homework.filter((h) => h.done).length;
    return { plan, homework, total: plan.length + homework.length, done };
  }
  const freeDays = days.week.filter((date) => date > tomorrow && itemsFor(date).total === 0);
  const overdueDays = overdueByDay(overdueHomework, missedLessons);
  const subjects = [...new Set(nests.map((n) => n.test.subject))];

  const canNotify = notificationsSupported();
  const permission = canNotify ? Notification.permission : "unsupported";

  async function turnOnReminders() {
    await askForNotifications();
    setPermissionAsked((n) => n + 1);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center gap-3">
        <PageIcon icon="todo" move="pop" size={52} lines={["Peck, peck, done!", "One task at a time!", "Check me off, I dare you.", "Future you says thanks!"]} label="Poke the list" />
        <div>
          <p className="label-small">Day by day</p>
          <h1 className="text-3xl">To-Do List</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <SyncButton />
          <button type="button" onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-1.5 px-4 py-2">
            <Icon name="plus" size={16} /> Homework
          </button>
          <PageTour page="todo" />
        </div>
      </div>

      {/* Reminders */}
      {permission === "default" && (
        <div className="card mt-6 flex flex-wrap items-center gap-3 bg-chick/50">
          <Icon name="bell" size={34} />
          <p className="flex-1 text-sm">
            Get a cluck when homework is due soon or overdue, and an evening nudge if today&apos;s lessons aren&apos;t
            done.
          </p>
          <button type="button" onClick={turnOnReminders} className="btn-primary px-4 py-1.5 text-sm">
            Turn on reminders
          </button>
        </div>
      )}
      {permission === "denied" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Icon name="bell" size={18} /> Notifications are blocked for this site, so reminders only show inside the app. You
          can allow them in your browser&apos;s site settings.
        </p>
      )}
      {permission === "granted" && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Icon name="bell" size={18} /> Reminders are on. They arrive while Cluck In is open in a tab.
        </p>
      )}

      {showAdd && <AddHomework subjects={subjects} today={today} onDone={() => setShowAdd(false)} />}

      <SyncedSources todos={todos} />

      {/* Overdue: one red card per day it was due, oldest first */}
      {overdueDays.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <p className="flex items-center gap-2 px-2 font-display font-semibold text-red-800">
            <Icon name="fried" size={22} /> Overdue · don&apos;t let these get fried!
          </p>
          {overdueDays.map(({ date, entries }) => {
            const late = daysBetween(date, today);
            return (
              <section key={date} className="card border-red-700 bg-red-50 shadow-[0_4px_0_#991b1b]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-xl text-red-800">
                    <Icon name="fried" size={26} />
                    {dayLabel(date, today)} <span className="text-base font-normal text-red-800/70">· {formatDate(date)}</span>
                  </h2>
                  <span className="rounded-full bg-red-700 px-3 py-0.5 text-sm font-semibold text-white">
                    {late === 0 ? "Overdue" : late === 1 ? "1 day late" : `${late} days late`}
                  </span>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {entries.map((entry) =>
                    entry.homework ? (
                      <HomeworkRow key={entry.homework.id} homework={entry.homework} now={now} />
                    ) : (
                      <PlanRow key={entry.lesson.key} item={entry.lesson} />
                    )
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* This week, day by day */}
      <div className="mt-6 flex flex-col gap-4">
        {days.week.map((date) => {
          const { plan, homework, total, done } = itemsFor(date);
          const isToday = date === today;

          // Quiet days after tomorrow are gathered into the free-range card below.
          if (!total && date > tomorrow) return null;

          return (
            <section key={date} className={`card ${isToday ? "bg-chick/60" : ""}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl">
                  {dayLabel(date, today)} <span className="text-base font-normal text-muted">· {formatDate(date)}</span>
                </h2>
                {total > 0 && (
                  <span className="text-sm font-semibold text-muted">
                    {done === total ? (
                      <span className="flex items-center gap-1">
                        <Icon name="done" size={16} /> All done!
                      </span>
                    ) : (
                      `${done} of ${total} done`
                    )}
                  </span>
                )}
              </div>
              {total === 0 ? (
                <div className="mt-2 flex items-center gap-3 text-muted">
                  <Chick variant="sunny" size={40} />
                  <p>Nothing due. Free-range day!</p>
                </div>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {plan.map((item) => (
                    <PlanRow key={item.key} item={item} />
                  ))}
                  {homework.map((h) => (
                    <HomeworkRow key={h.id} homework={h} now={now} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {/* The rest of the week's empty days, as one card of day chips */}
        {freeDays.length > 0 && (
          <section className="card">
            <div className="flex items-center gap-3">
              <Chick variant="sunny" size={40} className="shrink-0" />
              <div>
                <h2 className="text-xl">Free-range days</h2>
                <p className="text-sm text-muted">Nothing due these days this week. Enjoy!</p>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {freeDays.map((date) => (
                <li
                  key={date}
                  className="flex flex-col items-center rounded-2xl border-[3px] border-line bg-chick/40 px-3 py-1 font-display leading-tight"
                >
                  <span className="text-xs font-semibold text-muted uppercase">{weekdayShort(date)}</span>
                  <span className="text-lg font-semibold">{dayOfMonth(date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Homework and tests more than a week away, so nothing is hidden */}
        {days.later.length > 0 && (
          <section className="card">
            <h2 className="flex items-center gap-2 text-xl">
              <Icon name="calendar" size={22} /> Coming up later
            </h2>
            <div className="mt-3 flex flex-col gap-4">
              {days.later.map((date) => {
                const { plan, homework } = itemsFor(date);
                return (
                  <div key={date}>
                    <p className="label-small">
                      {formatDate(date)} · in {daysBetween(today, date)} days
                    </p>
                    <ul className="mt-2 flex flex-col gap-2">
                      {plan.map((item) => (
                        <PlanRow key={item.key} item={item} />
                      ))}
                      {homework.map((h) => (
                        <HomeworkRow key={h.id} homework={h} now={now} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {nests.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          Study plans from your <Link href="/nest" className="underline">nests</Link> show up here automatically.
        </p>
      )}
    </main>
  );
}

// "2026-11-15" → "Sun" and "15", for the free-range day chips.
function weekdayShort(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}
function dayOfMonth(dateKey) {
  return Number(dateKey.slice(8));
}

// Overdue homework and missed lessons, grouped by the day they were due (oldest day first,
// and by due time within a day).
function overdueByDay(homework, lessons) {
  const entries = [
    ...homework.map((h) => ({ homework: h, date: h.dueDate, due: dueAt(h), subject: h.subject })),
    ...lessons.map((l) => ({ lesson: l, date: l.date, due: new Date(`${l.date}T23:59:00`).getTime(), subject: l.subject })),
  ].sort((a, b) => a.due - b.due || (a.subject || "").localeCompare(b.subject || ""));
  const days = new Map();
  for (const entry of entries) {
    if (!days.has(entry.date)) days.set(entry.date, []);
    days.get(entry.date).push(entry);
  }
  return [...days].map(([date, items]) => ({ date, entries: items }));
}

// A round checkbox in the chicken style.
function CheckButton({ done, onClick, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={done}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-[3px] border-line transition ${
        done ? "bg-[oklch(0.76_0.15_145)]" : "bg-white hover:bg-chick"
      } ${disabled ? "cursor-default" : ""}`}
    >
      {done && <Icon name="check" size={18} />}
    </button>
  );
}

function PlanRow({ item }) {
  const meta = [item.subject, item.minutes && `${item.minutes} min`].filter(Boolean).join(" · ");
  return (
    <li className={`flex items-center gap-3 rounded-2xl bg-white px-3 py-2 ${item.done ? "opacity-60" : ""}`}>
      <CheckButton
        done={item.done}
        // Lessons that were passed stay checked: the quiz already proved it.
        disabled={item.auto}
        label={item.done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
        onClick={() => update("todos", (t) => toggleChecked(t, item.key))}
      />
      <Icon name={KIND_ICONS[item.kind]} size={24} />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${item.done ? "line-through" : ""}`}>{item.title}</p>
        <p className="text-xs text-muted">
          {meta}
          {item.auto && " · passed"}
        </p>
      </div>
      {item.href && !item.done && (
        <Link href={item.href} className="btn-secondary shrink-0 px-3 py-1 text-sm">
          {item.kind === "mock" ? "Take it" : "Open"}
        </Link>
      )}
    </li>
  );
}

function HomeworkRow({ homework: h, now }) {
  const status = homeworkStatus(h, now);
  const when = [h.dueTime && `due ${formatClock(new Date(`${h.dueDate}T${h.dueTime}`))}`]
    .filter(Boolean)
    .join(" ");
  return (
    <li className={`flex items-center gap-3 rounded-2xl bg-white px-3 py-2 ${h.done ? "opacity-60" : ""}`}>
      <CheckButton
        done={h.done}
        label={h.done ? `Mark "${h.title}" as not done` : `Mark "${h.title}" as done`}
        onClick={() => update("todos", (t) => toggleHomework(t, h.id))}
      />
      <Icon name="homework" size={24} />
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${h.done ? "line-through" : ""}`}>{h.title}</p>
        <p className="text-xs text-muted">
          {[h.subject, when, h.sourceId && "synced"].filter(Boolean).join(" · ")}
          {status === "soon" && <span className="ml-1 font-semibold text-beak">· Due {dueRelative(h, now)}</span>}
        </p>
      </div>
      {h.link && !h.done && (
        <a href={h.link} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0 px-3 py-1 text-sm">
          Open
        </a>
      )}
      <button
        type="button"
        onClick={() => update("todos", (t) => deleteHomework(t, h.id))}
        className="shrink-0 rounded-xl p-1 hover:bg-red-50"
        aria-label={`Delete "${h.title}"`}
        title="Delete"
      >
        <Icon name="trash" size={20} />
      </button>
    </li>
  );
}

function AddHomework({ subjects, today, onDone }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState(addDays(today, 1));
  const [dueTime, setDueTime] = useState("");
  const [error, setError] = useState("");

  function add(e) {
    e.preventDefault();
    if (!title.trim()) return setError("What's the homework?");
    if (!dueDate) return setError("Pick the due date.");
    update("todos", (t) => addHomework(t, { title, subject, dueDate, dueTime }));
    onDone();
  }

  return (
    <form onSubmit={add} className="card mt-6 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-xl">
        <Icon name="homework" size={26} /> Add homework
      </h2>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">What is it?</span>
        <input className="input" autoFocus placeholder="e.g. Worksheet 4.2, odd problems" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Class (optional)</span>
        <input className="input" list="todo-subjects" placeholder="e.g. AP Chemistry" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <datalist id="todo-subjects">
          {subjects.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Due date</span>
          <input type="date" className="input" min={today} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Time (optional)</span>
          <input type="time" className="input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
        </label>
      </div>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Add to my list
        </button>
      </div>
    </form>
  );
}
