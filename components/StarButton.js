"use client";

import Icon from "@/components/Icon";
import { problemId, toggleSaved, useSavedProblems, useSaveSpot } from "@/lib/savedProblems";

// The ☆ that saves a problem for later review (see lib/savedProblems.js). `problem` is
// { kind, question, choices?, answerIndex?, pick?, answer?, explanation? }; the nest and lesson come
// from the page's SaveSpot. Shows nothing outside a nest (e.g. practice problems in the Coop).
// `nudge` makes it wiggle with a "Save for later?" hint (after a missed quiz question).
export default function StarButton({ problem, nudge = false, className = "" }) {
  const spot = useSaveSpot();
  const saved = useSavedProblems();
  if (!spot || !problem?.question) return null;

  const id = problemId(spot.nestId, problem.question);
  const isSaved = Boolean(saved?.some((p) => p.id === id));

  function toggle(event) {
    event.stopPropagation(); // e.g. don't also open a <details> it sits in
    toggleSaved({ ...problem, id, nestId: spot.nestId, subject: spot.subject, lesson: spot.lesson });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isSaved}
      title={isSaved ? "Saved for later. Tap to remove." : "Save this problem for later review"}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold transition ${
        isSaved ? "border-line bg-chick" : "border-line/30 bg-white hover:border-line hover:bg-chick/40"
      } ${nudge && !isSaved ? "animate-egg-wiggle border-line" : ""} ${className}`}
    >
      <Icon name="star" size={18} className={isSaved ? "" : "opacity-40 grayscale"} />
      {isSaved ? "Saved" : nudge ? "Save for later?" : "Save"}
    </button>
  );
}
