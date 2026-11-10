"use client";

import Chick from "@/components/Chick";
import EditGradesButton from "@/components/EditGrades";
import { useConfirm } from "@/components/Modal";
import NestForm from "@/components/NestForm";
import NestPath from "@/components/NestPath";
import { resetNest, save, useStored } from "@/lib/storage";
import { openChest, randomChestCorn } from "@/lib/progress";
import { daysBetween, formatDate, todayString } from "@/lib/dates";

// Nest Builder: shows the form until a plan exists, then shows the level path.
export default function NestPage() {
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");
  const points = useStored("points");
  const { confirm, dialog } = useConfirm();

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

  function collectChest(sectionId) {
    const corn = randomChestCorn();
    save("plan", openChest(plan, sectionId, corn));
    save("points", (points ?? 0) + corn);
  }

  async function startNewNest() {
    const ok = await confirm({
      title: "Build a new nest?",
      message: "This plan, its lessons, and its mock exam will be deleted so you can start fresh. Your corn stays.",
      confirmLabel: "Start fresh",
      danger: true,
      chick: "mint",
    });
    if (!ok) return;
    resetNest();
  }

  const today = todayString();
  const daysLeft = daysBetween(today, test.testDate);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      {dialog}
      {/* Top banner: what this nest is for, plus quick stats */}
      <div className="card bg-chick">
        <p className="label-small">
          {test.subject} · {test.topic}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl">{plan.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-display font-semibold">
          <span>📅 {daysLeft > 0 ? `${daysLeft} days left` : "Test day!"}</span>
          <span className="flex items-center gap-2">
            🎯 {test.currentGrade}% → {test.goalGrade}% <EditGradesButton test={test} />
          </span>
          <span>🌽 {points ?? 0} corn</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{plan.overview}</p>

      <div className="mt-8">
        <NestPath plan={plan} profile={profile} today={today} onOpenChest={collectChest} />
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted">Test on {formatDate(test.testDate)}</p>
        <button type="button" onClick={startNewNest} className="btn-secondary mt-3">
          Build a new nest
        </button>
      </div>
    </main>
  );
}
