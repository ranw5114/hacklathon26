import { useEffect, useRef } from "react";
import Link from "next/link";
import { DAY_END_HOUR, DAY_START_HOUR, formatClock, studyEgg } from "@/lib/calendar";
import { eggResult, goalFraction, isUnlocked } from "@/lib/progress";

const HOUR_PX = 56; // height of one hour on the timeline

// Minutes since midnight → pixels from the top of the timeline.
const toY = (minutes) => ((minutes - DAY_START_HOUR * 60) / 60) * HOUR_PX;
const minutesOf = (value) => {
  const d = new Date(value);
  return d.getHours() * 60 + d.getMinutes();
};

// Puts overlapping events side by side: each gets a column number.
function layoutEvents(events) {
  const columns = [];
  const placed = events.map((event) => {
    const start = minutesOf(event.start);
    const end = Math.max(start + 20, minutesOf(event.end) || 24 * 60);
    let column = columns.findIndex((lastEnd) => lastEnd <= start);
    if (column === -1) column = columns.push(0) - 1;
    columns[column] = end;
    return { event, start, end, column };
  });
  return { placed, columnCount: Math.max(1, columns.length) };
}

// The expanded view of one day: study plan, suggested study time, and an hour-by-hour timeline.
export default function DayView({ info, suggestion, now, isToday }) {
  const scrollRef = useRef(null);
  const egg = studyEgg(info.studiedMinutes);
  const timed = info.events.filter((e) => !e.allDay);
  const allDay = info.events.filter((e) => e.allDay);
  const { placed, columnCount } = layoutEvents(timed);
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  // When a day opens, scroll the timeline to a useful spot: now (today), else the first event, else 8 AM.
  const firstEventMinutes = timed.length ? minutesOf(timed[0].start) : null;
  useEffect(() => {
    const target = isToday ? nowMinutes : (firstEventMinutes ?? 8 * 60);
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, toY(target) - HOUR_PX);
    // Only when the day changes, not every minute as `now` ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.date]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Timeline */}
      <div className="rounded-3xl border-[3px] border-line bg-white p-3">
        {allDay.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2 border-b-2 border-line/15 pb-3">
            <span className="label-small self-center">All day</span>
            {allDay.map((e) => (
              <span
                key={e.id}
                className="rounded-lg border border-sky-700 bg-sky-100 px-2 py-0.5 text-sm font-semibold"
              >
                {e.title}
              </span>
            ))}
          </div>
        )}

        {/* The timeline scrolls inside this box, so the whole day (12 AM - 12 AM) fits */}
        <div ref={scrollRef} className="max-h-[65vh] overflow-y-auto pt-2 pr-1">
          <div className="relative" style={{ height: (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX }}>
            {hours.map((hour) => (
              <div key={hour} className="absolute inset-x-0 flex items-start gap-2" style={{ top: toY(hour * 60) }}>
                <span className="w-16 shrink-0 -translate-y-2 text-right text-xs whitespace-nowrap text-muted">
                  {formatClock(new Date(2026, 0, 1, hour))}
                </span>
                <span className="mt-0 h-px flex-1 bg-line/15" />
              </div>
            ))}

            {/* Events and the suggested study block sit to the right of the hour labels */}
            <div className="absolute inset-y-0 right-0 left-[4.5rem]">
              {suggestion && !info.planDone && (
                <Link
                  href="/timer"
                  className="absolute inset-x-0 flex flex-col justify-center rounded-xl border-2 border-dashed border-line bg-chick/70 px-3 text-sm font-semibold hover:bg-chick"
                  style={{
                    top: toY(minutesOf(suggestion.start)),
                    height: Math.max(28, toY(minutesOf(suggestion.end)) - toY(minutesOf(suggestion.start))),
                  }}
                >
                  💡 Study time: {formatClock(suggestion.start)} – {formatClock(suggestion.end)}
                  <span className="text-xs font-normal text-muted">Tap to open the Egg Timer</span>
                </Link>
              )}

              {placed.map(({ event, start, end, column }) => (
                <div
                  key={event.id}
                  className="absolute overflow-hidden rounded-xl border-2 border-sky-700 bg-sky-100 px-2 py-1 text-xs"
                  style={{
                    top: toY(Math.max(start, DAY_START_HOUR * 60)),
                    height: Math.max(
                      22,
                      toY(Math.min(end, DAY_END_HOUR * 60)) - toY(Math.max(start, DAY_START_HOUR * 60)),
                    ),
                    left: `${(column / columnCount) * 100}%`,
                    width: `${100 / columnCount}%`,
                  }}
                >
                  <p className="truncate font-bold">{event.title}</p>
                  <p className="truncate text-muted">
                    {formatClock(event.start)} – {formatClock(event.end)}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
              ))}

              {/* A red line at the current time */}
              {isToday && nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= DAY_END_HOUR * 60 && (
                <div className="absolute inset-x-0 z-10 h-0.5 bg-red-600" style={{ top: toY(nowMinutes) }}>
                  <span className="absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-red-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Side panel: what to study today */}
      <aside className="flex flex-col gap-4">
        {info.tests.map((nest) => (
          <div key={nest.id} className="card bg-red-50 font-display text-lg font-semibold">
            🎯 {nest.test.subject} test day! You&apos;ve got this.
          </div>
        ))}
        {info.mocks.map((nest) => (
          <Link key={nest.id} href={`/nest/${nest.id}/exam`} className="card-link bg-beak/40 font-display text-lg font-semibold">
            🏆 {nest.test.subject} mock exam
          </Link>
        ))}

        {info.plans.map((plan) => {
          const goal = goalFraction(plan.nest.test);
          return (
            <div key={plan.nest.id} className="card">
              <p className="label-small">
                {plan.nest.test.subject} · Day {plan.number}
              </p>
              <h3 className="mt-1 text-xl">{plan.day.focus}</h3>
              <p className="text-sm text-muted">{plan.minutes} minutes planned</p>
              <ul className="mt-3 flex flex-col gap-2">
                {plan.day.sections.map((section) => {
                  const unlocked = isUnlocked(plan.nest.plan, section.id, goal);
                  const cook = section.completed ? eggResult(section.score, goal) : null;
                  const label = (
                    <>
                      <span>{cook ? cook.emoji : unlocked ? "🥚" : "🔒"}</span>
                      <span className="flex-1">{section.title}</span>
                      <span className="text-xs text-muted">{section.minutes}m</span>
                    </>
                  );
                  return (
                    <li key={section.id}>
                      {unlocked ? (
                        <Link
                          href={`/nest/${plan.nest.id}/${section.id}`}
                          className="flex items-center gap-2 rounded-xl bg-chick/40 px-3 py-2 text-sm font-semibold hover:bg-chick"
                        >
                          {label}
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-sm text-muted">
                          {label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {plan.done && <p className="mt-3 font-semibold">✅ All done for this test today!</p>}
            </div>
          );
        })}

        {info.plans.length > 0 && !info.planDone && (
          <>
            {suggestion && (
              <p className="rounded-xl border-2 border-dashed border-line px-3 py-2 text-sm">
                💡 {suggestion.fits ? "Free" : "Longest free gap"} for {info.studyMinutes} min of study:{" "}
                <strong>
                  {formatClock(suggestion.start)} – {formatClock(suggestion.end)}
                </strong>
                {!suggestion.fits && ` (${suggestion.minutes} min, so split your study time)`}
              </p>
            )}
            {!suggestion && isToday && (
              <p className="rounded-xl bg-chick/40 px-3 py-2 text-sm">
                🌙 It&apos;s getting late. Do what you can, or catch up tomorrow.
              </p>
            )}
          </>
        )}
        {info.plans.length === 0 && <div className="card text-muted">No study plan for this day.</div>}

        {egg && (
          <div className="card">
            <span className="text-2xl">{egg.emoji}</span> {egg.label}
          </div>
        )}
      </aside>
    </div>
  );
}
