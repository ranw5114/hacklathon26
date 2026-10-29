import { formatDate } from "@/lib/dates";

// One day of the study plan: its date, theme, and list of sections.
export default function DayCard({ day, dayNumber, isToday }) {
  const totalMinutes = day.sections.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <article className={`card ${isToday ? "border-indigo-400 ring-2 ring-indigo-100" : ""}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Day {dayNumber} · {formatDate(day.date)}
            {isToday && (
              <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">Today</span>
            )}
          </p>
          <h3 className="text-lg font-semibold">{day.focus}</h3>
        </div>
        <span className="text-sm text-zinc-500">{totalMinutes} min</span>
      </header>

      <ul className="mt-4 flex flex-col gap-2">
        {day.sections.map((section) => (
          <li
            key={section.id}
            className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3"
          >
            <div>
              <p className="font-medium">{section.title}</p>
              <p className="text-sm text-zinc-600">{section.goal}</p>
            </div>
            <span className="shrink-0 text-sm text-zinc-500">{section.minutes} min</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
