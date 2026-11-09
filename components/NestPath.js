import Link from "next/link";
import Chick from "@/components/Chick";
import { formatDate } from "@/lib/dates";
import { allSections, cookLevel, currentSectionId, hasChestAfter } from "@/lib/progress";

// Sideways offsets (in px) that make the path wind left and right.
const WIGGLE = [0, 50, 80, 50, 0, -50, -80, -50];

// The Duolingo-style path: day banners, level buttons, corn chests, then the mock exam.
export default function NestPath({ plan, profile, today, onOpenChest }) {
  const currentId = currentSectionId(plan);
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
                  section={section}
                  offset={levelOffset}
                  isCurrent={section.id === currentId}
                  avatar={profile.avatar}
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

      <ExamNode plan={plan} unlocked={allDone} />
    </div>
  );
}

function LevelNode({ section, offset, isCurrent, avatar }) {
  const locked = !section.completed && !isCurrent;
  const cook = section.completed ? cookLevel(section.score) : null;

  const circle = (
    <span
      className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-line text-3xl shadow-[0_6px_0_var(--chick-line)] transition ${
        locked ? "bg-zinc-200 opacity-70" : "hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
      } ${isCurrent ? "animate-bounce bg-chick" : ""}`}
      style={cook ? { background: cook.color } : undefined}
    >
      {locked ? "🔒" : cook ? cook.emoji : "⭐"}
    </span>
  );

  return (
    <div className="relative flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
      {isCurrent && <span className="bubble mb-3 text-sm">Start here!</span>}
      {locked ? circle : <Link href={`/nest/${section.id}`}>{circle}</Link>}
      <p className="mt-3 max-w-44 text-center text-sm font-semibold">{section.title}</p>
      {cook && <p className="text-xs text-muted">{cook.name}</p>}
      {/* The user's chick cheers next to the level they're on. */}
      {isCurrent && (
        <Chick variant={avatar} size={64} className={`absolute top-8 ${offset > 0 ? "-left-24" : "-right-24"}`} />
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

function ExamNode({ plan, unlocked }) {
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
      {unlocked ? <Link href="/nest/exam">{content}</Link> : content}
      <p className="mt-3 font-display text-lg font-semibold">Mock exam</p>
      <p className="text-sm text-muted">
        {exam.completed
          ? `Predicted grade: ${exam.predicted}%`
          : unlocked
            ? "Ready when you are!"
            : `Finish ${sectionsLeft} more level${sectionsLeft === 1 ? "" : "s"} to unlock`}
      </p>
    </div>
  );
}
