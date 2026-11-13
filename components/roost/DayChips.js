import Icon from "@/components/Icon";
import { formatClock } from "@/lib/calendar";

// Small colored labels for a day, used by the Month and Week views.
// Test (target), mock exam (trophy), study plan (one per nest, labeled with its subject), synced events.
// Each chip can have an `icon` (a name from components/Icon.js).
export function dayChips(info, suggestion) {
  const chips = [];
  for (const nest of info.tests) {
    chips.push({ key: `test-${nest.id}`, icon: "target", label: `${nest.test.subject} test`, className: "bg-red-100 border-red-700" });
  }
  for (const nest of info.mocks) {
    chips.push({ key: `mock-${nest.id}`, icon: "trophy", label: `${nest.test.subject} mock`, className: "bg-beak/60 border-line" });
  }
  for (const h of info.homework) {
    chips.push({
      key: `hw-${h.id}`,
      icon: h.done ? "done" : "homework",
      label: h.subject ? `${h.subject}: ${h.title}` : h.title,
      className: `bg-pink-50 border-pink-700 ${h.done ? "line-through opacity-60" : ""}`,
    });
  }
  for (const plan of info.plans) {
    chips.push({
      key: `plan-${plan.nest.id}`,
      icon: plan.done ? "done" : "egg",
      label: `${plan.nest.test.subject}: ${plan.day.focus}`,
      className: "bg-chick border-line",
    });
  }
  if (suggestion && !info.planDone) {
    chips.push({ key: "free", icon: "idea", label: `Study ${formatClock(suggestion.start)}`, className: "bg-white border-dashed border-line" });
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
      {chip.icon && <Icon name={chip.icon} size={13} className="mr-0.5" />}
      {chip.label}
    </span>
  );
}
