"use client";

import { useState } from "react";
import Modal, { useConfirm } from "@/components/Modal";
import { remove, save } from "@/lib/storage";
import { sampleEvents } from "@/lib/sampleCalendar";

// Asks our server to read the calendar link, then saves the events in this browser.
export async function syncCalendar(url) {
  const res = await fetch("/api/calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  save("calendar", { source: "link", url, events: data.events, syncedAt: Date.now() });
  return data.events.length;
}

function timeAgo(timestamp) {
  const minutes = Math.round((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} hr ago`;
}

// The toolbar button: shows the sync status and opens the sync pop-up.
export default function CalendarSyncButton({ calendar, open, onOpenChange }) {
  const label = !calendar ? "📅 Sync calendar" : calendar.source === "sample" ? "📅 Sample schedule" : "📅 Synced ✓";

  return (
    <>
      <button type="button" onClick={() => onOpenChange(true)} className="btn-secondary px-4 py-1.5 text-sm">
        {label}
      </button>
      <Modal open={open} onClose={() => onOpenChange(false)} title="Calendar sync" chick="peach" wide>
        <SyncPanel calendar={calendar} onDone={() => onOpenChange(false)} />
      </Modal>
    </>
  );
}

// What's inside the pop-up. It changes depending on what's connected right now.
function SyncPanel({ calendar, onDone }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirm();

  async function connect(link) {
    if (!link.trim()) return setError("Paste your calendar link first.");
    setLoading(true);
    setError("");
    try {
      await syncCalendar(link.trim()); // replaces the sample schedule or an old link
      setUrl("");
      onDone();
    } catch (err) {
      setError(err.message || "Couldn't sync that calendar.");
    }
    setLoading(false);
  }

  function loadSample() {
    save("calendar", { source: "sample", url: null, events: sampleEvents(), syncedAt: Date.now() });
    onDone();
  }

  async function removeCalendar() {
    const isSample = calendar.source === "sample";
    if (!isSample) {
      const ok = await confirm({
        title: "Remove your calendar?",
        message: "Your events will disappear from the Roost. Your real calendar isn't changed.",
        confirmLabel: "Remove",
        danger: true,
      });
      if (!ok) return;
    }
    remove("calendar");
  }

  return (
    <div className="flex flex-col gap-4">
      {dialog}

      {/* Current status */}
      {calendar?.source === "sample" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-chick/50 px-4 py-3">
          <span className="font-semibold">You&apos;re viewing a sample school schedule.</span>
          <button type="button" onClick={removeCalendar} className="btn-secondary px-4 py-1.5 text-sm">
            Remove sample schedule
          </button>
        </div>
      )}
      {calendar?.source === "link" && (
        <div className="flex flex-col gap-2 rounded-2xl bg-sky-50 px-4 py-3">
          <span className="font-semibold">
            ✓ Synced · {calendar.events.length} events · updated {timeAgo(calendar.syncedAt)}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => connect(calendar.url)}
              disabled={loading}
              className="btn-secondary px-4 py-1.5 text-sm"
            >
              {loading ? "Refreshing…" : "Refresh now"}
            </button>
            <button type="button" onClick={removeCalendar} className="btn-secondary px-4 py-1.5 text-sm text-red-800">
              Remove calendar
            </button>
          </div>
        </div>
      )}

      {/* Connect (or switch to) a real calendar */}
      <div>
        <h3 className="text-lg">{calendar?.source === "link" ? "Use a different calendar" : "Connect my calendar"}</h3>
        <p className="text-sm text-muted">
          See your classes and activities next to your study plan, and get study-time suggestions that fit around them.
          We can only read your calendar, never change it, and your link is saved only in this browser.
        </p>
      </div>

      <details className="rounded-2xl bg-chick/40 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold">Where do I find my calendar link?</summary>
        <ul className="mt-2 flex list-disc flex-col gap-2 pl-5">
          <li>
            <strong>Google Calendar</strong> (on a computer): Settings ⚙️ → click your calendar on the left → scroll to
            &quot;Integrate calendar&quot; → copy <strong>&quot;Secret address in iCal format&quot;</strong>.
          </li>
          <li>
            <strong>Apple Calendar (iCloud)</strong>: tap ⓘ next to a calendar → turn on <strong>Public Calendar</strong> →
            Share Link (it starts with webcal://).
          </li>
          <li>
            <strong>Outlook</strong>: Settings → Calendar → Shared calendars → Publish a calendar → copy the{" "}
            <strong>ICS</strong> link.
          </li>
        </ul>
      </details>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          connect(url);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          className="input flex-1"
          placeholder="Paste your calendar link (https://… or webcal://…)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Syncing…" : "Sync"}
        </button>
      </form>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {calendar?.source !== "sample" && (
        <div className="flex flex-wrap items-center gap-3 border-t-2 border-line/10 pt-4">
          <span className="text-sm text-muted">No link handy?</span>
          <button type="button" onClick={loadSample} className="btn-secondary px-4 py-1.5 text-sm">
            Try a sample school schedule
          </button>
        </div>
      )}
    </div>
  );
}
