"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import { useConfirm } from "@/components/Modal";
import { ExitDemoButton, TryDemoButton } from "@/components/DemoButtons";
import { AvatarPicker, Field, LearningStylePicker } from "@/components/ProfileFields";
import { clearAll, remove, save, useStored } from "@/lib/storage";
import { useNests } from "@/lib/nests";
import { avatarLook } from "@/lib/avatar";
import { chickName } from "@/lib/henhouse";
import Link from "next/link";

// Profile (edit name, avatar, learning style) and settings (reset data).
export default function ProfilePage() {
  const router = useRouter();
  const profile = useStored("profile");
  const nests = useNests();
  const prefs = useStored("prefs");
  const flock = useStored("flock");
  // Edit a copy, so nothing changes until "Save" is clicked.
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [toursReset, setToursReset] = useState(false);
  // Picking a starter chick here switches away from a Henhouse chick avatar (applied on Save).
  const [pickedStarter, setPickedStarter] = useState(false);
  const { confirm, dialog } = useConfirm();

  // What the avatar will look like after saving.
  const previewProfile = { ...draft, avatarChickId: pickedStarter ? null : profile?.avatarChickId };
  const henhouseChick = previewProfile.avatarChickId && flock?.chicks?.find((c) => c.id === previewProfile.avatarChickId);

  function update(field, value) {
    setDraft({ ...draft, [field]: value });
    setSaved(false);
  }

  function saveProfile() {
    if (!draft.name.trim()) return;
    // Start from the latest saved profile, so an avatar picked in the Henhouse meanwhile isn't lost.
    save("profile", {
      ...profile,
      ...draft,
      name: draft.name.trim(),
      avatarChickId: pickedStarter ? null : profile.avatarChickId,
    });
    setSaved(true);
  }

  async function deletePlan() {
    const ok = await confirm({
      title: "Delete all your nests?",
      message: "Every nest, with its study plan, lessons, and mock exam, will be deleted. Your profile and chicks stay. This can't be undone. (To delete just one, open it and use \"Delete this nest\".)",
      confirmLabel: "Delete all nests",
      danger: true,
    });
    if (!ok) return;
    remove("nests");
  }

  async function deleteEverything() {
    const ok = await confirm({
      title: "Delete everything?",
      message: "Your profile, nests, chicks, chats, and timer history will all be deleted. This can't be undone.",
      confirmLabel: "Delete everything",
      danger: true,
    });
    if (!ok) return;
    clearAll();
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      {dialog}
      <div className="flex items-end gap-4">
        <Chick variant={avatarLook(previewProfile, flock)} size={100} />
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
          {henhouseChick && (
            <p className="mb-2 rounded-2xl bg-chick/50 px-4 py-2 text-sm">
              <Icon name="star" size={16} /> Your avatar is <strong>{chickName(henhouseChick, flock.chicks.indexOf(henhouseChick))}</strong> from
              the <Link href="/henhouse" className="underline">Henhouse</Link>. Pick a starter chick below to switch back.
            </p>
          )}
          <AvatarPicker
            value={henhouseChick ? null : draft.avatar}
            onChange={(id) => {
              setPickedStarter(true);
              update("avatar", id);
            }}
          />
          {!henhouseChick && (
            <p className="mt-2 text-sm text-muted">
              Or make one of your hatched chicks your avatar in the{" "}
              <Link href="/henhouse" className="underline">
                Henhouse
              </Link>
              .
            </p>
          )}
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
        <p className="text-sm text-muted">Everything is saved only in this browser. Nothing is sent to an account.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              save("prefs", { ...prefs, toursSeen: {} });
              setToursReset(true);
            }}
            className="btn-secondary"
          >
            Show the tutorials again
          </button>
          {toursReset && <span className="text-sm text-muted">Done! Each page will show its tour again.</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={deletePlan} disabled={!nests?.length} className="btn-secondary">
            Delete all nests
          </button>
          {/* In the demo, "Delete all" is hidden so the user's saved real data can't be wiped by accident. */}
          {!profile.demo && (
            <button
              type="button"
              onClick={deleteEverything}
              className="btn-secondary border-red-700 text-red-700 hover:bg-red-50"
            >
              Delete all my data
            </button>
          )}
        </div>
      </section>

      <section className="card mt-8 flex flex-col gap-3">
        <h2 className="text-2xl">Demo</h2>
        {profile.demo ? (
          <>
            <p className="text-sm text-muted">
              You&apos;re exploring the demo student. Exit to go back to your own account.
            </p>
            <ExitDemoButton className="btn-primary self-start" />
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Peek at a sample student with a study plan already in progress. Your own progress is saved and comes back
              when you exit the demo.
            </p>
            <div className="flex flex-col items-start gap-2">
              <TryDemoButton className="btn-secondary" />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
