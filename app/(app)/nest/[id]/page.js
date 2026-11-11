"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Chick from "@/components/Chick";
import { FriedEgg, HatchedChick, PathEgg } from "@/components/EggArt";
import Modal from "@/components/Modal";
import Lesson from "@/components/Lesson";
import Quiz from "@/components/Quiz";
import { addCorn, hatchChicks, quizRewards } from "@/lib/flock";
import { save, update, useStored } from "@/lib/storage";
import { completeSection, eggResult, findSection, goalFraction, isUnlocked } from "@/lib/progress";

// One level: read the lesson, take the quiz, see how "cooked" you are.
export default function LevelPage() {
  const { id } = useParams(); // the [id] part of the URL, e.g. "d1-s2"
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");
  const levels = useStored("levels");

  const [stage, setStage] = useState("lesson"); // "lesson" → "quiz" → "results"
  const [result, setResult] = useState(null); // { correct, total, chicks, corn, egg, flagged }
  const [showFriedPopup, setShowFriedPopup] = useState(false);
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
    // 100% hatches a chick; the goal grade or higher earns corn; below the goal fries the egg.
    const score = correct / total;
    const goal = goalFraction(test);
    const { chicks, corn } = quizRewards(section, score, goal);
    const egg = eggResult(score, goal);

    save("plan", completeSection(plan, id, score));
    if (chicks) update("flock", (f) => hatchChicks(f, chicks, "quiz"));
    if (corn) update("flock", (f) => addCorn(f, corn));
    setResult({ correct, total, chicks, corn, egg, goal, flagged: level.quiz.length - total });
    setStage("results");
    setShowFriedPopup(egg.id === "fried");
  }

  function retryLoad() {
    setError("");
    setAttempt(attempt + 1);
  }

  function retryQuiz() {
    setShowFriedPopup(false);
    setQuizRound(quizRound + 1);
    setStage("quiz");
  }

  function reviewLesson() {
    setShowFriedPopup(false);
    setStage("lesson");
    window.scrollTo({ top: 0 });
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

        {stage === "results" && result && <Results result={result} onRetry={retryQuiz} onReview={reviewLesson} />}

        {/* A failed quiz: a heartbroken chicken pops up */}
        <Modal open={showFriedPopup} onClose={() => setShowFriedPopup(false)} title="My egg!!" chick={profile.avatar} chickMood="sad">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-end gap-2">
              <Chick variant={profile.avatar} mood="crying" size={90} />
              <FriedEgg size={70} />
            </div>
            <p className="font-display text-lg font-semibold">{FRIED_POPUP}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reviewLesson} className="btn-secondary">
                Review the lesson
              </button>
              <button type="button" onClick={retryQuiz} className="btn-primary">
                Retry the quiz
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </main>
  );
}

// What the chicken says when a quiz scores below the goal grade.
const FRIED_POPUP = "Don't fry my kids like how u are fried on the test! Let's retry that.";

function Results({ result, onRetry, onReview }) {
  const { egg } = result;
  const percent = Math.round((result.correct / result.total) * 100);

  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      <div className="flex h-32 items-end justify-center">
        {egg.id === "hatched" && <HatchedChick size={130} />}
        {egg.id === "golden" && <PathEgg state="golden" size={100} />}
        {egg.id === "fried" && <FriedEgg size={120} />}
      </div>
      <h2 className="text-4xl">
        {egg.id === "hatched" ? "It hatched!" : egg.id === "golden" ? "Golden egg!" : "Your egg got fried…"}
      </h2>
      <p className="text-lg">
        {result.correct} of {result.total} correct ({percent}%) · goal {Math.round(result.goal * 100)}%
      </p>
      {result.flagged > 0 && (
        <p className="text-sm text-muted">
          🚩 {result.flagged} flagged question{result.flagged === 1 ? "" : "s"} didn&apos;t count
        </p>
      )}
      {result.chicks > 0 && (
        <p className="font-display font-semibold">
          🐣 A new chick joined your coop!{" "}
          <Link href="/henhouse" className="underline">
            Visit the Henhouse
          </Link>
        </p>
      )}
      {result.corn > 0 && <p className="font-display font-semibold">🌽 +{result.corn} corn to spend in the Henhouse</p>}
      {egg.id === "golden" && result.corn === 0 && (
        <p className="text-sm text-muted">Get 100% to hatch a chick from this egg!</p>
      )}
      {egg.id === "fried" && (
        <p className="text-muted">Score your goal grade or higher to save this egg.</p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {egg.id === "fried" && (
          <button type="button" onClick={onReview} className="btn-secondary">
            Review the lesson
          </button>
        )}
        <button type="button" onClick={onRetry} className={egg.id === "fried" ? "btn-primary" : "btn-secondary"}>
          {egg.id === "fried" ? "Retry the quiz" : "Try again"}
        </button>
        <Link href="/nest" className={egg.id === "fried" ? "btn-secondary" : "btn-primary"}>
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
