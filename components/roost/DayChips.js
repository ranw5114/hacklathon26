import { formatClock } from "@/lib/calendar";

// Small colored labels for a day, used by the Month and Week views.
// 🎯 test, 🏆 mock exam, 🟡 study plan, 🔵 synced events.
export function dayChips(info, suggestion) {
  const chips = [];
  if (info.isTest) chips.push({ key: "test", label: "🎯 Test day", className: "bg-red-100 border-red-700" });
  if (info.isMock) chips.push({ key: "mock", label: "🏆 Mock exam", className: "bg-beak/60 border-line" });
  if (info.planDay) {
    chips.push({
      key: "plan",
      label: `${info.planDone ? "✅" : "🟡"} ${info.planDay.focus}`,
      className: "bg-chick border-line",
    });
  }
  if (suggestion && !info.planDone) {
    chips.push({ key: "free", label: `💡 Study ${formatClock(suggestion.start)}`, className: "bg-white border-dashed border-line" });
  }
  for (const event of info.events) {
    chips.push({
      key: event.id,
      label: event.allDay ? event.title : `${formatClock(event.start)} ${event.title}`,
      className: "bg-sky-100 border-sky-700",
    });
  }
  return chips;
}

export function Chip({ chip }) {
  return (
    <span className={`block truncate rounded-md border px-1.5 py-0.5 text-xs font-semibold ${chip.className}`}>
      {chip.label}
    </span>
  );
}
