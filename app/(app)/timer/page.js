"use client";

import PageIcon from "@/components/PageIcon";
import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import { BarnDoorway, BroodingChick, Chicken, CoopRoof, FriedEgg, FriedEggPlate, HatchedChick, TakeoutBucket } from "@/components/EggArt";
import { useConfirm } from "@/components/Modal";
import PageTour from "@/components/PageTour";
import { askForNotifications, notificationsSupported } from "@/lib/alerts";
import { popOutSupported, requestPopOut } from "@/lib/popout";
import { addDays, todayString } from "@/lib/dates";
import { CHICKS_PER_HEN, chickCount, fryEgg, hatchStreak, HENS_PER_ROOSTER, perchChicks, withDefaults, yardGroups } from "@/lib/flock";
import { chickLook, chickName } from "@/lib/henhouse";
import Link from "next/link";
import { currentSectionId, findSection, goalFraction } from "@/lib/progress";
import { save, update, useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { allPlanDays, focusNest, useNests } from "@/lib/nests";
import {
  alreadySaved,
  broodStage,
  MAX_BREAK_MIN,
  MAX_FOCUS_MIN,
  MAX_SAVED_TIMERS,
  removeSavedTimer,
  saveCustomTimer,
  coldIn,
  DEFAULT_TIMER,
  formatTime,
  hasEgg,
  MIN_FOCUS_MIN,
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
  const [draft, setDraft] = useState(null); // { focusMin, breakMin } while making a new timer
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
  // Nothing to say before starting: the Start button says it.
  const status = timer.mode === "break" ? "A new chick hatched!" : fried ? "Your egg got fried…" : idle ? null : stage.name;
  const savedTimers = timer.saved ?? [];
  const draftTaken = draft !== null && alreadySaved(timer, draft.focusMin, draft.breakMin);

  const currentId = plan ? currentSectionId(plan, goalFraction(test)) : null;
  const currentLevel = currentId ? findSection(plan, currentId).title : null;

  const today = todayString();
  const todaySessions = (sessions ?? []).filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.minutes, 0);

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
    const { focusMin, breakMin } = PRESETS[preset] ?? savedTimers.find((t) => t.id === preset);
    save("timer", setDurations(timer, preset, focusMin, breakMin));
  }

  async function deleteSaved(saved) {
    const ok = await confirm({
      title: "Delete this timer?",
      message: `Your ${saved.focusMin}-minute focus, ${saved.breakMin}-minute break timer will be removed.`,
      confirmLabel: "Delete timer",
      danger: true,
      chick: avatar,
    });
    if (ok) save("timer", removeSavedTimer(timer, saved.id));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      {dialog}
      <div className="flex items-center gap-3">
        <PageIcon icon="egg" move="wobble" size={52} lines={["Still part shell, all hustle.", "Tick tock, let's rock!", "Focus mode: cluck-tivated.", "Don't make me hard-boil you!"]} label="Poke the egg" />
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

      {/* The big timer: a ring that fills up as time passes, with the chick keeping its egg warm inside.
          The settings and today's tally live in the same card, so the page stays short. */}
      <section className="card mt-6 flex flex-col items-center gap-4 py-6">
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
          </div>
        </div>

        {/* How the egg is doing, under the ring (inside it, longer messages ran into the edge) */}
        {status && <p className="-mt-1 rounded-full bg-chick/50 px-4 py-1 font-display text-sm font-semibold">{status}</p>}

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
          {popOutSupported() && (
            <button
              type="button"
              onClick={requestPopOut}
              className="btn-secondary flex items-center gap-2 bg-chick/60"
              title="Keeps a mini timer floating on top of other tabs and apps while you study"
            >
              <Icon name="pin" size={20} /> Pop out
            </button>
          )}
        </div>

        {/* Settings: only shown before starting (they can't change while an egg is being kept warm) */}
        {idle && (
          <div className="flex w-full flex-col items-center gap-3 border-t-2 border-dashed border-line/30 pt-4">
            {/* The presets and the student's own saved timers, all in one row */}
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(PRESETS).map(([id, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => choosePreset(id)}
                  className={`${PRESET_BUTTON} px-3 ${timer.preset === id ? PRESET_SELECTED : "bg-white"}`}
                >
                  {preset.label}
                  <span className="ml-1 text-sm text-muted">{preset.focusMin}/{preset.breakMin}</span>
                </button>
              ))}
              {/* Older saves could have unsaved custom minutes; show them so it's clear what's set */}
              {timer.preset === "custom" && (
                <span className={`${PRESET_BUTTON} ${PRESET_SELECTED} px-3`}>
                  Custom <span className="ml-1 text-sm text-muted">{timer.focusMin}/{timer.breakMin}</span>
                </span>
              )}
              {savedTimers.map((t) => (
                <span
                  key={t.id}
                  className={`${PRESET_BUTTON} flex items-center gap-1 pr-1.5 pl-3 ${timer.preset === t.id ? PRESET_SELECTED : "bg-white"}`}
                >
                  <button type="button" onClick={() => choosePreset(t.id)} className="flex items-center gap-1" title="One of your timers">
                    <Icon name="star" size={16} /> {t.focusMin}/{t.breakMin}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSaved(t)}
                    className="ml-1 rounded-full p-1 transition hover:bg-red-100"
                    aria-label={`Delete the ${t.focusMin}/${t.breakMin} timer`}
                    title="Delete this timer"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </span>
              ))}
              {!draft && (
                <button
                  type="button"
                  disabled={savedTimers.length >= MAX_SAVED_TIMERS}
                  onClick={() => setDraft({ focusMin: timer.focusMin, breakMin: timer.breakMin })}
                  className={`${PRESET_BUTTON} flex items-center gap-1 border-dashed bg-white px-3`}
                  title={
                    savedTimers.length >= MAX_SAVED_TIMERS
                      ? `You can keep up to ${MAX_SAVED_TIMERS} timers. Delete one to make another.`
                      : "Make your own focus and break times, saved for next time"
                  }
                >
                  <Icon name="plus" size={16} /> New
                </button>
              )}
            </div>

            {/* Making a new timer: nothing changes until it's saved */}
            {draft && (
              <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border-[3px] border-dashed border-line/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Focus minutes ({MIN_FOCUS_MIN}+)</span>
                    <MinutesInput
                      min={MIN_FOCUS_MIN}
                      max={MAX_FOCUS_MIN}
                      value={draft.focusMin}
                      onCommit={(value) => setDraft({ ...draft, focusMin: clamp(value, MIN_FOCUS_MIN, MAX_FOCUS_MIN) })}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Break minutes</span>
                    <MinutesInput
                      min={1}
                      max={MAX_BREAK_MIN}
                      value={draft.breakMin}
                      onCommit={(value) => setDraft({ ...draft, breakMin: clamp(value, 1, MAX_BREAK_MIN) })}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={draftTaken}
                    onClick={() => {
                      save("timer", saveCustomTimer(timer, draft.focusMin, draft.breakMin));
                      setDraft(null);
                    }}
                    className="btn-primary px-5 py-2 disabled:opacity-50"
                  >
                    Save timer
                  </button>
                  <button type="button" onClick={() => setDraft(null)} className="btn-secondary px-5 py-2">
                    Cancel
                  </button>
                  {draftTaken && <span className="text-sm text-muted">You already have a {draft.focusMin}/{draft.breakMin} timer.</span>}
                </div>
              </div>
            )}

            {currentLevel && timer.mode === "focus" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={linkLevel}
                  onChange={(e) => setLinkLevel(e.target.checked)}
                  className="h-5 w-5 accent-[var(--chick-beak)]"
                />
                <span>
                  Focus on my current level: <strong>{currentLevel}</strong>
                </span>
              </label>
            )}
          </div>
        )}

        {notificationsSupported() && Notification.permission === "denied" && (
          <p className="max-w-sm text-center text-xs text-muted">
            Notifications are blocked for this site, so you&apos;ll only hear a ding. You can allow them in your
            browser&apos;s site settings.
          </p>
        )}

        {/* Today's tally in one line; tap it to see each session */}
        <div className="w-full border-t-2 border-dashed border-line/30 pt-3 text-center text-sm">
          {todaySessions.length === 0 ? (
            <p className="text-muted">
              <Icon name="egg" size={16} /> Today: no eggs hatched yet
            </p>
          ) : (
            <details>
              <summary className="cursor-pointer font-semibold">
                <Icon name="chick" size={16} /> Today: {todaySessions.length} egg{todaySessions.length === 1 ? "" : "s"} hatched ·{" "}
                {todayMinutes} focus minutes
              </summary>
              <ul className="mx-auto mt-2 flex max-w-sm flex-col gap-1.5">
                {todaySessions
                  .toSorted((a, b) => b.endedAt - a.endedAt) // newest first
                  .map((s) => (
                    <li key={s.endedAt} className="flex justify-between gap-3 rounded-xl bg-chick/40 px-3 py-1.5">
                      <span className="font-semibold">
                        {s.minutes} min{s.level ? ` · ${s.level}` : ""}
                      </span>
                      <span className="text-muted">
                        {new Date(s.endedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
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

// A typed number of minutes, kept between min and max.
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Math.round(Number(value)) || min));
}

// The look of the preset buttons (and saved timers), and of the one that's picked.
const PRESET_BUTTON = "rounded-2xl border-[3px] border-line py-2 font-display font-semibold disabled:opacity-50";
const PRESET_SELECTED = "bg-chick shadow-[0_3px_0_var(--chick-line)]";

// What the chick on the Henhouse button wears, as a taste of dressing up.
const HENHOUSE_OUTFIT = { head: "beret", neck: "bowtie" };

// What the sad chick says after its egg gets fried, and what the crying chick by the plate says.
const FRIED_MESSAGE = "Study more or u will be cooked on the exam like my egg!";
const PLATE_MESSAGE = "Don't fry my children anymore!!";
// How long the sad chick holds the fried egg before it flies, and how recent a fry must be to animate.
const HOLD_FRIED_MS = 1600;
const FLIGHT_WINDOW_MS = 6000;

// The coop's colors: a wooden sign, a plank wall, and straw on the floor.
const WOOD_SIGN = "oklch(80% 0.09 70)";
const WOOD_WALL =
  "repeating-linear-gradient(90deg, oklch(88% 0.06 70) 0 46px, oklch(82% 0.06 65) 46px 49px)";
const STRAW =
  "repeating-linear-gradient(115deg, oklch(88% 0.12 90) 0 5px, oklch(80% 0.13 85) 5px 7px, oklch(91% 0.1 95) 7px 12px)";
const PERCH = "oklch(52% 0.08 55)";
const GRASS = "repeating-linear-gradient(100deg, oklch(86% 0.1 140) 0 9px, oklch(82% 0.11 140) 9px 12px)";

// One kind of grown-up in the yard (roosters, hens, or chicks). Up to 4 are drawn; more show one with a count.
function YardGroup({ count, label, each, children }) {
  if (!count) return null;
  const drawn = count > 4 ? 1 : count;
  return (
    <span className="flex items-end gap-0.5" title={`${count} ${label}${count === 1 ? "" : "s"} (each is ${each})`}>
      {Array.from({ length: drawn }, (_, i) => (
        <span key={i}>{children}</span>
      ))}
      {count > drawn && <span className="mb-1 ml-1 font-display font-semibold">×{count}</span>}
    </span>
  );
}

// One chick on its perch. Hovering (or tapping, on a phone) shows a name tag above it.
function CoopChick({ chick, name, showTag, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="group relative px-1.5 pb-0.5"
      style={{ borderBottom: `6px solid ${PERCH}` }}
      aria-label={name}
    >
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border-2 border-line bg-white px-2 py-0.5 text-xs font-semibold whitespace-nowrap shadow-[0_2px_0_var(--chick-line)] ${
          showTag ? "block" : "hidden group-hover:block"
        }`}
      >
        {name}
      </span>
      <span className="block transition group-hover:-translate-y-1">
        <Chick {...chickLook(chick)} size={44} />
      </span>
    </button>
  );
}

// The fried-egg plate and the drumstick bucket, as small side-by-side tiles: the picture on the left,
// then the title with its count and one line on how they happen (or a happy note when there are none).
function LossCard({ title, count, icon, cause, allClear, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-chick/40 p-3">
      <div className="flex shrink-0 items-end">{children}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="label-small">{title}</p>
          <span
            className={`rounded-full border-2 border-line px-2 text-sm font-display font-semibold ${count > 0 ? "bg-white" : "bg-white/50 text-muted"}`}
          >
            × {count}
          </span>
        </div>
        <p className="mt-1 flex items-start gap-1.5 text-sm">
          <Icon name={count > 0 ? icon : "heart"} size={16} className="mt-0.5 shrink-0" />
          <span>{count > 0 ? cause : allClear}</span>
        </p>
      </div>
    </div>
  );
}

// Your flock: the coop with every chick you've hatched, the plate of fried eggs,
// and the takeout bucket of drumsticks.
function FlockSection({ flock, sessions, today, plan, avatar, plateRef, hideNewestFried }) {
  const f = withDefaults(flock);
  const count = chickCount(f);
  const streak = hatchStreak(sessions, today, addDays);
  const hatchedToday = (sessions ?? []).some((s) => s.date === today && s.minutes >= MIN_FOCUS_MIN);
  const planDayToday = plan?.days?.some((d) => d.date === today);
  // Favorites (or the newest few) sit on the perch; everyone else is out in the yard, grown up.
  const perch = perchChicks(f);
  const yardCount = count - perch.length;
  const yard = yardGroups(yardCount);
  const friedCount = Math.max(0, f.friedEggs.length - (hideNewestFried ? 1 : 0));
  const drumsticks = f.drumsticks.length;
  const unnamed = f.chicks.filter((chick) => !chick.name?.trim()).length;
  const [tagged, setTagged] = useState(null); // the chick whose name tag was tapped open (phones can't hover)

  return (
    <section className="card mt-6 flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl">Your flock</h2>
        <p className="font-display font-semibold">
          <Icon name="chick" size={20} /> {count} chick{count === 1 ? "" : "s"}
          {streak > 0 && (
            <span className="ml-3">
              <Icon name="flame" size={20} /> {streak}-day streak
            </span>
          )}
        </p>
      </div>

      {/* The coop, where every chick you've hatched lives */}
      <div>
        {/* A tall roof with the coop's sign hanging in it */}
        <div className="relative">
          <CoopRoof className="h-28" />
          <div className="absolute inset-x-0 bottom-1 flex justify-center">
            <div className="relative -rotate-2">
              {/* The two strings it hangs from */}
              <span className="absolute -top-5 left-5 h-5 w-[3px] bg-line" />
              <span className="absolute -top-5 right-5 h-5 w-[3px] bg-line" />
              <p
                className="rounded-lg border-[3px] border-line px-4 py-1 font-display font-semibold whitespace-nowrap shadow-[0_3px_0_var(--chick-line)]"
                style={{ background: WOOD_SIGN }}
              >
                The Coop
              </p>
            </div>
          </div>
        </div>

        <div className="-mt-px overflow-visible rounded-b-2xl border-[3px] border-line" style={{ background: WOOD_WALL }}>
          {count > 0 ? (
            // Chicks sit in rows; each one's bit of perch joins up with its neighbours into a long wooden bar.
            <div className="flex flex-wrap items-end justify-center gap-y-8 px-3 pt-10 pb-4">
              {perch.map((chick) => (
                <CoopChick
                  key={chick.id}
                  chick={chick}
                  name={chickName(chick, f.chicks.indexOf(chick))}
                  showTag={tagged === chick.id}
                  onTap={() => setTagged(tagged === chick.id ? null : chick.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 px-3 pt-6 pb-2">
              <Icon name="nest" size={56} />
              <p>
                <span className="block font-display font-semibold">No chicks yet</span>
                <span className="block text-sm text-foreground/70">
                  Finish a focus session ({MIN_FOCUS_MIN}+ minutes) to hatch your first one.
                </span>
              </p>
            </div>
          )}

          {/* Straw on the floor */}
          <div className="h-4 border-y-[3px] border-line" style={{ background: STRAW }} />

          {/* The yard: every chick not on the perch, grown up so a big flock stays tidy */}
          {yardCount > 0 && (
            <div className="border-b-[3px] border-line px-3 pt-3 pb-3" style={{ background: GRASS }}>
              <p className="label-small text-foreground/80">
                Out in the yard · {yardCount} chick{yardCount === 1 ? "" : "s"}
              </p>
              <div className="mt-2 flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
                <YardGroup count={yard.roosters} label="golden rooster" each={`${CHICKS_PER_HEN * HENS_PER_ROOSTER} chicks`}>
                  <Chicken kind="rooster" size={72} />
                </YardGroup>
                <YardGroup count={yard.hens} label="hen" each={`${CHICKS_PER_HEN} chicks`}>
                  <Chicken kind="hen" size={60} />
                </YardGroup>
                <YardGroup count={yard.chicks} label="chick" each="1 chick">
                  <Chick variant="sunny" size={36} />
                </YardGroup>
              </div>
              <p className="mt-2 text-center text-xs text-foreground/80">
                Every {CHICKS_PER_HEN} chicks grow into a hen, and every {HENS_PER_ROOSTER} hens into a golden rooster. Pick
                favorites in the Henhouse to keep them on the perch.
              </p>
            </div>
          )}

          {/* Invitation to the Henhouse: a barn door, with the newest chick (or your own) dressed up in the doorway */}
          <div className="p-3">
            <Link
              href="/henhouse"
              className="group flex items-center gap-3 rounded-xl border-[3px] border-line bg-white p-2 pr-4 transition hover:-translate-y-0.5 hover:shadow-[0_3px_0_var(--chick-line)]"
            >
              <BarnDoorway size={60}>
                {count > 0 ? (
                  <Chick {...chickLook(f.chicks.at(-1))} wear={HENHOUSE_OUTFIT} size={36} />
                ) : (
                  <Chick variant={avatar} wear={HENHOUSE_OUTFIT} size={36} />
                )}
              </BarnDoorway>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold">Name &amp; dress them in the Henhouse</span>
                <span className="block text-sm text-muted">
                  {count === 0
                    ? "Peek at the outfits you can buy with corn."
                    : unnamed > 0
                      ? `${unnamed} chick${unnamed === 1 ? " is" : "s are"} waiting for a name!`
                      : "Spend your corn on hats, scarves, and more."}
                </span>
              </span>
              <span className="shrink-0 font-display text-xl transition group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>

      {planDayToday && !hatchedToday && count > 0 && (
        <p className="rounded-2xl border-2 border-dashed border-line/40 px-4 py-2 text-sm font-semibold">
          Today is a study-plan day. Hatch at least one egg today or a chick gets fried into a drumstick!
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Fried eggs, stacked on a plate, with a heartbroken chick */}
        <LossCard
          title="Fried eggs"
          count={friedCount}
          icon="fried"
          cause="Stopping a focus session early, or pausing too long"
          allClear="No fried eggs. Keep it that way!"
        >
          <span title={friedCount > 0 ? PLATE_MESSAGE : undefined}>
            <Chick variant={avatar} mood={friedCount > 0 ? "crying" : "happy"} size={36} className="mb-1" />
          </span>
          <div ref={plateRef}>
            <FriedEggPlate count={friedCount} size={84} />
          </div>
        </LossCard>

        {/* Drumsticks, in a takeout bucket */}
        <LossCard
          title="Drumsticks"
          count={drumsticks}
          icon="drumstick"
          cause="Missing a study-plan day, or failing a Nest quiz"
          allClear="No drumsticks. Your chicks are safe!"
        >
          <TakeoutBucket count={drumsticks} size={84} className={drumsticks > 0 ? "" : "opacity-40"} />
        </LossCard>
      </div>
    </section>
  );
}
