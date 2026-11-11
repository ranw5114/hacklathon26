// A camera drawn like one of the chicks: yellow body, chick belly, a feather tuft on top,
// and a little beak-orange flash. Used for the "add a photo" button in the Coop.

import { useId } from "react";

export default function ChickCamera({ size = 32, className = "" }) {
  // Each copy needs its own clip path ID, even when several appear on one page.
  const clipId = useId();

  return (
    <svg
      viewBox="0 0 48 42"
      width={size}
      height={size * (42 / 48)}
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      {/* Feather tuft */}
      <path
        d="M21 12 C 19 7 22 4 24 7 C 25 3 29 4 28 8 C 31 6 33 9 30 12"
        fill="var(--chick-body)"
        stroke="var(--chick-line)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Viewfinder bump */}
      <rect x="9" y="11" width="10" height="6" rx="2" fill="var(--chick-body)" stroke="var(--chick-line)" strokeWidth="2.5" />
      {/* Body, with the lighter chick belly along the bottom */}
      <clipPath id={clipId}>
        <rect x="3" y="14" width="42" height="25" rx="8" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect x="3" y="14" width="42" height="25" fill="var(--chick-body)" />
        <rect x="3" y="32" width="42" height="8" fill="var(--chick-belly)" />
      </g>
      <rect x="3" y="14" width="42" height="25" rx="8" fill="none" stroke="var(--chick-line)" strokeWidth="3" />
      {/* Beak-colored flash */}
      <path d="M35 18 L42 18 L38.5 23 Z" fill="var(--chick-beak)" stroke="var(--chick-line)" strokeWidth="2" strokeLinejoin="round" />
      {/* Lens, like a big round eye */}
      <circle cx="24" cy="26.5" r="8.5" fill="var(--card)" stroke="var(--chick-line)" strokeWidth="3" />
      <circle cx="24" cy="26.5" r="4" fill="var(--chick-line)" />
      <circle cx="22.5" cy="25" r="1.3" fill="var(--card)" />
    </svg>
  );
}
