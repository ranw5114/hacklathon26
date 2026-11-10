"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/Modal";
import { exitDemo, loadDemo } from "@/lib/demo";
import { useStored } from "@/lib/storage";

// "Try the demo" button. If the user has their own data, it explains that it's saved first.
export function TryDemoButton({ className = "btn-secondary" }) {
  const router = useRouter();
  const profile = useStored("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirm();

  async function tryDemo() {
    if (profile && !profile.demo) {
      const ok = await confirm({
        title: "Try the demo?",
        message:
          "You'll explore a sample student's account. Your own progress is saved and comes back when you press \"Exit demo\".",
        confirmLabel: "Try the demo",
        chick: "mint",
      });
      if (!ok) return;
    }
    setLoading(true);
    if (await loadDemo()) {
      router.push("/barn");
    } else {
      setError("Couldn't save a backup of your data, so the demo didn't load. Your data is unchanged.");
      setLoading(false);
    }
  }

  return (
    <>
      {dialog}
      <button type="button" onClick={tryDemo} disabled={loading} className={className}>
        {loading ? "Hatching the demo…" : "Try the demo"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </>
  );
}

// "Exit demo" button: brings back the user's own data, or returns to the start screen.
export function ExitDemoButton({ className = "underline" }) {
  const router = useRouter();

  return (
    <button type="button" onClick={() => router.push(exitDemo() ? "/barn" : "/")} className={className}>
      Exit demo
    </button>
  );
}
