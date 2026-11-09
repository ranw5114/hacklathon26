"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { AvatarPicker, Field, LearningStylePicker } from "@/components/ProfileFields";
import { save } from "@/lib/storage";

const STEPS = [
  { bubble: "Hi! What should I call you?", title: "Let's hatch your profile" },
  { bubble: "How do you learn best?", title: "Your learning style" },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "",
    avatar: "sunny",
    learningStyle: "",
    videoSources: "",
  });
  const [error, setError] = useState("");

  // Updates one field, e.g. update("name", "Kacie").
  function update(field, value) {
    setProfile({ ...profile, [field]: value });
    setError("");
  }

  function next() {
    if (!profile.name.trim()) return setError("Tell me your name first!");
    setStep(1);
  }

  function finish() {
    if (!profile.learningStyle) return setError("Pick how you learn best.");
    save("profile", { ...profile, name: profile.name.trim() });
    router.push("/barn");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-10">
      {/* Step dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-3 w-10 rounded-full border-2 border-line ${i <= step ? "bg-beak" : "bg-white"}`}
          />
        ))}
      </div>

      <span className="bubble mt-6">{STEPS[step].bubble}</span>
      <Chick variant={profile.avatar} size={90} className="mt-5" />

      <section className="card mt-4 w-full">
        <h1 className="text-2xl">{STEPS[step].title}</h1>

        <div className="mt-5 flex flex-col gap-5">
          {step === 0 && (
            <>
              <Field label="Name">
                <input
                  className="input"
                  placeholder="e.g. EggcellentEmma"
                  value={profile.name}
                  onChange={(e) => update("name", e.target.value)}
                />
              </Field>
              <Field label="Pick your avatar">
                <AvatarPicker value={profile.avatar} onChange={(id) => update("avatar", id)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <LearningStylePicker
                value={profile.learningStyle}
                onChange={(id) => update("learningStyle", id)}
              />
              <Field label="Favorite video channels (optional)">
                <input
                  className="input"
                  placeholder="e.g. Khan Academy, The Organic Chemistry Tutor"
                  value={profile.videoSources}
                  onChange={(e) => update("videoSources", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>

        {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => setStep(0)} disabled={step === 0} className="btn-secondary">
            Back
          </button>
          {step === 0 ? (
            <button type="button" onClick={next} className="btn-primary">
              Next
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn-primary">
              Enter the Barn
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
