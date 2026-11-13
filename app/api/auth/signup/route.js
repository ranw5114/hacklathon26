// Makes an account: { email, username, password } → logs it in and returns { user }.
import { db } from "@/lib/server/db";
import { serverError } from "@/lib/server/errors";
import { emailKey, hashPassword, startSession, userKey } from "@/lib/server/auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request) {
  const { email = "", username = "", password = "" } = await request.json().catch(() => ({}));
  const cleanEmail = String(email).trim();
  const cleanName = String(username).trim();

  if (!EMAIL.test(cleanEmail) || cleanEmail.length > 120) return error("That email doesn't look right.");
  if (!USERNAME.test(cleanName)) return error("Usernames are 3-20 letters, numbers, or underscores.");
  if (String(password).length < 8) return error("Passwords need at least 8 characters.");
  if (String(password).length > 200) return error("That password is too long.");

  try {
    // Claim the username and email first, so two people can't take the same one at once.
    if (!(await db.setNew(userKey(cleanName), "{}"))) return error("That username is taken. Try another one!", 409);
    if (!(await db.setNew(emailKey(cleanEmail), cleanName.toLowerCase()))) {
      await db.del(userKey(cleanName));
      return error("There's already an account with that email. Log in instead?", 409);
    }
    const user = { username: cleanName, email: cleanEmail, password: await hashPassword(String(password)), createdAt: Date.now() };
    await db.set(userKey(cleanName), JSON.stringify(user));
    await startSession(cleanName);
    return Response.json({ user: { username: user.username, email: user.email } });
  } catch (err) {
    return serverError(err);
  }
}

function error(message, status = 400) {
  return Response.json({ error: message }, { status });
}

