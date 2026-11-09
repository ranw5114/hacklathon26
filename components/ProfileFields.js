import Chick, { CHICKS } from "@/components/Chick";
import { LEARNING_STYLES } from "@/lib/learningStyles";

// Avatar grid, used on the setup page and the profile page.
export function AvatarPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {Object.entries(CHICKS).map(([id, chick]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex flex-col items-center gap-1 rounded-2xl border-[3px] border-line p-2 pt-4 text-sm font-semibold transition ${
            value === id ? "bg-chick shadow-[0_4px_0_var(--chick-line)]" : "bg-white hover:bg-chick/40"
          }`}
        >
          <Chick variant={id} size={52} />
          {chick.name}
        </button>
      ))}
    </div>
  );
}

// Learning style choices, used on the setup page and the profile page.
export function LearningStylePicker({ value, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(LEARNING_STYLES).map(([id, style]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`rounded-2xl border-[3px] border-line p-4 text-left transition ${
            value === id ? "bg-chick shadow-[0_4px_0_var(--chick-line)]" : "bg-white hover:bg-chick/40"
          }`}
        >
          <span className="font-display font-semibold">{style.label}</span>
          <span className="block text-sm text-muted">{style.description}</span>
        </button>
      ))}
    </div>
  );
}

// A label with its input underneath.
export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-display font-semibold">{label}</span>
      {children}
    </label>
  );
}
