"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DayCard from "@/components/DayCard";
import { clearAll, useStored } from "@/lib/storage";
import { daysBetween, formatDate, todayString } from "@/lib/dates";

export default function PlanPage() {
  const router = useRouter();
  const profile = useStored("profile");
  const plan = useStored("plan");

  function startOver() {
    if (!confirm("Delete this plan and start over?")) return;
    clearAll();
    router.push("/setup");
  }

  // Still reading saved data from the browser.
  if (profile === undefined || plan === undefined) return null;

  if (!profile || !plan) {
    return (
      <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">No study plan yet</h1>
        <p className="text-zinc-600">Answer a few questions and we&apos;ll build one for your next test.</p>
        <Link href="/setup" className="btn-primary">
          Get started
        </Link>
      </main>
    );
  }

  const today = todayString();
  const daysLeft = daysBetween(today, profile.testDate);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-sm font-medium text-indigo-600">
        {profile.subject} · {profile.topic}
      </p>
      <h1 className="mt-1 text-3xl font-bold">{plan.title}</h1>
      <p className="mt-3 text-zinc-600">{plan.overview}</p>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Test date" value={formatDate(profile.testDate)} />
        <Stat label="Days left" value={daysLeft > 0 ? daysLeft : "Test day!"} />
        <Stat label="Grade" value={`${profile.currentGrade}% → ${profile.goalGrade}%`} />
      </div>

      <h2 className="mt-10 text-xl font-semibold">Your plan</h2>
      <div className="mt-4 flex flex-col gap-4">
        {plan.days.map((day, i) => (
          <DayCard key={day.date} day={day} dayNumber={i + 1} isToday={day.date === today} />
        ))}

        <article className="card border-dashed bg-indigo-50">
          <p className="text-sm font-medium text-zinc-500">{formatDate(plan.mockExam.date)}</p>
          <h3 className="text-lg font-semibold">Mock exam</h3>
          <p className="text-sm text-zinc-600">
            A practice test covering everything, with your predicted grade.
          </p>
        </article>
      </div>

      <button type="button" onClick={startOver} className="btn-secondary mt-10">
        Start over
      </button>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
