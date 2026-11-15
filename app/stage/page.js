"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import { Farm } from "@/components/StageScenery";
import { lineSeconds, lineText, STAGE_SCENES } from "@/lib/stageScript";

// The mascot stage for the judges' video. Scholar the chick stands on the farm and talks in speech
// bubbles: an intro, a "next up" cutaway before each part of the demo, and an outro.
// Pick a scene, press Play, and screen-record it; the voice and music are added in CapCut
// (see docs/video-guide.md). It's not in the menu: open /stage directly.
//
// Keys: Space = play the scene from the start, → / ← = next / previous line, 1-8 = pick a scene,
// F = full screen, H = hide or show the controls, Esc = stop.

const LEAD_IN_MS = 900; // a quiet moment before the sign drops, so the clip is easy to trim
const SIGN_TO_TALK_MS = 1100; // the sign drops, then Scholar starts talking
const TYPE_CHARS_PER_SEC = 45;

export default function StagePage() {
  const [sceneIndex, setSceneIndex] = useState(0);
  // It opens on a still of the intro: sign up, first line showing.
  const [lineIndex, setLineIndex] = useState(0); // -1 = not talking yet
  const [signShown, setSignShown] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [controls, setControls] = useState(true);
  const [typed, setTyped] = useState(Infinity);
  const timers = useRef([]);

  const scene = STAGE_SCENES[sceneIndex];
  const line = lineIndex >= 0 ? scene.lines[lineIndex] : null;
  const text = line ? lineText(line) : "";
  const mood = (line && typeof line === "object" && line.mood) || "happy";

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));

  // Show the whole scene as a still picture (sign up, last line), for picking and previewing.
  const showStill = useCallback((index) => {
    clearTimers();
    setSceneIndex(index);
    setPlaying(false);
    setSignShown(true);
    setLineIndex(0);
    setTyped(Infinity);
  }, []);

  // Play a scene from the start: quiet, sign drops, then each line in turn.
  const play = useCallback((index) => {
    clearTimers();
    setSceneIndex(index);
    setPlaying(true);
    setSignShown(false);
    setLineIndex(-1);
    setTyped(0);
    let at = LEAD_IN_MS;
    later(at, () => setSignShown(true));
    at += SIGN_TO_TALK_MS;
    STAGE_SCENES[index].lines.forEach((l, i) => {
      later(at, () => {
        setLineIndex(i);
        setTyped(0);
      });
      at += lineSeconds(lineText(l)) * 1000;
    });
    // Stay on the last line a moment, then stop (the picture stays, so the clip ends cleanly).
    later(at + 400, () => setPlaying(false));
  }, []);

  // The typing effect for the current bubble.
  useEffect(() => {
    if (!text || typed >= text.length) return;
    const tick = setTimeout(() => setTyped((n) => n + 1), 1000 / TYPE_CHARS_PER_SEC);
    return () => clearTimeout(tick);
  }, [text, typed]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e) {
      if (e.key === " ") {
        e.preventDefault();
        play(sceneIndex);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        clearTimers();
        setPlaying(false);
        setSignShown(true);
        const next = Math.min(scene.lines.length - 1, Math.max(0, lineIndex + (e.key === "ArrowRight" ? 1 : -1)));
        setLineIndex(next);
        setTyped(0);
      } else if (/^[1-9]$/.test(e.key) && STAGE_SCENES[Number(e.key) - 1]) {
        showStill(Number(e.key) - 1);
      } else if (e.key.toLowerCase() === "h") {
        setControls((c) => !c);
      } else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
      } else if (e.key === "Escape") {
        clearTimers();
        setPlaying(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, showStill, sceneIndex, lineIndex, scene.lines.length]);

  useEffect(() => clearTimers, []);

  return (
    <main className={`fixed inset-0 flex items-center justify-center bg-[oklch(25%_0.03_50)] ${playing ? "cursor-none" : ""}`}>
      {/* The 16:9 picture that gets recorded */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "min(100vw, calc(100vh * 16 / 9))",
          height: "min(100vh, calc(100vw * 9 / 16))",
          containerType: "size",
        }}
      >
        <Farm />

        {scene.extras === "flock" && <Flock />}
        {scene.extras === "party" && <Party />}

        {/* The sign: what this scene is about */}
        {signShown && (
          <div key={`sign-${scene.id}-${playing}`} className="absolute top-0 left-1/2 -translate-x-1/2" style={{ width: "46cqw" }}>
            <div className="origin-top" style={{ animation: "stage-drop 0.9s ease-out both" }}>
              <div className="flex justify-center gap-[18cqw]">
                <span className="block w-[0.5cqw] bg-line" style={{ height: "4cqh" }} />
                <span className="block w-[0.5cqw] bg-line" style={{ height: "4cqh" }} />
              </div>
              <div
                className="flex items-center justify-center gap-[1.6cqw] rounded-[1.6cqw] border-[0.45cqw] border-line px-[2.4cqw] py-[1.4cqw] shadow-[0_0.6cqw_0_var(--chick-line)]"
                style={{ background: "oklch(80% 0.09 70)", animation: "stage-sway 4s ease-in-out 1s infinite" }}
              >
                <span className="flex shrink-0 items-center justify-center rounded-[1.2cqw] border-[0.35cqw] border-line bg-chick p-[0.6cqw]">
                  <Icon name={scene.sign.icon} size={64} className="h-[5cqw] w-[5cqw]" />
                </span>
                <span className="leading-none">
                  <span className="block font-display text-[1.6cqw] font-semibold tracking-wider text-foreground/70 uppercase">
                    {scene.sign.kicker}
                  </span>
                  <span className="mt-[0.4cqw] block font-display text-[4cqw] font-semibold whitespace-nowrap">{scene.sign.title}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scholar, bobbing on the grass. Hops whenever a new line starts. */}
        <div className="absolute" style={{ left: "9cqw", bottom: "11cqh", width: "27cqw" }}>
          <div style={{ animation: "stage-bob 2.4s ease-in-out infinite" }}>
            <div key={`hop-${sceneIndex}-${lineIndex}`} className={lineIndex >= 0 ? "anim-hop" : ""}>
              <Chick variant="scholar" wear={scene.wear} mood={mood} size={300} className="h-auto w-full" />
            </div>
          </div>
          {/* A soft shadow on the grass */}
          <div className="mx-auto mt-[-1cqw] h-[2cqw] w-[70%] rounded-[50%] bg-black/15" />
        </div>

        {/* The speech bubble */}
        {line && (
          <div
            key={`bubble-${sceneIndex}-${lineIndex}`}
            className="anim-pop absolute flex items-center rounded-[2.4cqw] border-[0.45cqw] border-line bg-white px-[2.6cqw] py-[2cqw] shadow-[0_0.6cqw_0_var(--chick-line)]"
            style={{ left: "37cqw", bottom: "31cqh", width: "47cqw", minHeight: "16cqh" }}
          >
            {/* The tail, pointing at Scholar */}
            <span
              className="absolute rotate-45 border-b-[0.45cqw] border-l-[0.45cqw] border-line bg-white"
              style={{ left: "-1.5cqw", bottom: "4cqh", width: "2.8cqw", height: "2.8cqw" }}
            />
            <p className="relative font-display text-[2.9cqw] leading-[1.25] font-semibold">
              {text.slice(0, typed)}
              {/* The rest of the line, invisible, so the bubble is the right size from the start */}
              <span className="invisible">{text.slice(typed)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Controls (hidden while a scene plays, so they're not in the recording) */}
      {controls && !playing && (
        <div className="fixed inset-x-0 top-0 z-10 flex flex-wrap items-center justify-center gap-2 bg-black/60 px-3 py-2 text-sm text-white">
          {STAGE_SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => showStill(i)}
              className={`rounded-full border-2 px-3 py-1 font-semibold ${i === sceneIndex ? "border-chick bg-chick text-foreground" : "border-white/40 hover:bg-white/15"}`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
          <button type="button" onClick={() => play(sceneIndex)} className="rounded-full bg-beak px-4 py-1 font-bold text-foreground">
            ▶ Play
          </button>
          <span className="w-full text-center text-xs text-white/70">
            Space: play · → ←: step through lines · F: full screen · H: hide this bar · Esc: stop
          </span>
        </div>
      )}
    </main>
  );
}

// A few of Scholar's flock hopping around (intro and Your Farm).
function Flock() {
  const chicks = [
    { variant: "peach", wear: { head: "flower" }, right: "30cqw", delay: "0s" },
    { variant: "mint", wear: { face: "shades" }, right: "21cqw", delay: "0.5s" },
    { variant: "berry", wear: {}, right: "12cqw", delay: "1s" },
    { variant: "sunny", wear: { head: "beanie" }, right: "3cqw", delay: "1.5s" },
  ];
  return chicks.map((c) => (
    <div key={c.variant} className="absolute" style={{ right: c.right, bottom: "8cqh", width: "8cqw" }}>
      <div className="anim-hop" style={{ animationDelay: c.delay, animationIterationCount: "infinite", animationDuration: "2.2s" }}>
        <Chick variant={c.variant} wear={c.wear} size={100} className="h-auto w-full" />
      </div>
    </div>
  ));
}

// Confetti and party chicks for the outro.
function Party() {
  const colors = ["oklch(76% 0.16 60)", "oklch(78% 0.13 350)", "oklch(80% 0.1 235)", "oklch(82% 0.11 165)", "oklch(88% 0.14 90)"];
  return (
    <>
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[0.2cqw]"
          style={{
            left: `${(i * 37) % 100}cqw`,
            width: "1cqw",
            height: "1.6cqw",
            background: colors[i % colors.length],
            animation: `stage-fall ${5 + (i % 5)}s linear ${-((i * 0.7) % 6)}s infinite`,
          }}
        />
      ))}
      <Flock />
    </>
  );
}
