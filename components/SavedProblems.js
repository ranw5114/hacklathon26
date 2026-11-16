"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import PageIcon from "@/components/PageIcon";
import RichText from "@/components/RichText";
import { useAvatar } from "@/lib/avatar";
import { coopQuestion, leaveCoopDraft, removeSaved, useSavedProblems } from "@/lib/savedProblems";

const KINDS = { quiz: "Quiz", practice: "Practice", mock: "Mock exam" };
const LETTERS = "ABCDEFGH";

// The Saved problems page: every starred problem (or one nest's, with `nestId`), to try again.
// Answers stay hidden until "Show answer". "Got it now" takes a problem off the list.
export default function SavedProblems({ nestId = null, nestName = null }) {
  const saved = useSavedProblems();
  const avatar = useAvatar();
  if (saved === undefined) return null;

  const list = nestId ? saved.filter((p) => p.nestId === nestId) : saved;
  // Grouped by nest, newest first (the list is saved newest first).
  const groups = [];
  for (const p of list) {
    const group = groups.find((g) => g.nestId === p.nestId);
    if (group) group.problems.push(p);
    else groups.push({ nestId: p.nestId, subject: p.subject, problems: [p] });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      {nestId && (
        <Link href={`/nest/${nestId}`} className="text-sm font-semibold text-muted hover:underline">
          ← Back to nest
        </Link>
      )}
      <div className="mt-3 flex items-center gap-3">
        <PageIcon icon="star" move="pop" size={52} lines={["Practice makes perfect!", "You'll get it this time!", "Tricky ones, tamed."]} label="Poke the star" />
        <div>
          <p className="label-small">{nestName ?? "Review later"}</p>
          <h1 className="text-3xl">Saved problems</h1>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Problems you starred to look at again. Try each one first, then check the answer. When it finally makes sense, tap Got it now.
      </p>

      {list.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 py-8 text-center">
          <Chick variant={avatar} mood="happy" size={80} />
          <p className="font-display text-lg font-semibold">No saved problems yet!</p>
          <p className="max-w-sm text-sm text-muted">
            Tap <Icon name="star" size={16} /> Save on any quiz question, practice problem, or mock exam question you want to come back to.
          </p>
          {nestId && (
            <Link href={`/nest/${nestId}`} className="btn-secondary">
              Back to nest
            </Link>
          )}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.nestId} className="mt-6 flex flex-col gap-4">
            {!nestId && (
              <h2 className="flex items-center gap-2 text-xl">
                <Icon name="nest" size={22} /> {group.subject}
                <span className="text-sm font-normal text-muted">({group.problems.length})</span>
              </h2>
            )}
            {group.problems.map((p) => (
              <SavedCard key={p.id} problem={p} />
            ))}
          </section>
        ))
      )}
    </main>
  );
}

function SavedCard({ problem }) {
  const router = useRouter();
  const [shown, setShown] = useState(false);
  const p = problem;
  const missed = p.choices && p.pick != null && p.pick !== p.answerIndex;

  function askCoop() {
    leaveCoopDraft(coopQuestion(p));
    router.push("/coop");
  }

  // Each choice turns green (right answer) or red (theirs, if wrong) once the answer is shown.
  function choiceStyle(i) {
    if (shown && i === p.answerIndex) return "border-green-700 bg-green-100";
    if (shown && i === p.pick) return "border-red-700 bg-red-100";
    return "border-line/20 bg-white";
  }

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border-2 border-line bg-chick px-2.5 py-0.5 text-xs font-bold">{KINDS[p.kind] ?? "Problem"}</span>
        <p className="label-small min-w-0 flex-1 truncate">{p.lesson}</p>
        {missed && <span className="text-xs font-semibold text-red-800">You missed this one</span>}
      </div>

      <RichText text={p.question} className="font-semibold" />

      {p.choices && (
        <ul className="flex flex-col gap-2">
          {p.choices.map((text, i) => (
            <li key={i} className={`rounded-2xl border-[3px] px-4 py-2 text-sm font-semibold ${choiceStyle(i)}`}>
              <span className="font-display">{LETTERS[i]}.</span> <RichText text={text} inline />
              {shown && i === p.pick && <span className="ml-2 text-xs font-bold text-muted">(your answer)</span>}
            </li>
          ))}
        </ul>
      )}

      {shown && (
        <div className="flex flex-col gap-2 text-sm">
          {p.yours !== undefined && (
            <p>
              <span className="font-semibold">Your answer:</span> {p.yours || <em className="text-muted">(blank)</em>}
            </p>
          )}
          {p.answer && (
            <div>
              <p className="font-semibold">{p.kind === "practice" ? "Solution" : "Answer"}</p>
              <RichText text={p.answer} className="mt-1 rounded-xl bg-white p-3" />
            </div>
          )}
          {p.explanation && <RichText text={p.explanation} className="rounded-2xl bg-chick/40 px-4 py-2.5" />}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShown(!shown)} className="btn-secondary px-3 py-1.5 text-sm">
          {shown ? "Hide answer" : "Show answer"}
        </button>
        <button type="button" onClick={askCoop} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Icon name="hen" size={16} /> Ask the Coop
        </button>
        <button type="button" onClick={() => removeSaved(p.id)} className="btn-primary ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Icon name="check" size={16} /> Got it now
        </button>
      </div>
    </article>
  );
}
