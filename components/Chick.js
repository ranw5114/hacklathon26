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

export default function Chick({ variant = "sunny", size = 96, className = "", mood = "happy" }) {
  const chick = CHICKS[variant] || CHICKS.sunny;
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
      <Face mood={mood} />
      <Accessory type={chick.extra} />
    </svg>
  );
}
