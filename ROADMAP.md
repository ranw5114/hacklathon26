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
- [ ] Setup page: learning style, subject, topic, test date, current/goal grade, hours per day, notes
- [ ] Save setup answers in the browser
- [ ] `/api/plan`: Gemini returns a structured (JSON) plan
- [ ] Dashboard showing the plan as days and sections
- ✅ Done when: entering a test produces a personalized day-by-day plan

## Phase 2 · Studying a section (Nov 3–6)
- [ ] `/api/lesson`: lesson adapted to learning style (visual, lecture, examples)
- [ ] `/api/quiz`: mini quiz questions
- [ ] Mini quiz with instant feedback; score saved
- [ ] Generate quizzes from pasted notes (PDF upload is a stretch goal)
- ✅ Done when: finishing a section updates the dashboard

## Phase 3 · Mock exam + rewards (Nov 7–9)
- [ ] Mock exam across all sections, results page
- [ ] Predicted grade (plain math: ~70% mock exam + ~30% quiz average)
- [ ] Points for quizzes; focus timer that awards points
- ✅ Done when: **the full loop works** (minimum submittable app)

## Phase 4 · Tutor + demo-ready (Nov 10–11)
- [ ] `/api/tutor`: chat with photo upload
- [ ] Demo mode: sample student with content generated ahead of time (no AI requests)
- [ ] Friendly error messages when the AI limit is hit
- ✅ Done when: a judge can click "Try the demo" and explore without errors

## Phase 5 · Feature freeze + polish (Nov 12)
- [ ] No new features. Bug fixes, styling pass, check on a phone

## Phase 6 · Submission (Nov 13–14)
- [ ] Record and edit the 5-minute pitch video
- [ ] Write the Devpost description
- [ ] Submit (evening of Nov 14)

## Fallback plan
- Behind by Nov 6 → drop notes upload, use topic names only
- Behind by Nov 9 → drop the tutor chat
- Stretch goals (only if ahead): YouTube links per section, grade calculator, PDF upload

## Friend's parallel tasks
- Now – Nov 2: screen sketches, colors and fonts, final name
- Nov 3–9: sample notes and sample test for the demo student, pitch script draft
- Nov 12: styling pass on the real app
- Nov 13: narrate or co-present the video
