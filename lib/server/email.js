// Sends emails (password-change codes). Works with any email provider over SMTP, including a free
// Gmail account with an app password. Set these (see docs/accounts-setup.md):
//   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS, and optionally EMAIL_FROM.
// Without them, in local development the email is printed in the server log and saved to
// .data/outbox.json instead, so the flow can be tried.

import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";

export function emailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.NODE_ENV !== "production";
}

export async function sendEmail({ to, subject, text, html }) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({ from: process.env.EMAIL_FROM || `Chick Study Buddy <${process.env.SMTP_USER}>`, to, subject, text, html });
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Email isn't set up yet.");
  // Local development: keep it where a developer (or a test) can see it.
  console.log(`\n[email to ${to}] ${subject}\n${text}\n`);
  const file = path.join(process.cwd(), ".data", "outbox.json");
  let outbox = [];
  try {
    outbox = JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  outbox.push({ to, subject, text, at: Date.now() });
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(outbox.slice(-20), null, 2));
}
