"use client";

import Link from "next/link";
import AppNav from "@/components/AppNav";
import Chick from "@/components/Chick";
import { useStored } from "@/lib/storage";

// Shared layout for every page in the (app) folder: Barn, Nest, Coop, Timer, Roost, Profile.
// The (app) folder name is in parentheses, so it doesn't appear in the URL (/barn, not /app/barn).
export default function AppLayout({ children }) {
  const profile = useStored("profile");

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
      {/* Bottom padding on phones so content isn't hidden behind the bottom bar */}
      <div className="flex flex-1 flex-col pb-24 sm:pb-0">{children}</div>
    </>
  );
}
