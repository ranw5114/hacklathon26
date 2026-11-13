"use client";

import Icon from "@/components/Icon";
import { useRef, useState } from "react";
import { Field } from "@/components/ProfileFields";
import { useRouter } from "next/navigation";
import { todayString } from "@/lib/dates";
import { checkGrades } from "@/lib/grades";
import { findSubject, SUBJECT_GROUPS, SUBJECTS } from "@/lib/subjects";
import { isPdf } from "@/lib/studyGuide";
import { formatBytes } from "@/lib/attachmentTypes";
import { attachGuide, discardDraftGuides, removeGuides, setDraftGuides, startNestJob, useNestLive } from "@/lib/nestJobs";

// The menu value for "type your own subject".
const OTHER = "other";

const HOURS_OPTIONS = [0.5, 1, 1.5, 2, 3];

const EMPTY_TEST = {
  subjectId: "", // a SUBJECTS id from the menu, or "other" when typed in
  subject: "",
  topic: "",
  testDate: "",
  currentGrade: "",
  goalGrade: "",
  hoursPerDay: 1,
  notes: "",
};

// Returns { error, canSwap }, with error "" if everything is filled in correctly.
function validate(test) {
  if (!test.subject.trim()) return { error: "Pick a subject, or choose \"Something else\" and type it in." };
  if (!test.topic.trim() && !findSubject(test.subjectId)?.defaultTopic) return { error: "Add what's on the test." };
  if (!test.testDate) return { error: "Pick your test date." };
  if (test.testDate <= todayString()) return { error: "The test date needs to be after today." };
  return checkGrades(test.currentGrade, test.goalGrade);
}

// The form that collects test details and asks the AI to build a study plan.
export default function NestForm({ learner }) {
  const router = useRouter();
  const [test, setTest] = useState(EMPTY_TEST);
  const [error, setError] = useState("");
  const [canSwap, setCanSwap] = useState(false);
  // Attached study-guide PDFs: [{ id, name, size }]. They're read in the background (lib/nestJobs.js).
  // A fresh form starts empty, so PDFs left on an earlier, unfinished form are dropped.
  const [guides, setGuidesState] = useState(() => {
    discardDraftGuides();
    return [];
  });
  function setGuides(change) {
    setGuidesState((list) => {
      const next = typeof change === "function" ? change(list) : change;
      setDraftGuides(next.map((g) => g.id));
      return next;
    });
  }
  const [selected, setSelected] = useState([]); // ids ticked for deleting
  const fileInput = useRef(null);
  const live = useNestLive();

  function addGuides(files) {
    const pdfs = [...files].filter(isPdf);
    const skipped = files.length - pdfs.length;
    setError(skipped ? `Only PDFs can be attached here, so ${skipped === 1 ? "1 file was" : `${skipped} files were`} skipped.` : "");
    const about = { subject: test.subject, topic: test.topic };
    const added = pdfs.map((file) => ({ id: attachGuide(file, about), name: file.name, size: file.size }));
    setGuides((list) => [...list, ...added]);
  }

  function deleteGuides(ids) {
    removeGuides(ids);
    setGuides((list) => list.filter((g) => !ids.includes(g.id)));
    setSelected((list) => list.filter((id) => !ids.includes(id)));
  }

  function toggleSelected(id) {
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  }

  const picked = findSubject(test.subjectId);
  const isTest = picked?.kind === "test";

  function update(field, value) {
    setTest({ ...test, [field]: value });
    setError("");
    setCanSwap(false);
  }

  // Fixes the common mix-up of typing the goal into the current-grade box (and vice versa).
  function swapGrades() {
    setTest({ ...test, currentGrade: test.goalGrade, goalGrade: test.currentGrade });
    setError("");
    setCanSwap(false);
  }

  // Starts building in the background, clears the form for the next nest, and shows all nests.
  function buildNest() {
    const check = validate(test);
    if (check.error) {
      setError(check.error);
      setCanSwap(Boolean(check.canSwap));
      return;
    }
    const finalTest = {
      ...test,
      // Tests like the SAT can be studied as a whole, so "what's on it" can be left blank.
      topic: test.topic.trim() || findSubject(test.subjectId)?.defaultTopic || test.topic,
      currentGrade: Number(test.currentGrade),
      goalGrade: Number(test.goalGrade),
    };
    startNestJob({ test: finalTest, learner, today: todayString(), guides: guides.filter((g) => live.guides[g.id]?.status !== "error") });
    removeGuides(guides.filter((g) => live.guides[g.id]?.status === "error").map((g) => g.id));
    setDraftGuides([]); // they belong to the new nest now
    setTest(EMPTY_TEST);
    setGuidesState([]);
    setSelected([]);
    setError("");
    router.push("/nest");
  }

  return (
    <section className="card flex flex-col gap-5">
      <h2 className="text-2xl">What are we studying for?</h2>

      <Field label="Class or test">
        <select
          className="input"
          value={test.subjectId}
          onChange={(e) => {
            const id = e.target.value;
            const choice = findSubject(id);
            setTest({ ...test, subjectId: id, subject: choice ? choice.label : "" });
            setError("");
          }}
        >
          <option value="" disabled>
            Choose a class or test…
          </option>
          {SUBJECT_GROUPS.map((group) => (
            <optgroup key={group} label={group}>
              {SUBJECTS.filter((s) => s.group === group).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={OTHER}>Something else (type it in)</option>
        </select>
      </Field>
      {test.subjectId === OTHER && (
        <Field label="Type your class or test">
          <input
            className="input"
            autoFocus
            placeholder="e.g. Marine Biology, IB Physics HL, or the ACT Science section"
            value={test.subject}
            onChange={(e) => update("subject", e.target.value)}
          />
          <span className="text-xs text-muted">
            Tip: paste your syllabus or study guide in the notes below so the plan matches your exact class.
          </span>
        </Field>
      )}
      {picked?.kind === "test" && (
        <p className="-mt-2 rounded-2xl bg-chick/50 px-4 py-2 text-sm">
          <Icon name="book" size={18} /> Your plan will follow the real {picked.label}: its format, timing, scoring, and question style.
        </p>
      )}
      <Field label={picked?.defaultTopic ? "What's on it? (optional)" : "What's on the test?"}>
        <input
          className="input"
          placeholder={
            picked?.defaultTopic
              ? `Leave blank for the whole test, or name a part (e.g. ${picked.kind === "test" ? "Geometry and probability" : "Unit 3"})`
              : "e.g. Cell structure and cellular respiration"
          }
          value={test.topic}
          onChange={(e) => update("topic", e.target.value)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Test date">
          <input
            type="date"
            className="input"
            min={todayString()}
            value={test.testDate}
            onChange={(e) => update("testDate", e.target.value)}
          />
        </Field>
        <Field label="Study time per day">
          <select
            className="input"
            value={test.hoursPerDay}
            onChange={(e) => update("hoursPerDay", Number(e.target.value))}
          >
            {HOURS_OPTIONS.map((hours) => (
              <option key={hours} value={hours}>
                {hours} {hours === 1 ? "hour" : "hours"}
              </option>
            ))}
          </select>
        </Field>
        <Field label={isTest ? "Current score (% of the max)" : "Current grade (%)"}>
          <input
            type="number"
            className="input"
            placeholder="78"
            value={test.currentGrade}
            onChange={(e) => update("currentGrade", e.target.value)}
          />
        </Field>
        <Field label={isTest ? "Goal score (% of the max)" : "Goal grade (%)"}>
          <input
            type="number"
            className="input"
            placeholder="90"
            value={test.goalGrade}
            onChange={(e) => update("goalGrade", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Class notes or study guide (optional)">
        <textarea
          className="input min-h-40"
          placeholder="Paste your notes. The more you paste, the more the plan matches your class."
          value={test.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>
      <div className="-mt-2 flex flex-col gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addGuides(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary px-4 py-1.5 text-sm">
            <Icon name="plus" size={18} /> Attach study guide PDFs
          </button>
          <span className="text-xs text-muted">As many as you like, any size. Big ones are read in parts.</span>
        </div>
        {guides.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-chick/40 px-3 py-2 text-sm">
            <label className="flex cursor-pointer items-center gap-2 font-semibold">
              <input
                type="checkbox"
                className="h-5 w-5 accent-[var(--chick-line)]"
                checked={selected.length === guides.length}
                onChange={(e) => setSelected(e.target.checked ? guides.map((g) => g.id) : [])}
              />
              Select all ({guides.length})
            </label>
            <button
              type="button"
              disabled={!selected.length}
              onClick={() => deleteGuides(selected)}
              className="flex items-center gap-1 rounded-xl border-2 border-red-700 bg-white px-3 py-1 font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="trash" size={16} /> Delete selected{selected.length ? ` (${selected.length})` : ""}
            </button>
          </div>
        )}
        {guides.length > 0 && (
          <ul className="flex flex-col gap-2">
            {guides.map((guide) => {
              const g = { ...guide, ...(live.guides[guide.id] ?? { status: "waiting", progress: 0, label: "Waiting its turn…" }) };
              const isSelected = selected.includes(g.id);
              return (
                <li
                  key={g.id}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2 text-sm ${isSelected ? "border-red-700 bg-red-50" : "border-line bg-white"}`}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 shrink-0 accent-[var(--chick-line)]"
                    checked={isSelected}
                    onChange={() => toggleSelected(g.id)}
                    aria-label={`Select ${g.name}`}
                  />
                  <Icon name={g.status === "error" ? "fried" : g.status === "ready" ? "done" : "book"} size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{g.name}</p>
                    {g.status === "error" ? (
                      <p className="text-xs text-red-700">{g.error}</p>
                    ) : g.status === "ready" ? (
                      <p className="text-xs text-muted">
                        {formatBytes(g.size)}
                        {g.pages ? ` · ${g.pages} ${g.pages === 1 ? "page" : "pages"}` : ""} · {g.notes ? "Read and ready" : "No study notes found in it"}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs text-muted">
                          {formatBytes(g.size)} · {g.label}
                        </p>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-chick/50">
                          <span className="block h-full bg-beak transition-all" style={{ width: `${Math.round(g.progress * 100)}%` }} />
                        </span>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => deleteGuides([g.id])} className="shrink-0 rounded-xl p-1 hover:bg-red-50" aria-label={`Delete ${g.name}`}>
                    <Icon name="trash" size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {guides.length > 0 && (
          <p className="text-xs text-muted">You don&apos;t have to wait: build your nest now and your PDFs keep being read in the background.</p>
        )}
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          {canSwap && (
            <button type="button" onClick={swapGrades} className="btn-secondary px-4 py-1.5 text-sm">
              Swap them
            </button>
          )}
        </div>
      )}

      <button type="button" onClick={buildNest} className="btn-primary self-end">
        Build my nest
      </button>
    </section>
  );
}
