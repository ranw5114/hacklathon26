import { formatClock } from "@/lib/calendar";

// Small colored labels for a day, used by the Month and Week views.
// 🎯 test, 🏆 mock exam, 🟡 study plan (one per nest, labeled with its subject), 🔵 synced events.
export function dayChips(info, suggestion) {
  const chips = [];
  for (const nest of info.tests) {
    chips.push({ key: `test-${nest.id}`, label: `🎯 ${nest.test.subject} test`, className: "bg-red-100 border-red-700" });
  }
  for (const nest of info.mocks) {
    chips.push({ key: `mock-${nest.id}`, label: `🏆 ${nest.test.subject} mock`, className: "bg-beak/60 border-line" });
  }
  for (const plan of info.plans) {
    chips.push({
      key: `plan-${plan.nest.id}`,
      label: `${plan.done ? "✅" : "🟡"} ${plan.nest.test.subject}: ${plan.day.focus}`,
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
