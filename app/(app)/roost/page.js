"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import PageTour from "@/components/PageTour";
import CalendarSyncButton, { syncCalendar } from "@/components/roost/CalendarSync";
import DayView from "@/components/roost/DayView";
import MonthView from "@/components/roost/MonthView";
import WeekView from "@/components/roost/WeekView";
import { addMonths, dayInfo, formatLongDate, formatMonth, suggestStudySlot, weekDays } from "@/lib/calendar";
import { addDays, formatDate, todayString } from "@/lib/dates";
import { save, useStored } from "@/lib/storage";
import { useNests } from "@/lib/nests";
import { useNow } from "@/lib/useNow";

const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
];

// Re-download a linked calendar when it's older than this.
const REFRESH_AFTER_MS = 30 * 60_000;

// The Roost: a calendar with the study plan, synced events, and suggested study times.
export default function RoostPage() {
  const nests = useNests();
  const todos = useStored("todos");
  const sessions = useStored("sessions");
  const calendar = useStored("calendar");
  const prefs = useStored("prefs");
  const nowMs = useNow();
  const now = new Date(nowMs);
  const today = todayString();

  // Month on computers, Week on phones (the user can switch).
  const [view, setView] = useState(() => (window.matchMedia("(min-width: 640px)").matches ? "month" : "week"));
  const [focusDate, setFocusDate] = useState(today);
  const [syncOpen, setSyncOpen] = useState(false);
  const refreshed = useRef(false);

  // Quietly refresh a linked calendar when the page opens, if it's getting old.
  useEffect(() => {
    if (refreshed.current || calendar?.source !== "link" || Date.now() - calendar.syncedAt < REFRESH_AFTER_MS) return;
    refreshed.current = true;
    syncCalendar(calendar.url).catch(() => {}); // if it fails, keep showing the saved events
  }, [calendar]);

  if (calendar === undefined) return null;

  const data = { nests, events: calendar?.events, sessions, todos };
  // A suggested study slot for days with unfinished plan work.
  const suggestFor = (info) =>
    info.plans.length && !info.planDone ? suggestStudySlot(info.date, info.studyMinutes, data.events, now) : null;

  function move(direction) {
    if (view === "month") setFocusDate(addMonths(focusDate, direction));
    else setFocusDate(addDays(focusDate, direction * (view === "week" ? 7 : 1)));
  }

  function openDay(date) {
    setFocusDate(date);
    setView("day");
  }

  const week = weekDays(focusDate);
  const title =
    view === "month"
      ? formatMonth(focusDate)
      : view === "week"
        ? `${formatDate(week[0])} – ${formatDate(week[6])}`
        : formatLongDate(focusDate);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex items-center gap-3">
        <Chick variant="peach" size={56} />
        <div>
          <p className="label-small">Calendar</p>
          <h1 className="text-3xl">The Roost</h1>
        </div>
        <div className="ml-auto">
          <PageTour page="roost" />
        </div>
      </div>

      {/* A small, dismissible hint until a calendar is connected */}
      {!calendar && !prefs?.roostHintDismissed && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 text-sm">
          <button type="button" onClick={() => setSyncOpen(true)} className="flex-1 text-left font-semibold">
            <Icon name="calendar" size={18} /> Sync your calendar to see your classes here, or try a sample schedule →
          </button>
          <button
            type="button"
            onClick={() => save("prefs", { ...prefs, roostHintDismissed: true })}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Toolbar: previous/next, today, and the view switcher */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => move(-1)} className="btn-secondary px-3 py-1.5" aria-label="Previous">
            ‹
          </button>
          <button type="button" onClick={() => move(1)} className="btn-secondary px-3 py-1.5" aria-label="Next">
            ›
          </button>
          <button type="button" onClick={() => setFocusDate(today)} className="btn-secondary ml-1 px-4 py-1.5 text-sm">
            Today
          </button>
        </div>
        <h2 className="text-xl sm:text-2xl">{title}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <CalendarSyncButton calendar={calendar} open={syncOpen} onOpenChange={setSyncOpen} />
          <div className="flex rounded-2xl border-[3px] border-line bg-white p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`rounded-xl px-3 py-1 font-display text-sm font-semibold ${view === v.id ? "bg-chick" : ""}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        {view === "month" && (
          <MonthView focusDate={focusDate} today={today} data={data} suggestFor={suggestFor} onOpenDay={openDay} />
        )}
        {view === "week" && (
          <WeekView focusDate={focusDate} today={today} data={data} suggestFor={suggestFor} onOpenDay={openDay} />
        )}
        {view === "day" &&
          (() => {
            const info = dayInfo(focusDate, data);
            return (
              <DayView info={info} suggestion={suggestFor(info)} now={now} isToday={focusDate === today} />
            );
          })()}
      </div>

      {/* Color key */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1"><Icon name="egg" size={14} /> Study plan</span>
        <span className="flex items-center gap-1"><Icon name="idea" size={14} /> Suggested study time</span>
        <span className="flex items-center gap-1"><Icon dot="blue" size={12} /> Your calendar</span>
        <span className="flex items-center gap-1"><Icon name="homework" size={14} /> Homework</span>
        <span className="flex items-center gap-1"><Icon name="target" size={14} /> Test</span>
        <span className="flex items-center gap-1"><Icon name="trophy" size={14} /> Mock exam</span>
        <span className="flex items-center gap-1"><Icon name="chick" size={14} /> Hatched an egg with the Egg Timer</span>
      </div>
    </main>
  );
}
