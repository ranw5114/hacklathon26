// Drawings for the Egg Timer and the flock, in the same outlined style as the chicks.

import { useId } from "react";
import Chick, { CHICK_COLORS, CHICKS } from "@/components/Chick";

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

// The pattern on each new egg (see EGG_STYLES in lib/timer.js). Drawn inside the egg's outline.
function EggPattern({ style }) {
  const ink = "oklch(80% 0.09 60)";
  if (style === "speckled") {
    const dots = [[58, 76], [78, 80], [66, 92], [84, 100], [55, 104], [72, 110], [62, 116], [88, 88]];
    return dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 2 ? 1.8 : 2.4} fill={ink} />);
  }
  if (style === "striped") {
    return (
      <g fill="oklch(88% 0.08 230)">
        <rect x="40" y="86" width="60" height="6" />
        <rect x="40" y="100" width="60" height="6" />
      </g>
    );
  }
  if (style === "spotted") {
    return (
      <g fill="oklch(88% 0.09 165)">
        <circle cx="60" cy="82" r="5" />
        <circle cx="82" cy="96" r="6" />
        <circle cx="58" cy="108" r="4.5" />
        <circle cx="76" cy="114" r="3.5" />
      </g>
    );
  }
  if (style === "zigzag") {
    return (
      <path d="M44 98 L51 91 L58 98 L65 91 L72 98 L79 91 L86 98 L93 91 L96 98" fill="none" stroke="oklch(80% 0.12 330)" strokeWidth="4" strokeLinejoin="round" />
    );
  }
  if (style === "hearts") {
    const heart = (x, y, k) => `M${x} ${y + 3 * k} c ${-4 * k} ${-3 * k} ${-4 * k} ${-7 * k} 0 ${-6 * k} c ${4 * k} ${-1 * k} ${4 * k} ${3 * k} 0 ${6 * k} z`;
    return (
      <g fill="oklch(84% 0.1 15)">
        <path d={heart(60, 84, 1.3)} />
        <path d={heart(80, 100, 1.5)} />
        <path d={heart(62, 110, 1.1)} />
      </g>
    );
  }
  return null;
}

// The egg being kept warm: shell, pattern, shine, and cracks.
function Egg({ eggStyle, cracks, wiggle, clipId }) {
  return (
    <g className={wiggle ? "animate-egg-wiggle" : ""}>
      <defs>
        <clipPath id={clipId}>
          <path d={EGG} />
        </clipPath>
      </defs>
      <path d={EGG} fill={SHELL} />
      <g clipPath={`url(#${clipId})`}>
        <EggPattern style={eggStyle} />
      </g>
      <path d={EGG} fill="none" stroke={LINE} strokeWidth="3.5" />
      <ellipse cx="62" cy="82" rx="5" ry="7" fill="white" opacity="0.9" />
      {cracks > 0 && (
        <path d={CRACKS[Math.min(cracks, 3)]} fill="none" stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </g>
  );
}

// The student's chick with its egg.
//   holding: "egg" (keeping it warm), "fried" (it just got fried), or "none" (the fried egg flew away)
//   mood: "happy" or "sad" · cracks: 0-3 · animate: rock gently while brooding
export function BroodingChick({
  avatar = "sunny",
  cracks = 0,
  animate = false,
  eggStyle = "plain",
  holding = "egg",
  mood = "happy",
  size = 120,
  className = "",
}) {
  // The wings match the chick's color, including a Henhouse chick's paint.
  const baseVariant = typeof avatar === "object" ? avatar.variant : avatar;
  const paint = typeof avatar === "object" ? CHICK_COLORS[avatar.color] : null;
  const chick = { ...(CHICKS[baseVariant] || CHICKS.sunny), ...(paint ? { body: paint.body } : {}) };
  const clipId = useId();
  return (
    <svg viewBox="0 0 140 126" width={size} height={size * (126 / 140)} className={`overflow-visible ${className}`} aria-hidden="true">
      {/* Warm glow while brooding */}
      {holding === "egg" && <ellipse cx="70" cy="96" rx="58" ry="26" fill="var(--chick-beak)" opacity={animate ? 0.18 : 0.08} />}
      <g className={animate ? "animate-brood" : ""}>
        {/* The chick, sitting behind its egg */}
        <svg x="14" y="-6" width="112" height="93" viewBox="0 0 120 100" overflow="visible">
          <Chick variant={avatar} size={120} mood={mood} />
        </svg>
        {holding === "egg" && <Egg eggStyle={eggStyle} cracks={cracks} wiggle={animate && cracks >= 2} clipId={clipId} />}
        {holding === "fried" && (
          <svg x="36" y="74" width="68" height="57" viewBox="0 0 60 50">
            <FriedEggShape />
          </svg>
        )}
        {/* Wings: wrapped around the egg, or drooping when there's nothing left to hold */}
        {holding === "none" ? (
          <>
            <path d="M30 70 C 22 80 24 94 36 98 C 38 88 36 78 30 70 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
            <path d="M110 70 C 118 80 116 94 104 98 C 102 88 104 78 110 70 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <path d="M34 78 C 26 92 34 106 50 106 C 48 96 44 86 34 78 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
            <path d="M106 78 C 114 92 106 106 90 106 C 92 96 96 86 106 78 Z" fill={chick.body} stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
          </>
        )}
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

// The fried egg itself (white + yolk), in a 60×50 box. Used on its own and inside other drawings.
function FriedEggShape() {
  return (
    <>
      <path
        d="M10 26 C 6 14 18 6 28 9 C 36 3 50 8 50 18 C 57 24 54 38 44 40 C 38 47 22 46 18 40 C 8 40 4 32 10 26 Z"
        fill={SHELL}
        stroke={LINE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="25" r="9.5" fill="oklch(82% 0.17 75)" stroke={LINE} strokeWidth="3" />
      <ellipse cx="27" cy="22" rx="2.5" ry="2" fill="white" opacity="0.85" />
    </>
  );
}

// An egg that got fried (stopped early, or left paused too long).
export function FriedEgg({ size = 48, className = "" }) {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * (50 / 60)} className={className} aria-hidden="true">
      <FriedEggShape />
    </svg>
  );
}

// The drumstick itself, in a 60×50 box.
function DrumstickShape() {
  return (
    <>
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
    </>
  );
}

// A chick lost on a missed study-plan day.
export function Drumstick({ size = 48, className = "" }) {
  return (
    <svg viewBox="0 0 60 50" width={size} height={size * (50 / 60)} className={className} aria-hidden="true">
      <DrumstickShape />
    </svg>
  );
}

// How many items to draw in a stack or bucket before the number says the rest.
const MAX_STACK = 10;
const MAX_BUCKET = 7;

// Fried eggs stacked on a plate, like a pile of pancakes. `count` is how many to draw.
export function FriedEggPlate({ count, size = 180, className = "" }) {
  const shown = Math.min(count, MAX_STACK);
  return (
    <svg viewBox="0 0 160 150" width={size} height={size * (150 / 160)} className={`overflow-visible ${className}`} aria-hidden="true">
      {count > MAX_STACK && (
        <text x="150" y="20" textAnchor="end" fontFamily="var(--font-fredoka), sans-serif" fontWeight="700" fontSize="16" fill={LINE}>
          ×{count}
        </text>
      )}
      {/* Plate */}
      <ellipse cx="80" cy="128" rx="74" ry="17" fill="var(--card)" stroke={LINE} strokeWidth="3" />
      <ellipse cx="80" cy="125" rx="52" ry="10" fill="oklch(95% 0.02 230)" stroke={LINE} strokeWidth="2" />
      {/* Stack, bottom to top: each egg is squashed flat (seen from the side) and a little higher */}
      {Array.from({ length: shown }, (_, i) => (
        <svg key={i} x={40 + (i % 2 ? 8 : -4)} y={104 - i * 10} width="76" height="34" viewBox="0 0 60 50" preserveAspectRatio="none">
          <FriedEggShape />
        </svg>
      ))}
    </svg>
  );
}

// A takeout bucket with drumsticks poking out of the top.
export function TakeoutBucket({ count, size = 160, className = "" }) {
  const clipId = useId();
  const shown = Math.min(count, MAX_BUCKET);
  const BUCKET = "M24 62 L136 62 L122 146 L38 146 Z";
  return (
    <svg viewBox="0 0 160 150" width={size} height={size * (150 / 160)} className={`overflow-visible ${className}`} aria-hidden="true">
      {/* Drumsticks sticking out, fanned across the top */}
      {Array.from({ length: shown }, (_, i) => {
        const spread = shown === 1 ? 0 : (i / (shown - 1)) * 2 - 1; // -1 … 1
        return (
          <svg key={i} x={48 + spread * 40} y={4 + Math.abs(spread) * 8} width="64" height="54" viewBox="0 0 60 50" overflow="visible">
            <g transform={`rotate(${-129 + spread * 35} 30 25)`}>
              <DrumstickShape />
            </g>
          </svg>
        );
      })}
      {/* Bucket with red and white stripes */}
      <defs>
        <clipPath id={clipId}>
          <path d={BUCKET} />
        </clipPath>
      </defs>
      <path d={BUCKET} fill="var(--card)" />
      <g clipPath={`url(#${clipId})`} fill="oklch(62% 0.2 25)">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={20 + i * 24} y="60" width="12" height="90" />
        ))}
      </g>
      <path d={BUCKET} fill="none" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      <rect x="18" y="56" width="124" height="12" rx="4" fill="var(--card)" stroke={LINE} strokeWidth="3" />
      {/* Label */}
      <rect x="52" y="90" width="56" height="28" rx="8" fill="var(--card)" stroke={LINE} strokeWidth="2.5" />
      <text x="80" y="109" textAnchor="middle" fontFamily="var(--font-fredoka), sans-serif" fontWeight="700" fontSize="15" fill={LINE}>
        CLUCK
      </text>
    </svg>
  );
}

// The roof over the chick coop, with a sign.
export function CoopRoof({ className = "" }) {
  return (
    <svg viewBox="0 0 400 70" preserveAspectRatio="none" className={`block h-16 w-full ${className}`} aria-hidden="true">
      <path d="M6 66 L200 6 L394 66 Z" fill="oklch(62% 0.16 30)" stroke={LINE} strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M60 50 L340 50" stroke="oklch(52% 0.15 30)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <path d="M120 32 L280 32" stroke="oklch(52% 0.15 30)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// A barn doorway with its red door swung open; `children` (like a chick) stand in the doorway.
// The door swings a little wider when a parent with the "group" class is hovered.
export function BarnDoorway({ size = 64, children }) {
  const red = "oklch(62% 0.16 30)";
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} className="absolute inset-0 overflow-visible" aria-hidden="true">
        {/* The dark doorway, with a frame */}
        <path d="M10 62 V24 Q32 2 54 24 V62 Z" fill="oklch(38% 0.05 45)" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
        {/* The open door, hinged on the right */}
        <g className="origin-[54px_40px] transition-transform duration-300 group-hover:[transform:skewY(-6deg)_scaleX(0.8)]">
          <path d="M54 24 L63 20 L63 63 L54 62 Z" fill={red} stroke={LINE} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M55 26 L62 61 M62 23 L55 60" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </svg>
      <span className="absolute inset-x-0 bottom-0.5 flex justify-center">{children}</span>
    </span>
  );
}

// A grown-up chicken for the yard: "hen" (10 chicks grown up) or "rooster" (a golden rooster, 5 hens).
export function Chicken({ kind = "hen", size = 48, className = "" }) {
  const rooster = kind === "rooster";
  const body = rooster ? "oklch(84% 0.14 85)" : "oklch(97% 0.02 85)";
  const wing = rooster ? "oklch(74% 0.15 70)" : "oklch(90% 0.03 80)";
  const red = "oklch(60% 0.2 28)";
  const s = { stroke: LINE, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={`overflow-visible ${className}`} aria-hidden="true">
      {/* Tail feathers (a rooster's are long and colorful) */}
      {rooster ? (
        <>
          <path d="M70 52 Q96 14 94 46" fill="none" {...s} stroke="oklch(55% 0.13 155)" strokeWidth="7" />
          <path d="M70 56 Q100 30 92 62" fill="none" {...s} stroke={red} strokeWidth="7" />
          <path d="M70 52 Q96 14 94 46 M70 56 Q100 30 92 62" fill="none" {...s} strokeWidth="2" />
        </>
      ) : (
        <path d="M68 44 Q90 26 88 52 Q84 64 70 62 Z" fill={body} {...s} />
      )}
      {/* Legs */}
      <path d="M48 80 L46 92 M42 93 L50 93 M60 80 L62 92 M58 93 L66 93" fill="none" {...s} stroke="oklch(70% 0.16 60)" />
      {/* Body, wing, head */}
      <ellipse cx="55" cy="60" rx="27" ry="23" fill={body} {...s} />
      <path d="M50 56 Q63 50 73 61 Q62 71 50 64 Z" fill={wing} {...s} strokeWidth="2.5" />
      <circle cx="35" cy="34" r="14" fill={body} {...s} />
      {/* Comb (taller on a rooster), beak, wattle, eye */}
      <path
        d={rooster ? "M24 24 q0 -14 7 -5 q2 -14 8 -4 q5 -11 8 3 q-10 4 -23 6 z" : "M26 23 q2 -8 6 -2 q3 -8 7 -1 q4 -6 6 3 q-9 2 -19 0 z"}
        fill={red}
        {...s}
        strokeWidth="2.5"
      />
      <path d="M22 33 L12 36 L22 39 Z" fill="oklch(80% 0.15 70)" {...s} strokeWidth="2.5" />
      <path d="M24 40 q-3 8 3 8 q3 -2 1 -8 z" fill={red} {...s} strokeWidth="2" />
      <circle cx="31" cy="31" r="2.2" fill={LINE} />
      {rooster && <path d="M80 18 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z" fill="oklch(92% 0.12 95)" {...s} strokeWidth="1.5" />}
    </svg>
  );
}

// The two buildings at the top of the Henhouse and Shop pages: "henhouse" (a red barn with a
// chick peeking out) or "shop" (a market stall with a striped awning and corn on the counter).
export function FarmBuilding({ kind, size = 120 }) {
  const s = { stroke: LINE, strokeWidth: 3, strokeLinejoin: "round" };
  const red = "oklch(62% 0.16 30)";
  const wood = "oklch(78% 0.09 65)";
  return (
    <svg viewBox="0 0 120 90" width={size} height={size * 0.75} className="overflow-visible" aria-hidden="true">
      {kind === "henhouse" ? (
        <>
          <rect x="16" y="38" width="88" height="48" fill={red} {...s} />
          <path d="M8 42 L60 8 L112 42 Z" fill="oklch(50% 0.12 30)" {...s} />
          <circle cx="60" cy="29" r="8" fill="oklch(38% 0.05 45)" {...s} strokeWidth="2.5" />
          <circle cx="60" cy="31" r="5" fill="var(--chick-body)" stroke={LINE} strokeWidth="1.5" />
          <rect x="46" y="56" width="28" height="30" fill="oklch(55% 0.15 30)" {...s} />
          <path d="M48 58 L72 84 M72 58 L48 84" stroke="white" strokeWidth="2.5" />
        </>
      ) : (
        <>
          <rect x="16" y="44" width="5" height="12" fill={wood} {...s} strokeWidth="2" />
          <rect x="99" y="44" width="5" height="12" fill={wood} {...s} strokeWidth="2" />
          <rect x="12" y="54" width="96" height="32" fill={wood} {...s} />
          {/* Striped awning with a scalloped edge */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={8 + i * 13} y="26" width="13" height="16" fill={i % 2 ? "white" : red} />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <circle key={i} cx={14.5 + i * 13} cy="42" r="6.5" fill={i % 2 ? "white" : red} {...s} strokeWidth="2" />
          ))}
          <rect x="8" y="26" width="104" height="16" fill="none" {...s} />
          {/* Sign */}
          <rect x="36" y="6" width="48" height="16" rx="3" fill="oklch(88% 0.08 80)" {...s} strokeWidth="2.5" />
          <text x="60" y="18" textAnchor="middle" fontSize="11" fontWeight="700" fill={LINE} fontFamily="var(--font-display, sans-serif)">
            SHOP
          </text>
          {/* Corn on the counter */}
          {[34, 52, 70].map((x) => (
            <g key={x}>
              <ellipse cx={x + 6} cy="62" rx="5" ry="8" fill="oklch(85% 0.15 90)" {...s} strokeWidth="2" />
              <path d={`M${x + 1} 66 q5 6 10 0`} fill="oklch(65% 0.14 140)" {...s} strokeWidth="2" />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

// --- Eggs on the Nest path ---------------------------------------------------

const PATH_EGG = "M50 6 C 76 6 90 44 90 66 C 90 92 72 106 50 106 C 28 106 10 92 10 66 C 10 44 24 6 50 6 Z";
// The zigzag where the egg cracks open, and the shapes above and below it.
const CRACK_LINE = "8,60 20,50 32,60 44,50 56,60 68,50 80,60 92,52";
const TOP_HALF = `0,0 100,0 100,52 ${CRACK_LINE.split(" ").reverse().join(" ")} 0,60`;
const BOTTOM_HALF = `0,60 ${CRACK_LINE} 100,52 100,120 0,120`;

// One level on the Nest path, drawn as an egg.
//   state: "locked" | "ready" | "golden" | "fried" | "hatched"
//   cracking: true while it splits open (the lesson opens right after)
export function PathEgg({ state, cracking = false, chickColor = "sunny", size = 84 }) {
  const ids = useId();
  if (state === "fried") {
    return (
      <svg viewBox="0 0 60 50" width={size * 1.15} height={size * 0.96} aria-hidden="true" className="overflow-visible">
        <FriedEggShape />
      </svg>
    );
  }
  if (state === "hatched") {
    return <HatchedChick color={chickColor} size={size * 1.15} />;
  }

  const golden = state === "golden";
  const locked = state === "locked";
  const fill = locked ? "oklch(90% 0.005 80)" : golden ? `url(#${ids}-gold)` : SHELL;
  const shell = (
    <>
      <path d={PATH_EGG} fill={fill} />
      {state === "ready" && (
        <g fill="oklch(85% 0.07 70)">
          <circle cx="36" cy="40" r="3" />
          <circle cx="62" cy="30" r="2.5" />
          <circle cx="66" cy="72" r="3.5" />
          <circle cx="34" cy="84" r="2.5" />
        </g>
      )}
      <path d={PATH_EGG} fill="none" stroke={LINE} strokeWidth="4" />
      <ellipse cx="36" cy="32" rx="6" ry="10" fill="white" opacity={locked ? 0.4 : 0.8} transform="rotate(20 36 32)" />
    </>
  );

  return (
    <svg viewBox="0 0 100 112" width={size} height={size * 1.12} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={`${ids}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(93% 0.12 95)" />
          <stop offset="1" stopColor="oklch(78% 0.16 75)" />
        </linearGradient>
        <clipPath id={`${ids}-top`}>
          <polygon points={TOP_HALF} />
        </clipPath>
        <clipPath id={`${ids}-bottom`}>
          <polygon points={BOTTOM_HALF} />
        </clipPath>
      </defs>
      {/* Bottom half stays put; the top half flips off when it cracks */}
      <g clipPath={`url(#${ids}-bottom)`}>{shell}</g>
      <g
        style={{
          transformBox: "fill-box",
          transformOrigin: "100% 100%",
          transition: "transform 0.45s cubic-bezier(.3,1.6,.5,1), opacity 0.45s",
          transform: cracking ? "translate(18px, -26px) rotate(35deg)" : "none",
          opacity: cracking ? 0 : 1,
        }}
      >
        <g clipPath={`url(#${ids}-top)`}>{shell}</g>
      </g>
      {cracking && <polyline points={CRACK_LINE} fill="none" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />}
      {golden && !cracking && (
        <g fill="white" stroke={LINE} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M80 18 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
          <path d="M16 54 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z" />
        </g>
      )}
      {locked && (
        <g stroke={LINE} strokeWidth="3.5" strokeLinejoin="round">
          <path d="M40 62 v-8 a10 10 0 0 1 20 0 v8" fill="none" />
          <rect x="34" y="60" width="32" height="24" rx="5" fill="oklch(80% 0.01 80)" />
          <circle cx="50" cy="72" r="3" fill={LINE} stroke="none" />
        </g>
      )}
    </svg>
  );
}

// --- A chick sitting in its nest (one per test, on the Nests page) ----------------------

// `wear` dresses the chick for the subject (see subjectOutfit in lib/nests.js).
export function ChickInNest({ avatar = "sunny", wear, mood = "happy", size = 150, className = "" }) {
  const twig = "oklch(0.55 0.08 60)";
  return (
    <svg viewBox="0 0 140 130" width={size} height={size * (130 / 140)} className={`overflow-visible ${className}`} aria-hidden="true">
      {/* Back of the nest */}
      <path d="M10 82 Q70 66 130 82 L126 90 Q70 76 14 90 Z" fill="oklch(0.6 0.08 60)" stroke={LINE} strokeWidth="3" strokeLinejoin="round" />
      {/* The chick, sitting low */}
      <svg x="10" y="-6" width="120" height="100" viewBox="0 0 120 100" overflow="visible">
        <Chick variant={avatar} wear={wear} mood={mood} size={120} />
      </svg>
      {/* Front of the nest, with twigs */}
      <path
        d="M6 84 Q70 100 134 84 C 134 108 110 124 70 124 C 30 124 6 108 6 84 Z"
        fill="oklch(0.7 0.09 65)"
        stroke={LINE}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <g fill="none" stroke={twig} strokeWidth="3" strokeLinecap="round">
        <path d="M16 96 Q40 104 62 100" />
        <path d="M54 110 Q84 114 120 98" />
        <path d="M26 112 Q48 118 70 116" />
        <path d="M82 104 Q100 106 124 92" />
      </g>
      <g stroke={LINE} strokeWidth="2.5" strokeLinecap="round">
        <path d="M2 82 L14 88" />
        <path d="M138 80 L126 88" />
        <path d="M60 124 L52 128" />
      </g>
    </svg>
  );
}
