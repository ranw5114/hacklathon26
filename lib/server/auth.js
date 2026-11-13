// Passwords and login sessions for accounts (server only).
// Passwords are never stored: only a salted scrypt hash. A session is a signed cookie that says
// which account is logged in and until when; it can't be changed without the secret.

import crypto from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import { db } from "@/lib/server/db";

const scrypt = promisify(crypto.scrypt);
const COOKIE = "chick_session";
const SESSION_DAYS = 60;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is not set.");
  return "dev-only-secret-change-me"; // local development only
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export async function checkPassword(password, stored) {
  const [, salt, hash] = String(stored).split(":");
  if (!salt || !hash) return false;
  const attempt = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === attempt.length && crypto.timingSafeEqual(expected, attempt);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

function verify(token) {
  const [body, mac] = String(token ?? "").split(".");
  if (!body || !mac) return null;
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export async function startSession(username) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  (await cookies()).set(COOKIE, sign({ u: username, exp }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(exp),
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

// The logged-in account ({ username, email }), or null.
export async function currentUser() {
  const session = verify((await cookies()).get(COOKIE)?.value);
  if (!session) return null;
  const raw = await db.get(userKey(session.u));
  if (!raw) return null;
  const user = JSON.parse(raw);
  return { username: user.username, email: user.email };
}

export const userKey = (username) => `user:${username.toLowerCase()}`;
export const emailKey = (email) => `email:${email.toLowerCase()}`;
