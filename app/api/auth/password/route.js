// Step 2 of changing a password: { code, password, login? } → sets the new password.
// `login` is only needed when logged out (forgot password); then it also logs you in.
// 5 wrong codes and the code stops working (ask for a new one).
import crypto from "crypto";
import { db } from "@/lib/server/db";
import { currentUser, emailKey, hashPassword, startSession, userKey } from "@/lib/server/auth";
import { serverError } from "@/lib/server/errors";

const codeKey = (username) => `pwcode:${username.toLowerCase()}`;

export async function POST(request) {
  const { code = "", password = "", login = "" } = await request.json().catch(() => ({}));
  if (String(password).length < 8) return Response.json({ error: "Pick a password with at least 8 characters." }, { status: 400 });
  if (String(password).length > 200) return Response.json({ error: "That password is too long." }, { status: 400 });
  try {
    let username = (await currentUser())?.username;
    const loggedIn = Boolean(username);
    if (!username) {
      const name = String(login).trim();
      username = name.includes("@") ? await db.get(emailKey(name)) : name.toLowerCase();
    }
    const wrong = () => Response.json({ error: "That code isn't right. Check your email and try again." }, { status: 400 });
    if (!username) return wrong();

    const saved = JSON.parse((await db.get(codeKey(username))) ?? "null");
    if (!saved || saved.exp < Date.now()) return Response.json({ error: "That code has run out. Ask for a new one." }, { status: 400 });
    if (saved.tries >= 5) return Response.json({ error: "Too many wrong codes. Ask for a new one." }, { status: 429 });
    const attempt = crypto.createHash("sha256").update(String(code).trim()).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(attempt), Buffer.from(saved.hash))) {
      await db.set(codeKey(username), JSON.stringify({ ...saved, tries: saved.tries + 1 }));
      return wrong();
    }

    const user = JSON.parse(await db.get(userKey(username)));
    await db.set(userKey(username), JSON.stringify({ ...user, password: await hashPassword(String(password)), passwordChangedAt: Date.now() }));
    await db.del(codeKey(username), `tries:${username.toLowerCase()}`);
    if (!loggedIn) await startSession(user.username);
    return Response.json({ user: { username: user.username, email: user.email } });
  } catch (err) {
    return serverError(err);
  }
}
