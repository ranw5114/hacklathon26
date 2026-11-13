"use client";

import PageIcon from "@/components/PageIcon";
import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import PageTour from "@/components/PageTour";
import { SyncButton, SyncedSources } from "@/components/AssignmentSync";
import { askForNotifications, notificationsSupported } from "@/lib/alerts";
import { addDays, formatDate, todayString } from "@/lib/dates";
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
  const [overdueSort, setOverdueSort] = useState("date"); // "date" or "subject"
  const [, setPermissionAsked] = useState(0); // re-render after the browser's permission prompt

  if (nests === undefined || stored === undefined) return null;
  const todos = withTodoDefaults(stored);
  const today = todayString();

  const overdueHomework = todos.homework.filter((h) => homeworkStatus(h, now) === "overdue");
  const missedLessons = missedPlanItems(nests, today, todos);
  const days = daysToShow(nests, todos, today);
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
          <Icon name="bell" size={18} /> Reminders are on. They arrive while Chick Study Buddy is open in a tab.
        </p>
      )}

      {showAdd && <AddHomework subjects={subjects} today={today} onDone={() => setShowAdd(false)} />}

      <SyncedSources todos={todos} />

      {/* Overdue */}
      {(overdueHomework.length > 0 || missedLessons.length > 0) && (
        <section className="card mt-6 border-red-700 bg-red-50">
          <h2 className="flex items-center gap-2 text-xl text-red-800">
            <Icon name="fried" size={26} /> Overdue
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-red-800/80">Don&apos;t let these get fried! Catch up as soon as you can.</p>
            <div className="flex overflow-hidden rounded-xl border-2 border-red-800/40 text-xs font-semibold" role="group" aria-label="Sort overdue items">
              {[
                ["date", "Due date"],
                ["subject", "Subject"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOverdueSort(id)}
                  aria-pressed={overdueSort === id}
                  className={`px-2.5 py-1 ${overdueSort === id ? "bg-red-800 text-white" : "bg-white text-red-800"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {overdueGroups(overdueHomework, missedLessons, overdueSort).map((group) => (
            <div key={group.title ?? "all"} className="mt-3">
              {group.title && <p className="label-small mb-1.5 text-red-800/80">{group.title}</p>}
              <ul className="flex flex-col gap-2">
                {group.items.map((entry) =>
                  entry.homework ? (
                    <HomeworkRow key={entry.homework.id} homework={entry.homework} now={now} showDate />
                  ) : (
                    <PlanRow key={entry.lesson.key} item={entry.lesson} note={`From ${formatDate(entry.lesson.date)}`} />
                  )
                )}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Day by day */}
      <div className="mt-6 flex flex-col gap-4">
        {days.map((date) => {
          const plan = planItemsFor(nests, date, todos);
          const homework = todos.homework
            .filter((h) => h.dueDate === date && homeworkStatus(h, now) !== "overdue")
            .sort((a, b) => (a.dueTime || "99").localeCompare(b.dueTime || "99"));
          const total = plan.length + homework.length;
          const done = plan.filter((i) => i.done).length + homework.filter((h) => h.done).length;
          const isToday = date === today;

          // Quiet days after tomorrow get a single short line.
          if (!total && date > addDays(today, 1)) {
            return (
              <p key={date} className="px-2 text-sm text-muted">
                <strong>{dayLabel(date, today)}</strong> · {formatDate(date)} · Free-range day
              </p>
            );
          }

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
      </div>

      {nests.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">
          Study plans from your <Link href="/nest" className="underline">nests</Link> show up here automatically.
        </p>
      )}
    </main>
  );
}

// Overdue homework and missed lessons in one list, oldest first. With "subject", they're grouped by
// class (the class from Schoology or Classroom, or the one typed in), and each group is oldest first.
function overdueGroups(homework, lessons, sortBy) {
  const entries = [
    ...homework.map((h) => ({ homework: h, due: dueAt(h), subject: h.subject })),
    ...lessons.map((l) => ({ lesson: l, due: new Date(`${l.date}T23:59:00`).getTime(), subject: l.subject })),
  ].sort((a, b) => a.due - b.due || (a.subject || "").localeCompare(b.subject || ""));
  if (sortBy !== "subject") return [{ title: null, items: entries }];

  const groups = new Map();
  for (const entry of entries) {
    const title = entry.subject?.trim() || "No class";
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(entry);
  }
  // Classes in A-Z order, with "No class" last.
  return [...groups]
    .sort(([a], [b]) => (a === "No class") - (b === "No class") || a.localeCompare(b))
    .map(([title, items]) => ({ title, items }));
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

function PlanRow({ item, note }) {
  const meta = [item.subject, item.minutes && `${item.minutes} min`, note].filter(Boolean).join(" · ");
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

function HomeworkRow({ homework: h, now, showDate }) {
  const status = homeworkStatus(h, now);
  const when = [showDate && formatDate(h.dueDate), h.dueTime && `due ${formatClock(new Date(`${h.dueDate}T${h.dueTime}`))}`]
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
          {status === "overdue" && <span className="ml-1 font-semibold text-red-700">· Overdue</span>}
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
