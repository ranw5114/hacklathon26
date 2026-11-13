// "Sign in with Google" for the To-Do list: reads the student's Google Classroom assignments
// straight from Google, including which ones they've already turned in.
//
// Runs in the browser only. It uses Google's own sign-in library, so no secret is needed on our
// server; the access token stays in memory for this visit and is never saved.
// Setup (once, by the site owner): see docs/google-classroom-setup.md, then set
// NEXT_PUBLIC_GOOGLE_CLIENT_ID. Without it, the sign-in button simply doesn't appear.

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// Read-only: the student's classes, and their own assignments and submissions.
const SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
].join(" ");

const API = "https://classroom.googleapis.com/v1";
const DAY = 86_400_000;

export function googleSignInAvailable() {
  return Boolean(GOOGLE_CLIENT_ID);
}

let token = null; // { value, expiresAt }

function loadGoogleLibrary() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Google sign-in. Check your connection and try again."));
    document.head.appendChild(script);
  });
}

// Opens Google's sign-in pop-up (must be called from a click) and resolves with an access token.
// If this visit already has a fresh token, it's reused without a pop-up.
export async function signInWithGoogle() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  await loadGoogleLibrary();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) return reject(new Error(friendlyError(response.error)));
        token = { value: response.access_token, expiresAt: Date.now() + Number(response.expires_in || 3600) * 1000 };
        resolve(token.value);
      },
      error_callback: (err) => reject(new Error(friendlyError(err?.type))),
    });
    client.requestAccessToken();
  });
}

export function hasGoogleToken() {
  return Boolean(token && token.expiresAt > Date.now() + 60_000);
}

function friendlyError(code) {
  if (code === "popup_closed" || code === "access_denied") return "Google sign-in was cancelled.";
  if (code === "popup_failed_to_open") return "Your browser blocked the Google sign-in pop-up. Allow pop-ups for this site and try again.";
  return "Google sign-in didn't work. If you use a school account, your school may need to allow this app.";
}

async function get(path, accessToken) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 401) {
    token = null;
    throw new Error("Your Google sign-in expired. Please sign in again.");
  }
  if (res.status === 403) throw new Error("Google Classroom said no. Your school may not allow this app, or the Classroom API isn't turned on.");
  if (!res.ok) throw new Error("Couldn't read Google Classroom right now. Please try again.");
  return res.json();
}

// Follows Google's "next page" links (capped, so a huge account can't hang the page).
async function getAll(path, key, accessToken, maxPages = 5) {
  const items = [];
  let pageToken = "";
  for (let page = 0; page < maxPages; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const data = await get(`${path}${pageToken ? `${sep}pageToken=${encodeURIComponent(pageToken)}` : ""}`, accessToken);
    items.push(...(data[key] ?? []));
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return items;
}

// Google gives due dates in UTC as { year, month, day } and { hours, minutes }.
// Returns an exact ISO time (or null if there's no due date).
export function classroomDueAt(work) {
  const d = work.dueDate;
  if (!d?.year || !d?.month || !d?.day) return null;
  const t = work.dueTime ?? {};
  // No time means due by the end of the day; Google uses 23:59 in that case too.
  const hours = t.hours ?? (work.dueTime ? 0 : 23);
  const minutes = t.minutes ?? (work.dueTime ? 0 : 59);
  return new Date(Date.UTC(d.year, d.month - 1, d.day, hours, minutes)).toISOString();
}

// Every assignment with a due date in the student's active classes, as items for mergeImported:
// { uid, title, dueAt, dueDate, link, className, turnedIn }. Only items due from `sinceDays` ago onward.
export async function fetchClassroomAssignments(accessToken, { sinceDays = 14 } = {}) {
  const since = Date.now() - sinceDays * DAY;
  const courses = await getAll("/courses?studentId=me&courseStates=ACTIVE&pageSize=50", "courses", accessToken, 3);
  const items = [];
  for (const course of courses) {
    const [work, submissions] = await Promise.all([
      getAll(`/courses/${course.id}/courseWork?courseWorkStates=PUBLISHED&orderBy=dueDate%20desc&pageSize=50`, "courseWork", accessToken, 2),
      getAll(`/courses/${course.id}/courseWork/-/studentSubmissions?userId=me&pageSize=100`, "studentSubmissions", accessToken, 2),
    ]);
    const turnedIn = new Set(
      submissions.filter((s) => s.state === "TURNED_IN" || s.state === "RETURNED").map((s) => s.courseWorkId)
    );
    for (const w of work) {
      const dueAt = classroomDueAt(w);
      if (!dueAt || new Date(dueAt).getTime() < since) continue;
      items.push({
        uid: `classroom-${course.id}-${w.id}`,
        title: w.title || "Assignment",
        dueAt,
        dueDate: dueAt.slice(0, 10),
        link: w.alternateLink || "",
        className: course.name || "Google Classroom",
        turnedIn: turnedIn.has(w.id),
      });
    }
  }
  return items;
}
