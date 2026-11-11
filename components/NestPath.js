"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { PathEgg } from "@/components/EggArt";
import { formatDate } from "@/lib/dates";
import { BABY_COLORS } from "@/lib/flock";
import { allSections, currentSectionId, eggResult, hasChestAfter } from "@/lib/progress";

// How long the egg takes to crack open before the lesson appears.
const CRACK_MS = 650;

// Sideways offsets (in px) that make the path wind left and right.
const WIGGLE = [0, 50, 80, 50, 0, -50, -80, -50];

// The Duolingo-style path: day banners, an egg for each level, corn chests, then the mock exam.
// `goal` is the goal grade as a fraction (0.9 = 90%), which decides golden vs fried eggs.
export default function NestPath({ nestId, plan, avatar, today, goal, onOpenChest }) {
  const currentId = currentSectionId(plan, goal);
  const allDone = currentId === null;
  const totalLevels = allSections(plan).length;
  let index = 0; // counts stops on the path (levels + chests), to keep the wiggle going
  let levelNumber = 0; // counts levels only, to know where chests go

  return (
    <div className="flex flex-col items-center gap-6">
      {plan.days.map((day, dayIndex) => (
        <section key={day.date} className="flex w-full flex-col items-center gap-6">
          <header className={`card w-full py-4 ${day.date === today ? "bg-chick" : "bg-chick/50"}`}>
            <p className="label-small">
              Day {dayIndex + 1} · {formatDate(day.date)}
              {day.date === today && " · Today"}
            </p>
            <h2 className="text-xl">{day.focus}</h2>
          </header>

          {day.sections.map((section) => {
            levelNumber++;
            const levelOffset = WIGGLE[index++ % WIGGLE.length];
            const chestOffset = hasChestAfter(levelNumber, totalLevels) ? WIGGLE[index++ % WIGGLE.length] : null;

            return (
              <div key={section.id} className="flex flex-col items-center gap-6">
                <LevelNode
                  nestId={nestId}
                  section={section}
                  offset={levelOffset}
                  isCurrent={section.id === currentId}
                  avatar={avatar}
                  goal={goal}
                  chickColor={BABY_COLORS[levelNumber % BABY_COLORS.length]}
                />
                {chestOffset !== null && (
                  <ChestNode
                    offset={chestOffset}
                    unlocked={section.completed}
                    corn={plan.chests?.[section.id]}
                    onOpen={() => onOpenChest(section.id)}
                  />
                )}
              </div>
            );
          })}
        </section>
      ))}

      {/* In demo mode the exam is open early, so visitors can try it without finishing every level. */}
      <ExamNode nestId={nestId} plan={plan} unlocked={allDone || plan.demo} />
    </div>
  );
}

function LevelNode({ nestId, section, offset, isCurrent, avatar, goal, chickColor }) {
  const router = useRouter();
  const [cracking, setCracking] = useState(false);
  const locked = !section.completed && !isCurrent;
  const result = section.completed ? eggResult(section.score, goal) : null;
  const state = locked ? "locked" : result ? result.id : "ready";
  const href = `/nest/${nestId}/${section.id}`;

  // Unopened eggs crack open first, then the lesson appears. Finished ones open right away.
  function open() {
    if (state !== "ready" && state !== "golden") return router.push(href);
    setCracking(true);
    setTimeout(() => router.push(href), CRACK_MS);
  }

  const label = locked
    ? `${section.title} (locked)`
    : result
      ? `${section.title}: ${result.name} (${Math.round(section.score * 100)}%)`
      : `Open the lesson: ${section.title}`;

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && !cracking && <span className="bubble mb-3 text-sm">{result ? "Try again!" : "Tap to crack!"}</span>}
      <button
        type="button"
        onClick={open}
        disabled={locked || cracking}
        aria-label={label}
        className={`flex h-24 items-end justify-center transition ${
          locked ? "cursor-not-allowed opacity-80" : "hover:-translate-y-1 active:translate-y-0.5"
        } ${isCurrent && !cracking ? "animate-egg-wiggle" : ""}`}
      >
        <PathEgg state={state} cracking={cracking} chickColor={chickColor} />
      </button>
      <p className="mt-2 max-w-44 text-center text-sm font-semibold">{section.title}</p>
      {result && (
        <p className="text-xs text-muted">
          {result.name} · {Math.round(section.score * 100)}%
        </p>
      )}
      {/* The user's chick cheers next to the level they're on. */}
      {isCurrent && (
        <Chick variant={avatar} size={64} className={`absolute top-10 ${offset > 0 ? "-left-24" : "-right-24"}`} />
      )}
    </div>
  );
}

// A corn chest: locked until the level before it is done, then tap once to collect corn.
function ChestNode({ offset, unlocked, corn, onOpen }) {
  const opened = corn !== undefined;
  const ready = unlocked && !opened;

  return (
    <div className="flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      <button
        type="button"
        onClick={onOpen}
        disabled={!ready}
        aria-label={opened ? `Chest opened: ${corn} corn` : ready ? "Open chest" : "Locked chest"}
        className={`flex h-16 w-20 items-center justify-center rounded-2xl border-[3px] border-line text-3xl shadow-[0_5px_0_var(--chick-line)] transition ${
          opened ? "bg-white" : ready ? "animate-pulse bg-beak hover:-translate-y-0.5" : "bg-zinc-200 opacity-70"
        }`}
      >
        {opened ? "🌽" : "🎁"}
      </button>
      <p className="mt-2 text-xs font-semibold text-muted">
        {opened ? `+${corn} corn collected!` : ready ? "Tap to open!" : "Corn chest"}
      </p>
    </div>
  );
}

function ExamNode({ nestId, plan, unlocked }) {
  const exam = plan.mockExam;
  const sectionsLeft = allSections(plan).filter((s) => !s.completed).length;

  const content = (
    <span
      className={`flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-line text-5xl shadow-[0_6px_0_var(--chick-line)] ${
        unlocked ? "bg-beak hover:-translate-y-0.5" : "bg-zinc-200 opacity-70"
      }`}
    >
      {unlocked ? "🏆" : "🔒"}
    </span>
  );

  return (
    <div className="mt-4 flex flex-col items-center">
      {unlocked ? <Link href={`/nest/${nestId}/exam`}>{content}</Link> : content}
      <p className="mt-3 font-display text-lg font-semibold">Mock exam</p>
      <p className="text-sm text-muted">
        {exam.completed
          ? `Predicted grade: ${exam.predicted}%`
          : unlocked
            ? plan.demo && sectionsLeft > 0
              ? "Unlocked early for the demo!"
              : "Ready when you are!"
            : `Finish ${sectionsLeft} more level${sectionsLeft === 1 ? "" : "s"} to unlock`}
      </p>
    </div>
  );
}
