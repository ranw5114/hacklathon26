"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon from "@/components/Icon";
import Chick from "@/components/Chick";
import MissingNest from "@/components/MissingNest";
import { updateNest, useNest } from "@/lib/nests";
import { useAvatar } from "@/lib/avatar";
import { allSections } from "@/lib/progress";
import { addSection, deleteSection } from "@/lib/planEdit";
import { formatDate, todayString } from "@/lib/dates";
import {
  DEFAULT_FORMAT,
  examBatches,
  examScore,
  formatSummary,
  gradeLocally,
  MAX_QUESTIONS,
  QUESTION_TYPES,
  conceptStats,
  totalQuestions,
} from "@/lib/mockExam";

// Practice mock exams: as many as you like, in your real test's format, never repeating a question.
export default function MockExamPage() {
  const { nestId } = useParams();
  const nest = useNest(nestId);
  if (nest === undefined) return null;
  if (!nest) return <MissingNest />;
  return <MockExams key={nestId} nest={nest} />;
}

function MockExams({ nest }) {
  const avatar = useAvatar();
  const [editingFormat, setEditingFormat] = useState(!nest.examFormat);
  const [writing, setWriting] = useState(null); // { done, total } while the AI writes an exam
  const [error, setError] = useState("");
  const [showResult, setShowResult] = useState(null); // id of a finished exam to review
  const partial = useRef([]); // questions written so far, so "Try again" picks up where it stopped
  const history = nest.mockExams ?? [];
  const format = nest.examFormat ?? DEFAULT_FORMAT;

  async function writeExam() {
    setError("");
    const batches = examBatches(format);
    const total = totalQuestions(format);
    setWriting({ done: 0, total });
    const previous = history.flatMap((e) => e.questions.map((q) => q.question));
    const questions = partial.current;
    setWriting({ done: questions.length, total });
    try {
      for (const batch of batches) {
        // Skip what was already written before a hiccup.
        const have = questions.filter((q) => q.type === batch.type).length;
        const wanted = batches.filter((b) => b.type === batch.type).slice(0, batches.filter((b) => b.type === batch.type).indexOf(batch) + 1).reduce((n, b) => n + b.count, 0);
        const count = Math.min(batch.count, wanted - have);
        if (count <= 0) continue;
        const data = await askWithRetries({
          mode: "questions",
          test: nest.test,
          format,
          type: batch.type,
          count,
          topics: allSections(nest.plan).map((s) => s.title),
          previous: [...previous, ...questions.map((q) => q.question)],
        });
        questions.push(...data.questions);
        setWriting({ done: questions.length, total });
      }
      // Same order as a real test: multiple choice, true/false, short answer, then written.
      const order = Object.keys(QUESTION_TYPES);
      questions.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
      partial.current = [];
      const id = `m${Date.now().toString(36)}`;
      const seconds = Number(format.minutes) > 0 ? Number(format.minutes) * 60 : null;
      updateNest(nest.id, (n) => ({ ...n, mockInProgress: { id, questions, answers: {}, secondsLeft: seconds, startedAt: Date.now() } }));
    } catch (err) {
      setError(`${err.message || "Couldn't write the exam."} ${questions.length ? `(${questions.length} questions are already written; trying again picks up from there.)` : "Please try again."}`);
    }
    setWriting(null);
  }

  const result = showResult && history.find((e) => e.id === showResult);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href={`/nest/${nest.id}`} className="text-sm font-semibold text-muted hover:underline">
        ← Back to nest
      </Link>
      <p className="label-small mt-4">
        {nest.test.subject} · {nest.test.topic}
      </p>
      <h1 className="flex items-center gap-2 text-4xl">
        Mock exams <Icon name="trophy" size={36} />
      </h1>

      <div className="mt-6">
        {nest.mockInProgress ? (
          <TakeExam nest={nest} onFinished={(id) => setShowResult(id)} />
        ) : result ? (
          <ExamResults exam={result} nest={nest} number={history.indexOf(result) + 1} onAnother={() => setShowResult(null)} />
        ) : editingFormat ? (
          <FormatForm nest={nest} onSaved={() => setEditingFormat(false)} onCancel={nest.examFormat ? () => setEditingFormat(false) : null} />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="card flex flex-col items-center gap-3 py-8 text-center">
              <Chick variant={avatar} size={90} className={writing ? "animate-bounce" : ""} />
              <span className="bubble">
                {writing ? `Writing your exam… ${writing.done} of ${writing.total} questions` : `Ready for mock exam #${history.length + 1}?`}
              </span>
              {writing && (
                <span className="block h-2 w-full max-w-sm overflow-hidden rounded-full bg-chick/50">
                  <span className="block h-full bg-beak transition-all" style={{ width: `${Math.round((writing.done / writing.total) * 100)}%` }} />
                </span>
              )}
              <p className="font-display font-semibold">{formatSummary(format)}</p>
              {format.notes && <p className="max-w-md text-sm text-muted">&ldquo;{format.notes}&rdquo;</p>}
              <p className="max-w-md text-sm text-muted">
                Every exam has brand-new questions, never repeats or rewordings of ones you&apos;ve seen.
              </p>
              {error && <p className="text-red-700">{error}</p>}
              <div className="flex flex-wrap justify-center gap-3">
                <button type="button" onClick={writeExam} disabled={Boolean(writing)} className="btn-primary">
                  {writing ? "Writing…" : error ? "Try again" : history.length ? "Take another mock exam" : "Start my mock exam"}
                </button>
                <button type="button" onClick={() => setEditingFormat(true)} disabled={Boolean(writing)} className="btn-secondary">
                  Change format
                </button>
              </div>
            </div>
            {history.length > 0 && <History history={history} goal={nest.test.goalGrade} onOpen={setShowResult} />}
          </div>
        )}
      </div>
    </main>
  );
}

// The AI is sometimes busy or slow; each batch gets a few tries before giving up.
async function askWithRetries(body, tries = 3) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("/api/mock-exam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    if (attempt >= tries || res.status === 400) throw new Error(data.error || "Couldn't write the exam.");
    await new Promise((r) => setTimeout(r, attempt * 2500));
  }
}

// ---- The test's format (asked before the first exam) ---------------------------------------

function FormatForm({ nest, onSaved, onCancel }) {
  const [format, setFormat] = useState({ ...DEFAULT_FORMAT, ...(nest.examFormat ?? {}) });
  const [guessing, setGuessing] = useState(false);
  const [error, setError] = useState("");
  const total = totalQuestions(format);
  const set = (field, value) => {
    setFormat((f) => ({ ...f, [field]: value }));
    setError("");
  };

  async function guess() {
    setGuessing(true);
    setError("");
    try {
      const res = await fetch("/api/mock-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "format", test: nest.test }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormat((f) => ({ ...f, ...data.format }));
    } catch (err) {
      setError(err.message || "Couldn't guess the format. Fill it in yourself!");
    }
    setGuessing(false);
  }

  function save() {
    if (total < 1) return setError("Add at least one question.");
    if (total > MAX_QUESTIONS) return setError(`Keep it to ${MAX_QUESTIONS} questions or fewer (try one section of the test).`);
    const clean = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
    updateNest(nest.id, (n) => ({
      ...n,
      examFormat: {
        mc: clean(format.mc, MAX_QUESTIONS),
        tf: clean(format.tf, MAX_QUESTIONS),
        short: clean(format.short, MAX_QUESTIONS),
        written: clean(format.written, 10),
        mcChoices: Number(format.mcChoices) === 5 ? 5 : 4,
        minutes: clean(format.minutes, 300) || "",
        notes: format.notes.trim().slice(0, 500),
      },
    }));
    onSaved();
  }

  return (
    <section className="card flex flex-col gap-4">
      <div>
        <h2 className="text-2xl">What&apos;s your real test like?</h2>
        <p className="mt-1 text-sm text-muted">Your mock exams will match it: the same kinds of questions, how many, and the time limit.</p>
      </div>
      <button type="button" onClick={guess} disabled={guessing} className="btn-secondary self-start px-4 py-1.5 text-sm">
        <Icon name="sparkle" size={16} /> {guessing ? "Guessing…" : `Not sure? Guess the ${nest.test.subject} format for me`}
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(QUESTION_TYPES).map(([type, info]) => (
          <label key={type} className="flex items-center justify-between gap-3 rounded-2xl border-2 border-line/30 bg-white p-3">
            <span>
              <span className="block font-semibold">{info.label}</span>
              {info.hint && <span className="block text-xs text-muted">{info.hint}</span>}
            </span>
            <input type="number" min={0} max={MAX_QUESTIONS} className="input w-20 py-1.5 text-center" value={format[type]} onChange={(e) => set(type, e.target.value)} aria-label={`How many ${info.short} questions`} />
          </label>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Number(format.mc) > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Choices per multiple-choice question</span>
            <select className="input" value={format.mcChoices} onChange={(e) => set("mcChoices", Number(e.target.value))}>
              <option value={4}>4 (A-D)</option>
              <option value={5}>5 (A-E)</option>
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Time limit in minutes (optional)</span>
          <input type="number" min={0} max={300} className="input" placeholder="Untimed" value={format.minutes} onChange={(e) => set("minutes", e.target.value)} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Anything else about the test? (optional)</span>
        <textarea
          className="input min-h-20 text-sm"
          maxLength={500}
          placeholder="e.g. No calculator. Mostly word problems. The teacher always asks one question about lab safety."
          value={format.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </label>

      <p className="text-sm font-semibold">
        {total} question{total === 1 ? "" : "s"} · {Number(format.minutes) > 0 ? `${format.minutes} minutes` : "untimed"}
      </p>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
        <button type="button" onClick={save} className="btn-primary">
          Save format
        </button>
      </div>
    </section>
  );
}

// ---- Taking the exam ---------------------------------------------------------------------

const LETTERS = "ABCDE";

function TakeExam({ nest, onFinished }) {
  const exam = nest.mockInProgress;
  const [answers, setAnswers] = useState(exam.answers ?? {});
  const [secondsLeft, setSecondsLeft] = useState(exam.secondsLeft);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const latest = useRef({ answers, secondsLeft });
  const submitRef = useRef(null);

  // Answers and the clock are saved as you go, so leaving (or closing the tab) loses nothing.
  useEffect(() => {
    latest.current = { answers, secondsLeft };
  }, [answers, secondsLeft]);
  useEffect(() => {
    const save = () =>
      updateNest(nest.id, (n) => (n.mockInProgress ? { ...n, mockInProgress: { ...n.mockInProgress, ...latest.current } } : n));
    const timer = setInterval(save, 3000);
    window.addEventListener("pagehide", save);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pagehide", save);
      save();
    };
  }, [nest.id]);

  // The countdown (it pauses while you're away from the exam).
  const timed = exam.secondsLeft != null;
  useEffect(() => {
    if (!timed) return;
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick);
          setTimeout(() => submitRef.current?.(true), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [timed]);

  const answered = exam.questions.filter((q, i) => answers[i] !== undefined && String(answers[i]).trim() !== "").length;

  async function submit(timeUp = false) {
    if (!timeUp && answered < exam.questions.length && !confirming) return setConfirming(true);
    setConfirming(false);
    setGrading(true);
    setError("");
    try {
      const results = exam.questions.map((q, i) => ({ ...gradeLocally(q, answers[i]), feedback: "" }));
      const toAI = results.map((r, i) => (r.needsAI ? i : -1)).filter((i) => i >= 0);
      if (toAI.length) {
        const res = await fetch("/api/mock-grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: nest.test, items: toAI.map((i) => ({ ...exam.questions[i], response: answers[i] })) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toAI.forEach((qi, k) => Object.assign(results[qi], data.results[k] ?? {}, { needsAI: false }));
      }
      const finished = { id: exam.id, at: Date.now(), questions: exam.questions, answers, results, score: examScore(results), timeUp };
      updateNest(nest.id, (n) => {
        const { mockInProgress: _done, ...rest } = n;
        return { ...rest, mockExams: [...(n.mockExams ?? []), finished] };
      });
      onFinished(exam.id);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err.message || "Couldn't grade your exam. Your answers are saved, so try again.");
      setGrading(false);
    }
  }
  useEffect(() => {
    submitRef.current = submit;
  });

  const setAnswer = (i, value) => setAnswers((a) => ({ ...a, [i]: value }));
  const clock = secondsLeft == null ? null : `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-[3px] border-line bg-chick px-4 py-2 font-display font-semibold shadow-[0_3px_0_var(--chick-line)]">
        <span>
          {answered} of {exam.questions.length} answered
        </span>
        {clock && (
          <span className={`flex items-center gap-1.5 ${secondsLeft < 60 ? "text-red-700" : ""}`}>
            <Icon name="clock" size={18} /> {clock} left
          </span>
        )}
      </div>
      {clock && <p className="text-xs text-muted">The clock pauses if you leave this page, and your answers are saved.</p>}

      {exam.questions.map((q, i) => (
        <section key={i} className="card">
          <p className="label-small">
            Question {i + 1} · {QUESTION_TYPES[q.type]?.label}
          </p>
          <p className="mt-1 text-lg font-semibold whitespace-pre-line">{q.question}</p>
          {q.choices ? (
            <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
              {q.choices.map((choice, c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={answers[i] === c}
                  onClick={() => setAnswer(i, c)}
                  className={`flex items-start gap-3 rounded-2xl border-[3px] border-line p-3 text-left transition ${answers[i] === c ? "bg-chick shadow-[0_3px_0_var(--chick-line)]" : "bg-white hover:bg-chick/40"}`}
                >
                  {q.type === "mc" && <span className="font-display font-semibold">{LETTERS[c]}.</span>}
                  <span>{choice}</span>
                </button>
              ))}
            </div>
          ) : q.type === "short" ? (
            <input className="input mt-3" placeholder="Your answer" value={answers[i] ?? ""} onChange={(e) => setAnswer(i, e.target.value)} aria-label={`Answer to question ${i + 1}`} />
          ) : (
            <textarea className="input mt-3 min-h-32" placeholder="Write your answer. Show your work or explain your thinking." value={answers[i] ?? ""} onChange={(e) => setAnswer(i, e.target.value)} aria-label={`Answer to question ${i + 1}`} />
          )}
        </section>
      ))}

      {confirming && (
        <div className="card flex flex-wrap items-center gap-3 border-red-700 bg-red-50">
          <p className="flex-1 font-semibold text-red-800">
            {exam.questions.length - answered} question{exam.questions.length - answered === 1 ? " is" : "s are"} still blank. Submit anyway?
          </p>
          <button type="button" onClick={() => setConfirming(false)} className="btn-secondary px-4 py-1.5 text-sm">
            Keep going
          </button>
          <button type="button" onClick={() => submit()} className="btn-primary px-4 py-1.5 text-sm">
            Submit anyway
          </button>
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="button" onClick={() => submit()} disabled={grading} className="btn-primary self-end">
        {grading ? "Grading…" : "Submit exam"}
      </button>
    </div>
  );
}

// ---- Results -----------------------------------------------------------------------------

function ExamResults({ exam, nest, number, onAnother }) {
  const percent = Math.round(exam.score * 100);
  const goal = nest.test.goalGrade;
  const missed = exam.results.filter((r) => r.score < 1).length;
  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col items-center gap-2 py-8 text-center">
        <Chick variant="sunny" mood={percent >= goal ? "love" : percent >= goal - 15 ? "happy" : "sad"} size={90} />
        <p className="label-small mt-2">Mock exam #{number}</p>
        <p className="font-display text-7xl font-semibold">{percent}%</p>
        <p className="text-muted">Goal: {goal}%{exam.timeUp ? " · Time ran out" : ""}</p>
        <span className="bubble mt-3">
          {percent >= goal ? "You'd crush the real thing! Keep it up!" : `${goal - percent} points from your goal. Another round?`}
        </span>
        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onAnother} className="btn-primary">
            Take another mock exam
          </button>
          <Link href={`/nest/${nest.id}`} className="btn-secondary">
            Back to nest
          </Link>
        </div>
      </div>

      <TuneNest nest={nest} exam={exam} />

      <h2 className="text-2xl">{missed ? `Review (${missed} to look at)` : "Review: all correct!"}</h2>
      {exam.questions.map((q, i) => {
        const r = exam.results[i];
        const answer = exam.answers[i];
        const mark = r.score >= 1 ? "right" : r.score > 0 ? "partly" : "wrong";
        return (
          <section key={i} className={`card ${mark === "right" ? "" : mark === "partly" ? "border-beak" : "border-red-700 bg-red-50/50"}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="label-small">
                Question {i + 1} · {QUESTION_TYPES[q.type]?.label}
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${mark === "right" ? "bg-green-100 text-green-800" : mark === "partly" ? "bg-chick" : "bg-red-100 text-red-800"}`}>
                {mark === "right" ? "Correct" : mark === "partly" ? `${Math.round(r.score * 100)}% credit` : "Not quite"}
              </span>
            </div>
            <p className="mt-1 font-semibold whitespace-pre-line">{q.question}</p>
            {q.choices ? (
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {q.choices.map((c, k) => (
                  <li
                    key={k}
                    className={`rounded-xl px-3 py-1.5 ${k === q.answerIndex ? "bg-green-100 font-semibold" : k === answer ? "bg-red-100" : "bg-white"}`}
                  >
                    {q.type === "mc" && `${LETTERS[k]}. `}
                    {c}
                    {k === q.answerIndex ? " ✓" : k === answer ? " (your answer)" : ""}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <p>
                  <span className="font-semibold">Your answer:</span> {String(answer ?? "").trim() || <em className="text-muted">(blank)</em>}
                </p>
                {q.type === "short" && (
                  <p>
                    <span className="font-semibold">Answer:</span> {q.answers?.[0]}
                  </p>
                )}
              </div>
            )}
            {r.feedback && <p className="mt-2 rounded-xl bg-chick/40 p-2 text-sm">{r.feedback}</p>}
            {q.explanation && <p className="mt-2 text-sm text-muted">{q.explanation}</p>}
          </section>
        );
      })}
    </div>
  );
}

// After a mock exam: how you did on each concept, and changes to the nest to match: new eggs for
// what you're missing, and unstarted eggs on what you've mastered (so the nest can get shorter).
function TuneNest({ nest, exam }) {
  const stats = conceptStats(nest.mockExams);
  const goal = nest.test.goalGrade;
  const latest = nest.mockExams?.at(-1)?.id === exam.id;
  // Suggestions load by themselves for the newest exam (nothing changes until "Update my nest").
  const [state, setState] = useState(exam.tuned ? "applied" : latest && stats.length ? "loading" : "idle"); // idle | loading | ready | applied | error
  const [plan, setPlan] = useState(null); // { summary, add: [...with pick, date], remove: [...with pick] }
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState(exam.tuned ?? null);
  const today = todayString();
  const days = nest.plan.days.filter((d) => d.date >= today).map((d) => d.date);
  const dayChoices = days.length ? days : [nest.plan.days.at(-1).date];
  const sections = allSections(nest.plan);
  const asked = useRef(false);

  async function fetchSuggestions() {
    try {
      const res = await fetch("/api/plan-tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test: { subject: nest.test.subject, topic: nest.test.topic, goalGrade: goal },
          goal,
          sections: sections.map((sec) => ({ id: sec.id, title: sec.title, goal: sec.goal, completed: sec.completed, score: sec.score })),
          stats,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPlan({
        summary: data.summary,
        // Weakest first, so those land on the earliest days.
        add: data.add.map((a, i) => ({ ...a, pick: true, date: dayChoices[i % dayChoices.length] })),
        remove: data.remove.map((rm) => ({ ...rm, pick: true, title: sections.find((sec) => sec.id === rm.id)?.title ?? "A lesson" })),
      });
      setState("ready");
    } catch (err) {
      setError(err.message || "Couldn't get suggestions. Please try again.");
      setState("error");
    }
  }

  function suggest() {
    setState("loading");
    setError("");
    fetchSuggestions();
  }

  useEffect(() => {
    if (state !== "loading" || asked.current) return;
    asked.current = true;
    fetchSuggestions();
  });

  function apply() {
    const adds = plan.add.filter((a) => a.pick);
    const removes = plan.remove.filter((rm) => rm.pick);
    let result = null;
    updateNest(nest.id, (n) => {
      // New eggs go in first, so removing others can't empty (and drop) the day they're going to.
      let next = adds.reduce((acc, a) => addSection(acc, a.date, { title: a.title, goal: a.goal }), n);
      next = removes.reduce((acc, rm) => deleteSection(acc, rm.id), next);
      const count = (x) => allSections(x.plan).length;
      const added = count(next) - count(n) + removes.filter((rm) => !allSections(next.plan).some((sec) => sec.id === rm.id)).length;
      result = { added, removed: count(n) + added - count(next), before: count(n), after: count(next) };
      // Remember it on this exam, so it isn't suggested twice.
      return { ...next, mockExams: (next.mockExams ?? []).map((e) => (e.id === exam.id ? { ...e, tuned: result } : e)) };
    });
    setOutcome(result);
    setState("applied");
  }

  const toggle = (list, i) => setPlan((p) => ({ ...p, [list]: p[list].map((x, j) => (j === i ? { ...x, pick: !x.pick } : x)) }));
  const picked = plan ? plan.add.filter((a) => a.pick).length + plan.remove.filter((rm) => rm.pick).length : 0;

  return (
    <section className="card flex flex-col gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl">
          <Icon name="nest" size={26} /> Tune your nest
        </h2>
        <p className="text-sm text-muted">From your {Math.min(3, nest.mockExams?.length ?? 1)} latest mock exam{(nest.mockExams?.length ?? 1) === 1 ? "" : "s"}: more practice where you need it, less where you don&apos;t.</p>
      </div>

      {stats.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {stats.slice(0, 10).map((st) => (
            <li key={st.concept} className="grid grid-cols-[minmax(0,1fr)_7rem_3rem] items-center gap-2 text-sm">
              <span className="truncate">{st.concept}</span>
              <span className="h-3 overflow-hidden rounded-full border-2 border-line bg-white">
                <span className={`block h-full ${st.percent >= goal ? "bg-[oklch(0.76_0.15_145)]" : st.percent >= 60 ? "bg-beak" : "bg-red-400"}`} style={{ width: `${st.percent}%` }} />
              </span>
              <span className="text-right font-semibold tabular-nums">{st.percent}%</span>
            </li>
          ))}
        </ul>
      )}

      {state === "applied" && outcome ? (
        <p className="rounded-2xl bg-green-50 p-3 text-sm font-semibold text-green-800">
          Your nest is updated: {outcome.added} egg{outcome.added === 1 ? "" : "s"} added, {outcome.removed} removed ({outcome.before} → {outcome.after} eggs).{" "}
          <Link href={`/nest/${nest.id}`} className="underline">
            See your nest
          </Link>
        </p>
      ) : !latest ? (
        <p className="text-sm text-muted">Tune your nest from your latest mock exam.</p>
      ) : state === "ready" ? (
        <div className="flex flex-col gap-3">
          {plan.summary && <p className="bubble self-start text-sm">{plan.summary}</p>}
          {plan.add.length + plan.remove.length === 0 && <p className="text-sm font-semibold">Your nest already fits you. No changes needed!</p>}
          {plan.add.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-display font-semibold">Add these eggs</p>
              {plan.add.map((a, i) => (
                <div key={i} className={`flex flex-wrap items-start gap-3 rounded-xl border-2 border-line/20 bg-white p-2 ${a.pick ? "" : "opacity-50"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--chick-line)]" checked={a.pick} onChange={() => toggle("add", i)} aria-label={`Add ${a.title}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-muted">{a.reason}</p>
                  </div>
                  <select
                    className="input w-auto py-1 text-sm"
                    value={a.date}
                    aria-label={`Day for ${a.title}`}
                    onChange={(e) => setPlan((p) => ({ ...p, add: p.add.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)) }))}
                  >
                    {dayChoices.map((d) => (
                      <option key={d} value={d}>
                        {formatDate(d)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          {plan.remove.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="font-display font-semibold">Skip these (you&apos;ve got them down)</p>
              {plan.remove.map((rm, i) => (
                <label key={rm.id} className={`flex items-start gap-3 rounded-xl border-2 border-line/20 bg-white p-2 ${rm.pick ? "" : "opacity-50"}`}>
                  <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--chick-line)]" checked={rm.pick} onChange={() => toggle("remove", i)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold line-through decoration-2">{rm.title}</span>
                    <span className="block text-xs text-muted">{rm.reason}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {plan.add.length + plan.remove.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setState("idle")} className="btn-secondary px-4 py-1.5 text-sm">
                Not now
              </button>
              <button type="button" onClick={apply} disabled={!picked} className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50">
                Update my nest ({sections.length} → {sections.length + plan.add.filter((a) => a.pick).length - plan.remove.filter((rm) => rm.pick).length} eggs)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={suggest} disabled={state === "loading"} className="btn-primary">
            {state === "loading" ? "Looking at your results…" : "Tune my nest from my results"}
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      )}
    </section>
  );
}

function History({ history, goal, onOpen }) {
  const best = Math.max(...history.map((e) => Math.round(e.score * 100)));
  return (
    <section className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl">Your mock exams</h2>
        <span className="text-sm font-semibold text-muted">
          {history.length} taken · best {best}%
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {[...history].reverse().map((e, k) => {
          const n = history.length - k;
          const p = Math.round(e.score * 100);
          return (
            <li key={e.id}>
              <button type="button" onClick={() => onOpen(e.id)} className="flex w-full items-center gap-3 rounded-2xl border-2 border-line/30 bg-white px-3 py-2 text-left hover:bg-chick/40">
                <Icon name="trophy" size={20} />
                <span className="flex-1 font-semibold">Mock exam #{n}</span>
                <span className="text-sm text-muted">{new Date(e.at).toLocaleDateString()}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${p >= goal ? "bg-green-100 text-green-800" : "bg-chick"}`}>{p}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
