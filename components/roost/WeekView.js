import { dayInfo, studyEgg, weekDays } from "@/lib/calendar";
import { Chip, dayChips } from "@/components/roost/DayChips";

// Seven days side by side on computers, stacked on phones. Clicking a day opens the Day view.
export default function WeekView({ focusDate, today, data, suggestFor, onOpenDay }) {
  return (
    <div className="grid gap-3 sm:grid-cols-7 sm:gap-2">
      {weekDays(focusDate).map((date) => {
        const info = dayInfo(date, data);
        const chips = dayChips(info, suggestFor(info));
        const day = new Date(`${date}T12:00:00`);
        const egg = studyEgg(info.studiedMinutes);

        return (
          <button
            key={date}
            type="button"
            onClick={() => onOpenDay(date)}
            className={`flex flex-col gap-1.5 rounded-2xl border-[3px] border-line p-2 text-left transition hover:-translate-y-0.5 sm:min-h-64 ${
              date === today ? "bg-chick" : "bg-white"
            }`}
          >
            <span className="flex w-full items-start justify-between">
              <span className="flex items-baseline gap-2 sm:flex-col sm:gap-0">
                <span className="label-small">{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span className="font-display text-2xl font-semibold">{day.getDate()}</span>
              </span>
              {egg && (
                <span className="text-2xl leading-none" title={egg.label} aria-label={egg.label}>
                  {egg.emoji}
                </span>
              )}
            </span>
            {chips.length === 0 && <span className="text-xs text-muted">Nothing planned</span>}
            {chips.map((chip) => (
              <Chip key={chip.key} chip={chip} />
            ))}
          </button>
        );
      })}
    </div>
  );
}
