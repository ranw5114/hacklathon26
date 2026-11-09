"use client";

import Link from "next/link";
import Chick from "@/components/Chick";
import { useStored } from "@/lib/storage";

// Start screen. New visitors go to setup; returning visitors go straight to the Barn.
export default function StartPage() {
  const profile = useStored("profile");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span className="bubble">
        {profile ? `Welcome back, ${profile.name}!` : "Ready to study? Let's do this!"}
      </span>
      <Chick size={180} />
      <p className="max-w-md text-muted">
        Tell me your goal grade and I&apos;ll build a study plan to get you there, one step at a time.
      </p>
      {/* Wait until saved data is read, so the button points to the right place. */}
      {profile !== undefined && (
        <Link href={profile ? "/barn" : "/setup"} className="btn-primary">
          {profile ? "Go to the Barn" : "Start"}
        </Link>
      )}
    </main>
  );
}
