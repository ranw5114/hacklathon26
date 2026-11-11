// The chick mascot, drawn as an SVG so it stays sharp at any size.
// Matches the Lovable design. Your friend can replace these with her own drawings later.

import { useId } from "react";

const BODY = "M60 18 C 92 18 108 46 110 68 C 112 88 96 94 60 94 C 24 94 8 88 10 68 C 12 46 28 18 60 18 Z";

// Every avatar the user can pick. `body`/`belly` are colors; `extra` is an accessory on top.
export const CHICKS = {
  sunny: { name: "Sunny", body: "var(--chick-body)", belly: "var(--chick-belly)" },
  scholar: { name: "Scholar", body: "var(--chick-body)", belly: "var(--chick-belly)", extra: "cap" },
  peach: { name: "Peach", body: "oklch(0.93 0.07 50)", belly: "oklch(0.87 0.09 45)" },
  mint: { name: "Mint", body: "oklch(0.93 0.07 165)", belly: "oklch(0.87 0.09 165)" },
  eggy: { name: "Eggy", body: "var(--chick-body)", belly: "var(--chick-belly)", extra: "shell" },
  berry: { name: "Berry", body: "oklch(0.92 0.06 330)", belly: "oklch(0.86 0.08 330)", extra: "bow" },
};

// Extra colors a chick can be painted in the Henhouse (the avatar colors above are free).
export const CHICK_COLORS = {
  sunny: { name: "Sunny", body: "var(--chick-body)", belly: "var(--chick-belly)" },
  peach: { name: "Peach", body: "oklch(0.93 0.07 50)", belly: "oklch(0.87 0.09 45)" },
  mint: { name: "Mint", body: "oklch(0.93 0.07 165)", belly: "oklch(0.87 0.09 165)" },
  berry: { name: "Berry", body: "oklch(0.92 0.06 330)", belly: "oklch(0.86 0.08 330)" },
  sky: { name: "Sky", body: "oklch(0.92 0.06 235)", belly: "oklch(0.85 0.08 235)" },
  lavender: { name: "Lavender", body: "oklch(0.91 0.06 295)", belly: "oklch(0.84 0.08 295)" },
  lime: { name: "Lime", body: "oklch(0.94 0.1 125)", belly: "oklch(0.88 0.13 125)" },
  cocoa: { name: "Cocoa", body: "oklch(0.78 0.06 55)", belly: "oklch(0.7 0.07 55)" },
  midnight: { name: "Midnight", body: "oklch(0.55 0.08 270)", belly: "oklch(0.47 0.09 270)" },
};

const INK = "var(--chick-line)";

function Accessory({ type }) {
  if (type === "cap") {
    return (
      <g stroke="var(--chick-line)" strokeWidth="3" strokeLinejoin="round">
        <path d="M30 18 L60 6 L90 18 L60 30 Z" fill="var(--chick-line)" />
        <path d="M84 21 v14" fill="none" />
        <circle cx="84" cy="37" r="3" fill="var(--chick-beak)" />
      </g>
    );
  }
  if (type === "shell") {
    return (
      <path
        d="M34 26 L42 14 L50 24 L60 10 L70 24 L78 14 L86 26 Q60 34 34 26 Z"
        fill="var(--card)"
        stroke="var(--chick-line)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }
  if (type === "party") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M46 24 L60 -8 L74 24 Z" fill="oklch(0.8 0.13 330)" />
        <path d="M51 13 L69 13 M55 3 L65 3" stroke="white" strokeWidth="3" />
        <circle cx="60" cy="-9" r="5" fill="oklch(0.85 0.15 90)" />
      </g>
    );
  }
  if (type === "crown") {
    return (
      <path
        d="M38 26 L42 6 L51 17 L60 2 L69 17 L78 6 L82 26 Z"
        fill="oklch(0.85 0.15 85)"
        stroke={INK}
        strokeWidth="3"
        strokeLinejoin="round"
      />
    );
  }
  if (type === "flower") {
    return (
      <g stroke={INK} strokeWidth="2.5">
        {[0, 72, 144, 216, 288].map((angle) => (
          <circle key={angle} cx={84 + 7 * Math.cos((angle * Math.PI) / 180)} cy={22 + 7 * Math.sin((angle * Math.PI) / 180)} r="6" fill="oklch(0.88 0.08 330)" />
        ))}
        <circle cx="84" cy="22" r="5" fill="oklch(0.88 0.15 90)" />
      </g>
    );
  }
  if (type === "beanie") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M26 34 C 28 6 92 6 94 34 Z" fill="oklch(0.7 0.13 250)" />
        <rect x="24" y="28" width="72" height="9" rx="4" fill="oklch(0.62 0.13 250)" />
        <circle cx="60" cy="6" r="7" fill="white" />
      </g>
    );
  }
  if (type === "bow") {
    return (
      <g fill="var(--chick-heart)" stroke="var(--chick-line)" strokeWidth="3" strokeLinejoin="round">
        <path d="M60 20 L44 10 L44 30 Z" />
        <path d="M60 20 L76 10 L76 30 Z" />
        <circle cx="60" cy="20" r="4" />
      </g>
    );
  }
  return null;
}

// Faces for different moods. "happy" is the normal face.
const TEAR = "oklch(78% 0.1 230)";
function Face({ mood }) {
  if (mood === "crying") {
    return (
      <g>
        {/* Squeezed-shut eyes, streams of tears, and a wailing open beak */}
        <g fill="none" stroke="var(--chick-line)" strokeWidth="3.5" strokeLinecap="round">
          <path d="M33 58 l7 4 l-7 4" />
          <path d="M87 58 l-7 4 l7 4" />
        </g>
        <path d="M37 68 q-2 12 1 24" fill="none" stroke={TEAR} strokeWidth="5" strokeLinecap="round" />
        <path d="M83 68 q2 12 -1 24" fill="none" stroke={TEAR} strokeWidth="5" strokeLinecap="round" />
        <path d="M51 60 q9 -4 18 0 l-3 9 q-6 3 -12 0 z" fill="var(--chick-beak)" stroke="var(--chick-line)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M54 64 q6 2 12 0" fill="none" stroke="var(--chick-line)" strokeWidth="2" />
      </g>
    );
  }
  const sad = mood === "sad";
  return (
    <g>
      <ellipse cx="40" cy="60" rx="3.5" ry="4.5" fill="var(--chick-line)" />
      <ellipse cx="80" cy="60" rx="3.5" ry="4.5" fill="var(--chick-line)" />
      {sad ? (
        <>
          {/* Worried eyebrows, a droopy beak, and one tear */}
          <g fill="none" stroke="var(--chick-line)" strokeWidth="3" strokeLinecap="round">
            <path d="M32 51 L45 47" />
            <path d="M88 51 L75 47" />
          </g>
          <path d="M53 62 q7 -4 14 0 q-1 6 -7 7 q-6 -1 -7 -7 z" fill="var(--chick-beak)" />
          <path d="M84 67 q3 5 0 8 q-3 -3 0 -8 z" fill={TEAR} stroke="var(--chick-line)" strokeWidth="1.5" />
        </>
      ) : (
        <path d="M52 58 q8 -5 16 0 q-2 6 -8 6 q-6 0 -8 -6 z" fill="var(--chick-beak)" />
      )}
    </g>
  );
}

// Things a chick can wear on its face or neck (bought in the Henhouse).
function FaceWear({ type }) {
  if (type === "glasses") {
    return (
      <g fill="none" stroke={INK} strokeWidth="2.5">
        <circle cx="40" cy="60" r="9" fill="white" fillOpacity="0.25" />
        <circle cx="80" cy="60" r="9" fill="white" fillOpacity="0.25" />
        <path d="M49 59 Q60 54 71 59" />
      </g>
    );
  }
  if (type === "shades") {
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M28 54 L52 54 L50 66 Q40 70 30 66 Z" fill={INK} />
        <path d="M68 54 L92 54 L90 66 Q80 70 70 66 Z" fill={INK} />
        <path d="M52 56 L68 56" fill="none" />
        <path d="M33 57 l5 0" stroke="white" strokeWidth="2" />
      </g>
    );
  }
  return null;
}

function NeckWear({ type }) {
  if (type === "scarf") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" fill="oklch(0.65 0.18 25)">
        <path d="M14 76 Q60 88 106 76 L106 85 Q60 97 14 85 Z" />
        <path d="M80 86 L92 86 L94 99 L82 99 Z" />
      </g>
    );
  }
  if (type === "bowtie") {
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round" fill="oklch(0.6 0.16 280)">
        <path d="M60 80 L46 72 L46 88 Z" />
        <path d="M60 80 L74 72 L74 88 Z" />
        <circle cx="60" cy="80" r="4" />
      </g>
    );
  }
  return null;
}

// variant: an avatar from CHICKS. Optional `color` (a CHICK_COLORS id) repaints it, and
// `wear` ({ head, face, neck }) dresses it up; head "none" hides the avatar's own hat or bow.
export default function Chick({ variant = "sunny", size = 96, className = "", mood = "happy", color, wear }) {
  const base = CHICKS[variant] || CHICKS.sunny;
  const paint = CHICK_COLORS[color];
  const chick = paint ? { ...base, body: paint.body, belly: paint.belly } : base;
  const head = wear?.head === "none" ? null : wear?.head || base.extra;
  // Each chick needs its own unique ID for the clip path, even if two chicks look the same.
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 120 100"
      width={size}
      height={size * (100 / 120)}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={BODY} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="120" height="100" fill={chick.body} />
        <rect y="72" width="120" height="30" fill={chick.belly} />
      </g>
      <path d={BODY} fill="none" stroke="var(--chick-line)" strokeWidth="4" />
      <NeckWear type={wear?.neck} />
      <Face mood={mood} />
      <FaceWear type={wear?.face} />
      <Accessory type={head} />
    </svg>
  );
}
