# Judges' video: Scholar's intro, cutaways, and outro

Scholar (the mascot chick) hosts the video: an **intro**, a short **"Next up" cutaway** before each part of your demo, and an **outro**. You record each one from the stage page, then put them between your demo clips in CapCut, with a text-to-speech voice and music.

## 1. Record the scenes

1. Open **https://hacklathon26.vercel.app/stage** in Chrome. It's not in the app's menu, so you need the address. On your own computer, it's `localhost:3000/stage`.
2. Press **F** for full screen. The picture is 16:9, the same shape as a normal video.
3. Pick a scene with the buttons at the top, or press **1–8**.
4. Start your screen recording: **Cmd + Shift + 5**, then "Record Entire Screen".
5. Press **Space**. The controls and the mouse pointer disappear, the sign drops in, and Scholar talks.
6. When the last bubble has been up for a moment, stop recording.
7. Do it again for each scene. That's 8 short clips.

Each clip starts with about 1 second of the empty farm, then the sign drops, and Scholar starts talking at about **2 seconds**. Trim the start in CapCut if you want it snappier.

Other keys:

| Key | What it does |
| --- | --- |
| **Space** | Play the scene from the start |
| **→ / ←** | Step through the lines by hand, one bubble at a time |
| **1–8** | Pick a scene |
| **H** | Hide or show the control bar |
| **Esc** | Stop |

## 2. The lines, for CapCut's text-to-speech

In CapCut, add each line as **Text**, then use **Text to speech** and pick a cute, high voice. Use the same voice for every line. Put each line's audio where its bubble appears. The times are from the start of the clip, so line them up by eye and nudge as needed.

**1. Intro** (about 39 sec)
- 0:02 — Hi there! I'm Scholar, the study chick of Cluck In!
- 0:07 — Studying for a big test can feel like a total scramble.
- 0:12 — Where do you even start? What should you study each day? And how do you stay focused?
- 0:19 — Cluck In works backwards from the grade you want, and builds you a study plan, one day at a time.
- 0:28 — And every time you study, you hatch a new chick for your flock!
- 0:34 — Come on, let me show you around the farm!

**2. Getting started** (about 11 sec): before you show signing up and picking a learning style
- 0:02 — First, let's hatch your profile!
- 0:05 — Tell me how you learn best, and I'll teach you your way.

**3. Nest Builder** (about 14 sec)
- 0:02 — Next up, the Nest Builder!
- 0:05 — Add your test date, your goal grade, and your class notes, and your plan builds itself, one twig at a time.

**4. Chicken Coop** (about 13 sec)
- 0:02 — Stuck on a problem? Come ask me in the Chicken Coop!
- 0:07 — I explain things the way you learn. No question is too fowl!

**5. Egg Timer** (about 15 sec)
- 0:02 — Time to focus! In the Egg Timer, I keep an egg warm while you study.
- 0:09 — Finish your session and it hatches. Quit early, and it gets fried!

**6. Roost & To-Do** (about 12 sec)
- 0:02 — Next, the Roost and your To-Do list.
- 0:06 — Your lessons and homework, all in one place, so you always know what's next.

**7. Your Farm** (about 12 sec)
- 0:02 — All that hard work pays off!
- 0:05 — Earn corn as you study, and spend it dressing up your flock on Your Farm.

**8. Outro** (about 21 sec)
- 0:02 — And that's Cluck In!
- 0:04 — A study plan built around your goal, a tutor that teaches the way you learn, and a flock that grows every time you focus.
- 0:15 — So stop winging it, and cluck in!
- 0:18 — Thanks for watching! Bye bye!

All of Scholar together is about 2 minutes 15 seconds, which leaves about 2 minutes 45 seconds for your demo in a 5-minute video. If you need more demo time, skip a cutaway or two. The sign alone works as a 3-second chapter title.

## 3. Put it together in CapCut

- **Order:** Intro → your sign-up demo → cutaway 2 → … → cutaway 7 → your farm demo → Outro. Each cutaway goes right before the matching part of your demo.
- **Music:** in CapCut go to **Audio → Music**, try "Cute", "Happy", or "Ukulele", and pick one track for the whole video. Turn it down to about **15–20%** so voices are easy to hear. Raise it a little during the intro and outro.
- **Captions:** **Text → Auto captions** adds captions for your voice, so judges can follow along even with the sound off. Scholar already has speech bubbles.
- **Transitions:** a quick "pop" or "zoom" transition into and out of each Scholar clip makes the cutaways feel like chapter breaks.

## Changing what Scholar says

The lines live in `lib/stageScript.js`. Edit the text there and the stage page updates. Bubble timing adjusts to the length of each line. If you change the order of your demo, change the order of the scenes too.
