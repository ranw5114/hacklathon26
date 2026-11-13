"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { notify, playDing } from "@/lib/alerts";
import { todayString } from "@/lib/dates";
import { useNests } from "@/lib/nests";
import { load, save, useStored } from "@/lib/storage";
import { remindersDue } from "@/lib/todos";
import { useNow } from "@/lib/useNow";

// Lives in the shared layout, so it runs on every page. Once a minute it checks for homework
// that's due soon or overdue, and for unfinished lessons in the evening. Each reminder is sent
// once: as a browser notification (if allowed) and as a little pop-up inside the app.
export default function TodoWatcher() {
  const nests = useNests();
  const todos = useStored("todos");
  const now = useNow();
  const [popups, setPopups] = useState([]); // reminders shown inside the app until dismissed
  const minute = Math.floor(now / 60_000); // only re-check once a minute

  useEffect(() => {
    if (nests === undefined || todos === undefined) return;
    const moment = minute * 60_000;
    const due = remindersDue(load("todos"), nests, moment, todayString());
    if (!due.length) return;

    // Record them first, so they're never sent twice (even from another tab).
    save("todos", due.reduce((t, reminder) => reminder.mark(t), load("todos")));
    for (const reminder of due) notify(`🐔 ${reminder.title}`, reminder.body);
    playDing();
    // Shown from a timer, not straight from the effect, so React isn't re-rendering mid-effect.
    // (Not cancelled on cleanup: saving above re-runs this effect, and the pop-ups must still appear.)
    setTimeout(() => setPopups((current) => [...current, ...due].slice(-3)), 0);
  }, [minute, nests, todos]);

  if (!popups.length) return null;

  return (
    <div className="fixed right-4 bottom-24 z-40 flex max-w-sm flex-col gap-2 sm:bottom-6">
      {popups.map((reminder) => (
        <div
          key={reminder.id}
          role="status"
          className="flex items-start gap-3 rounded-2xl border-[3px] border-line bg-white px-4 py-3 shadow-[0_4px_0_var(--chick-line)]"
        >
          <Icon name="bell" size={28} />
          <div className="flex-1 text-sm">
            <p className="font-display font-semibold">{reminder.title}</p>
            <p className="text-muted">{reminder.body}</p>
            <Link
              href={reminder.href}
              onClick={() => setPopups((current) => current.filter((p) => p.id !== reminder.id))}
              className="mt-1 inline-block font-semibold underline"
            >
              Open my To-Do list
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setPopups((current) => current.filter((p) => p.id !== reminder.id))}
            aria-label="Dismiss reminder"
            className="text-muted hover:text-foreground"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
