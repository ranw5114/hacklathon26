"use client";

import Icon from "@/components/Icon";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { notify, playDing } from "@/lib/alerts";
import { BroodingChick, HatchedChick } from "@/components/EggArt";
import { formatDate, localDateString, todayString } from "@/lib/dates";
import { addCorn, CORN_PER_SESSION, fryEgg, hatchChicks, judgeMissedDays } from "@/lib/flock";
import { announceCorn } from "@/components/CornToast";
import { allPlanDays, useNests } from "@/lib/nests";
import { avatarLook } from "@/lib/avatar";
import { onPopOutRequest, openPopOutWindow, popOutSupported, requestPopOut } from "@/lib/popout";
import { load, save, update, useStored } from "@/lib/storage";
import {
  advance,
  broodStage,
  coldIn,
  DEFAULT_TIMER,
  formatTime,
  MIN_FOCUS_MIN,
  pauseTimer,
  fryTimer,
  progress,
  startTimer,
  timeLeft,
} from "@/lib/timer";
import { useNow } from "@/lib/useNow";

const APP_TITLE = "Cluck In";

// Lives in the shared layout, so it runs on every page (Barn, Nest, Coop, ...).
// It hatches eggs when time is up, fries eggs left paused too long, checks for missed
// study-plan days, keeps the tab title counting down, and shows a small floating timer.
export default function TimerWatcher() {
  const timer = useStored("timer");
  const sessions = useStored("sessions");
  const nests = useNests();
  const profile = useStored("profile");
  const flock = useStored("flock");
  const now = useNow();
  const pathname = usePathname();
  const [popout, setPopout] = useState(null); // the floating pop-out window, while it's open

  // Open the pop-out window when a "Pop out" button asks for it.
  useEffect(() => {
    return onPopOutRequest(async () => {
      if (popout) return popout.focus();
      try {
        const win = await openPopOutWindow();
        win.addEventListener("pagehide", () => setPopout(null)); // user closed it
        setPopout(win);
      } catch (err) {
        // The browser refused (e.g. not from a click, or pop-outs are turned off).
        console.warn("Couldn't open the pop-out timer:", err);
      }
    });
  }, [popout]);

  // Close the pop-out if this part of the app goes away (e.g. back to the start screen).
  useEffect(() => () => popout?.close(), [popout]);

  // When time runs out: log the session, hatch a chick, start the break, and alert the user.
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

    // Only sessions of at least MIN_FOCUS_MIN minutes hatch (older saved timers may be shorter).
    const hatched = newSessions.filter((s) => s.minutes >= MIN_FOCUS_MIN).length;
    const tooShort = newSessions.length - hatched;
    const notice = [
      hatched === 1 && `Your egg hatched! A new chick joined your flock, and you earned ${CORN_PER_SESSION} corn.`,
      hatched > 1 && `${hatched} eggs hatched! New chicks joined your flock, and you earned ${hatched * CORN_PER_SESSION} corn.`,
      tooShort > 0 && `Focus done! Sessions need ${MIN_FOCUS_MIN}+ minutes to hatch an egg.`,
      breakEnded ? "Break's over, ready for another round?" : `Break time (${next.breakMin} min).`,
    ]
      .filter(Boolean)
      .join(" ");

    if (newSessions.length) save("sessions", [...(sessions ?? []), ...newSessions].slice(-200));
    if (hatched) {
      update("flock", (f) => addCorn(hatchChicks(f, hatched, "timer", newSessions.at(-1).endedAt), hatched * CORN_PER_SESSION));
      announceCorn(hatched * CORN_PER_SESSION, hatched === 1 ? "Focus session finished" : "Focus sessions finished");
    }
    save("timer", { ...next, notice });

    playDing();
    notify("Egg Timer 🐣", notice);
  }, [now, timer, sessions]);

  // A focus session left paused too long: the egg goes cold and gets fried.
  useEffect(() => {
    if (!timer || coldIn(timer, now) !== 0) return;
    update("flock", (f) => fryEgg(f, "cold"));
    save("timer", {
      ...fryTimer(timer, "cold"),
      notice: "Your egg was left alone for too long and went cold. It got fried!",
    });
    playDing();
  }, [now, timer]);

  // Study-plan days that passed with no egg hatched: one chick per day becomes a drumstick.
  // Checked when the app opens and again after midnight (the date is part of the dependencies).
  const today = todayString();
  useEffect(() => {
    if (nests === undefined || sessions === undefined || flock === undefined || !nests.length) return;
    // Every nest's plan days count (a day with plans for two tests is still one day).
    const result = judgeMissedDays(load("flock"), allPlanDays(nests), sessions, today);
    if (!result.missed.length && result.flock.judgedDays.length === (flock?.judgedDays?.length ?? 0)) return;
    save("flock", result.flock);
    if (!result.lost) return;
    const days = result.missed.map(formatDate).join(", ");
    const message =
      result.lost === 1
        ? `You missed your study plan on ${days}. One chick got fried into a drumstick.`
        : `You missed your study plan on ${days}. ${result.lost} chicks got fried into drumsticks.`;
    update("timer", (t) => ({ ...(t ?? DEFAULT_TIMER), notice: message }));
  }, [nests, sessions, flock, today]);

  // Show the countdown in the browser tab, so it's visible from other tabs too.
  const running = timer?.status === "running";
  const paused = timer?.status === "paused";
  const label = timer?.mode === "break" ? "Break" : "Focus";
  const left = timer ? formatTime(timeLeft(timer, now)) : "";

  useEffect(() => {
    if (running) document.title = `🥚 ${left} · ${label}`;
    else if (paused) document.title = `🥚 ${left} · Paused`;
    else document.title = APP_TITLE;
  }, [running, paused, left, label]);

  const onTimerPage = pathname === "/timer";
  const showPill = (running || paused) && !onTimerPage;
  const avatar = avatarLook(profile, flock); // a starter chick or a Henhouse chick
  const lastChick = flock?.chicks?.at(-1)?.color;
  const popoutContent =
    popout &&
    createPortal(
      <PopOutTimer timer={timer ?? DEFAULT_TIMER} now={now} avatar={avatar} lastChick={lastChick} />,
      popout.document.body
    );

  if (!timer || (!showPill && !timer.notice)) return popoutContent;

  return (
    // Phones: a bar at the top that pushes the page down. Computers: floats in the top-right corner.
    <div className="sticky top-0 z-30 flex flex-col items-center gap-2 bg-background/95 px-3 py-2 sm:fixed sm:top-20 sm:right-6 sm:items-end sm:bg-transparent sm:p-0">
      {popoutContent}
      {timer.notice && !onTimerPage && (
        <div className="flex max-w-sm items-start gap-3 rounded-2xl border-[3px] border-line bg-white px-4 py-3 shadow-[0_4px_0_var(--chick-line)]">
          <p className="flex items-start gap-2 text-sm font-semibold">
            <Icon name="chick" size={20} /> {timer.notice}
          </p>
          <button
            type="button"
            onClick={() => save("timer", { ...timer, notice: null })}
            className="text-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {showPill && (
        <div className="flex items-center gap-1 rounded-full border-[3px] border-line bg-chick py-1 pr-1 pl-3 shadow-[0_4px_0_var(--chick-line)]">
          <Link href="/timer" className="flex items-center gap-2 font-display font-semibold">
            <TimerIcon timer={timer} now={now} avatar={avatar} lastChick={lastChick} size={34} />
            <span className="tabular-nums">{left}</span>
            <span className="text-sm text-muted">{paused ? "Paused" : label}</span>
          </Link>
          <button
            type="button"
            onClick={() => save("timer", running ? pauseTimer(timer) : startTimer(timer))}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-line bg-white text-sm"
            aria-label={running ? "Pause timer" : "Resume timer"}
          >
            <Icon name={running ? "pause" : "play"} size={14} />
          </button>
          {popOutSupported() && (
            <button
              type="button"
              onClick={requestPopOut}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-line bg-white text-sm"
              aria-label="Pop out timer"
              title="Pop out: keep the timer on top of other tabs and apps"
            >
              <Icon name="pin" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// A small picture of what's happening: the chick keeping its egg warm, or the new chick on a break.
function TimerIcon({ timer, now, avatar, lastChick, size }) {
  if (timer.mode === "break") return <HatchedChick color={lastChick} size={size} />;
  const animate = timer.status === "running";
  if (timer.status === "idle" && timer.fried) return <BroodingChick avatar={avatar} holding="none" mood="sad" size={size} />;
  return (
    <BroodingChick
      avatar={avatar}
      cracks={broodStage(progress(timer, now)).cracks}
      animate={animate}
      eggStyle={timer.eggStyle}
      size={size}
    />
  );
}

// What shows inside the floating pop-out window.
function PopOutTimer({ timer, now, avatar, lastChick }) {
  const running = timer.status === "running";
  const isBreak = timer.mode === "break";
  const fraction = progress(timer, now);

  return (
    <div className="flex h-screen items-center justify-center gap-4 bg-background p-4 text-foreground">
      <div
        className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-[3px] border-line"
        style={{ background: `conic-gradient(var(--chick-beak) ${fraction * 360}deg, var(--chick-body) 0deg)` }}
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-line bg-white">
          <TimerIcon timer={timer} now={now} avatar={avatar} lastChick={lastChick} size={64} />
        </div>
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="label-small">{timer.status === "paused" ? "Paused" : isBreak ? "Break" : "Focus"}</span>
        {coldIn(timer, now) !== null && (
          <span className="text-xs font-semibold text-red-700">Egg gets cold in {formatTime(coldIn(timer, now))}</span>
        )}
        <span className="font-display text-4xl font-semibold tabular-nums">{formatTime(timeLeft(timer, now))}</span>
        <button
          type="button"
          onClick={() => save("timer", running ? pauseTimer(timer) : startTimer(timer))}
          className="btn-primary px-4 py-1.5 text-sm"
        >
          {running ? "Pause" : timer.status === "paused" ? "Resume" : "Start"}
        </button>
      </div>
    </div>
  );
}
