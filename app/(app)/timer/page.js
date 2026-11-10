"use client";

import { useState } from "react";
import Chick from "@/components/Chick";
import PageTour from "@/components/PageTour";
import { askForNotifications, notificationsSupported } from "@/lib/alerts";
import { todayString } from "@/lib/dates";
import { currentSectionId, findSection } from "@/lib/progress";
import { save, useStored } from "@/lib/storage";
import {
  CORN_PER_FOCUS_MINUTE,
  DEFAULT_TIMER,
  eggStage,
  formatTime,
  pauseTimer,
  PRESETS,
  progress,
  resetTimer,
  setDurations,
  startTimer,
  timeLeft,
} from "@/lib/timer";
import { useNow } from "@/lib/useNow";

// The Egg Timer: focus/break cycles. The countdown itself is kept alive by TimerWatcher.
export default function TimerPage() {
  const stored = useStored("timer");
  const sessions = useStored("sessions");
  const plan = useStored("plan");
  const now = useNow();
  const [linkLevel, setLinkLevel] = useState(true);
  // Re-render after the notification prompt is answered.
  const [, setAlertsAsked] = useState(0);

  if (stored === undefined) return null;
  const timer = stored ?? DEFAULT_TIMER;

  const idle = timer.status === "idle";
  const running = timer.status === "running";
  const fraction = progress(timer, now);
  const egg = eggStage(timer.mode === "focus" ? fraction : 1);

  const currentId = plan ? currentSectionId(plan) : null;
  const currentLevel = currentId ? findSection(plan, currentId).title : null;

  const today = todayString();
  const todaySessions = (sessions ?? []).filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);
  const focusedMinutes = Math.floor((timer.focusMin * 60_000 - timeLeft(timer, now)) / 60_000);

  function start() {
    askForNotifications();
    setAlertsAsked((n) => n + 1);
    save("timer", startTimer(timer, idle && timer.mode === "focus" ? (linkLevel ? currentLevel : null) : timer.level));
  }

  function choosePreset(preset) {
    if (preset === "custom") return save("timer", { ...timer, preset });
    const { focusMin, breakMin } = PRESETS[preset];
    save("timer", setDurations(timer, preset, focusMin, breakMin));
  }

  function setCustom(field, value) {
    const minutes = Math.min(field === "focusMin" ? 120 : 60, Math.max(1, Number(value) || 1));
    const focusMin = field === "focusMin" ? minutes : timer.focusMin;
    const breakMin = field === "breakMin" ? minutes : timer.breakMin;
    save("timer", setDurations(timer, "custom", focusMin, breakMin));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="flex items-center gap-3">
        <Chick variant="eggy" size={56} />
        <div>
          <p className="label-small">Study timer</p>
          <h1 className="text-3xl">Egg Timer</h1>
        </div>
        <div className="ml-auto">
          <PageTour page="timer" />
        </div>
      </div>

      {timer.notice && (
        <div className="mt-6 flex items-start justify-between gap-3 rounded-2xl border-[3px] border-line bg-white p-4">
          <p className="font-semibold">{timer.notice}</p>
          <button type="button" onClick={() => save("timer", { ...timer, notice: null })} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* The big timer: a ring that fills up as time passes, with the cooking egg inside */}
      <section className="card mt-6 flex flex-col items-center gap-5 py-8">
        <p className="label-small">{timer.mode === "focus" ? "Focus time" : "Break time"}</p>
        <div
          className="flex h-60 w-60 items-center justify-center rounded-full border-[3px] border-line"
          style={{
            background: `conic-gradient(var(--chick-beak) ${fraction * 360}deg, var(--chick-body) 0deg)`,
          }}
        >
          <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full border-[3px] border-line bg-white">
            <span className="text-5xl">{timer.mode === "focus" ? egg.emoji : "☕"}</span>
            <span className="mt-1 font-display text-5xl font-semibold tabular-nums">
              {formatTime(timeLeft(timer, now))}
            </span>
            <span className="text-sm text-muted">{timer.mode === "focus" ? egg.name : "Stretch your wings"}</span>
          </div>
        </div>

        {timer.level && !idle && <p className="text-sm text-muted">Focusing on: {timer.level}</p>}

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <button type="button" onClick={() => save("timer", pauseTimer(timer))} className="btn-primary">
              Pause
            </button>
          ) : (
            <button type="button" onClick={start} className="btn-primary">
              {idle ? (timer.mode === "focus" ? "Start focus" : "Start break") : "Resume"}
            </button>
          )}
          {!idle && (
            <button type="button" onClick={() => save("timer", resetTimer(timer))} className="btn-secondary">
              {timer.mode === "break" ? "Skip break" : "Reset"}
            </button>
          )}
        </div>
      </section>

      {/* Settings: only changeable when the timer isn't running */}
      <section className="card mt-6 flex flex-col gap-4">
        <h2 className="text-xl">Timer settings</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([id, preset]) => (
            <button
              key={id}
              type="button"
              disabled={!idle}
              onClick={() => choosePreset(id)}
              className={`rounded-2xl border-[3px] border-line px-4 py-2 font-display font-semibold disabled:opacity-50 ${
                timer.preset === id ? "bg-chick shadow-[0_3px_0_var(--chick-line)]" : "bg-white"
              }`}
            >
              {preset.label}
              {preset.focusMin && <span className="ml-1 text-sm text-muted">{preset.focusMin}/{preset.breakMin}</span>}
            </button>
          ))}
        </div>

        {timer.preset === "custom" && (
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Focus (minutes)</span>
              <input
                type="number"
                min={1}
                max={120}
                disabled={!idle}
                className="input"
                value={timer.focusMin}
                onChange={(e) => setCustom("focusMin", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Break (minutes)</span>
              <input
                type="number"
                min={1}
                max={60}
                disabled={!idle}
                className="input"
                value={timer.breakMin}
                onChange={(e) => setCustom("breakMin", e.target.value)}
              />
            </label>
          </div>
        )}

        {currentLevel && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={linkLevel}
              disabled={!idle}
              onChange={(e) => setLinkLevel(e.target.checked)}
              className="h-5 w-5 accent-[var(--chick-beak)]"
            />
            <span>
              Focus on my current level: <strong>{currentLevel}</strong>
            </span>
          </label>
        )}

        <p className="text-sm text-muted">
          Earn {CORN_PER_FOCUS_MINUTE} 🌽 for every focus minute you finish. The timer keeps going on other pages
          and tabs.
        </p>
        {notificationsSupported() && Notification.permission === "denied" && (
          <p className="text-sm text-muted">
            Notifications are blocked for this site, so you&apos;ll only hear a ding. You can allow them in your
            browser&apos;s site settings.
          </p>
        )}
      </section>

      {/* Today's log */}
      <section className="card mt-6">
        <h2 className="text-xl">Today</h2>
        <p className="mt-1 text-muted">
          {todaySessions.length} session{todaySessions.length === 1 ? "" : "s"} · {todayMinutes} focus minutes ·{" "}
          {todayMinutes * CORN_PER_FOCUS_MINUTE} 🌽 earned
        </p>
        {/* Live progress for the session in progress (its corn is added when it finishes) */}
        {timer.mode === "focus" && !idle && (
          <p className="mt-3 rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 font-semibold">
            🍳 {focusedMinutes} of {timer.focusMin} minutes focused · +{timer.focusMin * CORN_PER_FOCUS_MINUTE} 🌽
            when this session finishes
          </p>
        )}
        {todaySessions.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {todaySessions
              .toSorted((a, b) => b.endedAt - a.endedAt) // newest first
              .map((s) => (
                <li key={s.endedAt} className="flex justify-between gap-3 rounded-2xl bg-chick/40 px-4 py-2 text-sm">
                  <span className="font-semibold">
                    {s.minutes} min{s.level ? ` · ${s.level}` : ""}
                  </span>
                  <span className="text-muted">
                    {new Date(s.endedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </main>
  );
}
