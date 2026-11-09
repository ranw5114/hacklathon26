"use client";

import { useState } from "react";
import { Field } from "@/components/ProfileFields";
import { save } from "@/lib/storage";
import { todayString } from "@/lib/dates";

const HOURS_OPTIONS = [0.5, 1, 1.5, 2, 3];

const EMPTY_TEST = {
  subject: "",
  topic: "",
  testDate: "",
  currentGrade: "",
  goalGrade: "",
  hoursPerDay: 1,
  notes: "",
};

// Returns an error message, or "" if everything is filled in.
function validate(test) {
  if (!test.subject.trim() || !test.topic.trim()) return "Add the subject and what's on the test.";
  if (!test.testDate) return "Pick your test date.";
  if (test.testDate <= todayString()) return "The test date needs to be after today.";
  const current = Number(test.currentGrade);
  const goal = Number(test.goalGrade);
  if (test.currentGrade === "" || current < 0 || current > 100) return "Enter your current grade (0-100).";
  if (test.goalGrade === "" || goal < 0 || goal > 100) return "Enter your goal grade (0-100).";
  return "";
}

// The form that collects test details and asks the AI to build a study plan.
export default function NestForm({ learner }) {
  const [test, setTest] = useState(EMPTY_TEST);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setTest({ ...test, [field]: value });
    setError("");
  }

  async function buildNest() {
    const message = validate(test);
    if (message) return setError(message);

    setLoading(true);
    const finalTest = {
      ...test,
      currentGrade: Number(test.currentGrade),
      goalGrade: Number(test.goalGrade),
    };

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learner, test: finalTest, today: todayString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Saving makes the Nest page switch from this form to the plan automatically.
      save("test", finalTest);
      save("plan", data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="card flex flex-col gap-5">
      <h2 className="text-2xl">What are we studying for?</h2>

      <Field label="Subject">
        <input
          className="input"
          placeholder="e.g. Biology"
          value={test.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </Field>
      <Field label="What's on the test?">
        <input
          className="input"
          placeholder="e.g. Cell structure and cellular respiration"
          value={test.topic}
          onChange={(e) => update("topic", e.target.value)}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Test date">
          <input
            type="date"
            className="input"
            min={todayString()}
            value={test.testDate}
            onChange={(e) => update("testDate", e.target.value)}
          />
        </Field>
        <Field label="Study time per day">
          <select
            className="input"
            value={test.hoursPerDay}
            onChange={(e) => update("hoursPerDay", Number(e.target.value))}
          >
            {HOURS_OPTIONS.map((hours) => (
              <option key={hours} value={hours}>
                {hours} {hours === 1 ? "hour" : "hours"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current grade (%)">
          <input
            type="number"
            className="input"
            placeholder="78"
            value={test.currentGrade}
            onChange={(e) => update("currentGrade", e.target.value)}
          />
        </Field>
        <Field label="Goal grade (%)">
          <input
            type="number"
            className="input"
            placeholder="90"
            value={test.goalGrade}
            onChange={(e) => update("goalGrade", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Class notes or study guide (optional)">
        <textarea
          className="input min-h-40"
          placeholder="Paste your notes. The more you paste, the more the plan matches your class."
          value={test.notes}
          onChange={(e) => update("notes", e.target.value)}
        />
      </Field>

      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button type="button" onClick={buildNest} disabled={loading} className="btn-primary self-end">
        {loading ? "Building your nest…" : "Build my nest"}
      </button>
    </section>
  );
}
