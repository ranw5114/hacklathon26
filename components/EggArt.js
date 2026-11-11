// Drawings for the Egg Timer and the flock, in the same outlined style as the chicks.

import Chick, { CHICKS } from "@/components/Chick";

const LINE = "var(--chick-line)";
const SHELL = "oklch(98.5% 0.012 85)";
const EGG = "M70 66 C 87 66 95 88 95 100 C 95 114 84 121 70 121 C 56 121 45 114 45 100 C 45 88 53 66 70 66 Z";

// Crack lines that spread across the egg as the focus session goes on (stage 0 = no cracks).
const CRACKS = [
  "",
  "M58 84 L63 89 L60 93",
  "M58 84 L63 89 L60 93 L67 97 L72 92 L78 97",
  "M52 90 L58 84 L63 89 L60 93 L67 97 L72 92 L78 97 L83 91 L88 95",
];

// The student's chick hugging its egg to keep it warm. `cracks` is 0-3; `animate` rocks it gently.
export function BroodingChick({ avatar = "sunny", cracks = 0, animate = false, size = 120, className = "" }) {
  const chick = CHICKS[avatar] || CHICKS.sunny;
  return (
    <svg viewBox="0 0 140 126" width={size} height={size * (126 / 140)} className={`overflow-visible ${className}`} aria-hidden="true">
      {/* Warm glow while brooding */}
      <ellipse cx="70" cy="96" rx="58" ry="26" fill="var(--chick-beak)" opacity={animate ? 0.18 : 0.08} />
      <g className={animate ? "animate-brood" : ""}>
        {/* The chick, sitting behind its egg */}
        <svg x="14" y="-6" width="112" height="93" viewBox="0 0 120 100" overflow="visible">
          <Chick variant={avatar} size={120} />
        </svg>
        {/* The egg, wiggling once it starts to crack */}
        <g className={animate && cracks >= 2 ? "animate-egg-wiggle" : ""}>
          <path d={EGG} fill={SHELL} stroke={LINE} strokeWidth="3.5" />
          <ellipse cx="62" cy="82" rx="5" ry="7" fill="white" opacity="0.9" />
          {cracks > 0 && (
            <path d={CRACKS[Math.min(cracks, 3)]} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          )}
        </g>
        {/* Wings wrapped around the egg */}
        <path d="M34 78 C 26 92 34 106 50 106 C 48 96 44 86 34 78 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
        <path d="M106 78 C 114 92 106 106 90 106 C 92 96 96 86 106 78 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// A baby chick popping out of the bottom half of its shell.
export function HatchedChick({ color = "sunny", size = 120, className = "" }) {
  return (
    <svg viewBox="0 0 140 126" width={size} height={size * (126 / 140)} className={`overflow-visible ${className}`} aria-hidden="true">
      <svg x="28" y="34" width="84" height="70" viewBox="0 0 120 100" overflow="visible">
        <Chick variant={color} size={120} />
      </svg>
      <path
        d="M42 96 L49 88 L56 96 L63 87 L70 96 L77 87 L84 96 L91 88 L98 96 C 98 112 87 121 70 121 C 53 121 42 112 42 96 Z"
        fill={SHELL}
        stroke={LINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* The top of the shell, knocked off to the side */}
      <path d="M100 66 L107 58 L113 65 L120 57 L126 66 C 126 56 120 50 113 50 C 106 50 100 56 100 66 Z" fill={SHELL} stroke={LINE} strokeWidth="3" strokeLinejoin="round" transform="rotate(18 113 60)" />
    </svg>
  );
}

// An egg that got fried (stopped early, or left paused too long).
export function FriedEgg({ size = 48, className = "" }) {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * (50 / 60)} className={className} aria-hidden="true">
      <path
        d="M10 26 C 6 14 18 6 28 9 C 36 3 50 8 50 18 C 57 24 54 38 44 40 C 38 47 22 46 18 40 C 8 40 4 32 10 26 Z"
        fill={SHELL}
        stroke={LINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="25" r="9.5" fill="oklch(82% 0.17 75)" stroke={LINE} strokeWidth="3" />
      <ellipse cx="27" cy="22" rx="2.5" ry="2" fill="white" opacity="0.85" />
    </svg>
  );
}

// A chick lost on a missed study-plan day.
export function Drumstick({ size = 48, className = "" }) {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * (50 / 60)} className={className} aria-hidden="true">
      <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
        {/* Bone */}
        <path d="M33 29 L45 39" fill="none" strokeWidth="7" strokeLinecap="round" />
        <path d="M33 29 L45 39" fill="none" stroke={SHELL} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="47" cy="37" r="4.5" fill={SHELL} />
        <circle cx="43" cy="42" r="4.5" fill={SHELL} />
        {/* Meat */}
        <path d="M8 18 C 8 7 22 2 31 8 C 39 13 40 25 34 31 C 28 37 15 36 10 29 C 8 26 8 22 8 18 Z" fill="oklch(66% 0.13 50)" />
      </g>
      <path d="M15 14 C 18 10 23 9 27 11" fill="none" stroke="oklch(80% 0.1 60)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
