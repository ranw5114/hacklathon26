"use client";

import { useState } from "react";
import { Field } from "@/components/ProfileFields";
import { PasswordInput } from "@/components/AccountFields";
import { changePassword, requestPasswordCode } from "@/lib/account";

// Change (or reset) a password with a code sent by email.
// `login` (username or email) is only needed when logged out, for "Forgot password?".
export default function ChangePassword({ login, onDone, onCancel, needLogin = false }) {
  const [who, setWho] = useState(login ?? "");
  const [sentTo, setSentTo] = useState(null); // where the code went (null = not sent yet)
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (needLogin && !who.trim()) return setError("Enter your username or email.");
    setBusy(true);
    setError("");
    try {
      const to = await requestPasswordCode(needLogin ? who.trim() : undefined);
      setSentTo(to ?? "your email");
    } catch (err) {
      setError(err.message);
    }
    setBusy(false);
  }

  async function save() {
    if (!/^\d{6}$/.test(code.trim())) return setError("Enter the 6-digit code from the email.");
    if (password.length < 8) return setError("Pick a new password with at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      await changePassword({ code: code.trim(), password, login: needLogin ? who.trim() : undefined });
      onDone?.();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-[3px] border-line bg-chick/30 p-4">
      {!sentTo ? (
        <>
          <p className="text-sm">
            {needLogin
              ? "Enter your username or email and we'll send you a code to make a new password."
              : "We'll email you a 6-digit code. Enter it here with your new password."}
          </p>
          {needLogin && (
            <Field label="Username or email">
              <input className="input" autoComplete="username" value={who} onChange={(e) => setWho(e.target.value)} />
            </Field>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={sendCode} disabled={busy} className="btn-primary px-4 py-1.5 text-sm">
              {busy ? "Sending…" : "Email me a code"}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn-secondary px-4 py-1.5 text-sm">
                Cancel
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            {needLogin && sentTo === "your email"
              ? "If that account exists, we sent a code to its email."
              : <>We sent a code to <strong>{sentTo}</strong>.</>}{" "}
            It works for 10 minutes. (Check your spam folder too!)
          </p>
          <Field label="6-digit code">
            <input
              className="input font-display text-xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
          <Field label="New password">
            <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={busy} className="btn-primary px-4 py-1.5 text-sm">
              {busy ? "Saving…" : "Change my password"}
            </button>
            <button type="button" onClick={sendCode} disabled={busy} className="text-sm font-semibold text-muted underline">
              Send a new code
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted underline">
                Cancel
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="rounded-xl bg-red-50 p-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
