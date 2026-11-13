"use client";

import PageIcon from "@/components/PageIcon";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BroodingChick, ChickInNest } from "@/components/EggArt";
import { cancelNestJob, retryNestJob, useNestLive } from "@/lib/nestJobs";
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

  const jobs = useStored("nestJobs") ?? [];
  const live = useNestLive();

  if (nests === undefined) return null;
  const today = todayString();
  const sorted = sortNests(nests, today);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageIcon icon="nest" move="bounce" size={52} lines={["One twig at a time!", "Cozy nests make smart chicks.", "Eggs in, A's out!", "Build it and they will hatch."]} label="Poke the nest" />
          <div>
            <p className="label-small">One nest per test</p>
            <h1 className="text-4xl">Your Nests</h1>
          </div>
        </div>
        <Link href="/nest/new" className="btn-primary">
          + Build a new nest
        </Link>
      </div>

      {sorted.length === 0 && jobs.length === 0 ? (
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
          {/* Nests still being built (they keep going on other pages too) */}
          {jobs.map((job) => (
            <BuildingCard key={job.id} job={job} live={live} avatar={avatar} />
          ))}
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

// A nest the AI is still building: the chick sits on its egg until the plan hatches.
function BuildingCard({ job, live, avatar }) {
  const failed = job.status === "error";
  // How far along the PDFs are (each PDF counts the same).
  const pdfs = job.guides.map((g) => (g.notes != null || g.failed ? 1 : live.guides[g.id]?.progress ?? 0));
  const pdfProgress = pdfs.length ? pdfs.reduce((a, b) => a + b, 0) / pdfs.length : 1;
  const readingPdfs = !failed && pdfProgress < 1;
  return (
    <div className={`card flex flex-col items-center gap-2 text-center ${failed ? "border-red-700 bg-red-50" : "bg-chick/40"}`}>
      <BroodingChick avatar={avatar} animate={!failed} mood={failed ? "sad" : "happy"} size={130} />
      <p className="label-small">{failed ? "Couldn't build" : "Building…"}</p>
      <p className="font-display text-lg leading-tight font-semibold">
        {job.test.subject}
        {job.test.topic ? `: ${job.test.topic}` : ""}
      </p>
      {failed ? (
        <>
          <p className="text-sm text-red-700">{job.error}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => retryNestJob(job.id)} className="btn-primary px-4 py-1.5 text-sm">
              Try again
            </button>
            <button type="button" onClick={() => cancelNestJob(job.id)} className="btn-secondary px-4 py-1.5 text-sm">
              Remove
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{job.label}</p>
          {readingPdfs && (
            <span className="block h-2 w-full overflow-hidden rounded-full bg-white">
              <span className="block h-full bg-beak transition-all" style={{ width: `${Math.round(pdfProgress * 100)}%` }} />
            </span>
          )}
          <p className="text-xs text-muted">You can leave this page. It keeps building, and you&apos;ll get a pop-up when it&apos;s ready.</p>
          <button type="button" onClick={() => cancelNestJob(job.id)} className="text-xs font-semibold text-muted underline">
            Cancel
          </button>
        </>
      )}
    </div>
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
        <Icon name="calendar" size={16} /> {when} · {formatDate(test.testDate)}
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
