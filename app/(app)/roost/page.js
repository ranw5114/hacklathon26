"use client";

import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import CalendarSyncButton, { syncCalendar } from "@/components/roost/CalendarSync";
import DayView from "@/components/roost/DayView";
import MonthView from "@/components/roost/MonthView";
import WeekView from "@/components/roost/WeekView";
import { addMonths, dayInfo, formatLongDate, formatMonth, suggestStudySlot, weekDays } from "@/lib/calendar";
import { addDays, formatDate, todayString } from "@/lib/dates";
import { save, useStored } from "@/lib/storage";
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
  const plan = useStored("plan");
  const test = useStored("test");
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

  const data = { plan, test, events: calendar?.events, sessions };
  // A suggested study slot for days with unfinished plan work.
  const suggestFor = (info) =>
    info.planDay && !info.planDone ? suggestStudySlot(info.date, info.studyMinutes, data.events, now) : null;

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
      </div>

      {/* A small, dismissible hint until a calendar is connected */}
      {!calendar && !prefs?.roostHintDismissed && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 text-sm">
          <button type="button" onClick={() => setSyncOpen(true)} className="flex-1 text-left font-semibold">
            📅 Sync your calendar to see your classes here, or try a sample schedule →
          </button>
          <button
            type="button"
            onClick={() => save("prefs", { ...prefs, roostHintDismissed: true })}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
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
              <DayView info={info} plan={plan} suggestion={suggestFor(info)} now={now} isToday={focusDate === today} />
            );
          })()}
      </div>

      {/* Color key */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-muted">
        <span>🟡 Study plan</span>
        <span>💡 Suggested study time</span>
        <span>🔵 Your calendar</span>
        <span>🎯 Test</span>
        <span>🏆 Mock exam</span>
        <span>🥚🍳🐣 Studied with the Egg Timer (cooks as you study more)</span>
      </div>
    </main>
  );
}
