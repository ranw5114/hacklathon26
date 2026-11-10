"use client";

import Link from "next/link";
import Chick from "@/components/Chick";
import { TryDemoButton } from "@/components/DemoButtons";
import { useStored } from "@/lib/storage";

// Start screen. New visitors can set up a profile or try the demo; returning visitors go to the Barn.
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
      {/* Wait until saved data is read, so the buttons point to the right place. */}
      {profile !== undefined && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={profile ? "/barn" : "/setup"} className="btn-primary">
              {profile ? "Go to the Barn" : "Start"}
            </Link>
            {!profile?.demo && <TryDemoButton />}
          </div>
          <p className="text-sm text-muted">The demo loads a sample student, so you can look around right away.</p>
        </div>
      )}
    </main>
  );
}
