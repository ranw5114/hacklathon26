"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { notify, playDing } from "@/lib/alerts";
import { localDateString } from "@/lib/dates";
import { save, useStored } from "@/lib/storage";
import {
  advance,
  CORN_PER_FOCUS_MINUTE,
  eggStage,
  formatTime,
  pauseTimer,
  progress,
  startTimer,
  timeLeft,
} from "@/lib/timer";
import { useNow } from "@/lib/useNow";

const APP_TITLE = "Chick Study Buddy";

// Lives in the shared layout, so it runs on every page (Barn, Nest, Coop, ...).
// It finishes sessions when time is up, keeps the tab title counting down,
// and shows a small floating timer while one is running.
export default function TimerWatcher() {
  const timer = useStored("timer");
  const sessions = useStored("sessions");
  const points = useStored("points");
  const now = useNow();
  const pathname = usePathname();

  // When time runs out: log the session, give corn, start the break, and alert the user.
  // The loop also catches up on anything that finished while the app was closed.
  useEffect(() => {
    if (!timer || timer.status !== "running" || now < timer.endsAt) return;

    let next = timer;
    const newSessions = [];
    let breakEnded = false;
    while (next.status === "running" && now >= next.endsAt) {
      if (next.mode === "focus") {
        newSessions.push({
          endedAt: next.endsAt,
          date: localDateString(next.endsAt),
          minutes: next.focusMin,
          level: next.level,
        });
      } else {
        breakEnded = true;
      }
      next = advance(next);
    }

    const corn = newSessions.reduce((sum, s) => sum + s.minutes * CORN_PER_FOCUS_MINUTE, 0);
    const notice = [
      newSessions.length && `Focus session done! +${corn} 🌽`,
      breakEnded ? "Break's over, ready for another round?" : `Break time (${next.breakMin} min).`,
    ]
      .filter(Boolean)
      .join(" ");

    if (newSessions.length) save("sessions", [...(sessions ?? []), ...newSessions].slice(-200));
    if (corn) save("points", (points ?? 0) + corn);
    save("timer", { ...next, notice });

    playDing();
    notify("Egg Timer 🐣", notice);
  }, [now, timer, sessions, points]);

  // Show the countdown in the browser tab, so it's visible from other tabs too.
  const running = timer?.status === "running";
  const paused = timer?.status === "paused";
  const label = timer?.mode === "break" ? "Break" : "Focus";
  const left = timer ? formatTime(timeLeft(timer, now)) : "";

  useEffect(() => {
    if (running) document.title = `🥚 ${left} · ${label}`;
    else if (paused) document.title = `⏸ ${left} · Paused`;
    else document.title = APP_TITLE;
  }, [running, paused, left, label]);

  if (!timer) return null;
  const onTimerPage = pathname === "/timer";
  const showPill = (running || paused) && !onTimerPage;
  if (!showPill && !timer.notice) return null;

  return (
    // Phones: a bar at the top that pushes the page down. Computers: floats in the top-right corner.
    <div className="sticky top-0 z-30 flex flex-col items-center gap-2 bg-background/95 px-3 py-2 sm:fixed sm:top-20 sm:right-6 sm:items-end sm:bg-transparent sm:p-0">
      {timer.notice && !onTimerPage && (
        <div className="flex max-w-sm items-start gap-3 rounded-2xl border-[3px] border-line bg-white px-4 py-3 shadow-[0_4px_0_var(--chick-line)]">
          <p className="text-sm font-semibold">{timer.notice}</p>
          <button
            type="button"
            onClick={() => save("timer", { ...timer, notice: null })}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {showPill && (
        <div className="flex items-center gap-1 rounded-full border-[3px] border-line bg-chick py-1 pr-1 pl-3 shadow-[0_4px_0_var(--chick-line)]">
          <Link href="/timer" className="flex items-center gap-2 font-display font-semibold">
            <span className="text-xl">{timer.mode === "break" ? "☕" : eggStage(progress(timer, now)).emoji}</span>
            <span className="tabular-nums">{left}</span>
            <span className="text-sm text-muted">{paused ? "Paused" : label}</span>
          </Link>
          <button
            type="button"
            onClick={() => save("timer", running ? pauseTimer(timer) : startTimer(timer))}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-line bg-white text-sm"
            aria-label={running ? "Pause timer" : "Resume timer"}
          >
            {running ? "⏸" : "▶"}
          </button>
        </div>
      )}
    </div>
  );
}
