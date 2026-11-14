// Step 1 of changing a password: emails a 6-digit code.
// Logged in: { } → the code goes to the account's email.
// Forgot password (logged out): { login } (username or email) → same, if that account exists.
// The code lasts 10 minutes. At most 5 codes per account per hour.
import crypto from "crypto";
import { db } from "@/lib/server/db";
import { currentUser, emailKey, userKey } from "@/lib/server/auth";
import { emailConfigured, sendEmail } from "@/lib/server/email";
import { serverError } from "@/lib/server/errors";

const CODE_MINUTES = 10;

const codeKey = (username) => `pwcode:${username.toLowerCase()}`;

function hide(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}${"•".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export async function POST(request) {
  const { login = "" } = await request.json().catch(() => ({}));
  if (!emailConfigured()) return Response.json({ error: "Sending emails isn't set up on this website yet." }, { status: 503 });
  try {
    let user = await currentUser();
    if (!user && String(login).trim()) {
      const name = String(login).trim();
      const username = name.includes("@") ? await db.get(emailKey(name)) : name.toLowerCase();
      const raw = username ? await db.get(userKey(username)) : null;
      user = raw ? JSON.parse(raw) : null;
      // Don't reveal whether an account exists: the answer looks the same either way.
      if (!user?.email) return Response.json({ sentTo: null });
    }
    if (!user) return Response.json({ error: "Enter your username or email." }, { status: 400 });

    if ((await db.bump(`pwcodes:${user.username.toLowerCase()}`, 60 * 60)) > 5) {
      return Response.json({ error: "That's a lot of codes! Wait an hour, then try again." }, { status: 429 });
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    await db.set(codeKey(user.username), JSON.stringify({ hash, exp: Date.now() + CODE_MINUTES * 60_000, tries: 0 }));
    await sendEmail({
      to: user.email,
      subject: `Your Cluck In code: ${code}`,
      text: `Hi ${user.username}!\n\nYour code to change your password is ${code}. It works for ${CODE_MINUTES} minutes.\n\nIf you didn't ask for this, you can ignore this email; your password stays the same.\n\n- Your study chick`,
      html: `<div style="font-family:sans-serif;font-size:16px;color:#3b2416"><p>Hi ${user.username}!</p><p>Your code to change your password is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>It works for ${CODE_MINUTES} minutes. If you didn't ask for this, you can ignore this email; your password stays the same.</p><p>- Your study chick</p></div>`,
    });
    return Response.json({ sentTo: hide(user.email) });
  } catch (err) {
    if (/Email isn't set up/.test(err.message)) return Response.json({ error: "Sending emails isn't set up on this website yet." }, { status: 503 });
    if (err.code === "EAUTH" || err.responseCode) {
      console.error("Email failed:", err);
      return Response.json({ error: "Couldn't send the email. Please try again later." }, { status: 502 });
    }
    return serverError(err);
  }
}
