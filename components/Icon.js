// The app's icons, drawn in the same style as the chicks: thick brown outlines and soft colors.
// They replace emoji everywhere, so the whole app matches. Usage: <Icon name="calendar" size={20} />

const LINE = "var(--chick-line)";
const YOLK = "var(--chick-body)";
const BEAK = "var(--chick-beak)";
const CREAM = "oklch(98.5% 0.012 85)";
const BROWN = "oklch(0.66 0.09 60)";
const RED = "oklch(0.64 0.19 25)";
const GREEN = "oklch(0.76 0.15 145)";
const BLUE = "oklch(0.78 0.09 235)";
const GOLD = "oklch(0.85 0.15 85)";
const PINK = "oklch(0.86 0.08 350)";

const stroke = { stroke: LINE, strokeWidth: 2.2, strokeLinejoin: "round", strokeLinecap: "round" };

// Each icon is drawn in a 32×32 box.
const ICONS = {
  // A baby chick peeking out of its shell
  chick: (
    <>
      <path d="M7.5 20 C 7.5 4 24.5 4 24.5 20 Z" fill={YOLK} {...stroke} />
      <circle cx="12.8" cy="11.5" r="1.4" fill={LINE} />
      <circle cx="19.2" cy="11.5" r="1.4" fill={LINE} />
      <path d="M14.3 13.6 L17.7 13.6 L16 15.4 Z" fill={BEAK} stroke={BEAK} strokeWidth="1" strokeLinejoin="round" />
      <path d="M5.5 19 L9 16.5 L12.5 19.5 L16 16.5 L19.5 19.5 L23 16.5 L26.5 19 C 26.5 25.5 21.5 28.5 16 28.5 C 10.5 28.5 5.5 25.5 5.5 19 Z" fill={CREAM} {...stroke} />
    </>
  ),
  // A grown-up hen's head
  hen: (
    <>
      <path d="M10 13 C 9 7 13 4 15 7 C 16 3 21 4 20 8 C 23 7 24 11 21 12" fill={RED} {...stroke} />
      <path d="M8 27 C 6 16 11 11 17 11 C 23 11 26 16 25 27 Z" fill={CREAM} {...stroke} />
      <circle cx="18.5" cy="16" r="1.4" fill={LINE} />
      <path d="M24 17 L28.5 18.5 L24 20.5 Z" fill={BEAK} {...stroke} strokeWidth="1.6" />
      <path d="M23 21 C 24 24 21 25 21 22" fill={RED} {...stroke} strokeWidth="1.6" />
    </>
  ),
  egg: (
    <>
      <path d="M16 4 C 23 4 26 15 26 19 C 26 25 21.5 28 16 28 C 10.5 28 6 25 6 19 C 6 15 9 4 16 4 Z" fill={CREAM} {...stroke} />
      <ellipse cx="12.5" cy="12" rx="2" ry="3.2" fill="white" transform="rotate(20 12.5 12)" />
      <circle cx="19" cy="20" r="1.2" fill="oklch(0.85 0.07 70)" />
      <circle cx="13" cy="23" r="0.9" fill="oklch(0.85 0.07 70)" />
    </>
  ),
  fried: (
    <>
      <path d="M5 16 C 3 9 10 5 15 7 C 19 3 27 6 27 11 C 30 15 28 22 23 23 C 20 27 12 27 10 23 C 4 23 2 19 5 16 Z" fill={CREAM} {...stroke} />
      <circle cx="16" cy="15" r="5" fill="oklch(0.82 0.17 75)" {...stroke} />
      <circle cx="14.5" cy="13.5" r="1.2" fill="white" />
    </>
  ),
  drumstick: (
    <>
      <path d="M17 17 L24 24" {...stroke} strokeWidth="5" />
      <path d="M17 17 L24 24" stroke={CREAM} strokeWidth="2" strokeLinecap="round" />
      <circle cx="25.5" cy="22.5" r="2.6" fill={CREAM} {...stroke} strokeWidth="1.8" />
      <circle cx="22.5" cy="25.5" r="2.6" fill={CREAM} {...stroke} strokeWidth="1.8" />
      <path d="M5 11 C 5 5 13 2 18 6 C 22 9 22 15 19 18 C 15 22 8 21 6 17 C 5 15 5 13 5 11 Z" fill="oklch(0.66 0.13 50)" {...stroke} />
      <path d="M9 9 C 11 7 13 6 15 7" stroke="oklch(0.8 0.1 60)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </>
  ),
  corn: (
    <>
      <path d="M16 4 C 21 4 22 10 22 16 C 22 22 19 26 16 26 C 13 26 10 22 10 16 C 10 10 11 4 16 4 Z" fill={GOLD} {...stroke} />
      <path d="M13 9 h6 M12 13 h8 M12 17 h8 M13 21 h6 M16 6 v18" stroke="oklch(0.7 0.13 75)" strokeWidth="1.3" fill="none" />
      <path d="M16 28 C 10 26 6 20 7 13 C 11 17 13 21 16 28 Z" fill={GREEN} {...stroke} />
      <path d="M16 28 C 22 26 26 20 25 13 C 21 17 19 21 16 28 Z" fill={GREEN} {...stroke} />
    </>
  ),
  nest: (
    <>
      <ellipse cx="11" cy="14" rx="4" ry="5" fill={CREAM} {...stroke} />
      <ellipse cx="19" cy="13" rx="4" ry="5" fill={CREAM} {...stroke} />
      <path d="M3 16 Q16 21 29 16 C 29 24 23 28 16 28 C 9 28 3 24 3 16 Z" fill={BROWN} {...stroke} />
      <path d="M6 21 Q12 23 18 22 M13 25 Q20 26 26 21" stroke="oklch(0.52 0.08 55)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  barn: (
    <>
      <path d="M4 14 L16 5 L28 14 L28 28 L4 28 Z" fill={RED} {...stroke} />
      <path d="M2 15 L16 4 L30 15" fill="none" {...stroke} stroke="oklch(0.95 0.02 80)" strokeWidth="1.6" />
      <path d="M2 15 L16 4 L30 15" fill="none" {...stroke} />
      <rect x="11" y="17" width="10" height="11" fill={CREAM} {...stroke} />
      <path d="M11 17 L21 28 M21 17 L11 28" {...stroke} strokeWidth="1.6" />
      <circle cx="16" cy="11.5" r="2" fill={CREAM} {...stroke} strokeWidth="1.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="5" y="7" width="22" height="21" rx="4" fill={CREAM} {...stroke} />
      <path d="M5 13 L27 13 L27 11 C 27 9 25.5 7 23 7 L9 7 C 6.5 7 5 9 5 11 Z" fill={RED} {...stroke} />
      <path d="M11 4 v5 M21 4 v5" {...stroke} />
      <circle cx="11" cy="18" r="1.3" fill={LINE} />
      <circle cx="16" cy="18" r="1.3" fill={LINE} />
      <circle cx="21" cy="18" r="1.3" fill={LINE} />
      <path d="M14 23 C 14 20 18 20 18 23 L19 25 L13 25 Z" fill={YOLK} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  todo: (
    <>
      <rect x="6" y="5" width="20" height="24" rx="3" fill={CREAM} {...stroke} />
      <rect x="11" y="3" width="10" height="5" rx="2" fill={BROWN} {...stroke} />
      <path d="M10 14 l2 2 l3 -3.5" fill="none" {...stroke} stroke={GREEN} strokeWidth="2.4" />
      <path d="M17.5 14.5 h5" {...stroke} strokeWidth="1.8" />
      <path d="M10 21 l2 2 l3 -3.5" fill="none" {...stroke} stroke={GREEN} strokeWidth="2.4" />
      <path d="M17.5 21.5 h5" {...stroke} strokeWidth="1.8" />
    </>
  ),
  homework: (
    <>
      <path d="M8 4 L20 4 L25 9 L25 28 L8 28 Z" fill={CREAM} {...stroke} />
      <path d="M20 4 L20 9 L25 9" fill="none" {...stroke} />
      <path d="M12 14 h9 M12 18 h9 M12 22 h6" {...stroke} strokeWidth="1.6" />
      <path d="M22 27 L28 15 L30 16 L24 28 L21.5 29 Z" fill={GOLD} {...stroke} strokeWidth="1.6" />
    </>
  ),
  chat: (
    <>
      <path d="M5 8 C 5 6 7 5 9 5 L23 5 C 25 5 27 6 27 8 L27 18 C 27 20 25 21 23 21 L14 21 L8 26 L9 21 C 7 21 5 20 5 18 Z" fill={CREAM} {...stroke} />
      <circle cx="11" cy="13" r="1.4" fill={LINE} />
      <circle cx="16" cy="13" r="1.4" fill={LINE} />
      <circle cx="21" cy="13" r="1.4" fill={LINE} />
    </>
  ),
  trophy: (
    <>
      <path d="M9 5 L23 5 L22 14 C 21 18 11 18 10 14 Z" fill={GOLD} {...stroke} />
      <path d="M9 7 C 4 7 4 13 10 13 M23 7 C 28 7 28 13 22 13" fill="none" {...stroke} />
      <rect x="14" y="17" width="4" height="5" fill={GOLD} {...stroke} strokeWidth="1.6" />
      <rect x="9" y="22" width="14" height="5" rx="1.5" fill={BROWN} {...stroke} />
      <path d="M14 9 C 14 7 18 7 18 9 L19 11 L13 11 Z" fill={YOLK} stroke={LINE} strokeWidth="1.2" />
    </>
  ),
  target: (
    <>
      <circle cx="16" cy="16" r="12" fill="white" {...stroke} />
      <circle cx="16" cy="16" r="8" fill={PINK} {...stroke} />
      <circle cx="16" cy="16" r="4" fill={RED} {...stroke} />
      <path d="M16 16 L27 5" {...stroke} />
      <path d="M24 4 L28 4 L28 8" fill="none" {...stroke} />
    </>
  ),
  chest: (
    <>
      <path d="M5 13 C 5 7 27 7 27 13 Z" fill={BROWN} {...stroke} />
      <rect x="5" y="13" width="22" height="14" rx="2" fill={BROWN} {...stroke} />
      <path d="M5 17 h22" {...stroke} />
      <rect x="13.5" y="14.5" width="5" height="6" rx="1" fill={GOLD} {...stroke} strokeWidth="1.6" />
      <path d="M9 22 C 9 20 12 20 12 22 L12.5 24 L8.5 24 Z" fill={GOLD} stroke={LINE} strokeWidth="1.2" />
    </>
  ),
  lock: (
    <>
      <path d="M11 14 v-4 a5 5 0 0 1 10 0 v4" fill="none" {...stroke} strokeWidth="2.6" />
      <rect x="7" y="14" width="18" height="14" rx="3" fill={GOLD} {...stroke} />
      <circle cx="16" cy="20" r="2" fill={LINE} />
      <path d="M16 21 v3" {...stroke} />
    </>
  ),
  star: (
    <path
      d="M16 3 L19.6 11.2 L28.5 12 L21.8 17.9 L23.8 26.6 L16 22 L8.2 26.6 L10.2 17.9 L3.5 12 L12.4 11.2 Z"
      fill={GOLD}
      {...stroke}
    />
  ),
  flame: (
    <>
      <path d="M16 3 C 18 9 25 11 25 19 C 25 25 21 29 16 29 C 11 29 7 25 7 19 C 7 14 10 12 11 8 C 13 11 13 13 14 14 C 15 10 15 7 16 3 Z" fill={BEAK} {...stroke} />
      <path d="M16 15 C 18 18 21 19 21 23 C 21 26 18.5 27 16 27 C 13.5 27 11 26 11 23 C 11 20 14 19 16 15 Z" fill={GOLD} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
  idea: (
    <>
      <path d="M16 3 C 22 3 25 8 25 12 C 25 16 22 18 21 21 L11 21 C 10 18 7 16 7 12 C 7 8 10 3 16 3 Z" fill={YOLK} {...stroke} />
      <rect x="11" y="21" width="10" height="4" rx="1" fill={CREAM} {...stroke} strokeWidth="1.8" />
      <path d="M13 28 h6" {...stroke} />
      <circle cx="13.5" cy="12" r="1.2" fill={LINE} />
      <circle cx="18.5" cy="12" r="1.2" fill={LINE} />
      <path d="M15 14 L17 14 L16 15.5 Z" fill={BEAK} stroke={BEAK} strokeWidth="0.8" />
    </>
  ),
  pencil: (
    <>
      <path d="M6 26 L8 19 L22 5 L27 10 L13 24 Z" fill={GOLD} {...stroke} />
      <path d="M6 26 L8 19 L13 24 Z" fill={CREAM} {...stroke} />
      <path d="M20 7 L25 12" {...stroke} />
      <path d="M22 5 L27 10 L28.5 8.5 C 29 8 29 7 28.5 6.5 L25.5 3.5 C 25 3 24 3 23.5 3.5 Z" fill={PINK} {...stroke} strokeWidth="1.6" />
    </>
  ),
  flag: (
    <>
      <path d="M8 4 L8 29" {...stroke} strokeWidth="2.6" />
      <path d="M8 6 C 13 3 17 9 25 6 L25 17 C 17 20 13 14 8 17 Z" fill={RED} {...stroke} />
    </>
  ),
  pin: (
    <>
      <path d="M12 5 L20 5 L19 12 C 23 13 25 16 25 18 L7 18 C 7 16 9 13 13 12 Z" fill={RED} {...stroke} />
      <path d="M16 18 L16 29" {...stroke} strokeWidth="2.4" />
    </>
  ),
  play: <path d="M10 6 L26 16 L10 26 Z" fill={YOLK} {...stroke} />,
  pause: (
    <>
      <rect x="8" y="6" width="6" height="20" rx="2" fill={YOLK} {...stroke} />
      <rect x="18" y="6" width="6" height="20" rx="2" fill={YOLK} {...stroke} />
    </>
  ),
  check: <path d="M6 17 L13 24 L26 8" fill="none" {...stroke} stroke={LINE} strokeWidth="3.5" />,
  done: (
    <>
      <rect x="4" y="4" width="24" height="24" rx="6" fill={GREEN} {...stroke} />
      <path d="M9 16.5 L14 21.5 L23 10.5" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  close: <path d="M8 8 L24 24 M24 8 L8 24" fill="none" {...stroke} strokeWidth="3" />,
  book: (
    <>
      <path d="M4 7 C 9 5 13 6 16 9 L16 27 C 13 24 9 23 4 25 Z" fill={BLUE} {...stroke} />
      <path d="M28 7 C 23 5 19 6 16 9 L16 27 C 19 24 23 23 28 25 Z" fill={BLUE} {...stroke} />
      <path d="M7 11 C 10 10 12 11 13.5 12 M7 15 C 10 14 12 15 13.5 16" stroke="white" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  party: (
    <>
      <path d="M5 28 L11 9 L23 21 Z" fill={PINK} {...stroke} />
      <path d="M8 19 L15 25 M9.5 14 L19 22" {...stroke} strokeWidth="1.6" stroke={GOLD} />
      <circle cx="22" cy="6" r="2" fill={GOLD} {...stroke} strokeWidth="1.4" />
      <circle cx="27" cy="13" r="1.8" fill={BLUE} {...stroke} strokeWidth="1.4" />
      <path d="M16 6 Q18 9 16 12 M24 18 Q27 19 29 17" fill="none" {...stroke} strokeWidth="1.6" />
    </>
  ),
  moon: (
    <>
      <path d="M21 4 C 13 5 9 12 10 18 C 11 24 17 28 24 27 C 19 25 16 21 16 16 C 16 11 18 7 21 4 Z" fill={GOLD} {...stroke} />
      <path d="M24 10 l1 2 l2 1 l-2 1 l-1 2 l-1 -2 l-2 -1 l2 -1 z" fill={YOLK} stroke={LINE} strokeWidth="1.2" />
    </>
  ),
  gear: (
    <>
      <path
        d="M14 3 h4 l1 4 l3 1.5 l3.5 -2 l3 3 l-2 3.5 l1.5 3 l4 1 v4 l-4 1 l-1.5 3 l2 3.5 l-3 3 l-3.5 -2 l-3 1.5 l-1 4 h-4 l-1 -4 l-3 -1.5 l-3.5 2 l-3 -3 l2 -3.5 l-1.5 -3 l-4 -1 v-4 l4 -1 l1.5 -3 l-2 -3.5 l3 -3 l3.5 2 l3 -1.5 z"
        fill={BLUE}
        {...stroke}
        transform="translate(16 16) scale(0.82) translate(-16 -16)"
      />
      <circle cx="16" cy="16" r="4.5" fill={CREAM} {...stroke} />
    </>
  ),
  clapper: (
    <>
      <rect x="4" y="12" width="24" height="16" rx="2" fill={CREAM} {...stroke} />
      <path d="M4 12 L26 6 L27.5 11 L5.5 17 Z" fill={LINE} {...stroke} />
      <path d="M9 10.8 L12 14.8 M15 9.2 L18 13.2 M21 7.6 L24 11.6" stroke="white" strokeWidth="2" />
    </>
  ),
  hourglass: (
    <>
      <path d="M8 4 h16 M8 28 h16" {...stroke} strokeWidth="2.6" />
      <path d="M10 4 C 10 11 15 13 15 16 C 15 19 10 21 10 28 L22 28 C 22 21 17 19 17 16 C 17 13 22 11 22 4 Z" fill={CREAM} {...stroke} />
      <path d="M12.5 26 C 13 22 16 21 16 19 C 16 21 19 22 19.5 26 Z" fill={GOLD} />
      <path d="M12.5 8 L19.5 8 C 19 10 17 11 16 12 C 15 11 13 10 12.5 8 Z" fill={GOLD} />
    </>
  ),
  cold: (
    <>
      <path d="M16 3 v26 M4.7 9.5 l22.6 13 M4.7 22.5 l22.6 -13" {...stroke} stroke={BLUE} strokeWidth="3" />
      <path d="M16 3 v26 M4.7 9.5 l22.6 13 M4.7 22.5 l22.6 -13" stroke={LINE} strokeWidth="1" strokeLinecap="round" />
      <path d="M12 5 L16 8 L20 5 M12 27 L16 24 L20 27" fill="none" {...stroke} strokeWidth="1.8" />
    </>
  ),
  repeat: (
    <>
      <path d="M7 15 C 7 9 11 7 16 7 L23 7" fill="none" {...stroke} strokeWidth="2.6" />
      <path d="M20 3 L24 7 L20 11" fill="none" {...stroke} strokeWidth="2.6" />
      <path d="M25 17 C 25 23 21 25 16 25 L9 25" fill="none" {...stroke} strokeWidth="2.6" />
      <path d="M12 21 L8 25 L12 29" fill="none" {...stroke} strokeWidth="2.6" />
    </>
  ),
  bell: (
    <>
      <path d="M16 4 C 22 4 24 9 24 14 L24 19 L27 23 L5 23 L8 19 L8 14 C 8 9 10 4 16 4 Z" fill={YOLK} {...stroke} />
      <path d="M12.5 26 C 13 29 19 29 19.5 26" fill={BEAK} {...stroke} />
      <circle cx="13" cy="13" r="1.2" fill={LINE} />
      <circle cx="19" cy="13" r="1.2" fill={LINE} />
      <path d="M15 15 L17 15 L16 16.5 Z" fill={BEAK} stroke={BEAK} strokeWidth="0.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="16" cy="16" r="12" fill={CREAM} {...stroke} />
      <path d="M16 9 L16 16 L21 19" fill="none" {...stroke} strokeWidth="2.6" />
    </>
  ),
  plus: <path d="M16 6 v20 M6 16 h20" {...stroke} strokeWidth="3.4" />,
  trash: (
    <>
      <path d="M7 9 h18 M13 9 V6 h6 v3" fill="none" {...stroke} />
      <path d="M9 9 L10.5 27 L21.5 27 L23 9 Z" fill={PINK} {...stroke} />
      <path d="M14 13 v10 M18 13 v10" {...stroke} strokeWidth="1.6" />
    </>
  ),
  sparkle: (
    <>
      <path d="M16 3 L18.5 13.5 L29 16 L18.5 18.5 L16 29 L13.5 18.5 L3 16 L13.5 13.5 Z" fill={GOLD} {...stroke} />
    </>
  ),
};

// Little colored dots for calendar keys (plan = yellow, calendar = blue, homework = pink).
const DOT_COLORS = { yellow: YOLK, blue: BLUE, pink: PINK, green: GREEN };

export const ICON_NAMES = Object.keys(ICONS);

export default function Icon({ name, size = 20, className = "", label, dot }) {
  const art = dot ? <circle cx="16" cy="16" r="9" fill={DOT_COLORS[dot] ?? YOLK} {...stroke} /> : ICONS[name];
  if (!art) return null;
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`inline-block shrink-0 overflow-visible align-[-0.2em] ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {art}
    </svg>
  );
}
