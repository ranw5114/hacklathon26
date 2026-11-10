# Roadmap

Deadline: submit to Devpost by **Nov 15, 8:00 AM PT**. Target: submit the evening of **Nov 14**.

Core loop: **Setup → Plan → Study a section → Mock exam → Predicted grade**

## Phase 0 · Setup (Oct 28–29)
- [x] Create the Next.js project
- [x] Push to GitHub
- [x] Deploy to Vercel (live URL: https://hacklathon26.vercel.app)
- [x] Get a Gemini API key and make one test call
- ✅ Done when: a live URL shows the app and one AI response

## Phase 1 · Setup flow + study plan (Oct 30 – Nov 2)
- [x] Setup page: learning style, subject, topic, test date, current/goal grade, hours per day, notes
- [x] Save setup answers in the browser
- [x] `/api/plan`: Gemini returns a structured (JSON) plan
- [x] Dashboard showing the plan as days and sections
- ✅ Done when: entering a test produces a personalized day-by-day plan

## Phase 1.5 · Chicken theme + navigation (Nov 7) ✅
- [x] Chicken theme matched to the Lovable design (colors, Fredoka font, chick mascots)
- [x] Start screen and profile setup (name, avatar, learning style)
- [x] The Barn home with the 4 areas, plus top/bottom navigation
- [x] Nest Builder holds the test form and plan
- [x] Profile + settings page; placeholder pages for Coop, Timer, Roost

## Phase 2 · Nest Builder path (Nov 8–9) ✅
- [x] Duolingo-style winding path: one level per plan section, mock exam at the end
- [x] `/api/level`: lesson adapted to learning style + 5-question quiz (one AI request)
- [x] Quiz score sets the level's "cooked level"; corn points for improving
- [x] Mock exam + predicted grade (70% mock exam + 30% quiz average)
- [x] AI reliability: automatic retries, backup model, time limits
- ✅ Done when: the full study loop works from the path

## Phase 3 · Chicken Coop + Egg Timer (Nov 10)
- [x] Corn chests on the nest path (every 3 levels, 15-30 corn)
- [x] `/api/tutor`: AI chat that knows the current plan, with homework photo upload
- [x] Egg Timer: keeps correct time across pages, tabs, and reloads; presets, pause/resume, ding + notification
- [x] Mini timer on every page, live countdown in the tab title and the Barn card
- [x] 1 corn per focus minute; today's session log

## Phase 4 · The Roost + demo-ready (Nov 11)
- [x] The Roost: Month / Week / Day views (click a day to expand), study plan, test and mock exam days
- [x] Calendar sync from a private iCal link (Google, Apple, Outlook), including repeating events
- [x] Sample school schedule for judges
- [x] 💡 Free-time study suggestions that fit around synced events
- [x] Demo mode: "Try the demo" loads an Algebra II student with pre-made lessons (data/demo.json), dates shift to today
- [x] Friendly errors when the AI limit is hit (done in Phase 2)
- [x] Tutorial cards for each area (auto-open on first visit, ? to replay, reset in Settings; text in lib/tutorials.js)
- [x] Pop-out timer (Chrome/Edge Picture-in-Picture), 📌 button on the Timer page and mini timer (needs a check in real Chrome)
- [ ] Friend's graphics due (avatars, area icons, cooked-level egg images)

## Phase 5 · Feature freeze + polish (Nov 12)
- [ ] No new features. Bug fixes, styling pass, check on a phone

## Phase 6 · Submission (Nov 13–14)
- [ ] Record and edit the 5-minute pitch video
- [ ] Write the Devpost description
- [ ] Submit (evening of Nov 14)

## Fallback plan
- Behind by Nov 9 → simplify lessons to text only
- Behind by Nov 10 → drop Roost calendar sync, show only the study plan
- Behind by Nov 11 → drop Coop photo upload
- Stretch goals (only if ahead): YouTube links per section, grade calculator, PDF upload

## Friend's parallel tasks
- By Nov 11: graphics as image files (6 avatars, 4 area icons, cooked-level eggs), sample notes for the demo
- Nov 12: review the real app, send final design tweaks
- Nov 13: pitch script and narration
