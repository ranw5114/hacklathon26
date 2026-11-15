"use client";

import Icon from "@/components/Icon";
import { useEffect, useState } from "react";
import { save, useStored } from "@/lib/storage";

// AI-written answers are usually right, but not always. Students can flag a question that looks
// wrong; flagged questions don't count toward the score. Limited per quiz so it can't skip hard ones.
const MAX_FLAGS = 2;

// Multiple-choice quiz, one question at a time. Used by levels and the mock exam.
// Answered questions can be looked at again (read-only) with Previous or the numbered dots.
// When the last question is answered, it calls onFinish(numberCorrect, numberCounted, answers),
// where numberCounted leaves out flagged questions and answers[i] = { correct, flagged, pick } per
// question (pick = the index of the answer chosen). `initial` resumes a paused quiz (a progress object from `onProgress`), and `onProgress` is called
// with { index, selected, checked, results, picks, flagged } after every change, so it can be saved.
export default function Quiz({ questions, onFinish, topic, initial, onProgress }) {
  const start = initial && initial.index < questions.length ? initial : null;
  const [index, setIndex] = useState(start?.index ?? 0);
  const [selected, setSelected] = useState(start?.selected ?? null); // index of the chosen answer
  const [checked, setChecked] = useState(start?.checked ?? false); // has "Check" been pressed?
  const [results, setResults] = useState(start?.results ?? []); // results[i] = true if question i was answered correctly
  const [flagged, setFlagged] = useState(start?.flagged ?? []); // indexes of flagged questions
  const [picks, setPicks] = useState(start?.picks ?? []); // picks[i] = the answer chosen on question i
  const [reviewing, setReviewing] = useState(null); // an earlier question being looked at again
  const savedFlags = useStored("flags");

  useEffect(() => {
    onProgress?.({ index, selected, checked, results, picks, flagged });
  }, [index, selected, checked, results, picks, flagged, onProgress]);

  // The question on screen: the current one, or an answered one being looked at again.
  const shown = reviewing ?? index;
  const question = questions[shown];
  const choice = reviewing === null ? selected : picks[reviewing];
  const answered = reviewing !== null || checked;
  const isCorrect = reviewing === null ? selected === question.answerIndex : Boolean(results[reviewing]);
  const isLast = index === questions.length - 1;
  const isFlagged = flagged.includes(shown);
  // How many questions have an answer, so far (those can be looked at again).
  const answeredCount = index + (checked ? 1 : 0);

  function check() {
    setChecked(true);
    setResults([...results, isCorrect]);
    const nextPicks = [...picks];
    nextPicks[index] = selected;
    setPicks(nextPicks);
  }

  // Look at question i again, or go back to the current one.
  function goTo(i) {
    setReviewing(i === index ? null : i);
  }

  function flag() {
    setFlagged([...flagged, index]);
    // Saved in this browser. In a full version these would go to a review queue.
    const report = {
      question: question.question,
      markedAnswer: question.choices[question.answerIndex],
      studentAnswer: question.choices[selected],
      topic: topic ?? null,
      flaggedAt: Date.now(),
    };
    save("flags", [...(savedFlags ?? []), report].slice(-100));
  }

  function next() {
    if (isLast) {
      const counted = questions.length - flagged.length;
      const correct = results.filter((right, i) => right && !flagged.includes(i)).length;
      const answers = questions.map((_, i) => ({ correct: Boolean(results[i]), flagged: flagged.includes(i), pick: picks[i] ?? null }));
      return onFinish(correct, counted, answers);
    }
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
  }

  // Colors each answer button: highlighted when picked, green/red after checking.
  function choiceStyle(i) {
    if (answered && i === question.answerIndex) return "bg-green-100 border-green-700";
    if (answered && i === choice) return "bg-red-100 border-red-700";
    if (i === choice) return "bg-chick shadow-[0_4px_0_var(--chick-line)]";
    return "bg-white hover:bg-chick/40";
  }

  // The dot for question i: green or red once answered, outlined when it's on screen.
  function dotStyle(i) {
    const base = i === shown ? "ring-[3px] ring-beak ring-offset-2" : "";
    if (i >= answeredCount) return `${base} bg-white text-muted`;
    if (flagged.includes(i)) return `${base} bg-zinc-200`;
    return `${base} ${results[i] ? "bg-green-100" : "bg-red-100"}`;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress bar */}
      <div className="h-4 overflow-hidden rounded-full border-[3px] border-line bg-white">
        <div
          className="h-full bg-beak transition-all"
          style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* One dot per question. Answered ones can be opened again. */}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            disabled={i > index}
            aria-label={i < answeredCount ? `Look at question ${i + 1} again` : `Question ${i + 1}`}
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-line text-xs font-bold transition disabled:cursor-default ${dotStyle(i)}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="label-small">
        Question {shown + 1} of {questions.length}
        {reviewing !== null && " · looking back"}
      </p>
      <h2 className="text-2xl leading-snug">{question.question}</h2>

      <div className="flex flex-col gap-3">
        {question.choices.map((text, i) => (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => setSelected(i)}
            className={`rounded-2xl border-[3px] border-line p-4 text-left font-semibold transition ${choiceStyle(i)}`}
          >
            {text}
            {reviewing !== null && i === choice && <span className="ml-2 text-xs font-bold text-muted">(your answer)</span>}
          </button>
        ))}
      </div>

      {answered && (
        <div className={`rounded-2xl border-[3px] p-4 ${isCorrect ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50"}`}>
          <p className="font-display text-lg font-semibold">{isCorrect ? <>Egg-cellent! <Icon name="chick" size={22} /></> : "Not quite!"}</p>
          <p className="mt-1">{question.explanation}</p>
          {isFlagged ? (
            <p className="mt-3 text-sm font-semibold"><Icon name="flag" size={16} /> Flagged. Thanks! This question won&apos;t count against you.</p>
          ) : reviewing !== null ? null : flagged.length < MAX_FLAGS ? (
            <button type="button" onClick={flag} className="mt-3 text-sm font-semibold text-muted underline">
              <Icon name="flag" size={16} /> This answer looks wrong
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted"><Icon name="flag" size={16} /> You&apos;ve used both flags for this quiz.</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        {shown > 0 ? (
          <button type="button" onClick={() => goTo(shown - 1)} className="btn-secondary">
            ← Previous
          </button>
        ) : (
          <span />
        )}
        {reviewing !== null ? (
          <button type="button" onClick={() => goTo(reviewing + 1)} className="btn-primary">
            {reviewing + 1 === index ? `Back to question ${index + 1}` : "Next →"}
          </button>
        ) : checked ? (
          <button type="button" onClick={next} className="btn-primary">
            {isLast ? "See results" : "Next question"}
          </button>
        ) : (
          <button type="button" onClick={check} disabled={selected === null} className="btn-primary">
            Check
          </button>
        )}
      </div>
    </div>
  );
}

// A finished quiz, every question at once: your answer, the right answer, and why.
// `answers` is what Quiz passed to onFinish ([{ correct, flagged, pick }]).
export function QuizReview({ questions, answers }) {
  return (
    <ol className="flex flex-col gap-4">
      {questions.map((q, n) => {
        const answer = answers[n] ?? {};
        const pick = answer.pick ?? null;
        return (
          <li key={n} className="card flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="label-small">Question {n + 1}</p>
              <span
                className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${
                  answer.flagged ? "border-line/30 bg-zinc-100" : answer.correct ? "border-green-700 bg-green-50 text-green-800" : "border-red-700 bg-red-50 text-red-800"
                }`}
              >
                {answer.flagged ? "Flagged" : answer.correct ? "Correct" : "Missed"}
              </span>
            </div>
            <h3 className="text-lg leading-snug">{q.question}</h3>
            <ul className="flex flex-col gap-2">
              {q.choices.map((text, i) => (
                <li
                  key={i}
                  className={`rounded-2xl border-[3px] px-4 py-2.5 text-sm font-semibold ${
                    i === q.answerIndex ? "border-green-700 bg-green-100" : i === pick ? "border-red-700 bg-red-100" : "border-line/20 bg-white"
                  }`}
                >
                  {text}
                  {i === pick && <span className="ml-2 text-xs font-bold text-muted">(your answer)</span>}
                </li>
              ))}
            </ul>
            <p className="rounded-2xl bg-chick/40 px-4 py-2.5 text-sm">{q.explanation}</p>
          </li>
        );
      })}
    </ol>
  );
}
