"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";

// Written out in full so Tailwind finds them: [on hover, on click]
const MOVES = {
  peck: ["group-hover:anim-peck", "anim-peck"],
  wobble: ["group-hover:anim-wobble", "anim-wobble"],
  flip: ["group-hover:anim-flip", "anim-flip"],
  bounce: ["group-hover:anim-bounce", "anim-bounce"],
  pop: ["group-hover:anim-pop", "anim-pop"],
  peek: ["group-hover:anim-peek", "anim-peek"],
};

// The picture at the top of a page: the same drawing as its Barn card and menu tab.
// Hover makes it move (`move`: peck, wobble, flip, bounce, pop or peek); a click plays it again and, with `lines`,
// it says something in a bubble beside it.
export default function PageIcon({ icon, move = "pop", lines, label, size = 64 }) {
  const [poke, setPoke] = useState(0);
  const [line, setLine] = useState("");
  const timer = useRef(null);

  function onClick() {
    setPoke((n) => n + 1);
    if (lines?.length) setLine(lines[poke % lines.length]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(""), 1800);
  }

  const [onHover, onPoke] = MOVES[move];
  const box = Math.round(size * 1.4);
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={label ?? "Poke me"}
        className="group flex cursor-pointer items-center justify-center rounded-2xl border-[3px] border-line bg-chick/60 transition hover:bg-chick active:scale-95"
        style={{ width: box, height: box }}
      >
        {/* The key restarts the animation on every click */}
        <span key={poke} className={`inline-block ${onHover} ${poke ? onPoke : ""}`}>
          <Icon name={icon} size={size} />
        </span>
      </button>
      {line && (
        <span className="bubble absolute top-full left-0 z-20 mt-3 w-max max-w-56 text-center text-sm shadow-[0_3px_0_var(--chick-line)] anim-pop after:hidden">
          {line}
        </span>
      )}
    </span>
  );
}
