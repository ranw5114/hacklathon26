"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { Field } from "@/components/ProfileFields";
import { PasswordInput } from "@/components/AccountFields";
import { logIn } from "@/lib/account";
import ChangePassword from "@/components/ChangePassword";

// Log in to an account, on any device. Your progress comes with you.
export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!login.trim() || !password) return setError("Enter your username (or email) and password.");
    setBusy(true);
    setError("");
    try {
      await logIn({ login: login.trim(), password });
      router.push("/barn");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-12">
      <span className="bubble">Welcome back! I missed you!</span>
      <Chick size={110} mood="love" className="mt-4" />
      <form onSubmit={submit} className="card mt-4 flex w-full flex-col gap-4">
        <h1 className="text-2xl">Log in</h1>
        <Field label="Username or email">
          <input className="input" autoComplete="username" value={login} onChange={(e) => setLogin(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Logging in…" : "Log in"}
        </button>
        {!forgot && (
          <button type="button" onClick={() => setForgot(true)} className="text-sm font-semibold text-muted underline">
            Forgot your password?
          </button>
        )}
        <p className="text-center text-sm text-muted">
          New here?{" "}
          <Link href="/setup" className="font-semibold underline">
            Sign up
          </Link>
        </p>
      </form>
      {forgot && (
        <div className="mt-4 w-full">
          <ChangePassword needLogin login={login} onCancel={() => setForgot(false)} onDone={() => router.push("/barn")} />
        </div>
      )}
      <Link href="/" className="mt-4 text-sm font-semibold text-muted hover:underline">
        ← Back
      </Link>
    </main>
  );
}
