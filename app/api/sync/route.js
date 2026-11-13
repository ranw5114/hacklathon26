// The logged-in account's saved data (see lib/account.js).
// GET → { data: { key: savedText } }   PUT { changes: { key: savedText | null } } → { ok }
// DELETE → removes all of it (used by "Delete everything").
import { db } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";
import { MAX_KEY_BYTES, SYNC_KEYS } from "@/lib/syncKeys";
import { serverError } from "@/lib/server/errors";

const dataKey = (username, key) => `data:${username.toLowerCase()}:${key}`;

async function who() {
  return currentUser();
}

export async function GET() {
  try {
    const user = await who();
    if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });
    const values = await db.mget(SYNC_KEYS.map((k) => dataKey(user.username, k)));
    const data = Object.fromEntries(SYNC_KEYS.map((k, i) => [k, values[i] ?? null]));
    return Response.json({ data });
  } catch (err) {
    return serverError(err);
  }
}

export async function PUT(request) {
  try {
    const user = await who();
    if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });
    const { changes } = await request.json().catch(() => ({}));
    if (!changes || typeof changes !== "object") return Response.json({ error: "Nothing to save." }, { status: 400 });
    const commands = [];
    const tooBig = [];
    for (const [key, value] of Object.entries(changes)) {
      if (!SYNC_KEYS.includes(key)) continue;
      if (value === null) commands.push(["DEL", dataKey(user.username, key)]);
      else if (typeof value === "string" && Buffer.byteLength(value) <= MAX_KEY_BYTES) commands.push(["SET", dataKey(user.username, key), value]);
      else tooBig.push(key);
    }
    if (commands.length) await db.run(commands);
    return Response.json({ ok: true, tooBig });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE() {
  try {
    const user = await who();
    if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });
    await db.del(...SYNC_KEYS.map((k) => dataKey(user.username, k)));
    return Response.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
