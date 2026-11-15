"use client";

import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import { Farm } from "@/components/StageScenery";

// The Devpost thumbnail: a 3:2 picture (1500 × 1000) of Scholar on the farm with the app's name.
// It's not in the menu: open /thumbnail and screenshot it, or export it with headless Chrome:
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --hide-scrollbars \
//     --window-size=1500,1000 --screenshot=thumbnail.png http://localhost:3000/thumbnail

const FEATURES = [
  { icon: "nest", text: "Study plans" },
  { icon: "hen", text: "AI tutor" },
  { icon: "egg", text: "Focus timer" },
];

const FLOCK = [
  { variant: "peach", wear: { head: "flower" }, right: "27cqw", bottom: "6cqh", width: "9cqw" },
  { variant: "mint", wear: { face: "shades" }, right: "17cqw", bottom: "9cqh", width: "8cqw" },
  { variant: "berry", wear: {}, right: "8cqw", bottom: "5cqh", width: "9cqw" },
  { variant: "sunny", wear: { head: "beanie" }, right: "1cqw", bottom: "11cqh", width: "7cqw" },
];

export default function ThumbnailPage() {
  return (
    <main className="fixed inset-0 overflow-hidden bg-[oklch(25%_0.03_50)]">
      <div className="relative overflow-hidden" style={{ width: 1500, height: 1000, containerType: "size" }}>
        <Farm henhouse={false} />

        {/* The name and what it does */}
        <div className="absolute flex flex-col items-start" style={{ left: "43cqw", top: "9cqh" }}>
          <div
            className="rounded-[2cqw] border-[0.5cqw] border-line px-[3cqw] pt-[1cqw] pb-[1.6cqw] shadow-[0_0.7cqw_0_var(--chick-line)]"
            style={{ background: "oklch(80% 0.09 70)", rotate: "-2deg" }}
          >
            <span className="block font-display text-[10cqw] leading-none font-semibold">Cluck In</span>
          </div>
          <p
            className="mt-[3cqh] rounded-[1.6cqw] border-[0.45cqw] border-line bg-white px-[2.2cqw] py-[1.3cqw] font-display text-[3.2cqw] leading-[1.15] font-semibold shadow-[0_0.5cqw_0_var(--chick-line)]"
            style={{ width: "46cqw" }}
          >
            Hatch a study plan that works backwards from your goal grade.
          </p>
          <div className="mt-[2.6cqh] flex gap-[1cqw]">
            {FEATURES.map((f) => (
              <span
                key={f.text}
                className="flex items-center gap-[0.6cqw] rounded-full border-[0.35cqw] border-line bg-chick px-[1.4cqw] py-[0.6cqw] font-display text-[2cqw] font-semibold"
              >
                <Icon name={f.icon} size={48} className="h-[2.6cqw] w-[2.6cqw]" />
                {f.text}
              </span>
            ))}
          </div>
        </div>

        {/* Scholar */}
        <div className="absolute" style={{ left: "4cqw", bottom: "8cqh", width: "36cqw" }}>
          <Chick variant="scholar" wear={{ head: "cap", prop: "book" }} size={400} className="h-auto w-full" />
          <div className="mx-auto mt-[-1.4cqw] h-[2.6cqw] w-[70%] rounded-[50%] bg-black/15" />
        </div>

        {/* Part of the flock */}
        {FLOCK.map((c) => (
          <div key={c.variant} className="absolute" style={{ right: c.right, bottom: c.bottom, width: c.width }}>
            <Chick variant={c.variant} wear={c.wear} size={120} className="h-auto w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
