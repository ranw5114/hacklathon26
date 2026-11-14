"use client";

import Icon from "@/components/Icon";
import PlayfulChick from "@/components/PlayfulChick";
import { useRef, useState } from "react";
import Link from "next/link";
import PageTour from "@/components/PageTour";
import { useStored } from "@/lib/storage";
import { useAvatar } from "@/lib/avatar";
import { chickCount, withDefaults } from "@/lib/flock";
import { useNests } from "@/lib/nests";
import { planItemsFor, withTodoDefaults } from "@/lib/todos";
import { todayString } from "@/lib/dates";
import { LEARNING_STYLES } from "@/lib/learningStyles";
import { formatTime, timeLeft } from "@/lib/timer";
import { useNow } from "@/lib/useNow";

const AREAS = [
  {
    href: "/coop",
    kicker: "AI study chat",
    title: "The Chicken Coop",
    tagline: "Ask anything. No question is too fowl.",
    icon: "hen", // same drawing as its menu tab
    hover: "group-hover:anim-peck",
  },
  {
    href: "/timer",
    kicker: "Study timer",
    title: "Egg Timer",
    tagline: "Focus until you're hard-boiled.",
    icon: "egg", // same drawing as its menu tab
    hover: "group-hover:anim-wobble",
  },
  {
    href: "/roost",
    kicker: "Calendar",
    title: "The Roost",
    tagline: "Know when to rise and grind.",
    icon: "calendar", // same drawing as its menu tab
    hover: "group-hover:anim-flip",
  },
  {
    href: "/nest",
    kicker: "Lesson plan creation",
    title: "Nest Builder",
    tagline: "Build your plan one twig at a time.",
    icon: "nest", // same drawing as its menu tab
    hover: "group-hover:anim-bounce",
  },
  {
    href: "/todo",
    kicker: "Homework and study",
    title: "To-Do List",
    tagline: "Peck away at it, one task at a time.",
    icon: "todo", // same drawing as its menu tab
    hover: "group-hover:anim-pop",
  },
  {
    href: "/henhouse",
    kicker: "Henhouse & Shop",
    title: "Your Farm",
    tagline: "Dress up your flock, and spend your corn.",
    icon: "henhouse", // same drawing as its menu tab
    hover: "group-hover:anim-peek",
  },
];

// What your chick says when you poke it on the Barn.
const AVATAR_LINES = [
  "Bawk! That tickles!",
  "I'm egg-static you're here!",
  "Okay okay, I'll study too!",
  "Whoa, I'm seeing stars... and study plans.",
  "Hehe, again! Again!",
  "You're one smart cookie. Er, chick.",
];

const JOKES = [
  "Why did the chicken study? To get egg-cellent grades!",
  "What do you call a chick who aces every test? A smart cluck-ie.",
  "Don't count your chickens before they're quizzed.",
  "Studying is no yolk, but you've got this!",
  "Why did the chick sit on the textbook? It was trying to hatch a plan.",
  "What's a chicken's favorite subject? Eggonomics.",
  "Why don't chickens cram? They know you can't rush a good egg.",
  "What do you call a chicken who studies all night? A night owl in disguise.",
  "How do chicks stay calm before a test? They take deep cluck-ing breaths.",
  "Why did the hen get an A? She was always on time and never chickened out.",
  "What did the egg say to the textbook? You crack me up.",
  "Which chicken is best at math? The one who can count her chicks before they hatch.",
];

// The home dashboard with the four areas.
export default function BarnPage() {
  const profile = useStored("profile");
  const avatar = useAvatar(); // a starter chick or a Henhouse chick (lib/avatar.js)
  const timer = useStored("timer");
  const flock = useStored("flock");
  const todos = useStored("todos");
  const nests = useNests();
  const now = useNow();
  // Pick one joke when the page opens (useState keeps it from changing on every re-render).
  // Start on a random joke; poking the joke chick tells the next one.
  const [jokeIndex, setJokeIndex] = useState(() => Math.floor(Math.random() * JOKES.length));
  // What the avatar says when poked (shown in the welcome bubble for a moment).
  const [chickLine, setChickLine] = useState(null);
  const pokes = useRef(0);
  const lineTimer = useRef(null);

  function pokeAvatar() {
    setChickLine(AVATAR_LINES[pokes.current++ % AVATAR_LINES.length]);
    clearTimeout(lineTimer.current);
    lineTimer.current = setTimeout(() => setChickLine(null), 1800);
  }
  const joke = JOKES[jokeIndex % JOKES.length];
  const style = LEARNING_STYLES[profile.learningStyle];

  // The To-Do card shows what's left today; the Egg Timer card shows a running countdown.
  function tagline(area) {
    if (area.href === "/todo") {
      const today = todayString();
      const t = withTodoDefaults(todos);
      const left =
        planItemsFor(nests ?? [], today, t).filter((i) => !i.done).length +
        t.homework.filter((h) => !h.done && h.dueDate <= today).length;
      return left ? `${left} thing${left === 1 ? "" : "s"} left to do today` : area.tagline;
    }
    if (area.href !== "/timer" || !timer || timer.status === "idle") return area.tagline;
    const left = formatTime(timeLeft(timer, now));
    if (timer.status === "paused") return <><Icon name="pause" size={14} /> Paused with {left} left</>;
    return <><Icon name="hourglass" size={14} /> {timer.mode === "break" ? "On a break" : "Focusing"}… {left} left</>;
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex items-end gap-5">
        <PlayfulChick look={avatar} size={120} onPoke={pokeAvatar} className="shrink-0" label="Poke your chick" />
        <div>
          <span key={chickLine ?? "welcome"} className={`bubble text-sm sm:text-base ${chickLine ? "anim-pop" : ""}`}>
            {chickLine ?? `Welcome to the barn, ${profile.name}!`}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl">The Barn</h1>
          <p className="mt-1 font-display font-semibold text-muted">
            {style && <>You&apos;re a {style.label.toLowerCase()} learner <Icon name="chick" size={18} /> · </>}<Link href="/henhouse" className="underline decoration-2 underline-offset-2 hover:text-foreground">
              {chickCount(flock)} chick{chickCount(flock) === 1 ? "" : "s"} · <Icon name="corn" size={18} /> {withDefaults(flock).corn} corn
            </Link>
          </p>
        </div>
        <div className="ml-auto self-start">
          <PageTour page="barn" />
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href} className="group card-link flex items-center gap-5 active:scale-[0.98]">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-[3px] border-line bg-chick/60 transition group-hover:bg-chick">
              <span className={`inline-block ${area.hover}`}>
                <Icon name={area.icon} size={64} />
              </span>
            </span>
            <span>
              <span className="label-small">{area.kicker}</span>
              <span className="block font-display text-2xl font-semibold">{area.title}</span>
              <span className="block text-muted">{tagline(area)}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <span key={jokeIndex} className="bubble max-w-md text-center text-sm anim-pop">
          {joke}
        </span>
        <PlayfulChick look="berry" size={80} onPoke={() => setJokeIndex((i) => i + 1)} label="Tell me another joke" />
        <p className="text-xs text-muted">Poke me for another joke!</p>
      </div>
    </main>
  );
}
