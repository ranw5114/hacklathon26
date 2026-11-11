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
  rose: { name: "Rose", body: "oklch(0.88 0.07 10)", belly: "oklch(0.8 0.1 10)" },
  coral: { name: "Coral", body: "oklch(0.82 0.11 35)", belly: "oklch(0.74 0.13 35)" },
  teal: { name: "Teal", body: "oklch(0.82 0.08 195)", belly: "oklch(0.74 0.1 195)" },
  cloud: { name: "Cloud", body: "oklch(0.96 0.005 250)", belly: "oklch(0.89 0.01 250)" },
  gold: { name: "Gold", body: "oklch(0.86 0.14 85)", belly: "oklch(0.78 0.15 75)" },
  ruby: { name: "Ruby", body: "oklch(0.62 0.17 20)", belly: "oklch(0.54 0.18 20)" },
  forest: { name: "Forest", body: "oklch(0.62 0.1 150)", belly: "oklch(0.54 0.11 150)" },
  bubblegum: { name: "Bubblegum", body: "oklch(0.85 0.12 345)", belly: "oklch(0.77 0.15 345)" },
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
  if (type === "tophat") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <rect x="42" y="-8" width="36" height="32" rx="3" fill="oklch(0.3 0.03 40)" />
        <rect x="42" y="13" width="36" height="6" fill="oklch(0.6 0.18 25)" />
        <ellipse cx="60" cy="25" rx="30" ry="5" fill="oklch(0.3 0.03 40)" />
      </g>
    );
  }
  if (type === "cowboy") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M38 22 C 36 4 46 -2 60 4 C 74 -2 84 4 82 22 Z" fill="oklch(0.62 0.1 55)" />
        <path d="M10 22 C 20 34 100 34 110 22 C 104 16 96 20 92 22 C 80 28 40 28 28 22 C 24 20 16 16 10 22 Z" fill="oklch(0.62 0.1 55)" />
        <path d="M39 17 Q60 22 81 17" fill="none" stroke="oklch(0.4 0.06 50)" strokeWidth="4" />
      </g>
    );
  }
  if (type === "chef") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round" fill="white">
        <circle cx="45" cy="8" r="10" />
        <circle cx="75" cy="8" r="10" />
        <circle cx="60" cy="0" r="12" />
        <rect x="40" y="10" width="40" height="16" rx="3" />
      </g>
    );
  }
  if (type === "bunny") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <ellipse cx="44" cy="2" rx="8" ry="20" fill="white" transform="rotate(-14 44 2)" />
        <ellipse cx="44" cy="4" rx="3.5" ry="13" fill="oklch(0.85 0.08 0)" stroke="none" transform="rotate(-14 44 4)" />
        <ellipse cx="76" cy="2" rx="8" ry="20" fill="white" transform="rotate(14 76 2)" />
        <ellipse cx="76" cy="4" rx="3.5" ry="13" fill="oklch(0.85 0.08 0)" stroke="none" transform="rotate(14 76 4)" />
      </g>
    );
  }
  if (type === "halo") {
    return (
      <g fill="none">
        <ellipse cx="60" cy="4" rx="24" ry="6" stroke={INK} strokeWidth="7" />
        <ellipse cx="60" cy="4" rx="24" ry="6" stroke="oklch(0.88 0.15 90)" strokeWidth="3.5" />
      </g>
    );
  }
  if (type === "witch") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M36 26 L66 -18 L80 24 Z" fill="oklch(0.45 0.13 300)" />
        <path d="M40 18 Q60 24 78 18 L79 22 Q60 28 39 22 Z" fill="oklch(0.85 0.15 90)" />
        <ellipse cx="58" cy="26" rx="38" ry="6" fill="oklch(0.45 0.13 300)" />
      </g>
    );
  }
  if (type === "beret") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M24 30 C 22 14 56 6 86 14 C 98 18 96 28 86 30 C 66 34 40 34 24 30 Z" fill="oklch(0.5 0.15 20)" />
        <path d="M58 9 l2 -6" strokeLinecap="round" />
      </g>
    );
  }
  if (type === "explorer") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <ellipse cx="60" cy="27" rx="44" ry="7" fill="oklch(0.78 0.07 85)" />
        <path d="M30 26 C 30 2 90 2 90 26 Z" fill="oklch(0.82 0.07 85)" />
        <path d="M31 21 Q60 26 89 21" fill="none" stroke="oklch(0.55 0.08 60)" strokeWidth="4" />
      </g>
    );
  }
  if (type === "headphones") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M17 58 C 14 4 106 4 103 58" fill="none" strokeWidth="6" />
        <path d="M17 58 C 14 4 106 4 103 58" fill="none" stroke="oklch(0.6 0.15 280)" strokeWidth="2.5" />
        <rect x="6" y="46" width="15" height="24" rx="6" fill="oklch(0.6 0.15 280)" />
        <rect x="99" y="46" width="15" height="24" rx="6" fill="oklch(0.6 0.15 280)" />
      </g>
    );
  }
  if (type === "headband") {
    return (
      <path
        d="M20 42 Q60 22 100 42 L100 51 Q60 31 20 51 Z"
        fill="oklch(0.62 0.2 25)"
        stroke={INK}
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
  if (type === "hearts") {
    const heart = (x) => `M${x} 68 C ${x - 14} 58 ${x - 10} 46 ${x} 53 C ${x + 10} 46 ${x + 14} 58 ${x} 68 Z`;
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d={heart(40)} fill="oklch(0.7 0.2 10)" fillOpacity="0.85" />
        <path d={heart(80)} fill="oklch(0.7 0.2 10)" fillOpacity="0.85" />
        <path d="M50 57 Q60 53 70 57" fill="none" />
      </g>
    );
  }
  if (type === "monocle") {
    return (
      <g fill="none" stroke={INK} strokeWidth="2.5">
        <circle cx="80" cy="60" r="10" stroke="oklch(0.7 0.13 80)" strokeWidth="3.5" fill="white" fillOpacity="0.2" />
        <path d="M89 66 Q96 78 92 92" stroke="oklch(0.7 0.13 80)" strokeWidth="2" />
      </g>
    );
  }
  if (type === "goggles") {
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <path d="M12 58 L108 58" strokeWidth="4" stroke="oklch(0.55 0.08 60)" />
        <rect x="27" y="49" width="27" height="21" rx="9" fill="oklch(0.9 0.06 220)" fillOpacity="0.85" />
        <rect x="66" y="49" width="27" height="21" rx="9" fill="oklch(0.9 0.06 220)" fillOpacity="0.85" />
        <path d="M54 59 L66 59" />
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

// Clothes on the body (drawn inside the body outline).
function BodyWear({ type }) {
  if (type === "sweater") {
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        <rect x="0" y="70" width="120" height="40" fill="oklch(0.62 0.13 250)" />
        <path d="M0 82 L10 76 L20 82 L30 76 L40 82 L50 76 L60 82 L70 76 L80 82 L90 76 L100 82 L110 76 L120 82" fill="none" stroke="white" strokeWidth="3" />
        <path d="M40 70 Q60 80 80 70" fill="none" />
      </g>
    );
  }
  if (type === "labcoat") {
    return (
      <g stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
        {/* White coat with a V of shirt showing, lapels, buttons, and a pocket */}
        <path d="M0 64 L46 64 L60 84 L74 64 L120 64 L120 110 L0 110 Z" fill="white" />
        <path d="M46 64 L60 84 L74 64 Z" fill="oklch(0.82 0.06 230)" />
        <path d="M46 64 L52 76 L44 74 Z M74 64 L68 76 L76 74 Z" fill="oklch(0.95 0 0)" />
        <circle cx="60" cy="88" r="1.8" fill={INK} />
        <path d="M20 76 h13 v9 h-13 z" fill="none" />
      </g>
    );
  }
  return null;
}

// Something the chick holds, in front of its body on the right.
function Prop({ type }) {
  if (!type) return null;
  const common = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round", strokeLinecap: "round" };
  if (type === "flask") {
    return (
      <g {...common}>
        <path d="M88 62 L96 62 L96 70 L106 92 L78 92 L88 70 Z" fill="white" />
        <path d="M82 84 L102 84 L106 92 L78 92 Z" fill="oklch(0.82 0.17 145)" />
        <path d="M86 62 L98 62" />
      </g>
    );
  }
  if (type === "leaf") {
    return (
      <g {...common}>
        <path d="M84 92 C 82 72 96 62 108 60 C 110 76 100 90 84 92 Z" fill="oklch(0.75 0.17 145)" />
        <path d="M86 90 C 92 80 98 72 106 63" fill="none" />
      </g>
    );
  }
  if (type === "apple") {
    return (
      <g {...common}>
        <path d="M95 70 C 86 64 78 72 80 82 C 82 92 90 96 95 92 C 100 96 108 92 110 82 C 112 72 104 64 95 70 Z" fill="oklch(0.62 0.2 25)" />
        <path d="M95 70 L96 63" fill="none" />
        <path d="M96 64 C 100 60 104 61 105 63 C 101 66 98 66 96 64 Z" fill="oklch(0.72 0.17 145)" />
      </g>
    );
  }
  if (type === "pencil") {
    return (
      <g {...common} transform="rotate(-35 96 78)">
        <rect x="88" y="62" width="10" height="28" fill="oklch(0.88 0.15 90)" />
        <path d="M88 90 L93 99 L98 90 Z" fill="oklch(0.9 0.04 70)" />
        <rect x="88" y="58" width="10" height="5" fill="oklch(0.8 0.1 15)" />
      </g>
    );
  }
  if (type === "book") {
    return (
      <g {...common}>
        <rect x="80" y="66" width="28" height="28" rx="3" fill="oklch(0.62 0.13 250)" />
        <path d="M84 70 L104 70 L104 90" fill="none" stroke="white" strokeWidth="2" />
        <path d="M87 76 h12" stroke="white" strokeWidth="2" />
      </g>
    );
  }
  if (type === "scroll") {
    return (
      <g {...common}>
        <rect x="82" y="66" width="24" height="26" fill="oklch(0.94 0.05 85)" />
        <rect x="79" y="62" width="30" height="7" rx="3.5" fill="oklch(0.85 0.07 70)" />
        <rect x="79" y="89" width="30" height="7" rx="3.5" fill="oklch(0.85 0.07 70)" />
        <path d="M87 75 h14 M87 81 h10" />
      </g>
    );
  }
  if (type === "balloon") {
    return (
      <g {...common}>
        <path d="M96 94 Q92 76 102 58" fill="none" strokeWidth="1.5" />
        <ellipse cx="104" cy="44" rx="12" ry="14" fill="oklch(0.68 0.2 25)" />
        <path d="M101 58 L107 58 L104 54 Z" fill="oklch(0.68 0.2 25)" />
        <ellipse cx="99" cy="38" rx="3" ry="5" fill="white" opacity="0.6" stroke="none" />
      </g>
    );
  }
  if (type === "wand") {
    return (
      <g {...common}>
        <path d="M88 96 L104 64" strokeWidth="4" />
        <path d="M105 50 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="oklch(0.88 0.15 90)" />
      </g>
    );
  }
  if (type === "mug") {
    return (
      <g {...common}>
        <path d="M82 72 L102 72 L100 94 L84 94 Z" fill="oklch(0.85 0.08 30)" />
        <path d="M102 76 C 110 76 110 88 101 88" fill="none" />
        <path d="M88 66 q-3 -4 0 -8 M95 66 q-3 -4 0 -8" fill="none" strokeWidth="2" />
      </g>
    );
  }
  if (type === "trophy") {
    return (
      <g {...common}>
        <path d="M84 64 L106 64 L104 78 C 102 84 88 84 86 78 Z" fill="oklch(0.85 0.15 85)" />
        <path d="M84 67 C 76 67 78 78 87 77 M106 67 C 114 67 112 78 103 77" fill="none" />
        <rect x="92" y="83" width="6" height="6" fill="oklch(0.85 0.15 85)" />
        <rect x="86" y="89" width="18" height="6" rx="1" fill="oklch(0.6 0.08 55)" />
      </g>
    );
  }
  if (type === "paintbrush") {
    return (
      <g {...common} transform="rotate(30 96 78)">
        <rect x="93" y="70" width="6" height="26" fill="oklch(0.65 0.1 55)" />
        <path d="M92 70 C 92 60 100 60 100 70 Z" fill="oklch(0.65 0.2 300)" />
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
  if (type === "pearls") {
    return (
      <g stroke={INK} strokeWidth="1.5" fill="white">
        {[16, 25, 34, 43, 52, 60, 68, 77, 86, 95, 104].map((x) => (
          <circle key={x} cx={x} cy={78 + 6 * Math.sin(((x - 16) / 88) * Math.PI)} r="4" />
        ))}
      </g>
    );
  }
  if (type === "bandana") {
    return (
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M22 74 Q60 84 98 74 L60 100 Z" fill="oklch(0.62 0.2 25)" />
        <g fill="white" stroke="none">
          <circle cx="50" cy="82" r="2" />
          <circle cx="66" cy="83" r="2" />
          <circle cx="58" cy="91" r="2" />
        </g>
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
// `wear` ({ head, face, neck, body, prop }) dresses it up; head "none" hides the avatar's own hat or bow.
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
      {wear?.body === "cape" && (
        <path
          d="M18 56 C 2 74 0 92 8 102 L112 102 C 120 92 118 74 102 56 Z"
          fill="oklch(0.6 0.2 25)"
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      <g clipPath={`url(#${clipId})`}>
        <rect width="120" height="100" fill={chick.body} />
        <rect y="72" width="120" height="30" fill={chick.belly} />
        <BodyWear type={wear?.body} />
      </g>
      <path d={BODY} fill="none" stroke="var(--chick-line)" strokeWidth="4" />
      <NeckWear type={wear?.neck} />
      <Face mood={mood} />
      <FaceWear type={wear?.face} />
      <Accessory type={head} />
      <Prop type={wear?.prop} />
    </svg>
  );
}
