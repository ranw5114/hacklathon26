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
import { chickCount, withDefaults } from "@/lib/flock";
import { LEARNING_STYLES } from "@/lib/learningStyles";
import Link from "next/link";
import { deleteAccountData, logOut, signUp, useAccount, useAccountsAvailable } from "@/lib/account";
import { AccountFields, checkAccount, EMPTY_ACCOUNT } from "@/components/AccountFields";
import ChangePassword from "@/components/ChangePassword";

// The Me page: your profile, account, help, and data, grouped into rows that open when tapped.
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
  const account = useAccount();
  const accounts = useAccountsAvailable();
  const [leaving, setLeaving] = useState(false);
  const [newAccount, setNewAccount] = useState(EMPTY_ACCOUNT);
  const [accountError, setAccountError] = useState("");
  const [makingAccount, setMakingAccount] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [open, setOpen] = useState(null); // which settings row is open

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
      message: `Your profile, nests, chicks, chats, and timer history will all be deleted${account ? ", from this device AND your account (you'll be logged out)" : ""}. This can't be undone.`,
      confirmLabel: "Delete everything",
      danger: true,
    });
    if (!ok) return;
    if (account) {
      await deleteAccountData().catch(() => {});
      await logOut();
    } else clearAll();
    router.push("/");
  }

  async function makeAccount(e) {
    e.preventDefault();
    const problem = checkAccount(newAccount);
    if (problem) return setAccountError(problem);
    setMakingAccount(true);
    setAccountError("");
    try {
      await signUp({ ...newAccount, email: newAccount.email.trim(), username: newAccount.username.trim() });
      setNewAccount(EMPTY_ACCOUNT);
    } catch (err) {
      setAccountError(err.message);
    }
    setMakingAccount(false);
  }

  async function leave() {
    const ok = await confirm({
      title: "Log out?",
      message: "Your progress is saved to your account. Log back in on any device to pick up where you left off. This device will be cleared.",
      confirmLabel: "Log out",
    });
    if (!ok) return;
    setLeaving(true);
    await logOut();
    router.push("/");
  }

  const learningStyle = LEARNING_STYLES[profile.learningStyle]?.label;
  const accountSummary =
    accounts === false
      ? "Saved on this device only"
      : account && !account.expired
        ? `Logged in as ${account.username}`
        : account?.expired
          ? "Logged out: log in again to keep saving"
          : "Saved on this device only: make an account";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      {dialog}
      <div className="flex items-end gap-4">
        <Chick variant={avatarLook(previewProfile, flock)} size={100} />
        <div>
          <p className="label-small">Profile</p>
          <h1 className="text-4xl">{profile.name}</h1>
          <p className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
            <span className="rounded-full border-2 border-line bg-white px-3 py-0.5">
              <Icon name="chick" size={16} /> {chickCount(flock)} chicks
            </span>
            <span className="rounded-full border-2 border-line bg-white px-3 py-0.5">
              <Icon name="corn" size={16} /> {withDefaults(flock).corn} corn
            </span>
            <span className="rounded-full border-2 border-line bg-white px-3 py-0.5">
              <Icon name="nest" size={16} /> {nests?.length ?? 0} nest{nests?.length === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      {/* Settings, grouped like a phone's settings app. Tap a row to open it. */}
      <MenuGroup title="You">
        <MenuRow id="profile" open={open} setOpen={setOpen} icon="chick" title="Name & avatar" summary={profile.name}>
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
          <SaveButton saved={saved} onSave={saveProfile} />
        </MenuRow>
        <MenuRow
          id="learning"
          open={open}
          setOpen={setOpen}
          icon="book"
          title="How I learn"
          summary={learningStyle ? `${learningStyle} learner` : "Pick your learning style"}
        >
          <Field label="Learning style">
            <LearningStylePicker value={draft.learningStyle} onChange={(id) => update("learningStyle", id)} />
          </Field>
          <Field label="Favorite video channels">
            <input className="input" value={draft.videoSources} onChange={(e) => update("videoSources", e.target.value)} />
          </Field>
          <SaveButton saved={saved} onSave={saveProfile} />
        </MenuRow>
      </MenuGroup>

      {/* Account: make one, see it, change the password, log out */}
      {!profile?.demo && (
        <MenuGroup title="Account">
          <MenuRow id="account" open={open} setOpen={setOpen} icon="lock" title="Account" summary={accountSummary}>
            {accounts === false ? (
              <p className="text-muted">
                Accounts aren&apos;t switched on for this website yet, so your progress is saved on this device only. (The site owner
                can turn them on: see docs/accounts-setup.md.)
              </p>
            ) : account && !account.expired ? (
              <>
                <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
                  <dt className="font-display font-semibold">Username</dt>
                  <dd>{account.username}</dd>
                  <dt className="font-display font-semibold">Email</dt>
                  <dd className="break-all">{account.email}</dd>
                  <dt className="font-display font-semibold">Password</dt>
                  <dd className="flex flex-wrap items-center gap-3">
                    <span className="tracking-widest">••••••••</span>
                    {!changingPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setChangingPassword(true);
                          setPasswordChanged(false);
                        }}
                        className="btn-secondary px-3 py-1 text-sm"
                      >
                        Change password
                      </button>
                    )}
                  </dd>
                </dl>
                {changingPassword && (
                  <ChangePassword
                    onCancel={() => setChangingPassword(false)}
                    onDone={() => {
                      setChangingPassword(false);
                      setPasswordChanged(true);
                    }}
                  />
                )}
                {passwordChanged && <p className="rounded-2xl bg-green-50 p-3 text-sm font-semibold text-green-800">Your password is changed! Use the new one next time you log in.</p>}
                <p className="text-sm text-muted">Your progress saves to your account automatically. Log in with this username (or email) on any device.</p>
                <button type="button" onClick={leave} disabled={leaving} className="btn-secondary self-start">
                  {leaving ? "Logging out…" : "Log out"}
                </button>
              </>
            ) : account?.expired ? (
              <>
                <p className="text-red-800">You&apos;ve been logged out of {account.username}. Log in again to keep saving.</p>
                <Link href="/login" className="btn-primary self-start">
                  Log in again
                </Link>
              </>
            ) : accounts ? (
              <form onSubmit={makeAccount} className="flex flex-col gap-4">
                <p className="text-muted">
                  Your progress is only on this device right now. Add an email, username, and password to save it to an account and
                  log in on any device. Everything you&apos;ve done so far comes with you.
                </p>
                <AccountFields
                  value={newAccount}
                  onChange={(v) => {
                    setNewAccount(v);
                    setAccountError("");
                  }}
                />
                {accountError && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{accountError}</p>}
                <div className="flex flex-wrap items-center gap-3">
                  <button type="submit" disabled={makingAccount} className="btn-primary">
                    {makingAccount ? "Making your account…" : "Make my account"}
                  </button>
                  <Link href="/login" className="text-sm font-semibold underline">
                    I already have one: log in
                  </Link>
                </div>
              </form>
            ) : null}
          </MenuRow>
        </MenuGroup>
      )}

      <MenuGroup title="Help">
        <MenuRow id="tours" open={open} setOpen={setOpen} icon="idea" title="Tutorials" summary="Replay each page's tour">
          <p className="text-sm text-muted">Each page shows its tutorial cards again the next time you open it.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                save("prefs", { ...prefs, toursSeen: {} });
                setToursReset(true);
              }}
              className="btn-secondary self-start"
            >
              Show the tutorials again
            </button>
            {toursReset && <span className="text-sm text-muted">Done! Each page will show its tour again.</span>}
          </div>
        </MenuRow>
        <MenuRow
          id="demo"
          open={open}
          setOpen={setOpen}
          icon="clapper"
          title="Demo student"
          summary={profile.demo ? "You're exploring the demo" : "Peek at a sample student"}
        >
          {profile.demo ? (
            <>
              <p className="text-sm text-muted">You&apos;re exploring the demo student. Exit to go back to your own account.</p>
              <ExitDemoButton className="btn-primary self-start" />
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Peek at a sample student with a study plan already in progress. Your own progress is saved and comes back
                when you exit the demo.
              </p>
              <TryDemoButton className="btn-secondary self-start" />
            </>
          )}
        </MenuRow>
      </MenuGroup>

      <MenuGroup title="Your data">
        <MenuRow id="delete" open={open} setOpen={setOpen} icon="trash" title="Delete data" summary="Remove your nests, or everything">
          <p className="text-sm text-muted">
            {account && !account.expired
              ? "Your progress is saved to your account and this device."
              : "Everything is saved only in this browser."}
          </p>
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
        </MenuRow>
      </MenuGroup>
    </main>
  );
}

// A titled group of settings rows, in one card.
function MenuGroup({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="label-small mb-2 px-2">{title}</h2>
      <div className="card flex flex-col divide-y-2 divide-line/15 overflow-hidden p-0">{children}</div>
    </section>
  );
}

// One settings row: an icon, a title, and a one-line summary. Tapping it opens its settings below
// (one row open at a time).
function MenuRow({ id, open, setOpen, icon, title, summary, children }) {
  const isOpen = open === id;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(isOpen ? null : id)}
        aria-expanded={isOpen}
        className="group flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-chick/30"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-line bg-chick/50 transition group-hover:-rotate-6">
          <Icon name={icon} size={24} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted">{summary}</span>
        </span>
        <span className={`font-display text-xl transition ${isOpen ? "rotate-90" : ""}`}>›</span>
      </button>
      {isOpen && <div className="flex flex-col gap-5 px-5 pb-5">{children}</div>}
    </div>
  );
}

function SaveButton({ saved, onSave }) {
  return (
    <div className="flex items-center justify-end gap-3">
      {saved && <span className="text-sm text-muted">Saved!</span>}
      <button type="button" onClick={onSave} className="btn-primary">
        Save changes
      </button>
    </div>
  );
}
