"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Chick from "@/components/Chick";
import { Drumstick, FriedEgg, HatchedChick, PathEgg } from "@/components/EggArt";
import Modal from "@/components/Modal";
import Lesson from "@/components/Lesson";
import Quiz from "@/components/Quiz";
import { addCorn, chickCount, hatchChicks, loseChickToQuiz, quizRewards } from "@/lib/flock";
import { todayString } from "@/lib/dates";
import MissingNest from "@/components/MissingNest";
import { updateNest, useNest } from "@/lib/nests";
import { update, useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { completeSection, conceptSummary, eggResult, findSection, goalFraction, isUnlocked } from "@/lib/progress";
import { DIFFICULTIES, recentFeedback, saveFeedback } from "@/lib/planEdit";

// One level: read the lesson, take the quiz, see how "cooked" you are.
export default function LevelPage() {
  // The URL is /nest/<nestId>/<levelId>, e.g. /nest/nabc123/d1-s2
  const { nestId, levelId: id } = useParams();
  const nest = useNest(nestId);
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const test = nest?.test;
  const plan = nest?.plan;
  const levels = nest?.levels;
  const flock = useStored("flock");

  const [stage, setStage] = useState("lesson"); // "lesson" → "quiz" → "results"
  const [result, setResult] = useState(null); // { correct, total, chicks, corn, egg, flagged }
  const [showFriedPopup, setShowFriedPopup] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to re-run the loading effect
  const [quizRound, setQuizRound] = useState(0); // bumped to restart the quiz from question 1
  const requested = useRef(false); // so we only ask the AI once
  const remakeAs = useRef(null); // "easier" or "harder" when the student asked to redo this lesson
  const [remaking, setRemaking] = useState(null); // the same, for the loading message

  const section = plan ? findSection(plan, id) : null;
  const level = levels?.[id]; // saved lesson + quiz, if we've generated it before
  const canPlay = plan && section && isUnlocked(plan, id, goalFraction(test));

  // Generate the lesson + quiz the first time this level is opened, then save it.
  useEffect(() => {
    if (!canPlay || level || requested.current) return;
    requested.current = true;

    fetch("/api/level", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Their feedback on earlier lessons helps the AI pitch this one right.
      body: JSON.stringify({ learner: profile, test, section, feedback: recentFeedback(nest), remake: remakeAs.current }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // Saving re-renders the page with the lesson.
        remakeAs.current = null;
        setRemaking(null);
        updateNest(nestId, (n) => ({ ...n, levels: { ...n.levels, [id]: data } }));
      })
      .catch((err) => {
        setError(err.message || "Couldn't load this level.");
        requested.current = false; // allow "Try again"
      });
  }, [canPlay, level, profile, test, section, id, nestId, attempt, nest]);

  function sendFeedback(difficulty, note) {
    updateNest(nestId, (n) => saveFeedback(n, id, { difficulty, note }));
  }

  // Makes this lesson again, easier or harder, with a new quiz.
  function remakeLesson(kind) {
    remakeAs.current = kind;
    setRemaking(kind);
    requested.current = false;
    setResult(null);
    setShowFriedPopup(false);
    setStage("lesson");
    updateNest(nestId, (n) => {
      const levels = { ...n.levels };
      delete levels[id];
      return { ...n, levels };
    });
    window.scrollTo({ top: 0 });
  }

  // `total` leaves out any questions the student flagged as wrong. answers[i] = { correct, flagged }.
  function finishQuiz(correct, total, answers) {
    // 100% hatches a chick; each understood concept earns corn; below the goal fries the egg
    // AND one of your chicks (it becomes a drumstick).
    const score = total ? correct / total : 0;
    const goal = goalFraction(test);
    const concepts = conceptSummary(level.quiz, answers ?? []);
    const { chicks, corn, newConcepts, loseChick } = quizRewards(section, score, goal, concepts.understood);
    const egg = eggResult(score, goal);
    const lostChick = loseChick && chickCount(flock) > 0;

    updateNest(nestId, (n) => ({ ...n, plan: completeSection(n.plan, id, score, newConcepts) }));
    if (chicks) update("flock", (f) => hatchChicks(f, chicks, "quiz"));
    if (corn) update("flock", (f) => addCorn(f, corn));
    if (lostChick) update("flock", (f) => loseChickToQuiz(f, todayString()));
    setResult({ correct, total, chicks, corn, egg, goal, concepts, lostChick, flagged: level.quiz.length - total });
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

  if (nest === undefined) return null;
  if (!nest) return <MissingNest />;

  if (!canPlay) {
    return (
      <Message bubble="This level is still in its shell!" avatar={avatar} nestId={nestId}>
        Pass the levels before it first (reach your goal grade on each one).
      </Message>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href={`/nest/${nestId}`} className="text-sm font-semibold text-muted hover:underline">
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
            <Chick variant={avatar} size={100} className="animate-bounce" />
            <span className="bubble">{remaking ? `Making it ${remaking} for you…` : "Hatching your lesson…"}</span>
          </div>
        )}

        {level && stage === "lesson" && (
          <>
            <Lesson lesson={level.lesson} avatar={avatar} videoSources={profile.videoSources} />
            <div className="mt-8 flex justify-end">
              <button type="button" onClick={() => setStage("quiz")} className="btn-primary">
                Start the quiz →
              </button>
            </div>
          </>
        )}

        {/* A new key makes React start a fresh Quiz (back to question 1) */}
        {level && stage === "quiz" && <Quiz key={quizRound} questions={level.quiz} onFinish={finishQuiz} topic={section.title} />}

        {stage === "results" && result && (
          <Results
            result={result}
            nestId={nestId}
            onRetry={retryQuiz}
            onReview={reviewLesson}
            feedback={nest.feedback?.[id]}
            onFeedback={sendFeedback}
            onRemake={remakeLesson}
          />
        )}

        {/* A failed quiz: a heartbroken chicken pops up */}
        <Modal open={showFriedPopup} onClose={() => setShowFriedPopup(false)} title="My egg!!" chick={avatar} chickMood="sad">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-end gap-2">
              <Chick variant={avatar} mood="crying" size={90} />
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
// The summary's verdicts.
const PASSED_LINE = "You ate that lesson, here's some corn for your chicks to eat!";
const FAILED_LINE = "You gotta lock in before you run out of chicks to fry.";
const COOKED_LINE = "You are cooked for this test if you don't work on these concepts:";

function Results({ result, nestId, onRetry, onReview, feedback, onFeedback, onRemake }) {
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
          <Icon name="flag" size={14} /> {result.flagged} flagged question{result.flagged === 1 ? "" : "s"} didn&apos;t count
        </p>
      )}
      {result.chicks > 0 && (
        <p className="font-display font-semibold">
          <Icon name="chick" size={18} /> A new chick joined your coop!{" "}
          <Link href="/henhouse" className="underline">
            Visit the Henhouse
          </Link>
        </p>
      )}
      {egg.id === "golden" && <p className="text-sm text-muted">Get 100% to hatch a chick from this egg!</p>}
      {egg.id === "fried" && (
        <p className="text-muted">Score your goal grade or higher to save this egg and unlock the next one.</p>
      )}

      <LessonSummary result={result} />
      <FeedbackBox saved={feedback} onSend={onFeedback} onRemake={onRemake} />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {egg.id === "fried" && (
          <button type="button" onClick={onReview} className="btn-secondary">
            Review the lesson
          </button>
        )}
        <button type="button" onClick={onRetry} className={egg.id === "fried" ? "btn-primary" : "btn-secondary"}>
          {egg.id === "fried" ? "Retry the quiz" : "Try again"}
        </button>
        <Link href={`/nest/${nestId}`} className={egg.id === "fried" ? "btn-secondary" : "btn-primary"}>
          Back to nest
        </Link>
      </div>
    </div>
  );
}

// After the quiz: which concepts you understood (corn) and which you didn't (drumsticks).
function LessonSummary({ result }) {
  const { egg, concepts, corn, lostChick } = result;
  const passed = egg.id !== "fried";
  return (
    <section className="mt-4 w-full max-w-md rounded-3xl border-[3px] border-line bg-chick/40 p-4 text-left">
      <p className="label-small">Lesson summary</p>
      <p className="mt-1 font-display text-lg font-semibold">{passed ? PASSED_LINE : FAILED_LINE}</p>

      {concepts.understood.length > 0 && (
        <>
          <p className="mt-3 text-sm font-semibold">Concepts you got <Icon name="corn" size={16} /></p>
          <ul className="mt-1 flex flex-col gap-1">
            {concepts.understood.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm">
                <Icon name="corn" size={18} /> {c}
              </li>
            ))}
          </ul>
        </>
      )}
      {concepts.missed.length > 0 && (
        <>
          <p className="mt-3 text-sm font-semibold">Concepts to work on</p>
          <ul className="mt-1 flex flex-col gap-1">
            {concepts.missed.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm">
                <Drumstick size={22} /> {c}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 flex flex-col gap-1 font-semibold">
        {corn > 0 && <p><Icon name="corn" size={18} /> +{corn} corn for your chicks (spend it in the Henhouse)</p>}
        {corn === 0 && concepts.understood.length > 0 && (
          <p className="text-sm text-muted">You already earned corn for these concepts on this lesson.</p>
        )}
        {lostChick && <p className="text-red-700"><Icon name="drumstick" size={18} /> One of your chicks got fried into a drumstick.</p>}
      </div>

      {concepts.missed.length > 0 && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-semibold">
          {COOKED_LINE} {concepts.missed.join(", ")}.
        </p>
      )}
    </section>
  );
}

// After every lesson: was it too easy or too hard, and what could be better? Saved with the nest
// and sent to the AI with the next lessons. Too easy / too hard also offers to remake this one.
function FeedbackBox({ saved, onSend, onRemake }) {
  const [difficulty, setDifficulty] = useState(saved?.difficulty ?? "");
  const [note, setNote] = useState(saved?.note ?? "");
  const [sent, setSent] = useState(false);

  function send() {
    onSend(difficulty, note);
    setSent(true);
  }

  if (sent) {
    return (
      <section className="mt-4 flex w-full max-w-md flex-col items-center gap-2 rounded-3xl border-[3px] border-line bg-white p-4 text-center">
        <Chick variant="sunny" mood="love" size={60} />
        <p className="font-display text-lg font-semibold">Thanks! I&apos;ll use this to make your next lessons better.</p>
        {difficulty !== "right" && (
          <button type="button" onClick={() => onRemake(difficulty === "hard" ? "easier" : "harder")} className="btn-primary px-4 py-2 text-sm">
            Remake this lesson {difficulty === "hard" ? "easier" : "harder"}
          </button>
        )}
        <button type="button" onClick={() => setSent(false)} className="text-xs font-semibold text-muted underline">
          Change my feedback
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4 w-full max-w-md rounded-3xl border-[3px] border-line bg-white p-4 text-left">
      <p className="label-small">Your feedback</p>
      <p className="mt-1 font-display text-lg font-semibold">How was this lesson?</p>
      <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="How hard was this lesson?">
        {Object.entries(DIFFICULTIES).map(([key, d]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={difficulty === key}
            onClick={() => setDifficulty(key)}
            className={`group flex flex-col items-center gap-1 rounded-2xl border-[3px] px-2 py-2 text-sm font-semibold transition ${
              difficulty === key ? "border-line bg-chick shadow-[0_3px_0_var(--chick-line)]" : "border-line/30 bg-white hover:border-line"
            }`}
          >
            <span className="inline-flex group-hover:anim-hop">
              <Chick variant="sunny" mood={d.mood} size={44} />
            </span>
            {d.label}
          </button>
        ))}
      </div>
      <label className="mt-3 flex flex-col gap-1">
        <span className="text-sm font-semibold">What can we do better? (optional)</span>
        <textarea
          className="input min-h-20 text-sm"
          maxLength={400}
          placeholder="e.g. More examples, shorter explanations, harder questions, explain the formulas…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <button type="button" onClick={send} disabled={!difficulty} className="btn-primary mt-3 w-full disabled:opacity-50">
        {difficulty ? "Send feedback" : "Pick one above to send"}
      </button>
    </section>
  );
}

function Message({ bubble, avatar, nestId, children }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bubble">{bubble}</span>
      <Chick variant={avatar} size={110} />
      <p className="text-muted">{children}</p>
      <Link href={`/nest/${nestId}`} className="btn-primary">
        Back to nest
      </Link>
    </main>
  );
}
