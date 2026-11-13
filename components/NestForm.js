"use client";

import Icon from "@/components/Icon";
import { useRef, useState } from "react";
import { Field } from "@/components/ProfileFields";
import { useRouter } from "next/navigation";
import { addNest } from "@/lib/nests";
import { todayString } from "@/lib/dates";
import { checkGrades } from "@/lib/grades";
import { findSubject, SUBJECT_GROUPS, SUBJECTS } from "@/lib/subjects";
import { isPdf, mergeNotes, readStudyGuide } from "@/lib/studyGuide";
import { formatBytes } from "@/lib/attachmentTypes";

// More notes than this (from lots of PDFs) get combined into one shorter set before planning.
const GUIDE_MERGE_CHARS = 40_000;

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
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("");
  // Study-guide PDFs: { id, name, size, progress, label, status: "waiting" | "working" | "ready" | "error", notes, pages, error }
  const [guides, setGuides] = useState([]);
  const queue = useRef(Promise.resolve()); // PDFs are read one at a time, so the free AI isn't overloaded
  const fileInput = useRef(null);
  const reading = guides.some((g) => g.status === "waiting" || g.status === "working");

  function changeGuide(id, changes) {
    setGuides((list) => list.map((g) => (g.id === id ? { ...g, ...changes } : g)));
  }

  function addGuides(files) {
    const pdfs = [...files].filter(isPdf);
    const skipped = files.length - pdfs.length;
    setError(skipped ? `Only PDFs can be attached here, so ${skipped === 1 ? "1 file was" : `${skipped} files were`} skipped.` : "");
    const about = { subject: test.subject, topic: test.topic };
    for (const file of pdfs) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setGuides((list) => [...list, { id, name: file.name, size: file.size, progress: 0, label: "Waiting its turn…", status: "waiting" }]);
      queue.current = queue.current.then(async () => {
        changeGuide(id, { status: "working", label: "Opening the PDF…" });
        try {
          const { notes, pages } = await readStudyGuide(file, about, (progress, label) => changeGuide(id, { progress, label }));
          changeGuide(id, { status: "ready", progress: 1, notes, pages, label: "Read" });
        } catch (err) {
          changeGuide(id, { status: "error", error: err.message || "Couldn't read this PDF." });
        }
      });
    }
  }

  function removeGuide(id) {
    setGuides((list) => list.filter((g) => g.id !== id));
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

  async function buildNest() {
    const check = validate(test);
    if (check.error) {
      setError(check.error);
      setCanSwap(Boolean(check.canSwap));
      return;
    }

    if (reading) {
      setError("Hang on, the AI is still reading your PDFs. The button will work once they're done.");
      return;
    }

    setLoading(true);
    const ready = guides.filter((g) => g.status === "ready" && g.notes);
    const finalTest = {
      ...test,
      // Tests like the SAT can be studied as a whole, so "what's on it" can be left blank.
      topic: test.topic.trim() || findSubject(test.subjectId)?.defaultTopic || test.topic,
      currentGrade: Number(test.currentGrade),
      goalGrade: Number(test.goalGrade),
      guideFiles: ready.map((g) => ({ name: g.name, pages: g.pages ?? null })),
    };

    try {
      // Notes from the PDFs are kept with the nest (the PDFs themselves aren't stored).
      let guide = ready.map((g) => (ready.length > 1 ? `From "${g.name}":\n${g.notes}` : g.notes)).join("\n\n");
      if (guide.length > GUIDE_MERGE_CHARS && ready.length > 1) {
        setLoadingLabel("Combining the notes from your PDFs…");
        guide = await mergeNotes(ready.map((g) => `From "${g.name}":\n${g.notes}`), { subject: finalTest.subject, topic: finalTest.topic });
      }
      finalTest.guide = guide;
      setLoadingLabel("");

      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner, test: finalTest, today: todayString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // The research about the subject is kept with the test, so every lesson, exam, and tutor
      // answer for this nest can use it. Saved as a new nest next to any others, then opened.
      const { research, ...plan } = data;
      const researchedTest = { ...finalTest, brief: research?.brief ?? "", sources: research?.sources ?? [], basis: research?.basis ?? [] };
      const id = addNest(researchedTest, plan);
      router.push(`/nest/${id}`);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
      setLoadingLabel("");
    }
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
          <ul className="flex flex-col gap-2">
            {guides.map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-white px-3 py-2 text-sm">
                <Icon name={g.status === "error" ? "fried" : g.status === "ready" ? "done" : "book"} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.name}</p>
                  {g.status === "error" ? (
                    <p className="text-xs text-red-700">{g.error}</p>
                  ) : g.status === "ready" ? (
                    <p className="text-xs text-muted">
                      {formatBytes(g.size)}
                      {g.pages ? ` · ${g.pages} ${g.pages === 1 ? "page" : "pages"}` : ""} · {g.notes ? "Read and added to your plan" : "No study notes found in it"}
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
                {g.status !== "working" && (
                  <button type="button" onClick={() => removeGuide(g.id)} className="shrink-0 rounded-xl p-1 hover:bg-red-50" aria-label={`Remove ${g.name}`}>
                    <Icon name="close" size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>
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

      <button type="button" onClick={buildNest} disabled={loading || reading} className="btn-primary self-end">
        {reading ? "Reading your PDFs…" : loadingLabel ? loadingLabel : loading ? `Researching ${test.subject || "your subject"} and building your nest…` : "Build my nest"}
      </button>
    </section>
  );
}
