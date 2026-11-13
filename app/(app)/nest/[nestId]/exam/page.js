"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import Quiz from "@/components/Quiz";
import { chicksForExam, hatchChicks } from "@/lib/flock";
import { useParams } from "next/navigation";
import MissingNest from "@/components/MissingNest";
import { updateNest, useNest } from "@/lib/nests";
import { update, useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { allSections, currentSectionId, goalFraction, predictedGrade, quizAverage } from "@/lib/progress";

// The mock exam: a practice test on everything, ending with a predicted grade.
export default function ExamPage() {
  const { nestId } = useParams();
  const nest = useNest(nestId);
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const test = nest?.test;
  const plan = nest?.plan;
  const exam = nest?.exam; // saved questions, so a refresh doesn't make a new exam
  const [earned, setEarned] = useState(0); // chicks hatched by this attempt (first try only)

  const [stage, setStage] = useState("intro"); // "intro" → "exam" → "results"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (nest === undefined) return null;
  if (!nest) return <MissingNest />;

  const unlocked = plan && (currentSectionId(plan, goalFraction(test)) === null || plan.demo);
  if (!unlocked) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="bubble">Pass every level to unlock the mock exam!</span>
        <Chick variant={avatar} size={110} />
        <Link href={`/nest/${nestId}`} className="btn-primary">
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
      updateNest(nestId, (n) => ({ ...n, exam: data.questions }));
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

    updateNest(nestId, (n) => ({ ...n, plan: { ...n.plan, mockExam: { ...n.plan.mockExam, completed: true, score, predicted } } }));
    const chicks = firstTry ? chicksForExam(score) : 0;
    if (chicks) update("flock", (f) => hatchChicks(f, chicks, "exam"));
    setEarned(chicks);
    setStage("results");
  }

  // A retake uses brand-new questions.
  function retake() {
    updateNest(nestId, (n) => ({ ...n, exam: null }));
    setStage("intro");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href={`/nest/${nestId}`} className="text-sm font-semibold text-muted hover:underline">
        ← Back to nest
      </Link>
      <p className="label-small mt-4">
        {test.subject} · {test.topic}
      </p>
      <h1 className="flex items-center gap-2 text-4xl">Mock exam <Icon name="trophy" size={36} /></h1>

      <div className="mt-6">
        {stage === "intro" && (
          <div className="card flex flex-col items-center gap-4 py-10 text-center">
            <Chick variant={avatar} size={100} className={loading ? "animate-bounce" : ""} />
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

        {stage === "results" && <ExamResults nestId={nestId} plan={plan} test={test} avatar={avatar} earned={earned} onRetake={retake} />}
      </div>
    </main>
  );
}

function ExamResults({ nestId, plan, test, avatar, earned, onRetake }) {
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
        {earned > 0 && (
          <p className="font-display font-semibold">
            <Icon name="chick" size={18} /> +{earned} chick{earned === 1 ? "" : "s"} hatched!
          </p>
        )}
        <span className="bubble mt-4">
          {gap <= 0 ? <>You&apos;re on track to hit your goal! <Icon name="party" size={18} /></> : `${gap} points from your goal. You can do it!`}
        </span>
      </div>

      {weakSpots.length > 0 && (
        <div className="card">
          <h2 className="text-xl">Review these levels</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {weakSpots.map((s) => (
              <li key={s.id}>
                <Link href={`/nest/${nestId}/${s.id}`} className="font-semibold underline">
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
        <Link href={`/nest/${nestId}`} className="btn-primary">
          Back to nest
        </Link>
      </div>
    </div>
  );
}
