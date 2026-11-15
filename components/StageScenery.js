import { FarmBuilding } from "@/components/EggArt";

// The farm scenery used by the video stage (/stage) and the Devpost thumbnail (/thumbnail).
// Sizes are in cqw/cqh, so it scales with whatever box it's in (the box needs containerType "size").

// The farm behind Scholar: sky, sun, drifting clouds, hills, a fence, and the henhouse.
// henhouse: false leaves the henhouse out (the thumbnail puts its text there).
export function Farm({ henhouse = true }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: "linear-gradient(oklch(86% 0.08 225), oklch(95% 0.05 95) 75%)" }} />
      {/* Sun */}
      <div
        className="absolute rounded-full"
        style={{
          right: "7cqw",
          top: "8cqh",
          width: "9cqw",
          height: "9cqw",
          background: "oklch(90% 0.15 90)",
          boxShadow: "0 0 0 1.6cqw oklch(92% 0.12 90 / 0.45), 0 0 0 3.4cqw oklch(94% 0.1 90 / 0.25)",
        }}
      />
      {/* Clouds */}
      {[
        { top: "10cqh", size: 1, duration: 70, delay: -10 },
        { top: "22cqh", size: 0.7, duration: 95, delay: -60 },
        { top: "6cqh", size: 0.55, duration: 120, delay: -30 },
      ].map((c, i) => (
        <div key={i} className="absolute left-0" style={{ top: c.top, animation: `stage-drift ${c.duration}s linear ${c.delay}s infinite` }}>
          <Cloud scale={c.size} />
        </div>
      ))}
      {/* Back hill and the henhouse on it */}
      <div className="absolute rounded-[50%]" style={{ left: "-10cqw", right: "-10cqw", bottom: "-40cqh", height: "80cqh", background: "oklch(84% 0.1 140)" }} />
      {henhouse && (
        <div className="absolute" style={{ right: "1.5cqw", bottom: "31cqh", width: "14cqw" }}>
          <FarmBuildingScaled />
        </div>
      )}
      {/* Fence */}
      <div
        className="absolute inset-x-0"
        style={{
          bottom: "27cqh",
          height: "7cqh",
          background:
            "linear-gradient(transparent 22%, oklch(80% 0.07 65) 22% 34%, transparent 34% 62%, oklch(80% 0.07 65) 62% 74%, transparent 74%), repeating-linear-gradient(90deg, oklch(74% 0.08 60) 0 1.2cqw, transparent 1.2cqw 7cqw)",
        }}
      />
      {/* Front grass */}
      <div
        className="absolute inset-x-0 bottom-0 border-t-[0.45cqw] border-line"
        style={{
          height: "29cqh",
          background: "repeating-linear-gradient(100deg, oklch(80% 0.12 140) 0 1.6cqw, oklch(76% 0.13 140) 1.6cqw 2.2cqw)",
        }}
      />
    </div>
  );
}

// FarmBuilding draws at a fixed pixel size; this lets it scale with the picture.
function FarmBuildingScaled() {
  return (
    <div className="[&>svg]:h-auto [&>svg]:w-full">
      <FarmBuilding kind="henhouse" size={240} />
    </div>
  );
}

function Cloud({ scale = 1 }) {
  return (
    <div className="relative" style={{ width: `${16 * scale}cqw`, height: `${5 * scale}cqw` }}>
      <span className="absolute bottom-0 left-0 h-[60%] w-full rounded-full bg-white/90" />
      <span className="absolute bottom-[25%] left-[18%] h-[75%] w-[38%] rounded-full bg-white/90" />
      <span className="absolute bottom-[20%] left-[45%] h-[95%] w-[40%] rounded-full bg-white/90" />
    </div>
  );
}
