"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Chick from "@/components/Chick";
import Lesson from "@/components/Lesson";
import Quiz from "@/components/Quiz";
import { chicksForQuiz, hatchChicks } from "@/lib/flock";
import { save, update, useStored } from "@/lib/storage";
import { completeSection, cookLevel, findSection, isUnlocked } from "@/lib/progress";

// One level: read the lesson, take the quiz, see how "cooked" you are.
export default function LevelPage() {
  const { id } = useParams(); // the [id] part of the URL, e.g. "d1-s2"
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");
  const levels = useStored("levels");

  const [stage, setStage] = useState("lesson"); // "lesson" → "quiz" → "results"
  const [result, setResult] = useState(null); // { correct, total, earned }
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to re-run the loading effect
  const [quizRound, setQuizRound] = useState(0); // bumped to restart the quiz from question 1
  const requested = useRef(false); // so we only ask the AI once

  const section = plan ? findSection(plan, id) : null;
  const level = levels?.[id]; // saved lesson + quiz, if we've generated it before
  const canPlay = plan && section && isUnlocked(plan, id);

  // Generate the lesson + quiz the first time this level is opened, then save it.
  useEffect(() => {
    if (!canPlay || level || levels === undefined || requested.current) return;
    requested.current = true;

    fetch("/api/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learner: profile, test, section }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        save("levels", { ...levels, [id]: data }); // saving re-renders the page with the lesson
      })
      .catch((err) => {
        setError(err.message || "Couldn't load this level.");
        requested.current = false; // allow "Try again"
      });
  }, [canPlay, level, levels, profile, test, section, id, attempt]);

  // `total` leaves out any questions the student flagged as wrong.
  function finishQuiz(correct, total) {
    // Chicks hatch the first time you finish a level and the first time you ace it, so replaying can't farm them.
    const earned = chicksForQuiz(section, correct, total);

    save("plan", completeSection(plan, id, correct / total));
    if (earned) update("flock", (f) => hatchChicks(f, earned, "quiz"));
    setResult({ correct, total, earned, flagged: level.quiz.length - total });
    setStage("results");
  }

  function retryLoad() {
    setError("");
    setAttempt(attempt + 1);
  }

  function retryQuiz() {
    setQuizRound(quizRound + 1);
    setStage("quiz");
  }

  if (plan === undefined || levels === undefined) return null;

  if (!canPlay) {
    return (
      <Message bubble="This level is still in its shell!" avatar={profile.avatar}>
        Finish the levels before it first.
      </Message>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href="/nest" className="text-sm font-semibold text-muted hover:underline">
        ← Back to nest
      </Link>
      <p className="label-small mt-4">{test.subject}</p>
      <h1 className="text-3xl">{section.title}</h1>
      <p className="mt-1 text-muted">{section.goal}</p>

      <div className="mt-6">
        {error && (
          <div className="card text-center">
            <p className="text-red-700">{error}</p>
            <button type="button" onClick={retryLoad} className="btn-primary mt-4">
              Try again
            </button>
          </div>
        )}

        {!error && !level && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Chick variant={profile.avatar} size={100} className="animate-bounce" />
            <span className="bubble">Hatching your lesson…</span>
          </div>
        )}

        {level && stage === "lesson" && (
          <>
            <Lesson lesson={level.lesson} avatar={profile.avatar} videoSources={profile.videoSources} />
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={() => setStage("quiz")} className="btn-primary">
                Start the quiz →
              </button>
            </div>
          </>
        )}

        {/* A new key makes React start a fresh Quiz (back to question 1) */}
        {level && stage === "quiz" && <Quiz key={quizRound} questions={level.quiz} onFinish={finishQuiz} topic={section.title} />}

        {stage === "results" && result && <Results result={result} onRetry={retryQuiz} />}
      </div>
    </main>
  );
}

function Results({ result, onRetry }) {
  const cook = cookLevel(result.correct / result.total);

  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      <span
        className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-line text-6xl"
        style={{ background: cook.color }}
      >
        {cook.emoji}
      </span>
      <p className="label-small">You&apos;re</p>
      <h2 className="text-4xl">{cook.name}!</h2>
      <p className="text-lg">
        {result.correct} of {result.total} correct
      </p>
      {result.flagged > 0 && (
        <p className="text-sm text-muted">
          🚩 {result.flagged} flagged question{result.flagged === 1 ? "" : "s"} didn&apos;t count
        </p>
      )}
      {result.earned > 0 && (
        <p className="font-display font-semibold">
          🐣 +{result.earned} chick{result.earned === 1 ? "" : "s"} hatched!
        </p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRetry} className="btn-secondary">
          Try again
        </button>
        <Link href="/nest" className="btn-primary">
          Back to nest
        </Link>
      </div>
    </div>
  );
}

function Message({ bubble, avatar, children }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bubble">{bubble}</span>
      <Chick variant={avatar} size={110} />
      <p className="text-muted">{children}</p>
      <Link href="/nest" className="btn-primary">
        Back to nest
      </Link>
    </main>
  );
}
