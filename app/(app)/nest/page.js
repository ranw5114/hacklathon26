"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChickInNest } from "@/components/EggArt";
import { daysBetween, formatDate, todayString } from "@/lib/dates";
import { sortNests, subjectOutfit, useNests } from "@/lib/nests";
import { allSections, goalFraction, isPassed } from "@/lib/progress";
import { useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";

// All nests: one chick sitting in a nest for each test, dressed for its subject.
export default function NestsPage() {
  const nests = useNests();
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const router = useRouter();

  if (nests === undefined) return null;
  const today = todayString();
  const sorted = sortNests(nests, today);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-small">One nest per test</p>
          <h1 className="text-4xl">Your Nests</h1>
        </div>
        <Link href="/nest/new" className="btn-primary">
          + Build a new nest
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="card mt-8 flex flex-col items-center gap-4 py-10 text-center">
          <ChickInNest avatar={avatar} size={170} />
          <span className="bubble">No nests yet. Got a test coming up?</span>
          <p className="max-w-md text-muted">
            Build a nest for each test. Your chick makes a day-by-day study plan, with a short lesson and quiz for every
            step.
          </p>
          <button type="button" onClick={() => router.push("/nest/new")} className="btn-primary">
            Build my first nest
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((nest) => (
            <NestCard key={nest.id} nest={nest} avatar={avatar} today={today} />
          ))}
          {/* An empty nest that starts a new one */}
          <Link
            href="/nest/new"
            className="card-link flex flex-col items-center justify-center gap-2 border-dashed text-center"
          >
            <EmptyNest />
            <p className="font-display text-lg font-semibold">Build a new nest</p>
            <p className="text-sm text-muted">Another test? Add it here. Your other nests stay.</p>
          </Link>
        </div>
      )}
    </main>
  );
}

function NestCard({ nest, avatar, today }) {
  const { test, plan } = nest;
  const goal = goalFraction(test);
  const levels = allSections(plan);
  const passed = levels.filter((s) => isPassed(s, goal)).length;
  const daysLeft = daysBetween(today, test.testDate);
  const done = daysLeft < 0;
  const when = done ? `Test was ${formatDate(test.testDate)}` : daysLeft === 0 ? "Test is today!" : daysLeft === 1 ? "Test tomorrow" : `Test in ${daysLeft} days`;

  return (
    <Link href={`/nest/${nest.id}`} className={`card-link flex flex-col items-center gap-2 text-center ${done ? "opacity-70" : ""}`}>
      <ChickInNest avatar={avatar} wear={subjectOutfit(test.subject)} size={150} />
      <p className="label-small mt-1">{test.subject}</p>
      <h2 className="line-clamp-2 text-lg leading-snug">{test.topic}</h2>
      <p className={`text-sm font-semibold ${daysLeft >= 0 && daysLeft <= 1 ? "text-red-700" : "text-muted"}`}>
        📅 {when} · {formatDate(test.testDate)}
      </p>
      {/* Progress through the eggs */}
      <div className="mt-1 w-full">
        <div className="h-3 w-full overflow-hidden rounded-full border-2 border-line bg-white">
          <div className="h-full bg-beak" style={{ width: `${levels.length ? (passed / levels.length) * 100 : 0}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted">
          {passed} of {levels.length} eggs passed
          {plan.mockExam?.completed && ` · Mock exam: ${plan.mockExam.predicted}% predicted`}
        </p>
      </div>
    </Link>
  );
}

// A nest with nobody in it yet.
function EmptyNest() {
  return (
    <svg viewBox="0 0 140 70" width="140" height="70" aria-hidden="true">
      <path
        d="M6 20 Q70 36 134 20 C 134 44 110 62 70 62 C 30 62 6 44 6 20 Z"
        fill="oklch(0.7 0.09 65)"
        stroke="var(--chick-line)"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M8 18 Q70 4 132 18 L128 26 Q70 12 12 26 Z" fill="oklch(0.6 0.08 60)" stroke="var(--chick-line)" strokeWidth="3" />
      <text x="70" y="48" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--chick-line)" fontFamily="sans-serif">
        +
      </text>
    </svg>
  );
}
