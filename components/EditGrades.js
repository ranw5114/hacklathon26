"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Field } from "@/components/ProfileFields";
import { formatDate } from "@/lib/dates";
import { checkGrades } from "@/lib/grades";
import { save } from "@/lib/storage";

// "✏️ Edit" on the Nest banner: change the current and goal grade without rebuilding the plan.
export default function EditGradesButton({ test }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border-2 border-line bg-white px-2 py-0.5 text-sm font-semibold hover:bg-chick/40"
        aria-label="Edit grades"
      >
        ✏️ Edit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Update your grades" chick="mint">
        {/* A key resets the form to the saved grades each time it opens */}
        {open && <EditGradesForm key={open} test={test} onDone={() => setOpen(false)} />}
      </Modal>
    </>
  );
}

function EditGradesForm({ test, onDone }) {
  const [current, setCurrent] = useState(String(test.currentGrade));
  const [goal, setGoal] = useState(String(test.goalGrade));
  const [error, setError] = useState("");
  const [canSwap, setCanSwap] = useState(false);

  function saveGrades() {
    const check = checkGrades(current, goal);
    if (check.error) {
      setError(check.error);
      setCanSwap(Boolean(check.canSwap));
      return;
    }
    save("test", { ...test, currentGrade: Number(current), goalGrade: Number(goal) });
    onDone();
  }

  function swap() {
    setCurrent(goal);
    setGoal(current);
    setError("");
    setCanSwap(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Got a test back, or aiming higher? Your plan and progress stay the same.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current grade (%)">
          <input
            type="number"
            className="input"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setError("");
            }}
          />
        </Field>
        <Field label="Goal grade (%)">
          <input
            type="number"
            className="input"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
              setError("");
            }}
          />
        </Field>
      </div>

      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
          <span className="flex-1">{error}</span>
          {canSwap && (
            <button type="button" onClick={swap} className="btn-secondary px-4 py-1.5 text-sm">
              Swap them
            </button>
          )}
        </div>
      )}

      <p className="rounded-2xl bg-chick/40 px-4 py-2 text-sm">
        📅 Test date: <strong>{formatDate(test.testDate)}</strong>. To change it, build a new nest (the plan needs
        a different number of days).
      </p>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={saveGrades} className="btn-primary">
          Save
        </button>
      </div>
    </div>
  );
}
