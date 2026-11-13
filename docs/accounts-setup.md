# Setting up accounts

Accounts let students sign up with an email, username, and password, and log in on any device to
pick up where they left off. They need a small database. We use **Upstash for Redis** through
Vercel (free plan), plus one secret.

Until this is set up, the live site works like before: no sign up or log in, and progress stays on
each device. When you run the app on your own computer (`npm run dev`), accounts work right away
using a file in `.data/` instead of the database.

## 1. Add the database (about 3 minutes)

1. Open the project on [vercel.com](https://vercel.com) and go to the **Storage** tab.
2. Click **Create Database**, choose **Upstash for Redis** (it may be listed under "Marketplace"), and
   pick the **Free** plan. Any region close to you is fine.
3. When it asks which project to connect, pick this one, with all environments (Production,
   Preview, Development) ticked.

This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project's environment variables for you.

## 2. Add the login secret

1. In the project, go to **Settings → Environment Variables**.
2. Add `AUTH_SECRET` with a long random value (all environments). To make one, run
   `openssl rand -base64 32` in a terminal, or use any password generator with 32+ characters.
   Keep it secret, and don't change it later (that would log everyone out).

## 3. Redeploy

Go to **Deployments**, open the latest one, and click **Redeploy**. After that, the start screen
shows **Sign up** and **Log in**.

## How it works

- Passwords are never stored, only a salted scrypt hash. Logins use a signed, HTTP-only cookie that
  lasts 60 days. After 10 wrong passwords, that account is locked for 15 minutes.
- The app still saves everything in the browser first (fast, works offline). When logged in, each
  change is copied to the account about a second later, and opening the app brings down changes
  from other devices. If two devices change the same thing, the newest save wins.
- What's copied: profile, nests, to-dos, chicks, chats, timer, focus sessions, calendar, settings,
  and flagged questions (`lib/syncKeys.js`). Each one can be up to about 1 MB.
- Not done yet: "forgot password" (it needs an email service to send reset links).
