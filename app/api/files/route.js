// Uploads for the Coop chat. Files go from the student's browser STRAIGHT to Google's Gemini
// file storage (up to 2 GB, kept for 48 hours), so they never pass through our server, which
// can only accept requests up to about 4.5 MB on Vercel.
//
// POST { name, mimeType, size } → { uploadUrl }: starts an upload session. The API key stays here;
//   the upload link Google returns only works for this one file, from this website.
// GET ?name=files/abc → { state, uri, mimeType }: checks a file Google is still processing (videos).

import { SUPPORTED_UPLOAD_TYPES } from "@/lib/attachmentTypes";

const API = "https://generativelanguage.googleapis.com";
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // Google's limit per file

function apiKey() {
  return process.env.GEMINI_API_KEY;
}

export async function POST(request) {
  const { name, mimeType, size } = await request.json();
  if (!SUPPORTED_UPLOAD_TYPES.includes(mimeType)) {
    return Response.json({ error: "The AI can't read that kind of file." }, { status: 400 });
  }
  if (!Number.isFinite(size) || size <= 0) return Response.json({ error: "That file is empty." }, { status: 400 });
  if (size > MAX_BYTES) return Response.json({ error: "Files can be up to 2 GB." }, { status: 400 });

  // Google only lets the browser finish the upload if the session names the website it comes from.
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const res = await fetch(`${API}/upload/v1beta/files`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey(),
      Origin: origin,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(size),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: { display_name: String(name || "file").slice(0, 120) } }),
  });
  const uploadUrl = res.headers.get("x-goog-upload-url");
  if (!res.ok || !uploadUrl) {
    console.error("Upload session failed:", res.status, await res.text().catch(() => ""));
    const error = res.status === 429 ? "The AI's file storage is busy right now. Please try again in a minute." : "Couldn't start the upload. Please try again.";
    return Response.json({ error }, { status: 502 });
  }
  return Response.json({ uploadUrl });
}

export async function GET(request) {
  const name = new URL(request.url).searchParams.get("name") || "";
  if (!/^files\/[a-z0-9-]+$/i.test(name)) return Response.json({ error: "Unknown file." }, { status: 400 });
  const res = await fetch(`${API}/v1beta/${name}`, { headers: { "x-goog-api-key": apiKey() } });
  if (!res.ok) return Response.json({ error: "Couldn't check that file." }, { status: 502 });
  const file = await res.json();
  return Response.json({ state: file.state, uri: file.uri, mimeType: file.mimeType });
}
