"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MissingNest from "@/components/MissingNest";
import PageTour from "@/components/PageTour";
import EditGradesButton from "@/components/EditGrades";
import { useConfirm } from "@/components/Modal";
import NestPath from "@/components/NestPath";
import { addCorn, chickCount, randomChestCorn, withDefaults } from "@/lib/flock";
import { deleteNest, updateNest, useNest } from "@/lib/nests";
import { update, useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { goalFraction, openChest } from "@/lib/progress";
import { daysBetween, formatDate, todayString } from "@/lib/dates";

// One nest: the path of egg levels for one test.
export default function NestPage() {
  const { nestId } = useParams();
  const router = useRouter();
  const nest = useNest(nestId);
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const flock = useStored("flock");
  const { confirm, dialog } = useConfirm();

  if (nest === undefined) return null;
  if (!nest) return <MissingNest />;

  const { test, plan } = nest;

  function collectChest(sectionId) {
    const corn = randomChestCorn();
    updateNest(nestId, (n) => ({ ...n, plan: openChest(n.plan, sectionId, corn) }));
    update("flock", (f) => addCorn(f, corn));
  }

  async function removeNest() {
    const ok = await confirm({
      title: "Delete this nest?",
      message: `Your ${test.subject} plan, its lessons, and its mock exam will be deleted. Your other nests and your chicks stay. This can't be undone.`,
      confirmLabel: "Delete nest",
      danger: true,
      chick: avatar,
    });
    if (!ok) return;
    router.push("/nest");
    deleteNest(nestId);
  }

  const today = todayString();
  const daysLeft = daysBetween(today, test.testDate);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      {dialog}
      <Link href="/nest" className="text-sm font-semibold text-muted hover:underline">
        ← All nests
      </Link>
      {/* Top banner: what this nest is for, plus quick stats */}
      <div className="card mt-3 bg-chick">
        <div className="flex items-start justify-between gap-3">
          <p className="label-small">
            {test.subject} · {test.topic}
          </p>
          <PageTour page="nest" />
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl">{plan.title}</h1>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-display font-semibold">
          <span>📅 {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : daysLeft === 0 ? "Test day!" : "Test done"}</span>
          <span className="flex items-center gap-2">
            🎯 {test.currentGrade}% → {test.goalGrade}% <EditGradesButton test={test} nestId={nestId} />
          </span>
          <span>🐣 {chickCount(flock)} chicks</span>
          <span>🌽 {withDefaults(flock).corn} corn</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{plan.overview}</p>
      {test.brief && (
        <details className="mt-3 rounded-2xl border-2 border-line/30 bg-white px-4 py-2 text-sm">
          <summary className="cursor-pointer font-semibold">
            📚 What we found about {test.subject}
            {test.basis?.length > 0 && <span className="font-normal text-muted"> · {test.basis.join(" + ")}</span>}
          </summary>
          <p className="mt-2 whitespace-pre-line text-muted">{test.brief}</p>
          {test.sources?.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {test.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted">Every lesson, quiz, and mock exam in this nest uses this.</p>
        </details>
      )}

      <div className="mt-8">
        <NestPath nestId={nestId} plan={plan} avatar={avatar} today={today} goal={goalFraction(test)} onOpenChest={collectChest} />
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">Test on {formatDate(test.testDate)}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/nest/new" className="btn-primary">
            Build another nest
          </Link>
          <button type="button" onClick={removeNest} className="btn-secondary">
            Delete this nest
          </button>
        </div>
      </div>
    </main>
  );
}
