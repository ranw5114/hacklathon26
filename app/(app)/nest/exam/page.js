"use client";

import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import Quiz from "@/components/Quiz";
import { remove, save, useStored } from "@/lib/storage";
import {
  allSections,
  currentSectionId,
  POINTS_PER_CORRECT,
  predictedGrade,
  quizAverage,
} from "@/lib/progress";

// The mock exam: a practice test on everything, ending with a predicted grade.
export default function ExamPage() {
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");
  const exam = useStored("exam"); // saved questions, so a refresh doesn't make a new exam
  const points = useStored("points");

  const [stage, setStage] = useState("intro"); // "intro" → "exam" → "results"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (plan === undefined || exam === undefined) return null;

  const unlocked = plan && (currentSectionId(plan) === null || plan.demo);
  if (!unlocked) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="bubble">Finish every level to unlock the mock exam!</span>
        <Chick variant={profile.avatar} size={110} />
        <Link href="/nest" className="btn-primary">
          Back to nest
        </Link>
      </main>
    );
  }

  async function startExam() {
    if (exam) return setStage("exam");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test, sections: allSections(plan) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save("exam", data.questions);
      setStage("exam");
    } catch (err) {
      setError(err.message || "Couldn't make the exam. Please try again.");
    }
    setLoading(false);
  }

  // `counted` leaves out any questions the student flagged as wrong.
  function finishExam(correct, counted) {
    const score = correct / counted;
    const predicted = predictedGrade(score, quizAverage(plan));
    const firstTry = !plan.mockExam.completed;

    save("plan", { ...plan, mockExam: { ...plan.mockExam, completed: true, score, predicted } });
    if (firstTry) save("points", (points ?? 0) + correct * POINTS_PER_CORRECT);
    setStage("results");
  }

  // A retake uses brand-new questions.
  function retake() {
    remove("exam");
    setStage("intro");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href="/nest" className="text-sm font-semibold text-muted hover:underline">
        ← Back to nest
      </Link>
      <p className="label-small mt-4">
        {test.subject} · {test.topic}
      </p>
      <h1 className="text-4xl">Mock exam 🏆</h1>

      <div className="mt-6">
        {stage === "intro" && (
          <div className="card flex flex-col items-center gap-4 py-10 text-center">
            <Chick variant={profile.avatar} size={100} className={loading ? "animate-bounce" : ""} />
            <span className="bubble">
              {loading ? "Writing your exam…" : "This one counts! Like the real test."}
            </span>
            <p className="max-w-md text-muted">
              10 questions covering every level, with extra focus on the ones you found tricky. You&apos;ll
              get a predicted grade at the end.
            </p>
            {error && <p className="text-red-700">{error}</p>}
            <button type="button" onClick={startExam} disabled={loading} className="btn-primary">
              {exam ? "Start exam" : loading ? "Preparing…" : "Start exam"}
            </button>
          </div>
        )}

        {stage === "exam" && exam && <Quiz questions={exam} onFinish={finishExam} topic="Mock exam" />}

        {stage === "results" && <ExamResults plan={plan} test={test} avatar={profile.avatar} onRetake={retake} />}
      </div>
    </main>
  );
}

function ExamResults({ plan, test, avatar, onRetake }) {
  const { predicted, score } = plan.mockExam;
  const gap = test.goalGrade - predicted;
  // Levels scored under 80% are the ones worth reviewing.
  const weakSpots = allSections(plan).filter((s) => s.score < 0.8);

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col items-center gap-2 py-10 text-center">
        <Chick variant={avatar} size={90} />
        <p className="label-small mt-2">Predicted grade</p>
        <p className="font-display text-7xl font-semibold">{predicted}%</p>
        <p className="text-muted">
          Mock exam: {Math.round(score * 100)}% · Goal: {test.goalGrade}%
        </p>
        <span className="bubble mt-4">
          {gap <= 0 ? "You're on track to hit your goal! 🎉" : `${gap} points from your goal. You can do it!`}
        </span>
      </div>

      {weakSpots.length > 0 && (
        <div className="card">
          <h2 className="text-xl">Review these levels</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {weakSpots.map((s) => (
              <li key={s.id}>
                <Link href={`/nest/${s.id}`} className="font-semibold underline">
                  {s.title}
                </Link>{" "}
                <span className="text-sm text-muted">({Math.round(s.score * 100)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-sm text-muted">
        How it&apos;s calculated: 70% from this mock exam + 30% from your level quizzes.
      </p>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onRetake} className="btn-secondary">
          Retake with new questions
        </button>
        <Link href="/nest" className="btn-primary">
          Back to nest
        </Link>
      </div>
    </div>
  );
}
