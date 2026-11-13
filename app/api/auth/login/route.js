// Logs in with a username or email and password: { login, password } → { user }.
import { db } from "@/lib/server/db";
import { checkPassword, emailKey, startSession, userKey } from "@/lib/server/auth";
import { serverError } from "@/lib/server/errors";

const MAX_TRIES = 10; // wrong passwords allowed per account...
const LOCK_SECONDS = 15 * 60; // ...in this long

export async function POST(request) {
  const { login = "", password = "" } = await request.json().catch(() => ({}));
  const name = String(login).trim();
  if (!name || !password) return Response.json({ error: "Enter your username (or email) and password." }, { status: 400 });

  try {
    const username = name.includes("@") ? await db.get(emailKey(name)) : name.toLowerCase();
    const raw = username ? await db.get(userKey(username)) : null;
    const user = raw ? JSON.parse(raw) : null;
    const tries = `tries:${(username || name).toLowerCase()}`;
    if (Number((await db.get(tries)) ?? 0) >= MAX_TRIES) {
      return Response.json({ error: "Too many tries. Wait 15 minutes, then try again." }, { status: 429 });
    }
    if (!user?.password || !(await checkPassword(String(password), user.password))) {
      await db.bump(tries, LOCK_SECONDS);
      return Response.json({ error: "That username or password isn't right." }, { status: 401 });
    }
    await db.del(tries);
    await startSession(user.username);
    return Response.json({ user: { username: user.username, email: user.email } });
  } catch (err) {
    return serverError(err);
  }
}
