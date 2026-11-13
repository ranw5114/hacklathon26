"use client";

import { useRef, useState } from "react";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";

// Each poke plays the next reaction: a move, a face, and sometimes floating hearts.
const REACTIONS = [
  { anim: "anim-jump", mood: "surprised" },
  { anim: "anim-hop", mood: "love", hearts: true },
  { anim: "anim-wiggle", mood: "squint" },
  { anim: "anim-spin", mood: "dizzy" },
  { anim: "anim-hop", mood: "squint", hearts: true },
];

const REACTION_MS = 1600;

// A chick you can poke. Hover makes it tilt; a click makes it react and (with `lines`) say
// something. `onPoke` runs on every click (e.g. the Barn's joke chick tells a new joke).
//   look: an avatar id or a whole look (see lib/avatar.js) · lines: things it might say
//   bubbleSide: "top" (default, above it) or "right" (beside it, for chicks next to a page title)
export default function PlayfulChick({ look = "sunny", size = 96, lines, onPoke, className = "", bubbleSide = "top", label = "Poke the chick" }) {
  const [reaction, setReaction] = useState(null); // { anim, mood, hearts, key }
  const [line, setLine] = useState("");
  const [hearts, setHearts] = useState([]);
  const count = useRef(0);
  const timer = useRef(null);

  function poke() {
    const next = REACTIONS[count.current % REACTIONS.length];
    count.current += 1;
    setReaction({ ...next, key: count.current });
    if (lines?.length) setLine(lines[(count.current - 1) % lines.length]);
    if (next.hearts) {
      const burst = Array.from({ length: 4 }, (_, i) => ({ id: `${count.current}-${i}`, drift: (i - 1.5) * 18, delay: i * 90 }));
      setHearts((h) => [...h, ...burst]);
      setTimeout(() => setHearts((h) => h.filter((x) => !burst.includes(x))), 1400);
    }
    onPoke?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setReaction(null);
      setLine("");
    }, REACTION_MS);
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      {line && (
        <span
          className={`bubble absolute z-10 w-max max-w-56 text-center text-sm anim-pop ${
            bubbleSide === "right"
              ? "top-1/2 left-full ml-3 -translate-y-1/2 shadow-[0_3px_0_var(--chick-line)] after:hidden"
              : "bottom-full left-1/2 mb-3 -translate-x-1/2"
          }`}
        >
          {line}
        </span>
      )}
      <button
        type="button"
        onClick={poke}
        aria-label={label}
        className="cursor-pointer rounded-full transition-transform hover:anim-tilt active:scale-95"
      >
        {/* The key restarts the animation on every poke */}
        <span key={reaction?.key ?? 0} className={`inline-block ${reaction?.anim ?? ""}`}>
          <Chick variant={look} size={size} mood={reaction?.mood ?? "happy"} />
        </span>
      </button>
      {hearts.map((h) => (
        <span
          key={h.id}
          className="pointer-events-none absolute top-1/4 left-1/2 anim-float-up"
          style={{ "--drift": `${h.drift}px`, animationDelay: `${h.delay}ms` }}
          aria-hidden="true"
        >
          <Icon name="heart" size={Math.max(14, size / 6)} />
        </span>
      ))}
    </span>
  );
}
