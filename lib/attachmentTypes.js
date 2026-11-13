// Which files the Coop chat accepts, and how each one is sent to the AI. Shared by the browser
// (to sort files out) and the server (to check uploads).

// File types Google's AI reads directly from its file storage.
export const SUPPORTED_UPLOAD_TYPES = [
  "application/pdf",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "audio/wav",
  "audio/mp3",
  "audio/aiff",
  "audio/aac",
  "audio/ogg",
  "audio/flac",
  "video/mp4",
  "video/mpeg",
  "video/mov",
  "video/avi",
  "video/x-flv",
  "video/mpg",
  "video/webm",
  "video/wmv",
  "video/3gpp",
];

// Browsers name some types differently from Google.
const RENAME = {
  "audio/mpeg": "audio/mp3",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/x-aiff": "audio/aiff",
  "audio/x-flac": "audio/flac",
  "audio/mp4": "audio/aac",
  "audio/x-m4a": "audio/aac",
  "video/quicktime": "video/mov",
  "video/x-msvideo": "video/avi",
  "video/x-ms-wmv": "video/wmv",
  "video/3gpp2": "video/3gpp",
};

const BY_EXTENSION = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp3: "audio/mp3",
  wav: "audio/wav",
  aiff: "audio/aiff",
  aac: "audio/aac",
  m4a: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  flac: "audio/flac",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mpeg: "video/mpeg",
  mpg: "video/mpg",
  mov: "video/mov",
  avi: "video/avi",
  flv: "video/x-flv",
  webm: "video/webm",
  wmv: "video/wmv",
  "3gp": "video/3gpp",
};

// Read as plain text: notes, data, and code of any kind.
const TEXT_EXTENSIONS = new Set(
  "txt md markdown csv tsv json xml html htm css js jsx ts tsx mjs py java c h cpp hpp cs go rb php swift kt rs sql sh bat yml yaml toml ini log tex bib r m scala lua pl dart vue svelte rtf srt vtt".split(" ")
);

// Office files: the browser pulls the text out first (see lib/officeText.js).
export const OFFICE_EXTENSIONS = { docx: "Word", pptx: "PowerPoint", xlsx: "Excel" };

// Old Office files (before 2007) are a closed binary format.
const OLD_OFFICE = { doc: "docx", ppt: "pptx", xls: "xlsx" };

function extensionOf(name) {
  const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

// Sorts a picked file into how it'll be sent:
//   { kind: "photo" }                    small images, shrunk in the browser and sent with the message
//   { kind: "upload", mimeType }         sent to Google's file storage as is
//   { kind: "text" }                     read as text, then uploaded as text/plain
//   { kind: "office", app }              text pulled out of a Word/PowerPoint/Excel file, then uploaded
//   { kind: "unsupported", reason }
export function classifyFile(file) {
  const ext = extensionOf(file.name);
  const type = RENAME[file.type] || file.type || "";

  if (OFFICE_EXTENSIONS[ext]) return { kind: "office", app: OFFICE_EXTENSIONS[ext], ext };
  if (OLD_OFFICE[ext]) return { kind: "unsupported", reason: `Old .${ext} files can't be read. Save it as .${OLD_OFFICE[ext]} or PDF and try again.` };

  // Everyday photos (JPG, PNG, WebP, GIF, BMP) are shrunk and sent with the message, like before.
  // HEIC (iPhone) can't be shrunk in most browsers, so it's uploaded instead.
  if (/^image\/(jpeg|png|webp|gif|bmp)$/.test(type) || ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext)) return { kind: "photo" };

  const mimeType = SUPPORTED_UPLOAD_TYPES.includes(type) ? type : BY_EXTENSION[ext];
  if (mimeType && mimeType !== "text/plain") return { kind: "upload", mimeType };

  if (type.startsWith("text/") || TEXT_EXTENSIONS.has(ext) || type === "application/json" || type === "application/xml") return { kind: "text" };

  return { kind: "unsupported", reason: "The AI can't read that kind of file. Try a PDF, photo, Word, PowerPoint, Excel, text, audio, or video file." };
}

// What icon to show for an attachment.
export function attachmentIcon(kindOrMime = "") {
  if (kindOrMime.startsWith("video")) return "clapper";
  if (kindOrMime.startsWith("audio")) return "bell";
  if (kindOrMime.startsWith("image")) return "sparkle";
  return "homework";
}

// "12.4 MB"
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
