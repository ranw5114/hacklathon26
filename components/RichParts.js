// Pieces shared by the Coop chat and Nest lessons: AI-drawn diagrams and practice problems.

import { svgToImageSrc } from "@/lib/tutorReply";

// A diagram the AI drew (for visual learners). Pass `src` (already converted) or raw `svg`.
// Shown as an image, so it can't run code. Click it to open it full size.
export function Diagram({ src, svg }) {
  const imageSrc = src || (svg ? svgToImageSrc(svg) : null);
  if (!imageSrc) return null;
  return (
    <a href={imageSrc} target="_blank" rel="noreferrer" title="Open the diagram full size">
      {/* eslint-disable-next-line @next/next/no-img-element -- drawn by the AI, not a hosted image */}
      <img src={imageSrc} alt="Diagram" className="w-full rounded-2xl border-[3px] border-line bg-white" />
    </a>
  );
}

// A practice problem with its solution hidden until they're ready (for examples learners).
export function Practice({ number, problem, solution }) {
  return (
    <div className="rounded-2xl border-[3px] border-line bg-chick/40 p-3">
      <p className="label-small">Practice {number}</p>
      <p className="mt-1 whitespace-pre-line">{problem}</p>
      <details className="group mt-2">
        <summary className="btn-secondary inline-block list-none px-3 py-1 text-sm [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show solution</span>
          <span className="hidden group-open:inline">Hide solution</span>
        </summary>
        <p className="mt-2 rounded-xl bg-white p-3 whitespace-pre-line">{solution}</p>
      </details>
    </div>
  );
}
