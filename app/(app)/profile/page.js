"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { AvatarPicker, Field, LearningStylePicker } from "@/components/ProfileFields";
import { clearAll, remove, save, useStored } from "@/lib/storage";

// Profile (edit name, avatar, learning style) and settings (reset data).
export default function ProfilePage() {
  const router = useRouter();
  const profile = useStored("profile");
  const plan = useStored("plan");
  // Edit a copy, so nothing changes until "Save" is clicked.
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  function update(field, value) {
    setDraft({ ...draft, [field]: value });
    setSaved(false);
  }

  function saveProfile() {
    if (!draft.name.trim()) return;
    save("profile", { ...draft, name: draft.name.trim() });
    setSaved(true);
  }

  function deletePlan() {
    if (!confirm("Delete your current study plan? This can't be undone.")) return;
    remove("test", "plan");
  }

  function deleteEverything() {
    if (!confirm("Delete your profile and all your progress? This can't be undone.")) return;
    clearAll();
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <div className="flex items-end gap-4">
        <Chick variant={draft.avatar} size={100} />
        <div>
          <p className="label-small">Profile</p>
          <h1 className="text-4xl">{profile.name}</h1>
        </div>
      </div>

      <section className="card mt-8 flex flex-col gap-5">
        <h2 className="text-2xl">Edit profile</h2>
        <Field label="Name">
          <input className="input" value={draft.name} onChange={(e) => update("name", e.target.value)} />
        </Field>
        <Field label="Avatar">
          <AvatarPicker value={draft.avatar} onChange={(id) => update("avatar", id)} />
        </Field>
        <Field label="Learning style">
          <LearningStylePicker value={draft.learningStyle} onChange={(id) => update("learningStyle", id)} />
        </Field>
        <Field label="Favorite video channels">
          <input
            className="input"
            value={draft.videoSources}
            onChange={(e) => update("videoSources", e.target.value)}
          />
        </Field>
        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-muted">Saved!</span>}
          <button type="button" onClick={saveProfile} className="btn-primary">
            Save changes
          </button>
        </div>
      </section>

      <section className="card mt-8 flex flex-col gap-4">
        <h2 className="text-2xl">Settings</h2>
        <p className="text-sm text-muted">
          Everything is saved only in this browser. Nothing is sent to an account.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={deletePlan} disabled={!plan} className="btn-secondary">
            Delete study plan
          </button>
          <button
            type="button"
            onClick={deleteEverything}
            className="btn-secondary border-red-700 text-red-700 hover:bg-red-50"
          >
            Delete all my data
          </button>
        </div>
      </section>
    </main>
  );
}
