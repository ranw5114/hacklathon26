"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { PathEgg } from "@/components/EggArt";
import { formatDate } from "@/lib/dates";
import { updateNest } from "@/lib/nests";
import { allSections, eggResult } from "@/lib/progress";
import { addSection, deleteSection, editDayFocus, editSection } from "@/lib/planEdit";

// Edit plan (on the nest page): rename eggs and days, change what an egg teaches, delete eggs
// you don't need, and add your own. Every change saves right away; a delete can be undone.
export default function PlanEditor({ nestId, nest, goal, onDone }) {
  const [undo, setUndo] = useState(null); // { title, before } after a delete
  const { plan } = nest;
  const onlyOne = allSections(plan).length <= 1;

  function remove(section) {
    const before = nest;
    updateNest(nestId, (n) => deleteSection(n, section.id));
    setUndo({ title: section.title, before });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 bg-chick/60 py-4">
        <div>
          <p className="font-display text-lg font-semibold">Editing your plan</p>
          <p className="text-sm text-muted">Changes save as you go. Renamed eggs get a fresh lesson the next time you open them.</p>
        </div>
        <button type="button" onClick={onDone} className="btn-primary">
          Done editing
        </button>
      </div>

      {undo && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-2xl border-[3px] border-line bg-white px-4 py-2 text-sm anim-pop">
          <span>
            Deleted <strong>{undo.title}</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              updateNest(nestId, () => undo.before);
              setUndo(null);
            }}
            className="font-semibold underline"
          >
            Undo
          </button>
        </div>
      )}

      {plan.days.map((day, dayIndex) => (
        <section key={day.date} className="card flex flex-col gap-3">
          <div>
            <p className="label-small">
              Day {dayIndex + 1} · {formatDate(day.date)}
            </p>
            <input
              key={`${day.date}-${day.focus}`}
              className="input mt-1 font-display text-lg font-semibold"
              defaultValue={day.focus}
              aria-label={`Day ${dayIndex + 1} focus`}
              onBlur={(e) => updateNest(nestId, (n) => editDayFocus(n, day.date, e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </div>

          <ul className="flex flex-col gap-2">
            {day.sections.map((section) => {
              const result = section.completed ? eggResult(section.score, goal) : null;
              return (
                <li key={section.id} className="flex items-start gap-3 rounded-2xl border-2 border-line/30 bg-white p-3">
                  <span className="mt-1 shrink-0">
                    <PathEgg state={result ? result.id : "ready"} size={34} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <input
                      key={`${section.id}-t-${section.title}`}
                      className="input py-1.5 font-semibold"
                      defaultValue={section.title}
                      aria-label="Egg title"
                      onBlur={(e) => updateNest(nestId, (n) => editSection(n, section.id, { title: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                    <textarea
                      key={`${section.id}-g-${section.goal}`}
                      className="input min-h-14 py-1.5 text-sm"
                      defaultValue={section.goal}
                      aria-label="What this egg teaches"
                      onBlur={(e) => updateNest(nestId, (n) => editSection(n, section.id, { goal: e.target.value }))}
                    />
                    {result && (
                      <p className="text-xs text-muted">
                        {result.name} · {Math.round(section.score * 100)}%
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(section)}
                    disabled={onlyOne}
                    title={onlyOne ? "A plan needs at least one egg" : "Delete this egg"}
                    aria-label={`Delete ${section.title}`}
                    className="shrink-0 rounded-xl p-1.5 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Icon name="trash" size={22} />
                  </button>
                </li>
              );
            })}
          </ul>

          <AddEgg onAdd={(egg) => updateNest(nestId, (n) => addSection(n, day.date, egg))} />
        </section>
      ))}

      <button type="button" onClick={onDone} className="btn-primary self-center">
        Done editing
      </button>
    </div>
  );
}

function AddEgg({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line/50 py-2 text-sm font-semibold hover:bg-chick/40">
        <Icon name="plus" size={16} /> Add an egg to this day
      </button>
    );
  }

  function add() {
    if (!title.trim()) return;
    onAdd({ title, goal });
    setTitle("");
    setGoal("");
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-dashed border-line/50 bg-chick/30 p-3">
      <input className="input py-1.5" autoFocus placeholder="What should this lesson be about?" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
      <input className="input py-1.5 text-sm" placeholder="What you want to be able to do after it (optional)" value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-3 py-1 text-sm">
          Cancel
        </button>
        <button type="button" onClick={add} disabled={!title.trim()} className="btn-primary px-3 py-1 text-sm disabled:opacity-50">
          Add egg
        </button>
      </div>
    </div>
  );
}
