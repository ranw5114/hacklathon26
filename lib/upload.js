// Browser side of Coop attachments. Photos are shrunk and sent with the message (like before).
// Everything else (PDFs, Word/PowerPoint/Excel, text and code, audio, video) is uploaded straight
// from the browser to Google's AI file storage, so there's no 4.5 MB limit: files can be up to 2 GB.

import { classifyFile } from "@/lib/attachmentTypes";
import { resizeImage } from "@/lib/images";
import { officeText } from "@/lib/officeText";

const PROCESSING_POLL_MS = 2000;
const PROCESSING_MAX_MS = 5 * 60 * 1000;

// Prepares one picked file. Returns one of:
//   { type: "photo", name, mimeType, data, preview }               (sent inside the message)
//   { type: "file", name, size, mimeType, uri, uploadedAt, note }  (uploaded to Google)
// `onProgress(fraction, label)` reports what's happening, for the progress bar.
export async function prepareAttachment(file, onProgress = () => {}) {
  const sort = classifyFile(file);
  if (sort.kind === "unsupported") throw new Error(sort.reason);

  if (sort.kind === "photo") {
    onProgress(1, "Ready");
    return { type: "photo", name: file.name, ...(await resizeImage(file)) };
  }

  let blob = file;
  let mimeType = sort.mimeType;
  let note = "";
  if (sort.kind === "office") {
    onProgress(0, `Reading the ${sort.app} file…`);
    blob = new Blob([await officeText(file, sort.ext)], { type: "text/plain" });
    mimeType = "text/plain";
    note = `${sort.app} file (text only)`;
  } else if (sort.kind === "text") {
    blob = new Blob([await file.text()], { type: "text/plain" });
    mimeType = "text/plain";
  }

  const uploaded = await uploadToGoogle(blob, file.name, mimeType, onProgress);
  return { type: "file", name: file.name, size: file.size, mimeType, uri: uploaded.uri, uploadedAt: Date.now(), note };
}

async function uploadToGoogle(blob, name, mimeType, onProgress) {
  // 1. Our server starts the upload (it holds the API key) and hands back a one-time upload link.
  onProgress(0, "Starting upload…");
  const start = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType, size: blob.size }),
  });
  const startData = await start.json();
  if (!start.ok) throw new Error(startData.error || "Couldn't start the upload.");

  // 2. The browser sends the file straight to Google, reporting progress.
  const file = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", startData.uploadUrl);
    xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
    xhr.setRequestHeader("X-Goog-Upload-Offset", "0");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total, "Uploading…");
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.file?.uri) resolve(data.file);
        else reject(new Error("The upload didn't finish. Please try again."));
      } catch {
        reject(new Error("The upload didn't finish. Please try again."));
      }
    };
    xhr.onerror = () => reject(new Error("The upload stopped. Check your connection and try again."));
    xhr.send(blob);
  });

  // 3. Videos (and sometimes big files) need a moment before the AI can read them.
  const startedWaiting = Date.now();
  let state = file.state;
  while (state === "PROCESSING") {
    if (Date.now() - startedWaiting > PROCESSING_MAX_MS) throw new Error("That file is taking too long to process. Try a shorter one.");
    onProgress(1, "Getting it ready for the AI…");
    await new Promise((r) => setTimeout(r, PROCESSING_POLL_MS));
    const check = await fetch(`/api/files?name=${encodeURIComponent(file.name)}`);
    state = (await check.json()).state;
  }
  if (state === "FAILED") throw new Error("Google couldn't process that file. Try a different format.");
  onProgress(1, "Ready");
  return file;
}

// Google keeps uploaded files for 48 hours. Older ones can't be sent to the AI again.
export const FILE_LIFETIME_MS = 47 * 60 * 60 * 1000;
export function fileStillAvailable(attachment, now = Date.now()) {
  return attachment?.uri && now - attachment.uploadedAt < FILE_LIFETIME_MS;
}
