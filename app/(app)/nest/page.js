"use client";

import Chick from "@/components/Chick";
import DayCard from "@/components/DayCard";
import NestForm from "@/components/NestForm";
import { remove, useStored } from "@/lib/storage";
import { daysBetween, formatDate, todayString } from "@/lib/dates";

// Nest Builder: shows the form until a plan exists, then shows the plan.
// Next step: replace the day list with a Duolingo-style path of levels.
export default function NestPage() {
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");

  if (test === undefined || plan === undefined) return null;

  if (!test || !plan) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6 flex items-end gap-4">
          <Chick variant="mint" size={90} />
          <div>
            <span className="bubble text-sm">Let&apos;s build your nest, one twig at a time!</span>
            <h1 className="mt-3 text-4xl">Nest Builder</h1>
          </div>
        </div>
        <NestForm learner={profile} />
      </main>
    );
  }

  function startNewNest() {
    if (!confirm("Delete this plan and build a new one?")) return;
    remove("test", "plan");
  }

  const today = todayString();
  const daysLeft = daysBetween(today, test.testDate);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="label-small">
        {test.subject} · {test.topic}
      </p>
      <h1 className="mt-1 text-4xl">{plan.title}</h1>
      <p className="mt-3 text-muted">{plan.overview}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Test date" value={formatDate(test.testDate)} />
        <Stat label="Days left" value={daysLeft > 0 ? daysLeft : "Test day!"} />
        <Stat label="Grade" value={`${test.currentGrade}% → ${test.goalGrade}%`} />
      </div>

      <h2 className="mt-10 text-2xl">Your plan</h2>
      <div className="mt-4 flex flex-col gap-5">
        {plan.days.map((day, i) => (
          <DayCard key={day.date} day={day} dayNumber={i + 1} isToday={day.date === today} />
        ))}

        <article className="card border-dashed bg-chick/50">
          <p className="label-small">{formatDate(plan.mockExam.date)}</p>
          <h3 className="text-xl">Mock exam</h3>
          <p className="text-sm text-muted">A practice test covering everything, with your predicted grade.</p>
        </article>
      </div>

      <button type="button" onClick={startNewNest} className="btn-secondary mt-10">
        Build a new nest
      </button>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <p className="label-small">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
