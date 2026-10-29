"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { save } from "@/lib/storage";
import { todayString } from "@/lib/dates";

const LEARNING_STYLES = [
  { value: "visual", label: "Visual", description: "Diagrams, charts, and pictures" },
  { value: "lecture", label: "Lecture", description: "Clear step-by-step explanations" },
  { value: "examples", label: "Examples", description: "Worked examples and practice problems" },
];

const HOURS_OPTIONS = [0.5, 1, 1.5, 2, 3];

const STEPS = ["How you learn", "Your test", "Your notes"];

const EMPTY_PROFILE = {
  learningStyle: "",
  videoSources: "",
  subject: "",
  topic: "",
  testDate: "",
  currentGrade: "",
  goalGrade: "",
  hoursPerDay: 1,
  notes: "",
};

// Returns an error message for the current step, or "" if everything is filled in.
function validateStep(step, profile) {
  if (step === 0 && !profile.learningStyle) return "Pick how you learn best.";
  if (step === 1) {
    if (!profile.subject.trim() || !profile.topic.trim()) return "Add the subject and test topic.";
    if (!profile.testDate) return "Pick your test date.";
    if (profile.testDate <= todayString()) return "The test date needs to be after today.";
    const current = Number(profile.currentGrade);
    const goal = Number(profile.goalGrade);
    if (profile.currentGrade === "" || current < 0 || current > 100) return "Enter your current grade (0-100).";
    if (profile.goalGrade === "" || goal < 0 || goal > 100) return "Enter your goal grade (0-100).";
  }
  return "";
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Updates one field, e.g. update("subject", "Biology").
  function update(field, value) {
    setProfile({ ...profile, [field]: value });
    setError("");
  }

  function next() {
    const message = validateStep(step, profile);
    if (message) return setError(message);
    setStep(step + 1);
  }

  async function createPlan() {
    setLoading(true);
    setError("");
    const finalProfile = {
      ...profile,
      currentGrade: Number(profile.currentGrade),
      goalGrade: Number(profile.goalGrade),
    };

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: finalProfile, today: todayString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      save("profile", finalProfile);
      save("plan", data);
      router.push("/plan");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
      <p className="text-sm font-medium text-indigo-600">
        Step {step + 1} of {STEPS.length}
      </p>
      <h1 className="mt-1 text-3xl font-bold">{STEPS[step]}</h1>

      {/* Progress bar */}
      <div className="mt-4 h-2 rounded-full bg-zinc-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mt-8 flex flex-col gap-5">
        {step === 0 && (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 font-medium">How do you learn best?</legend>
              {LEARNING_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => update("learningStyle", style.value)}
                  className={`rounded-xl border-2 p-4 text-left transition ${
                    profile.learningStyle === style.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <span className="font-semibold">{style.label}</span>
                  <span className="block text-sm text-zinc-600">{style.description}</span>
                </button>
              ))}
            </fieldset>
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

        {step === 1 && (
          <>
            <Field label="Subject">
              <input
                className="input"
                placeholder="e.g. Biology"
                value={profile.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            </Field>
            <Field label="What's on the test?">
              <input
                className="input"
                placeholder="e.g. Cell structure and cellular respiration"
                value={profile.topic}
                onChange={(e) => update("topic", e.target.value)}
              />
            </Field>
            <Field label="Test date">
              <input
                type="date"
                className="input"
                min={todayString()}
                value={profile.testDate}
                onChange={(e) => update("testDate", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Current grade (%)">
                <input
                  type="number"
                  className="input"
                  placeholder="78"
                  value={profile.currentGrade}
                  onChange={(e) => update("currentGrade", e.target.value)}
                />
              </Field>
              <Field label="Goal grade (%)">
                <input
                  type="number"
                  className="input"
                  placeholder="90"
                  value={profile.goalGrade}
                  onChange={(e) => update("goalGrade", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Study time per day">
              <select
                className="input"
                value={profile.hoursPerDay}
                onChange={(e) => update("hoursPerDay", Number(e.target.value))}
              >
                {HOURS_OPTIONS.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <Field label="Paste your class notes or study guide (optional)">
            <textarea
              className="input min-h-64"
              placeholder="The more you paste, the more the plan matches your class."
              value={profile.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Field>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0 || loading}
          className="btn-secondary"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="btn-primary">
            Next
          </button>
        ) : (
          <button type="button" onClick={createPlan} disabled={loading} className="btn-primary">
            {loading ? "Building your plan…" : "Create my study plan"}
          </button>
        )}
      </div>
    </main>
  );
}

// A label with its input underneath. Reused for every field on this page.
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
