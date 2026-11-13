"use client";

import Link from "next/link";
import Chick from "@/components/Chick";
import { TryDemoButton } from "@/components/DemoButtons";
import { useStored } from "@/lib/storage";
import { useAccount, useAccountsAvailable } from "@/lib/account";

// Start screen. New visitors sign up, log in, or try the demo; returning visitors go to the Barn.
export default function StartPage() {
  const profile = useStored("profile");
  const account = useAccount();
  const accounts = useAccountsAvailable(); // false if the accounts database isn't set up

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
      {profile !== undefined && accounts !== undefined && (
        <div className="flex flex-col items-center gap-3">
          {profile ? (
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/barn" className="btn-primary">
                Go to the Barn
              </Link>
              {!profile.demo && !account && accounts && (
                <Link href="/account" className="btn-secondary">
                  Make an account
                </Link>
              )}
            </div>
          ) : accounts ? (
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/setup" className="btn-primary">
                Sign up
              </Link>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
            </div>
          ) : (
            <Link href="/setup" className="btn-primary">
              Start
            </Link>
          )}
          {!profile?.demo && (
            <>
              <TryDemoButton />
              <p className="text-sm text-muted">The demo loads a sample student, so you can look around right away.</p>
            </>
          )}
          {profile && !profile.demo && !account && accounts && (
            <p className="max-w-sm text-sm text-muted">Make an account to keep your progress safe and pick up on any device.</p>
          )}
        </div>
      )}
    </main>
  );
}
