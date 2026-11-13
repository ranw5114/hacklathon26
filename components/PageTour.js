"use client";

import Icon from "@/components/Icon";
import ChickCamera from "@/components/ChickCamera";
import { useState } from "react";
import Modal from "@/components/Modal";
import { save, useStored } from "@/lib/storage";
import { TUTORIALS } from "@/lib/tutorials";

// A "?" button for a page's tutorial cards. The tour also opens by itself the first time
// someone visits the page. Seen tours are remembered in prefs.toursSeen.
export default function PageTour({ page }) {
  const prefs = useStored("prefs");
  const [replaying, setReplaying] = useState(false);
  const [step, setStep] = useState(0);

  const cards = TUTORIALS[page];
  // Opens automatically until this page's tour has been seen (wait until saved prefs are read).
  const firstVisit = prefs !== undefined && !prefs?.toursSeen?.[page];
  const open = firstVisit || replaying;

  function close() {
    save("prefs", { ...prefs, toursSeen: { ...prefs?.toursSeen, [page]: true } });
    setReplaying(false);
    setStep(0);
  }

  const card = cards[step];
  const isLast = step === cards.length - 1;

  return (
    <>
      <button
        type="button"
        onClick={() => setReplaying(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-line bg-white font-display font-semibold hover:bg-chick"
        aria-label="Show the tutorial for this page"
        title="How does this page work?"
      >
        ?
      </button>

      <Modal open={open} onClose={close} title={card.title} chick={card.chick}>
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Picture: one of the app's drawn icons (the camera is the Coop's chicken camera) */}
          <div className="flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-line bg-chick">
            {card.picture === "camera" ? <ChickCamera size={64} /> : <Icon name={card.picture} size={64} />}
          </div>
          <p className="text-lg leading-relaxed">{card.text}</p>

          {/* Step dots */}
          <div className="flex gap-2" aria-label={`Card ${step + 1} of ${cards.length}`}>
            {cards.map((_, i) => (
              <span
                key={i}
                className={`h-2.5 rounded-full border-2 border-line transition-all ${i === step ? "w-6 bg-beak" : "w-2.5 bg-white"}`}
              />
            ))}
          </div>

          <div className="flex w-full items-center justify-between gap-3">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
                Back
              </button>
            ) : (
              <button type="button" onClick={close} className="text-sm font-semibold text-muted underline">
                Skip tour
              </button>
            )}
            <button type="button" onClick={isLast ? close : () => setStep(step + 1)} className="btn-primary">
              {isLast ? "Got it!" : "Next"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
