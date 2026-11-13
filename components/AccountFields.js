"use client";

import { useState } from "react";
import { Field } from "@/components/ProfileFields";

export const EMPTY_ACCOUNT = { email: "", username: "", password: "" };

// Checks the sign-up boxes before asking the server. Returns an error message, or "".
export function checkAccount({ email, username, password }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter your email (like name@example.com).";
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) return "Pick a username: 3-20 letters, numbers, or underscores.";
  if (password.length < 8) return "Pick a password with at least 8 characters.";
  return "";
}

// Email, username, and password boxes for making an account.
export function AccountFields({ value, onChange }) {
  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });
  return (
    <div className="flex flex-col gap-4">
      <Field label="Email">
        <input className="input" type="email" autoComplete="email" placeholder="you@example.com" value={value.email} onChange={set("email")} />
      </Field>
      <Field label="Username">
        <input className="input" autoComplete="username" maxLength={20} placeholder="e.g. eggcellent_emma" value={value.username} onChange={set("username")} />
      </Field>
      <Field label="Password">
        <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" value={value.password} onChange={set("password")} />
      </Field>
    </div>
  );
}

export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative flex">
      <input {...props} type={show ? "text" : "password"} className="input w-full pr-20" />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute top-1/2 right-3 -translate-y-1/2 text-sm font-semibold text-muted underline"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "Hide" : "Show"}
      </button>
    </span>
  );
}
