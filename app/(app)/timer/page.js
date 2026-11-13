"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import PlayfulChick from "@/components/PlayfulChick";
import { BroodingChick, CoopRoof, FriedEgg, FriedEggPlate, HatchedChick, TakeoutBucket } from "@/components/EggArt";
import { useConfirm } from "@/components/Modal";
import PageTour from "@/components/PageTour";
import { askForNotifications, notificationsSupported } from "@/lib/alerts";
import { popOutSupported, requestPopOut } from "@/lib/popout";
import { addDays, todayString } from "@/lib/dates";
import { chickCount, fryEgg, hatchStreak, withDefaults } from "@/lib/flock";
import { chickLook, chickName } from "@/lib/henhouse";
import Link from "next/link";
import { currentSectionId, findSection, goalFraction } from "@/lib/progress";
import { save, update, useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { allPlanDays, focusNest, useNests } from "@/lib/nests";
import {
  broodStage,
  coldIn,
  DEFAULT_TIMER,
  formatTime,
  hasEgg,
  MIN_FOCUS_MIN,
  PAUSE_LIMIT_MS,
  pauseTimer,
  PRESETS,
  progress,
  resetTimer,
  fryTimer,
  setDurations,
  startTimer,
  timeLeft,
} from "@/lib/timer";
import { useNow } from "@/lib/useNow";

// The Egg Timer: your chick keeps an egg warm while you focus. Finish and it hatches into a
// new chick for your flock; stop early and it gets fried. The countdown is kept alive by TimerWatcher.
export default function TimerPage() {
  const stored = useStored("timer");
  const sessions = useStored("sessions");
  // "Focus on my current level" uses the nest whose test is soonest.
  const nests = useNests();
  const focus = focusNest(nests, todayString());
  const plan = focus?.plan ?? null;
  const test = focus?.test ?? null;
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const flock = useStored("flock");
  const now = useNow();
  const { confirm, dialog } = useConfirm();
  const [linkLevel, setLinkLevel] = useState(true);
  // Re-render after the notification prompt is answered.
  const [, setAlertsAsked] = useState(0);

  // When an egg gets fried while you watch: the sad chick holds it for a moment, then it pops
  // up and flies onto the plate in "Your flock".
  const ringRef = useRef(null);
  const plateRef = useRef(null);
  const flyingRef = useRef(null);
  const [flight, setFlight] = useState(null); // { at, from: {x, y}, to: {x, y} } while flying
  const [landedAt, setLandedAt] = useState(null); // which fried egg (by its time) has landed
  const friedAt = stored?.fried?.at ?? null;

  useEffect(() => {
    if (!friedAt || Date.now() - friedAt > FLIGHT_WINDOW_MS) return;
    const wait = setTimeout(() => {
      const center = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      if (!ringRef.current || !plateRef.current) return setLandedAt(friedAt);
      setFlight({ at: friedAt, from: center(ringRef.current), to: center(plateRef.current) });
    }, HOLD_FRIED_MS);
    return () => clearTimeout(wait);
  }, [friedAt]);

  useEffect(() => {
    if (!flight || !flyingRef.current) return;
    const dx = flight.to.x - flight.from.x;
    const dy = flight.to.y - flight.from.y;
    const animation = flyingRef.current.animate(
      [
        { transform: "translate(-50%, -50%) scale(1)" },
        { transform: `translate(calc(-50% + ${dx * 0.2}px), calc(-50% - 90px)) scale(1.35) rotate(-20deg)`, offset: 0.3 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.7) rotate(200deg)` },
      ],
      { duration: 1100, easing: "ease-in-out", fill: "forwards" }
    );
    animation.onfinish = () => {
      setLandedAt(flight.at);
      setFlight(null);
    };
    return () => animation.cancel();
  }, [flight]);

  if (stored === undefined) return null;
  const timer = stored ?? DEFAULT_TIMER;

  const idle = timer.status === "idle";
  const running = timer.status === "running";
  const fraction = progress(timer, now);
  const stage = broodStage(fraction);
  const coldLeft = coldIn(timer, now);
  const newestChick = flock?.chicks?.at(-1)?.color;
  // A fried egg is shown until the next egg is started. It sits in the chick's wings until it flies away.
  const fried = idle && timer.mode === "focus" && timer.fried;
  const friedFresh = fried && now - timer.fried.at < FLIGHT_WINDOW_MS && landedAt !== timer.fried.at;
  const holding = !fried ? "egg" : friedFresh && !flight ? "fried" : "none";

  const currentId = plan ? currentSectionId(plan, goalFraction(test)) : null;
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

  // Stopping a focus session early fries the egg, so ask first. Skipping a break is free.
  async function stop() {
    if (hasEgg(timer)) {
      const ok = await confirm({
        title: "Leave your egg?",
        message: "If you stop now, your egg won't hatch. It'll get fried instead!",
        confirmLabel: "Stop and fry it",
        cancelLabel: "Keep it warm",
        danger: true,
        chick: avatar,
      });
      if (!ok) return;
      update("flock", (f) => fryEgg(f, "stopped"));
      save("timer", fryTimer(timer, "stopped"));
      return;
    }
    save("timer", resetTimer(timer));
  }

  function choosePreset(preset) {
    if (preset === "custom") return save("timer", { ...timer, preset });
    const { focusMin, breakMin } = PRESETS[preset];
    save("timer", setDurations(timer, preset, focusMin, breakMin));
  }

  function setCustom(field, value) {
    const shortest = field === "focusMin" ? MIN_FOCUS_MIN : 1;
    const minutes = Math.min(field === "focusMin" ? 120 : 60, Math.max(shortest, Number(value) || shortest));
    const focusMin = field === "focusMin" ? minutes : timer.focusMin;
    const breakMin = field === "breakMin" ? minutes : timer.breakMin;
    save("timer", setDurations(timer, "custom", focusMin, breakMin));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      {dialog}
      <div className="flex items-center gap-3">
        <PlayfulChick look="eggy" size={56} lines={["Still part shell, all hustle.", "Tick tock, let's rock!", "Focus mode: cluck-tivated.", "Don't make me hard-boil you!"]} bubbleSide="right" label="Poke Eggy" />
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
          <p className="flex items-start gap-2 font-semibold">
            <Icon name="chick" size={22} /> {timer.notice}
          </p>
          <button type="button" onClick={() => save("timer", { ...timer, notice: null })} aria-label="Dismiss">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* The big timer: a ring that fills up as time passes, with the chick keeping its egg warm inside */}
      <section className="card mt-6 flex flex-col items-center gap-5 py-8">
        <p className="label-small">{timer.mode === "focus" ? "Focus time" : "Break time"}</p>
        {fried && <span className="bubble max-w-xs text-center text-sm">{FRIED_MESSAGE}</span>}
        <div
          ref={ringRef}
          className="flex h-64 w-64 items-center justify-center rounded-full border-[3px] border-line"
          style={{
            background: `conic-gradient(var(--chick-beak) ${fraction * 360}deg, var(--chick-body) 0deg)`,
          }}
        >
          <div className="flex h-52 w-52 flex-col items-center justify-center rounded-full border-[3px] border-line bg-white">
            {timer.mode === "focus" ? (
              <BroodingChick
                avatar={avatar}
                cracks={idle ? 0 : stage.cracks}
                animate={running}
                eggStyle={timer.eggStyle}
                holding={holding}
                mood={fried ? "sad" : "happy"}
                size={112}
              />
            ) : (
              <HatchedChick color={newestChick} size={112} />
            )}
            <span className="font-display text-4xl font-semibold tabular-nums">{formatTime(timeLeft(timer, now))}</span>
            <span className="text-sm text-muted">
              {timer.mode === "break"
                ? "A new chick hatched!"
                : fried
                  ? "Your egg got fried…"
                  : idle
                    ? "Ready to keep it warm"
                    : stage.name}
            </span>
          </div>
        </div>

        {coldLeft !== null && (
          <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <Icon name="cold" size={16} /> Your egg is getting cold! Resume within {formatTime(coldLeft)} or it gets fried.
          </p>
        )}

        {timer.level && !idle && <p className="text-sm text-muted">Focusing on: {timer.level}</p>}

        <div className="flex flex-wrap justify-center gap-3">
          {running ? (
            <button type="button" onClick={() => save("timer", pauseTimer(timer))} className="btn-primary">
              Pause
            </button>
          ) : (
            <button type="button" onClick={start} className="btn-primary">
              {idle ? (timer.mode === "focus" ? (fried ? "Try a new egg" : "Start focus") : "Start break") : "Resume"}
            </button>
          )}
          {!idle && (
            <button type="button" onClick={stop} className="btn-secondary">
              {timer.mode === "break" ? "Skip break" : "Stop"}
            </button>
          )}
        </div>
        {popOutSupported() && (
          <div className="flex w-full flex-col items-center gap-2 border-t-2 border-dashed border-line/30 pt-5">
            <button type="button" onClick={requestPopOut} className="btn-secondary flex items-center gap-2 bg-chick/60">
              <Icon name="pin" size={20} /> Pop out timer
            </button>
            <p className="max-w-xs text-center text-sm text-muted">
              Keeps a mini timer floating on top of other tabs and apps while you study.
            </p>
          </div>
        )}
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
              <span className="text-sm font-semibold">Focus (minutes, at least {MIN_FOCUS_MIN})</span>
              <MinutesInput
                min={MIN_FOCUS_MIN}
                max={120}
                disabled={!idle}
                value={timer.focusMin}
                onCommit={(value) => setCustom("focusMin", value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Break (minutes)</span>
              <MinutesInput
                min={1}
                max={60}
                disabled={!idle}
                value={timer.breakMin}
                onCommit={(value) => setCustom("breakMin", value)}
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
          Finish a focus session ({MIN_FOCUS_MIN} minutes or longer) and your egg hatches into a chick. Stop early
          and it gets fried. You can pause for up
          to {PAUSE_LIMIT_MS / 60_000} minutes before your egg goes cold. The timer keeps going on other pages and tabs.
        </p>
        {notificationsSupported() && Notification.permission === "denied" && (
          <p className="text-sm text-muted">
            Notifications are blocked for this site, so you&apos;ll only hear a ding. You can allow them in your
            browser&apos;s site settings.
          </p>
        )}
      </section>

      <FlockSection
        flock={flock}
        sessions={sessions}
        today={today}
        plan={allPlanDays(nests)}
        avatar={avatar}
        plateRef={plateRef}
        hideNewestFried={Boolean(friedFresh)}
      />

      {/* The fried egg on its way from the timer to the plate */}
      {flight && (
        <div ref={flyingRef} className="pointer-events-none fixed z-40" style={{ left: flight.from.x, top: flight.from.y }}>
          <FriedEgg size={76} />
        </div>
      )}

      {/* Today's log */}
      <section className="card mt-6">
        <h2 className="text-xl">Today</h2>
        <p className="mt-1 text-muted">
          {todaySessions.length} egg{todaySessions.length === 1 ? "" : "s"} hatched · {todayMinutes} focus minutes
        </p>
        {/* Live progress for the egg being kept warm right now */}
        {hasEgg(timer) && (
          <p className="mt-3 rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 font-semibold">
            <Icon name="egg" size={16} /> {focusedMinutes} of {timer.focusMin} minutes warm · it hatches when this session finishes
          </p>
        )}
        {todaySessions.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {todaySessions
              .toSorted((a, b) => b.endedAt - a.endedAt) // newest first
              .map((s) => (
                <li key={s.endedAt} className="flex justify-between gap-3 rounded-2xl bg-chick/40 px-4 py-2 text-sm">
                  <span className="font-semibold">
                    <Icon name="chick" size={16} /> {s.minutes} min{s.level ? ` · ${s.level}` : ""}
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

// A minutes box you can type into freely. The number is checked (and fixed if it's out of range)
// when you click away or press Enter, so typing "15" doesn't get corrected halfway through.
function MinutesInput({ value, min, max, disabled, onCommit }) {
  const [draft, setDraft] = useState(null); // what's being typed, or null when not editing
  const commit = () => {
    if (draft !== null) onCommit(draft);
    setDraft(null);
  };
  return (
    <input
      type="number"
      min={min}
      max={max}
      disabled={disabled}
      className="input"
      value={draft ?? value}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
    />
  );
}

// How many chicks to draw before showing "+N more", so a big flock doesn't fill the page.
const MAX_DRAWN_CHICKS = 48;

// What the sad chick says after its egg gets fried, and what the crying chick by the plate says.
const FRIED_MESSAGE = "Study more or u will be cooked on the exam like my egg!";
const PLATE_MESSAGE = "Don't fry my children anymore!!";
// How long the sad chick holds the fried egg before it flies, and how recent a fry must be to animate.
const HOLD_FRIED_MS = 1600;
const FLIGHT_WINDOW_MS = 6000;

// Your flock: the coop with every chick you've hatched, the plate of fried eggs,
// and the takeout bucket of drumsticks.
function FlockSection({ flock, sessions, today, plan, avatar, plateRef, hideNewestFried }) {
  const f = withDefaults(flock);
  const count = chickCount(f);
  const streak = hatchStreak(sessions, today, addDays);
  const hatchedToday = (sessions ?? []).some((s) => s.date === today && s.minutes >= MIN_FOCUS_MIN);
  const planDayToday = plan?.days?.some((d) => d.date === today);
  const shown = f.chicks.slice(-MAX_DRAWN_CHICKS);
  const friedCount = Math.max(0, f.friedEggs.length - (hideNewestFried ? 1 : 0));
  const drumsticks = f.drumsticks.length;

  return (
    <section className="card mt-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl">Your flock</h2>
        <p className="font-display font-semibold">
          <Icon name="chick" size={20} /> {count} chick{count === 1 ? "" : "s"}
          {streak > 0 && <span className="ml-3"><Icon name="flame" size={20} /> {streak}-day streak</span>}
        </p>
      </div>

      {/* The coop, where every chick you've hatched lives */}
      <div>
        <CoopRoof />
        <div className="-mt-px rounded-b-2xl border-[3px] border-line bg-[oklch(90%_0.06_75)] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="label-small text-foreground/70">The Coop</p>
            <Link href="/henhouse" className="text-sm font-semibold underline">
              Name &amp; dress them in the Henhouse →
            </Link>
          </div>
          {count > 0 ? (
            <div className="flex flex-wrap items-end justify-center gap-1 rounded-xl bg-[oklch(94%_0.07_95)] p-3">
              {shown.map((chick) => (
                <span key={chick.id} title={chickName(chick, f.chicks.indexOf(chick))}>
                  <Chick {...chickLook(chick)} size={36} />
                </span>
              ))}
              {count > shown.length && (
                <span className="ml-2 font-display font-semibold text-muted">+{count - shown.length} more</span>
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-[oklch(94%_0.07_95)] p-4 text-center text-muted">
              The coop is empty. Finish a focus session to hatch your first chick!
            </p>
          )}
        </div>
      </div>

      {planDayToday && !hatchedToday && count > 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 text-sm font-semibold">
          Today is a study-plan day. Hatch at least one egg today or a chick gets fried into a drumstick!
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Fried eggs, stacked on a plate, with a heartbroken chick */}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-chick/40 p-4 text-center">
          <p className="label-small">Fried eggs</p>
          {friedCount > 0 && <span className="bubble text-sm">{PLATE_MESSAGE}</span>}
          <div className="mt-1 flex items-end gap-1">
            <Chick variant={avatar} mood={friedCount > 0 ? "crying" : "happy"} size={64} className="mb-3 shrink-0" />
            <div ref={plateRef}>
              <FriedEggPlate count={friedCount} size={150} />
            </div>
          </div>
          <p className="text-sm text-muted">
            {friedCount === 0
              ? "No fried eggs. Keep it that way!"
              : `${friedCount} fried egg${friedCount === 1 ? "" : "s"} (stopped early or went cold)`}
          </p>
        </div>

        {/* Drumsticks, in a takeout bucket */}
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-chick/40 p-4 text-center">
          <p className="label-small">Drumsticks</p>
          {drumsticks > 0 ? (
            <TakeoutBucket count={drumsticks} size={150} />
          ) : (
            <div className="flex h-[140px] items-center">
              <TakeoutBucket count={0} size={120} className="opacity-40" />
            </div>
          )}
          <p className="text-sm text-muted">
            {drumsticks === 0
              ? "No drumsticks. Your chicks are safe!"
              : `${drumsticks} drumstick${drumsticks === 1 ? "" : "s"} (missed plan days or failed quizzes)`}
          </p>
        </div>
      </div>
    </section>
  );
}
