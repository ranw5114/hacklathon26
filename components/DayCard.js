import { formatDate } from "@/lib/dates";

// One day of the study plan: its date, theme, and list of sections.
export default function DayCard({ day, dayNumber, isToday }) {
  const totalMinutes = day.sections.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <article className={`card ${isToday ? "bg-chick/40" : ""}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="label-small">
            Day {dayNumber} · {formatDate(day.date)}
            {isToday && (
              <span className="ml-2 rounded-full border-2 border-line bg-beak px-2 py-0.5 text-foreground">
                Today
              </span>
            )}
          </p>
          <h3 className="mt-1 text-xl">{day.focus}</h3>
        </div>
        <span className="text-sm text-muted">{totalMinutes} min</span>
      </header>

      <ul className="mt-4 flex flex-col gap-2">
        {day.sections.map((section) => (
          <li
            key={section.id}
            className="flex items-center justify-between gap-3 rounded-2xl border-2 border-line/20 bg-white p-3"
          >
            <div>
              <p className="font-semibold">{section.title}</p>
              <p className="text-sm text-muted">{section.goal}</p>
            </div>
            <span className="shrink-0 text-sm text-muted">{section.minutes} min</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
