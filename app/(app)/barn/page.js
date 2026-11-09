"use client";

import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import { useStored } from "@/lib/storage";
import { LEARNING_STYLES } from "@/lib/learningStyles";

const AREAS = [
  {
    href: "/coop",
    kicker: "AI study chat",
    title: "The Chicken Coop",
    tagline: "Ask anything. No question is too fowl.",
    chick: "scholar",
  },
  {
    href: "/timer",
    kicker: "Study timer",
    title: "Egg Timer",
    tagline: "Focus until you're hard-boiled.",
    chick: "eggy",
  },
  {
    href: "/roost",
    kicker: "Calendar",
    title: "The Roost",
    tagline: "Know when to rise and grind.",
    chick: "peach",
  },
  {
    href: "/nest",
    kicker: "Lesson plan creation",
    title: "Nest Builder",
    tagline: "Build your plan one twig at a time.",
    chick: "mint",
  },
];

const JOKES = [
  "Why did the chicken study? To get egg-cellent grades!",
  "What do you call a chick who aces every test? A smart cluck-ie.",
  "Don't count your chickens before they're quizzed.",
  "Studying is no yolk, but you've got this!",
];

// The home dashboard with the four areas.
export default function BarnPage() {
  const profile = useStored("profile");
  // Pick one joke when the page opens (useState keeps it from changing on every re-render).
  const [joke] = useState(() => JOKES[Math.floor(Math.random() * JOKES.length)]);
  const style = LEARNING_STYLES[profile.learningStyle];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <div className="flex items-end gap-5">
        <Chick variant={profile.avatar} size={120} className="shrink-0" />
        <div>
          <span className="bubble text-sm sm:text-base">Welcome to the barn, {profile.name}!</span>
          <h1 className="mt-4 text-4xl sm:text-5xl">The Barn</h1>
          {style && <p className="mt-1 font-display font-semibold text-muted">You&apos;re a {style.label.toLowerCase()} learner 🐣</p>}
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href} className="card-link flex items-center gap-5">
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-[3px] border-line bg-chick/60">
              <Chick variant={area.chick} size={68} />
            </span>
            <span>
              <span className="label-small">{area.kicker}</span>
              <span className="block font-display text-2xl font-semibold">{area.title}</span>
              <span className="block text-muted">{area.tagline}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-col items-center gap-3">
        <span className="bubble max-w-md text-center text-sm">{joke}</span>
        <Chick variant="berry" size={80} />
      </div>
    </main>
  );
}
