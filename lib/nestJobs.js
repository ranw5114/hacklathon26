// Builds nests in the background, so you can leave the Nest Builder (or switch tabs) while the AI
// works, and build several nests at once.
//
// - Attached study-guide PDFs start being read right away, one at a time (lib/studyGuide.js).
//   Their progress lives in memory; a copy of each file is kept in the browser until it's read.
// - "Build my nest" saves a job (storage key "nestJobs"). The job waits for its PDFs, then asks for
//   the plan, saves the nest, and shows a pop-up when it's ready.
// - If the page reloads or the tab closes mid-build, the app picks the job up again next time it
//   opens (resumeNestJobs, called from the app layout), re-reading any PDF that wasn't finished.

import { useSyncExternalStore } from "react";
import { addNest } from "@/lib/nests";
import { load, update } from "@/lib/storage";
import { mergeNotes, readStudyGuide } from "@/lib/studyGuide";
import { dropStashedFile, getStashedFile, stashFile } from "@/lib/fileStash";

const GUIDE_MERGE_CHARS = 40_000; // more notes than this get combined into one shorter set
const BEAT_MS = 4000; // a working tab marks its jobs this often...
const STALE_MS = 15_000; // ...so another tab only takes over a job nobody has touched for this long

// When the page closes or reloads, the browser cancels requests. That isn't a real failure: the job
// stays "working" and picks up again next time the app opens.
let leaving = false;
if (typeof window !== "undefined") window.addEventListener("pagehide", () => (leaving = true));

// ---- Live progress (memory only) --------------------------------------------------------

// guides: { [id]: { status: "waiting" | "working" | "ready" | "error", progress, label, notes, pages, error } }
// notices: nests that just finished, for the pop-up: [{ id, nestId, subject }]
let live = { guides: {}, notices: [] };
const listeners = new Set();
const EMPTY = { guides: {}, notices: [] };

function setLive(change) {
  live = { ...live, ...change(live) };
  listeners.forEach((l) => l());
}
function setGuide(id, changes) {
  if (!live.guides[id]) return; // removed while it was being read
  setLive((s) => ({ guides: { ...s.guides, [id]: { ...s.guides[id], ...changes } } }));
}

export function useNestLive() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => live,
    () => EMPTY
  );
}

export function dismissNotice(id) {
  setLive((s) => ({ notices: s.notices.filter((n) => n.id !== id) }));
}

// ---- Reading PDFs (one at a time, so the free AI isn't overloaded) ------------------------

let queue = Promise.resolve();
const finished = {}; // id → promise that settles when that PDF is read (or fails/is removed)

function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readInQueue(id, file, about) {
  finished[id] = queue = queue.then(async () => {
    if (!live.guides[id]) return; // removed before its turn
    setGuide(id, { status: "working", label: "Opening the PDF…" });
    try {
      const { notes, pages } = await readStudyGuide(file, about, (progress, label) => setGuide(id, { progress, label }));
      setGuide(id, { status: "ready", progress: 1, notes, pages, label: "Read" });
    } catch (err) {
      if (leaving) return; // the page is closing: keep the saved copy so it's read again next time
      setGuide(id, { status: "error", error: err.message || "Couldn't read this PDF." });
    }
    dropStashedFile(id);
  });
  return finished[id];
}

// Starts reading a PDF straight away. Returns its id.
export function attachGuide(file, about) {
  const id = newId("g");
  setLive((s) => ({ guides: { ...s.guides, [id]: { status: "waiting", progress: 0, label: "Waiting its turn…" } } }));
  stashFile(id, file);
  readInQueue(id, file, about);
  return id;
}

// PDFs attached on the Nest Builder that aren't part of a nest yet. A new, blank form drops them.
let draft = [];
export function setDraftGuides(ids) {
  draft = ids;
}
export function discardDraftGuides() {
  if (draft.length) removeGuides(draft);
  draft = [];
}

export function removeGuides(ids) {
  setLive((s) => {
    const guides = { ...s.guides };
    ids.forEach((id) => delete guides[id]);
    return { guides };
  });
  ids.forEach((id) => dropStashedFile(id));
}

// ---- Nest jobs (saved, so they survive a reload) -----------------------------------------
// Each job: { id, test, learner, today, guides: [{ id, name, size, notes?, pages?, failed? }],
//             status: "working" | "error", label, error, beat }

const running = new Set(); // jobs this tab is working on


// Asks for the plan, trying again if the connection drops for a moment.
async function requestPlan(body) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (err) {
      if (leaving || attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

function saveJob(id, changes) {
  update("nestJobs", (jobs) => (jobs ?? []).map((j) => (j.id === id ? { ...j, ...changes } : j)));
}

export function startNestJob({ test, learner, today, guides }) {
  const job = { id: newId("j"), test, learner, today, guides, status: "working", label: "Getting started…", beat: Date.now(), createdAt: Date.now() };
  update("nestJobs", (jobs) => [...(jobs ?? []), job]);
  run(job.id);
  return job.id;
}

export function retryNestJob(id) {
  saveJob(id, { status: "working", error: "", label: "Trying again…", beat: Date.now() });
  run(id);
}

export function cancelNestJob(id) {
  const job = (load("nestJobs") ?? []).find((j) => j.id === id);
  job?.guides.forEach((g) => dropStashedFile(g.id));
  update("nestJobs", (jobs) => (jobs ?? []).filter((j) => j.id !== id));
  running.delete(id);
}

// Picks up jobs that were interrupted (page reloaded, tab closed). Call once when the app opens.
export function resumeNestJobs() {
  const now = Date.now();
  for (const job of load("nestJobs") ?? []) {
    if (job.status === "working" && !running.has(job.id) && now - (job.beat ?? 0) > STALE_MS) run(job.id);
  }
}

async function run(id) {
  if (running.has(id)) return;
  running.add(id);
  const beat = setInterval(() => (running.has(id) ? saveJob(id, { beat: Date.now() }) : clearInterval(beat)), BEAT_MS);
  try {
    const job = () => (load("nestJobs") ?? []).find((j) => j.id === id);
    const start = job();
    if (!start) return;
    const about = { subject: start.test.subject, topic: start.test.topic };

    // 1. Wait for the PDFs. A PDF from before a reload is read again from the saved copy.
    for (const g of start.guides) {
      if (g.notes != null || g.failed) continue;
      saveJob(id, { label: `Reading ${g.name}…` });
      if (!finished[g.id]) {
        const file = await getStashedFile(g.id);
        if (!file) {
          saveGuideResult(id, g.id, { failed: true });
          continue;
        }
        setLive((s) => ({ guides: { ...s.guides, [g.id]: { status: "waiting", progress: 0, label: "Waiting its turn…" } } }));
        readInQueue(g.id, file, about);
      }
      await finished[g.id];
      if (!running.has(id) || leaving) return; // cancelled, or the page is closing
      const result = live.guides[g.id];
      saveGuideResult(id, g.id, result?.status === "ready" ? { notes: result.notes ?? "", pages: result.pages ?? null } : { failed: true });
    }

    // 2. Put the notes together.
    const current = job();
    const ready = current.guides.filter((g) => g.notes);
    const labelled = ready.map((g) => (ready.length > 1 ? `From "${g.name}":\n${g.notes}` : g.notes));
    let guide = labelled.join("\n\n");
    if (guide.length > GUIDE_MERGE_CHARS && ready.length > 1) {
      saveJob(id, { label: "Combining the notes from your PDFs…" });
      guide = await mergeNotes(labelled, about);
    }

    // 3. Build the plan.
    saveJob(id, { label: `Researching ${current.test.subject} and building your nest…` });
    const test = { ...current.test, guide, guideFiles: ready.map((g) => ({ name: g.name, pages: g.pages ?? null })) };
    const res = await requestPlan({ learner: current.learner, test, today: current.today });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    if (!running.has(id) || !job()) return; // cancelled while waiting

    // 4. Save the nest (with its research, like before) and say it's ready.
    const { research, ...plan } = data;
    const nestId = addNest({ ...test, brief: research?.brief ?? "", sources: research?.sources ?? [], basis: research?.basis ?? [] }, plan);
    update("nestJobs", (jobs) => (jobs ?? []).filter((j) => j.id !== id));
    current.guides.forEach((g) => removeGuides([g.id]));
    setLive((s) => ({ notices: [...s.notices, { id, nestId, subject: test.subject }] }));
  } catch (err) {
    if (running.has(id) && !leaving) saveJob(id, { status: "error", error: err.message || "Something went wrong. Please try again." });
  } finally {
    running.delete(id);
    clearInterval(beat);
  }
}

function saveGuideResult(jobId, guideId, result) {
  update("nestJobs", (jobs) =>
    (jobs ?? []).map((j) => (j.id === jobId ? { ...j, guides: j.guides.map((g) => (g.id === guideId ? { ...g, ...result } : g)) } : j))
  );
}
