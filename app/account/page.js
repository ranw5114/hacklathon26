"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { AccountFields, checkAccount, EMPTY_ACCOUNT } from "@/components/AccountFields";
import { signUp, useAccount } from "@/lib/account";
import { useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";

// For someone already using the app on this device: make an account from their progress, so
// they can log in anywhere.
export default function MakeAccountPage() {
  const router = useRouter();
  const profile = useStored("profile");
  const account = useAccount();
  const avatar = useAvatar();
  const [form, setForm] = useState(EMPTY_ACCOUNT);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (profile === undefined) return null;
  if (!profile || profile.demo) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="bubble">{profile?.demo ? "Leave the demo first, then make your account." : "Let's set up your profile first!"}</span>
        <Chick size={110} />
        <Link href={profile?.demo ? "/profile" : "/setup"} className="btn-primary">
          {profile?.demo ? "Go to settings" : "Sign up"}
        </Link>
      </main>
    );
  }
  if (account && !account.expired) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="bubble">You&apos;re logged in as {account.username}!</span>
        <Chick variant={avatar} size={110} mood="love" />
        <Link href="/barn" className="btn-primary">
          Go to the Barn
        </Link>
      </main>
    );
  }

  async function submit(e) {
    e.preventDefault();
    const problem = checkAccount(form);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      await signUp({ ...form, email: form.email.trim(), username: form.username.trim() });
      router.push("/barn");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-12">
      <span className="bubble">Take me everywhere you go!</span>
      <Chick variant={avatar} size={110} className="mt-4" />
      <form onSubmit={submit} className="card mt-4 flex w-full flex-col gap-4">
        <div>
          <h1 className="text-2xl">Make your account</h1>
          <p className="mt-1 text-sm text-muted">Everything you&apos;ve done so far comes with you. Log in on any device to pick up where you left off.</p>
        </div>
        <AccountFields value={form} onChange={(v) => (setForm(v), setError(""))} />
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Making your account…" : "Make my account"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have one?{" "}
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          (this replaces what&apos;s on this device with your account&apos;s progress)
        </p>
      </form>
    </main>
  );
}
