"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import { dismissNotice, resumeNestJobs, useNestLive } from "@/lib/nestJobs";
import { useStored } from "@/lib/storage";

// On every page: keeps nests building in the background (lib/nestJobs.js), shows a small
// "Building…" pill while they work, and a pop-up when one is ready.
export default function NestJobsWatcher() {
  const jobs = useStored("nestJobs") ?? [];
  const { notices } = useNestLive();
  const pathname = usePathname();

  // Pick up anything interrupted by a reload or a closed tab. (A job counts as interrupted once
  // nobody has worked on it for a few seconds, so this checks again every few seconds.)
  useEffect(() => {
    resumeNestJobs();
    const check = setInterval(resumeNestJobs, 5000);
    return () => clearInterval(check);
  }, []);

  const working = jobs.filter((j) => j.status === "working").length;
  const failed = jobs.filter((j) => j.status === "error").length;
  const showPill = (working > 0 || failed > 0) && pathname !== "/nest";

  if (!showPill && !notices.length) return null;
  return (
    <div className="fixed bottom-28 left-4 z-40 flex max-w-sm flex-col items-start gap-2 sm:bottom-28">
      {notices.map((n) => (
        <div key={n.id} role="status" className="flex items-start gap-3 rounded-2xl border-[3px] border-line bg-white px-4 py-3 shadow-[0_4px_0_var(--chick-line)] anim-pop">
          <Icon name="nest" size={30} />
          <div className="flex-1 text-sm">
            <p className="font-display font-semibold">Your {n.subject} nest is ready!</p>
            <p className="text-muted">Your study plan just hatched.</p>
            <Link href={`/nest/${n.nestId}`} onClick={() => dismissNotice(n.id)} className="mt-1 inline-block font-semibold underline">
              Open it
            </Link>
          </div>
          <button type="button" onClick={() => dismissNotice(n.id)} aria-label="Dismiss" className="text-muted hover:text-foreground">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
      {showPill && (
        <Link
          href="/nest"
          className={`flex w-max items-center gap-2 rounded-full border-[3px] px-4 py-2 text-sm font-semibold shadow-[0_3px_0_var(--chick-line)] ${
            failed && !working ? "border-red-700 bg-red-50 text-red-800" : "border-line bg-chick"
          }`}
        >
          <span className={working ? "inline-flex anim-wobble [animation-iteration-count:infinite]" : "inline-flex"}>
            <Icon name={failed && !working ? "fried" : "egg"} size={20} />
          </span>
          {working > 0 ? `Building ${working === 1 ? "1 nest" : `${working} nests`}…` : ""}
          {working > 0 && failed > 0 ? " · " : ""}
          {failed > 0 ? `${failed} needs a retry` : ""}
        </Link>
      )}
    </div>
  );
}
