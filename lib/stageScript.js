// What Scholar (the mascot chick) says in the judges' video: an intro, a short "next up" cutaway
// before each part of the demo, and an outro. The /stage page plays these; docs/video-guide.md
// lists the same lines for CapCut's text-to-speech.
//
// Each scene: a sign (what it's about), what Scholar wears, and the lines, one speech bubble each.
// A line can be { text, mood } to change Scholar's face for that line.

export const STAGE_SCENES = [
  {
    id: "intro",
    label: "Intro",
    sign: { icon: "chick", kicker: "Welcome to", title: "Cluck In" },
    wear: { head: "cap" },
    extras: "flock",
    lines: [
      "Hi there! I'm Scholar, the study chick of Cluck In!",
      { text: "Studying for a big test can feel like a total scramble.", mood: "dizzy" },
      { text: "Where do you even start? What should you study each day? And how do you stay focused?", mood: "surprised" },
      "Cluck In works backwards from the grade you want, and builds you a study plan, one day at a time.",
      { text: "And every time you study, you hatch a new chick for your flock!", mood: "love" },
      "Come on, let me show you around the farm!",
    ],
  },
  {
    id: "setup",
    label: "Getting started",
    sign: { icon: "egg", kicker: "Next up", title: "Hatch your profile" },
    wear: { head: "cap" },
    lines: [
      "First, let's hatch your profile!",
      "Tell me how you learn best, and I'll teach you your way.",
    ],
  },
  {
    id: "nest",
    label: "Nest Builder",
    sign: { icon: "nest", kicker: "Next up", title: "Nest Builder" },
    wear: { head: "cap", prop: "book" },
    lines: [
      "Next up, the Nest Builder!",
      "Add your test date, your goal grade, and your class notes, and your plan builds itself, one twig at a time.",
    ],
  },
  {
    id: "coop",
    label: "Chicken Coop",
    sign: { icon: "hen", kicker: "Next up", title: "The Chicken Coop" },
    wear: { head: "cap", face: "glasses" },
    lines: [
      "Stuck on a problem? Come ask me in the Chicken Coop!",
      { text: "I explain things the way you learn. No question is too fowl!", mood: "squint" },
    ],
  },
  {
    id: "timer",
    label: "Egg Timer",
    sign: { icon: "egg", kicker: "Next up", title: "Egg Timer" },
    wear: { head: "cap", prop: "mug" },
    lines: [
      "Time to focus! In the Egg Timer, I keep an egg warm while you study.",
      { text: "Finish your session and it hatches. Quit early, and it gets fried!", mood: "surprised" },
    ],
  },
  {
    id: "plan",
    label: "Roost & To-Do",
    sign: { icon: "calendar", kicker: "Next up", title: "The Roost & To-Do" },
    wear: { head: "cap", prop: "pencil" },
    lines: [
      "Next, the Roost and your To-Do list.",
      "Your lessons and homework, all in one place, so you always know what's next.",
    ],
  },
  {
    id: "farm",
    label: "Your Farm",
    sign: { icon: "henhouse", kicker: "Next up", title: "Your Farm" },
    wear: { head: "crown", neck: "bowtie" },
    extras: "flock",
    lines: [
      { text: "All that hard work pays off!", mood: "love" },
      "Earn corn as you study, and spend it dressing up your flock on Your Farm.",
    ],
  },
  {
    id: "outro",
    label: "Outro",
    sign: { icon: "chick", kicker: "Stop winging it", title: "Cluck In!" },
    wear: { head: "party" },
    extras: "party",
    lines: [
      "And that's Cluck In!",
      "A study plan built around your goal, a tutor that teaches the way you learn, and a flock that grows every time you focus.",
      { text: "So stop winging it, and cluck in!", mood: "love" },
      "Thanks for watching! Bye bye!",
    ],
  },
];

// How long a bubble stays up: about as long as text-to-speech takes to say it, plus a breath.
export function lineSeconds(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(2.4, words / 2.6 + 0.9);
}

export function lineText(line) {
  return typeof line === "string" ? line : line.text;
}
