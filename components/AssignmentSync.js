"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { load, save, update } from "@/lib/storage";
import { addSource, mergeImported, removeSource, RESYNC_AFTER_MS, SOURCE_NAMES, withTodoDefaults } from "@/lib/todos";
import { fetchClassroomAssignments, googleSignInAvailable, hasGoogleToken, signInWithGoogle } from "@/lib/googleClassroom";

// Downloads a linked calendar's assignments and merges them into the To-Do list.
// Returns { added, updated } or throws an Error with a message for the student.
async function syncSource(source, { firstTime = false } = {}) {
  // Signed in with Google: read Classroom directly (needs a click if this visit has no token yet).
  if (source.kind === "google") {
    const accessToken = await signInWithGoogle();
    const items = await fetchClassroomAssignments(accessToken, { sinceDays: firstTime ? 1 : 14 });
    const result = mergeImported(load("todos"), source.id, items);
    save("todos", result.todos);
    return result;
  }
  const res = await fetch("/api/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // The first sync skips old assignments (they're probably already turned in).
    body: JSON.stringify({ url: source.url, kind: source.kind, sinceDays: firstTime ? 1 : 14 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Couldn't sync that calendar.");
  // A Classroom calendar is named after its class; use that if the student didn't name it.
  if (data.calendarName && source.name === SOURCE_NAMES[source.kind]) {
    update("todos", (t) => ({
      ...withTodoDefaults(t),
      sources: withTodoDefaults(t).sources.map((s) => (s.id === source.id ? { ...s, name: data.calendarName } : s)),
    }));
  }
  const result = mergeImported(load("todos"), source.id, data.items);
  save("todos", result.todos);
  return result;
}

function timeAgo(ms) {
  const minutes = Math.round((Date.now() - ms) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours} hr ago` : `${Math.round(hours / 24)} days ago`;
}

// The "Sync" button in the To-Do page header, which opens the pop-up to link a calendar.
export function SyncButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary flex items-center gap-1.5 px-4 py-2">
        <Icon name="repeat" size={16} /> Sync
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Sync your homework" chick="sunny" wide>
        <LinkForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

// The linked calendars, with "Sync now" and "Unlink". Also re-syncs them quietly when the page opens.
export function SyncedSources({ todos }) {
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const refreshed = useRef(false);
  const sources = withTodoDefaults(todos).sources;

  // Quietly re-check linked calendars when the page opens, if it's been a while.
  useEffect(() => {
    if (refreshed.current) return;
    refreshed.current = true;
    for (const source of sources) {
      if (source.kind === "google" && !hasGoogleToken()) continue; // Google's pop-up needs a click
      if (!source.syncedAt || Date.now() - source.syncedAt > RESYNC_AFTER_MS) syncSource(source).catch(() => {});
    }
  }, [sources]);

  async function syncNow(source) {
    setBusyId(source.id);
    setMessage("");
    try {
      const { added, updated } = await syncSource(source);
      setMessage(
        added || updated
          ? `${source.name}: ${added} new, ${updated} updated.`
          : `${source.name} is up to date.`
      );
    } catch (err) {
      setMessage(err.message);
    }
    setBusyId(null);
  }

  if (!sources.length) return null;
  return (
    <>
      {sources.length > 0 && (
        <div className="card mt-6">
          <p className="label-small">Synced homework</p>
          <ul className="mt-2 flex flex-col gap-2">
            {sources.map((source) => (
              <li key={source.id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-chick/40 px-3 py-2 text-sm">
                <Icon name={source.kind === "schoology" ? "book" : "homework"} size={20} />
                <span className="flex-1 font-semibold">
                  {source.name}
                  <span className="block text-xs font-normal text-muted">
                    {source.kind === "google" ? "Signed in with Google" : SOURCE_NAMES[source.kind]} · {source.syncedAt ? `${source.count} assignments · synced ${timeAgo(source.syncedAt)}` : "not synced yet"}
                  </span>
                </span>
                <button type="button" onClick={() => syncNow(source)} disabled={busyId === source.id} className="btn-secondary px-3 py-1 text-xs">
                  {busyId === source.id ? "Syncing…" : "Sync now"}
                </button>
                <button
                  type="button"
                  onClick={() => update("todos", (t) => removeSource(t, source.id))}
                  className="px-2 py-1 text-xs font-semibold text-muted underline"
                >
                  Unlink
                </button>
              </li>
            ))}
          </ul>
          {message && <p className="mt-2 text-sm font-semibold">{message}</p>}
        </div>
      )}
    </>
  );
}

const STEPS = {
  schoology: [
    "Open Schoology on a computer and go to Calendar (top menu).",
    'Click the export button at the top right of the calendar (the one with the calendar icon, labeled "Export").',
    "Copy the iCal / webcal link it shows, and paste it below.",
  ],
  classroom: [
    "Open the class in Google Classroom, go to Classwork, and click \"Google Calendar\" at the top. The class calendar opens.",
    "In Google Calendar, on the left, point at that class's calendar → the three dots → Settings and sharing.",
    'Scroll to "Secret address in iCal format", copy it, and paste it below.',
    "Do this once for each class. (If your school hides the secret address, ask your teacher to post due dates in Schoology, or add homework by hand.)",
  ],
};

function LinkForm({ onDone }) {
  const [kind, setKind] = useState("schoology");
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function connect(e) {
    e.preventDefault();
    if (!url.trim()) return setError("Paste the calendar link first.");
    setBusy(true);
    setError("");
    const { todos, id } = addSource(load("todos"), { kind, url: url.trim(), name });
    save("todos", todos);
    const source = withTodoDefaults(todos).sources.find((s) => s.id === id);
    try {
      const { added } = await syncSource(source, { firstTime: !source.syncedAt });
      setResult({ added, name: withTodoDefaults(load("todos")).sources.find((s) => s.id === id)?.name });
    } catch (err) {
      // Don't keep a link that didn't work.
      update("todos", (t) => removeSource(t, id));
      setError(err.message);
    }
    setBusy(false);
  }

  if (result) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <Icon name="done" size={48} />
        <p className="font-display text-lg font-semibold">
          {result.added ? `Added ${result.added} assignment${result.added === 1 ? "" : "s"} from ${result.name}!` : `Linked ${result.name}. No upcoming assignments right now.`}
        </p>
        <p className="text-sm text-muted">New assignments show up automatically each time you open your To-Do list.</p>
        <button type="button" onClick={onDone} className="btn-primary">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={connect} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {["schoology", "classroom"].map((id) => [id, SOURCE_NAMES[id]]).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setKind(id);
              setError("");
            }}
            className={`rounded-2xl border-[3px] border-line px-3 py-2 font-display font-semibold ${kind === id ? "bg-chick shadow-[0_3px_0_var(--chick-line)]" : "bg-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {kind === "classroom" && <GoogleSignIn onDone={onDone} />}

      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm">
        {STEPS[kind].map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Calendar link</span>
        <input
          className="input"
          placeholder={kind === "schoology" ? "webcal://….schoology.com/calendar/…" : "https://calendar.google.com/calendar/ical/…/basic.ics"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">Name (optional)</span>
        <input
          className="input"
          placeholder={kind === "schoology" ? "e.g. My Schoology" : "Leave blank to use the class name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted">
        The link stays in this browser and is only used to read due dates. Anyone with it could see your calendar, so
        don&apos;t share it.
      </p>

      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Syncing…" : "Link and sync"}
        </button>
      </div>
    </form>
  );
}

// The Google Classroom tab's first option: read Classroom directly. Only shown once the site
// owner has set up Google sign-in (docs/google-classroom-setup.md).
function GoogleSignIn({ onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);

  if (!googleSignInAvailable()) {
    return (
      <p className="rounded-2xl bg-chick/40 px-4 py-2 text-xs text-muted">
        Signing in with Google isn&apos;t set up on this site yet, so use your class calendar link below.
      </p>
    );
  }

  async function signIn() {
    setBusy(true);
    setError("");
    const { todos, id } = addSource(load("todos"), { kind: "google", url: "google:classroom", name: "Google Classroom" });
    save("todos", todos);
    const source = withTodoDefaults(todos).sources.find((s) => s.id === id);
    try {
      const result = await syncSource(source, { firstTime: !source.syncedAt });
      setAdded(result.added);
    } catch (err) {
      if (!source.syncedAt) update("todos", (t) => removeSource(t, id));
      setError(err.message);
    }
    setBusy(false);
  }

  if (added !== null) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-chick/40 p-4 text-center">
        <Icon name="done" size={40} />
        <p className="font-display font-semibold">
          {added ? `Added ${added} assignment${added === 1 ? "" : "s"} from Google Classroom!` : "Google Classroom is linked. Nothing new right now."}
        </p>
        <p className="text-xs text-muted">Anything you&apos;ve turned in is checked off for you.</p>
        <button type="button" onClick={onDone} className="btn-primary px-4 py-1.5 text-sm">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border-[3px] border-line bg-white p-4 text-center">
      <button type="button" onClick={signIn} disabled={busy} className="btn-primary flex items-center gap-2">
        <GoogleG /> {busy ? "Reading your classes…" : "Sign in with Google"}
      </button>
      <p className="text-xs text-muted">
        Reads all your classes at once, and checks off what you&apos;ve already turned in. Read-only: it can&apos;t change
        anything in Classroom.
      </p>
      {error && <p className="w-full rounded-2xl bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      <p className="mt-1 text-xs font-semibold text-muted">or use a class calendar link:</p>
    </div>
  );
}

// Google's "G", drawn in its four colors (Google asks sign-in buttons to show it).
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}

