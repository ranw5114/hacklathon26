"use client";

import Link from "next/link";
import AppNav from "@/components/AppNav";
import Chick from "@/components/Chick";
import TimerWatcher from "@/components/TimerWatcher";
import { ExitDemoButton } from "@/components/DemoButtons";
import { useMoveOldNest } from "@/lib/nests";
import { useStored } from "@/lib/storage";

// Shared layout for every page in the (app) folder: Barn, Nest, Coop, Timer, Roost, Profile.
// The (app) folder name is in parentheses, so it doesn't appear in the URL (/barn, not /app/barn).
export default function AppLayout({ children }) {
  const profile = useStored("profile");
  // Plans saved before multiple nests existed move into the new nests list (once).
  useMoveOldNest();

  // Still reading saved data from the browser.
  if (profile === undefined) return null;

  // Every page here needs a profile, so send new visitors to setup first.
  if (!profile) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="bubble">We haven&apos;t met yet!</span>
        <Chick size={120} />
        <Link href="/setup" className="btn-primary">
          Hatch your profile
        </Link>
      </main>
    );
  }

  return (
    <>
      <AppNav avatar={profile.avatar} />
      {profile.demo && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b-2 border-line/20 bg-beak/30 px-4 py-1.5 text-center text-sm font-semibold">
          <span>🎬 Demo mode: a sample student, so explore freely!</span>
          <ExitDemoButton />
        </div>
      )}
      {/* Always mounted, so the Egg Timer keeps going on every page */}
      <TimerWatcher />
      {/* Bottom padding on phones so content isn't hidden behind the bottom bar */}
      <div className="flex flex-1 flex-col pb-24 sm:pb-0">{children}</div>
    </>
  );
}
