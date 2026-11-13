"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import { save, useStored } from "@/lib/storage";

// AI-written answers are usually right, but not always. Students can flag a question that looks
// wrong; flagged questions don't count toward the score. Limited per quiz so it can't skip hard ones.
const MAX_FLAGS = 2;

// Multiple-choice quiz, one question at a time. Used by levels and the mock exam.
// When the last question is answered, it calls onFinish(numberCorrect, numberCounted, answers),
// where numberCounted leaves out flagged questions and answers[i] = { correct, flagged } per question.
export default function Quiz({ questions, onFinish, topic }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null); // index of the chosen answer
  const [checked, setChecked] = useState(false); // has "Check" been pressed?
  const [results, setResults] = useState([]); // results[i] = true if question i was answered correctly
  const [flagged, setFlagged] = useState([]); // indexes of flagged questions
  const savedFlags = useStored("flags");

  const question = questions[index];
  const isCorrect = selected === question.answerIndex;
  const isLast = index === questions.length - 1;
  const isFlagged = flagged.includes(index);

  function check() {
    setChecked(true);
    setResults([...results, isCorrect]);
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
      const answers = questions.map((_, i) => ({ correct: Boolean(results[i]), flagged: flagged.includes(i) }));
      return onFinish(correct, counted, answers);
    }
    setIndex(index + 1);
    setSelected(null);
    setChecked(false);
  }

  // Colors each answer button: highlighted when picked, green/red after checking.
  function choiceStyle(i) {
    if (checked && i === question.answerIndex) return "bg-green-100 border-green-700";
    if (checked && i === selected) return "bg-red-100 border-red-700";
    if (i === selected) return "bg-chick shadow-[0_4px_0_var(--chick-line)]";
    return "bg-white hover:bg-chick/40";
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

      <p className="label-small">
        Question {index + 1} of {questions.length}
      </p>
      <h2 className="text-2xl leading-snug">{question.question}</h2>

      <div className="flex flex-col gap-3">
        {question.choices.map((choice, i) => (
          <button
            key={i}
            type="button"
            disabled={checked}
            onClick={() => setSelected(i)}
            className={`rounded-2xl border-[3px] border-line p-4 text-left font-semibold transition ${choiceStyle(i)}`}
          >
            {choice}
          </button>
        ))}
      </div>

      {checked && (
        <div className={`rounded-2xl border-[3px] p-4 ${isCorrect ? "border-green-700 bg-green-50" : "border-red-700 bg-red-50"}`}>
          <p className="font-display text-lg font-semibold">{isCorrect ? <>Egg-cellent! <Icon name="chick" size={22} /></> : "Not quite!"}</p>
          <p className="mt-1">{question.explanation}</p>
          {isFlagged ? (
            <p className="mt-3 text-sm font-semibold"><Icon name="flag" size={16} /> Flagged. Thanks! This question won&apos;t count against you.</p>
          ) : flagged.length < MAX_FLAGS ? (
            <button type="button" onClick={flag} className="mt-3 text-sm font-semibold text-muted underline">
              <Icon name="flag" size={16} /> This answer looks wrong
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted"><Icon name="flag" size={16} /> You&apos;ve used both flags for this quiz.</p>
          )}
        </div>
      )}

      <div className="flex justify-end">
        {checked ? (
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
