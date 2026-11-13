// Browser side of study-guide PDFs on the Nest Builder. There's no limit on how many PDFs or how
// big they are: each one is split into parts of up to 100 pages (and about 40 MB), every part is
// uploaded straight to Google (see lib/upload.js), and the AI turns each part into study notes.
// Only those notes are kept with the nest, so lessons can use them long after Google deletes the
// uploaded files (48 hours).

import { PDFDocument } from "pdf-lib";
import { uploadToGoogle } from "@/lib/upload";

const PART_PAGES = 100; // ~26k AI tokens a part: quick to read, well inside the AI's limits
const PART_BYTES = 40 * 1024 * 1024; // Google reads PDFs up to 50 MB at a time
const BUSY_WAIT_MS = 30_000; // the free AI allows a set amount of reading per minute
const BUSY_TRIES = 6;

export function isPdf(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

// Reads one PDF into study notes. Returns { pages, notes }.
// `onProgress(fraction, label)` reports how far along it is (0 to 1).
export async function readStudyGuide(file, { subject, topic }, onProgress = () => {}) {
  onProgress(0, "Opening the PDF…");
  const parts = await splitPdf(file);
  const pages = parts.reduce((n, p) => n + (p.pages ?? 0), 0) || null;
  const notes = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const prefix = parts.length > 1 ? `Part ${i + 1} of ${parts.length}: ` : "";
    // Uploading is the first half of each part's progress, reading it the second half.
    const uploaded = await uploadToGoogle(part.blob, file.name, "application/pdf", (f, label) =>
      onProgress((i + f * 0.5) / parts.length, prefix + label)
    );
    onProgress((i + 0.5) / parts.length, `${prefix}Reading it…`);
    const text = await askAi({
      mode: "read",
      file: { uri: uploaded.uri, name: uploaded.name },
      fileName: file.name,
      part: parts.length > 1 ? `pages ${part.from}-${part.to}` : "",
      subject,
      topic,
    });
    if (text) notes.push(parts.length > 1 ? `(${file.name}, pages ${part.from}-${part.to})\n${text}` : text);
  }
  onProgress(1, "Done");
  return { pages, notes: notes.join("\n\n") };
}

// Shrinks many files' notes into one set that fits in a plan request (used when there are lots).
export async function mergeNotes(texts, { subject, topic }) {
  return askAi({ mode: "merge", texts, subject, topic });
}

// Splits a PDF into parts the AI can read in one go. Small PDFs are sent as they are.
async function splitPdf(file) {
  let doc;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
  } catch {
    // A PDF this library can't open (e.g. password-protected): send it whole if Google can take it.
    if (file.size <= PART_BYTES) return [{ blob: file, from: 1, to: null, pages: null }];
    throw new Error("This PDF couldn't be opened (it may be password-protected). Try saving a copy without a password.");
  }
  const total = doc.getPageCount();
  if (total <= PART_PAGES && file.size <= PART_BYTES) return [{ blob: file, from: 1, to: total, pages: total }];

  const parts = [];
  for (let start = 0; start < total; start += PART_PAGES) {
    parts.push(...(await makeParts(doc, start, Math.min(start + PART_PAGES, total))));
  }
  return parts;
}

// Copies pages [start, end) into a new PDF, halving the range until it's under the size limit.
async function makeParts(doc, start, end) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, Array.from({ length: end - start }, (_, i) => start + i));
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  if (bytes.length > PART_BYTES && end - start > 1) {
    const mid = Math.floor((start + end) / 2);
    return [...(await makeParts(doc, start, mid)), ...(await makeParts(doc, mid, end))];
  }
  return [{ blob: new Blob([bytes], { type: "application/pdf" }), from: start + 1, to: end, pages: end - start }];
}

// Calls /api/guide, waiting and trying again while the free AI is at its per-minute limit.
async function askAi(body) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch("/api/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data.notes ?? "";
    if ([429, 503, 504].includes(res.status) && attempt < BUSY_TRIES) {
      await new Promise((r) => setTimeout(r, BUSY_WAIT_MS));
      continue;
    }
    throw new Error(data.error || "The AI couldn't read this PDF. Please try again.");
  }
}
