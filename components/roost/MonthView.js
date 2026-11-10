import { dayInfo, monthWeeks, studyEgg } from "@/lib/calendar";
import { Chip, dayChips } from "@/components/roost/DayChips";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_CHIPS = 3;

// A month grid. Clicking a day opens it in the Day view.
export default function MonthView({ focusDate, today, data, suggestFor, onOpenDay }) {
  const month = focusDate.slice(0, 7);

  return (
    <div className="overflow-hidden rounded-3xl border-[3px] border-line bg-white">
      <div className="grid grid-cols-7 border-b-[3px] border-line bg-chick/50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-bold tracking-wider text-muted uppercase">
            {d}
          </div>
        ))}
      </div>

      {monthWeeks(focusDate).map((week) => (
        <div key={week[0]} className="grid grid-cols-7">
          {week.map((date) => {
            const info = dayInfo(date, data);
            const chips = dayChips(info, suggestFor(info));
            const inMonth = date.slice(0, 7) === month;
            const egg = studyEgg(info.studiedMinutes);

            return (
              <button
                key={date}
                type="button"
                onClick={() => onOpenDay(date)}
                className={`flex min-h-16 flex-col gap-1 border-r border-b border-line/15 p-1.5 text-left transition hover:bg-chick/30 sm:min-h-28 ${
                  inMonth ? "" : "bg-zinc-50 text-muted"
                }`}
              >
                {/* Date number, with the study egg in the top-right corner */}
                <span className="flex w-full items-start justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                      date === today ? "bg-beak text-foreground" : ""
                    }`}
                  >
                    {Number(date.slice(8))}
                  </span>
                  {egg && (
                    <span className="text-lg leading-none sm:text-xl" title={egg.label} aria-label={egg.label}>
                      {egg.emoji}
                    </span>
                  )}
                </span>

                {/* Phones: colored dots. Computers: labeled chips. */}
                <span className="flex flex-wrap gap-0.5 sm:hidden">
                  {chips.slice(0, 4).map((chip) => (
                    <span key={chip.key} className={`h-2 w-2 rounded-full border ${chip.className}`} />
                  ))}
                </span>
                <span className="hidden w-full flex-col gap-0.5 sm:flex">
                  {chips.slice(0, MAX_CHIPS).map((chip) => (
                    <Chip key={chip.key} chip={chip} />
                  ))}
                  {chips.length > MAX_CHIPS && (
                    <span className="text-xs font-semibold text-muted">+{chips.length - MAX_CHIPS} more</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
