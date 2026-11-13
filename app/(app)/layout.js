"use client";

import Icon from "@/components/Icon";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import Chick from "@/components/Chick";
import TimerWatcher from "@/components/TimerWatcher";
import TodoWatcher from "@/components/TodoWatcher";
import NestJobsWatcher from "@/components/NestJobsWatcher";
import { ExitDemoButton } from "@/components/DemoButtons";
import { useMoveOldNest } from "@/lib/nests";
import { useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";

// Shared layout for every page in the (app) folder: Barn, Nest, Coop, Timer, Roost, To-Do, Henhouse, Profile.
// The (app) folder name is in parentheses, so it doesn't appear in the URL (/barn, not /app/barn).
export default function AppLayout({ children }) {
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
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
      <AppNav avatar={avatar} />
      {profile.demo && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b-2 border-line/20 bg-beak/30 px-4 py-1.5 text-center text-sm font-semibold">
          <span className="flex items-center gap-1.5"><Icon name="clapper" size={18} /> Demo mode: a sample student, so explore freely!</span>
          <ExitDemoButton />
        </div>
      )}
      {/* Always mounted, so the Egg Timer keeps going on every page */}
      <TimerWatcher />
      {/* Homework and study reminders, on every page */}
      <TodoWatcher />
      {/* Nests being built in the background keep going on every page */}
      <NestJobsWatcher />
      {/* Bottom padding on phones so content isn't hidden behind the bottom bar */}
      <div className="flex flex-1 flex-col pb-24 sm:pb-0">{children}</div>
    </>
  );
}
