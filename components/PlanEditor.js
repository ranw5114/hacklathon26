"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { PathEgg } from "@/components/EggArt";
import { formatDate, todayString } from "@/lib/dates";
import { isPdf } from "@/lib/studyGuide";
import { formatBytes } from "@/lib/attachmentTypes";
import { attachGuideToNest, dismissUpload, useNestLive } from "@/lib/nestJobs";
import { updateNest } from "@/lib/nests";
import { allSections, eggResult } from "@/lib/progress";
import { addGuideNotes, addSection, deleteSection, editDayFocus, editSection } from "@/lib/planEdit";

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

      <StudyMaterial nest={nest} />

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

// Edit plan → more study material: attach PDFs or paste notes after the nest was built. They're
// added to the nest's notes (used by every lesson made from now on), and the AI can suggest new
// eggs for topics the plan doesn't cover yet.
function StudyMaterial({ nest }) {
  const live = useNestLive();
  const fileInput = useRef(null);
  const [typed, setTyped] = useState("");
  const [addedText, setAddedText] = useState([]); // notes typed in this visit, for suggestions
  const [message, setMessage] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState(null); // [{ title, goal, minutes, pick, date }]
  const uploads = live.uploads[nest.id] ?? [];
  const files = nest.test.guideFiles ?? [];
  const today = todayString();
  const upcoming = nest.plan.days.filter((d) => d.date >= today).map((d) => d.date);
  const dayChoices = upcoming.length ? upcoming : [nest.plan.days.at(-1).date];

  // What's new this visit: PDFs read and notes typed.
  const freshNotes = [
    ...uploads.map((u) => live.guides[u.id]).filter((g) => g?.status === "ready" && g.notes).map((g) => g.notes),
    ...addedText,
  ].join("\n\n");
  const reading = uploads.some((u) => !u.added && ["waiting", "working"].includes(live.guides[u.id]?.status));

  function attach(list) {
    const pdfs = [...list].filter(isPdf);
    const skipped = list.length - pdfs.length;
    setMessage(skipped ? `Only PDFs can be attached, so ${skipped === 1 ? "1 file was" : `${skipped} files were`} skipped.` : "");
    pdfs.forEach((file) => attachGuideToNest(nest, file));
  }

  function addTyped() {
    if (!typed.trim()) return;
    updateNest(nest.id, (n) => addGuideNotes(n, { name: "Notes you added", notes: typed }));
    setAddedText((list) => [...list, typed.trim()]);
    setTyped("");
    setMessage("Added! New lessons in this nest will use your notes.");
  }

  async function suggest() {
    setSuggesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/plan-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: { subject: nest.test.subject, topic: nest.test.topic }, titles: allSections(nest.plan).map((s) => s.title), notes: freshNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Spread them across the days left before the test.
      setSuggestions(data.sections.map((sec, i) => ({ ...sec, pick: true, date: dayChoices[i % dayChoices.length] })));
      if (!data.sections.length) setMessage("Your plan already covers everything in the new material. Nice!");
    } catch (err) {
      setMessage(err.message || "Couldn't get suggestions. Please try again.");
    }
    setSuggesting(false);
  }

  function addPicked() {
    const picked = suggestions.filter((sg) => sg.pick);
    updateNest(nest.id, (n) => picked.reduce((acc, sg) => addSection(acc, sg.date, { title: sg.title, goal: sg.goal }), n));
    setSuggestions(null);
    setMessage(`Added ${picked.length} new egg${picked.length === 1 ? "" : "s"} to your plan!`);
  }

  return (
    <section className="card flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 text-xl">
          <Icon name="book" size={22} /> Study guides &amp; notes
        </h2>
        <p className="text-sm text-muted">Add more material any time. Lessons you haven&apos;t opened yet will use it.</p>
      </div>

      {(files.length > 0 || nest.test.notes?.trim()) && (
        <ul className="flex flex-wrap gap-2">
          {nest.test.notes?.trim() && <li className="rounded-full border-2 border-line/30 bg-white px-3 py-1 text-xs font-semibold">Notes from when you built this nest</li>}
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-full border-2 border-line/30 bg-white px-3 py-1 text-xs font-semibold">
              <Icon name="book" size={14} /> {f.name}
              {f.pages ? <span className="font-normal text-muted"> · {f.pages} {f.pages === 1 ? "page" : "pages"}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          attach(e.target.files);
          e.target.value = "";
        }}
      />
      <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary self-start px-4 py-1.5 text-sm">
        <Icon name="plus" size={16} /> Attach more PDFs
      </button>

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2">
          {uploads.map((u) => {
            const g = live.guides[u.id] ?? {};
            return (
              <li key={u.id} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-3 py-2 text-sm">
                <Icon name={g.status === "error" ? "fried" : u.added ? "done" : "book"} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{u.name}</p>
                  {g.status === "error" ? (
                    <p className="text-xs text-red-700">{g.error}</p>
                  ) : u.added ? (
                    <p className="text-xs text-muted">Added to this nest{g.pages ? ` · ${g.pages} ${g.pages === 1 ? "page" : "pages"}` : ""}</p>
                  ) : g.status === "ready" && !g.notes ? (
                    <p className="text-xs text-muted">No study notes found in it</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted">
                        {formatBytes(u.size)} · {g.label ?? "Waiting its turn…"}
                      </p>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-chick/50">
                        <span className="block h-full bg-beak transition-all" style={{ width: `${Math.round((g.progress ?? 0) * 100)}%` }} />
                      </span>
                    </>
                  )}
                </div>
                {(u.added || g.status === "error") && (
                  <button type="button" onClick={() => dismissUpload(nest.id, u.id)} aria-label={`Hide ${u.name}`} className="shrink-0 rounded-xl p-1 hover:bg-chick/50">
                    <Icon name="close" size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {reading && <p className="text-xs text-muted">You can keep editing or leave this page. Your PDFs keep being read in the background.</p>}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Or paste more notes</span>
        <textarea className="input min-h-20 text-sm" placeholder="e.g. Teacher said Chapter 6 is on the test too…" value={typed} onChange={(e) => setTyped(e.target.value)} />
      </label>
      <button type="button" onClick={addTyped} disabled={!typed.trim()} className="btn-secondary self-start px-4 py-1.5 text-sm disabled:opacity-50">
        Add these notes
      </button>

      {freshNotes && !suggestions && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-chick/50 p-3">
          <p className="flex-1 text-sm font-semibold">Want new eggs for anything in your new material?</p>
          <button type="button" onClick={suggest} disabled={suggesting || reading} className="btn-primary px-4 py-1.5 text-sm">
            {suggesting ? "Thinking…" : reading ? "Reading your PDFs…" : "Suggest new eggs"}
          </button>
        </div>
      )}

      {suggestions?.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border-[3px] border-line bg-chick/30 p-3">
          <p className="font-display font-semibold">Suggested eggs: tick the ones you want</p>
          {suggestions.map((sg, i) => (
            <div key={i} className={`flex flex-wrap items-start gap-3 rounded-xl bg-white p-2 ${sg.pick ? "" : "opacity-60"}`}>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 accent-[var(--chick-line)]"
                checked={sg.pick}
                aria-label={`Add ${sg.title}`}
                onChange={(e) => setSuggestions((list) => list.map((x, j) => (j === i ? { ...x, pick: e.target.checked } : x)))}
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{sg.title}</p>
                <p className="text-xs text-muted">{sg.goal}</p>
              </div>
              <select
                className="input w-auto py-1 text-sm"
                value={sg.date}
                aria-label={`Day for ${sg.title}`}
                onChange={(e) => setSuggestions((list) => list.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))}
              >
                {dayChoices.map((date) => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSuggestions(null)} className="btn-secondary px-3 py-1 text-sm">
              No thanks
            </button>
            <button type="button" onClick={addPicked} disabled={!suggestions.some((sg) => sg.pick)} className="btn-primary px-3 py-1 text-sm disabled:opacity-50">
              Add {suggestions.filter((sg) => sg.pick).length} to my plan
            </button>
          </div>
        </div>
      )}

      {message && <p className="rounded-2xl bg-chick/60 px-3 py-2 text-sm font-semibold">{message}</p>}
    </section>
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
