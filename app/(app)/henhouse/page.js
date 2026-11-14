"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import Link from "next/link";
import Chick, { CHICK_COLORS } from "@/components/Chick";
import FarmHeader from "@/components/FarmHeader";
import { MAX_FAVORITES, toggleFavorite, withDefaults } from "@/lib/flock";
import { chickLook, chickName, SHOP, SLOTS, updateChick, wardrobe } from "@/lib/henhouse";
import { load, save, update, useStored } from "@/lib/storage";

// What each outfit tab is called in the dressing room.
const WEAR_LABELS = { head: "Head", face: "Face", neck: "Neck", body: "Body", prop: "Holding" };

// Where a chick hatched from, shown under it.
const HOW_FROM = {
  timer: { icon: "egg", label: "Egg Timer" },
  quiz: { icon: "star", label: "Perfect quiz" },
  exam: { icon: "trophy", label: "Mock exam" },
  chest: { icon: "chest", label: "Chest" },
};

// How many chicks to show before "Show all", so a big flock doesn't fill the page.
const SHOW_AT_FIRST = 30;

// The Henhouse: every chick you've hatched. Pick one to name it, paint it, dress it up,
// make it a favorite (favorites sit on the coop's perch), or make it your avatar.
export default function HenhousePage() {
  const stored = useStored("flock");
  const profile = useStored("profile");
  const [selectedId, setSelectedId] = useState(null);
  const [slot, setSlot] = useState("head");
  const [showAll, setShowAll] = useState(false);
  const [message, setMessage] = useState("");

  if (stored === undefined) return null;
  const flock = withDefaults(stored);
  const chicks = flock.chicks;
  // Favorites first, then the newest.
  const ordered = [...chicks.filter((c) => c.favorite), ...chicks.filter((c) => !c.favorite).reverse()];
  const shown = showAll ? ordered : ordered.slice(0, SHOW_AT_FIRST);
  const selected = chicks.find((c) => c.id === selectedId) ?? ordered[0];
  const nameOf = (chick) => chickName(chick, chicks.indexOf(chick));
  const clothes = wardrobe(flock);
  const favorites = chicks.filter((c) => c.favorite).length;

  function change(changes) {
    update("flock", (f) => updateChick(f, selected.id, changes));
  }

  function switchFavorite() {
    const next = toggleFavorite(load("flock"), selected.id);
    if (!next) return setMessage(`Only ${MAX_FAVORITES} chicks fit on the perch. Take one off first.`);
    save("flock", next);
    setMessage("");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <FarmHeader active="henhouse" />

      {!chicks.length ? (
        <section className="card mt-6 flex flex-col items-center gap-2 py-8 text-center">
          <Chick variant="sunny" mood="sad" size={80} />
          <p className="font-display text-lg font-semibold">The henhouse is empty.</p>
          <p className="max-w-sm text-muted">
            Hatch chicks by finishing a focus session in the <Link href="/timer" className="underline">Egg Timer</Link> or
            getting 100% on a <Link href="/nest" className="underline">Nest</Link> quiz.
          </p>
        </section>
      ) : (
        <>
          {/* Every chick: tap one to look after it */}
          <section className="card mt-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl">Your chicks</h2>
              <p className="text-sm text-muted">
                <Icon name="heart" size={14} /> {favorites}/{MAX_FAVORITES} favorites on the perch
              </p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {shown.map((chick) => (
                <button
                  key={chick.id}
                  type="button"
                  onClick={() => setSelectedId(chick.id)}
                  className={`group flex flex-col items-center rounded-2xl border-[3px] p-1 transition ${
                    chick === selected ? "border-line bg-chick shadow-[0_3px_0_var(--chick-line)]" : "border-transparent hover:bg-chick/30"
                  }`}
                >
                  <span className="relative">
                    <span className="inline-block group-hover:anim-hop">
                      <Chick {...chickLook(chick)} size={48} />
                    </span>
                    {chick.favorite && (
                      <span className="absolute -top-1 -left-2" title="Favorite">
                        <Icon name="heart" size={16} />
                      </span>
                    )}
                    {chick.id === profile?.avatarChickId && (
                      <span className="absolute -top-2 -right-2" title="Your avatar">
                        <Icon name="star" size={16} />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 w-full truncate text-xs font-semibold">{nameOf(chick)}</span>
                </button>
              ))}
            </div>
            {ordered.length > SHOW_AT_FIRST && (
              <button type="button" onClick={() => setShowAll(!showAll)} className="btn-secondary mx-auto mt-3 block px-4 py-1.5 text-sm">
                {showAll ? "Show fewer" : `Show all ${ordered.length} chicks`}
              </button>
            )}
          </section>

          {/* The dressing room for the chosen chick */}
          <section className="card mt-6 grid gap-6 sm:grid-cols-[200px_1fr]">
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="label-small">Dressing room</p>
              <Chick {...chickLook(selected)} size={150} />
              <div className="flex flex-wrap justify-center gap-1.5 text-xs font-semibold">
                <span className="flex items-center gap-1 rounded-full border-2 border-line/30 bg-white px-2.5 py-0.5">
                  <Icon name="calendar" size={14} />
                  {new Date(selected.hatchedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {HOW_FROM[selected.from] && (
                  <span className="flex items-center gap-1 rounded-full border-2 border-line/30 bg-white px-2.5 py-0.5">
                    <Icon name={HOW_FROM[selected.from].icon} size={14} /> {HOW_FROM[selected.from].label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={switchFavorite}
                className={`flex items-center gap-1.5 rounded-full border-2 border-line px-3 py-1 text-sm font-semibold ${
                  selected.favorite ? "bg-chick" : "bg-white"
                }`}
              >
                <Icon name="heart" size={16} /> {selected.favorite ? "On the perch" : "Put on the perch"}
              </button>
              {message && <p className="rounded-2xl bg-chick/60 px-3 py-1.5 text-xs font-semibold">{message}</p>}
              {selected.id === profile?.avatarChickId ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="rounded-full bg-chick px-3 py-1 text-sm font-semibold">
                    <Icon name="star" size={14} /> Your avatar
                  </span>
                  <button
                    type="button"
                    onClick={() => update("profile", (p) => ({ ...p, avatarChickId: null }))}
                    className="text-xs font-semibold text-muted underline"
                  >
                    Stop using as avatar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => update("profile", (p) => ({ ...p, avatarChickId: selected.id }))}
                  className="btn-secondary px-3 py-1 text-sm"
                >
                  Make this my avatar
                </button>
              )}
            </div>

            <div className="flex flex-col gap-5">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Name</span>
                {/* The key resets the box when a different chick is picked */}
                <input
                  key={selected.id}
                  className="input"
                  maxLength={20}
                  placeholder={nameOf({ ...selected, name: "" })}
                  defaultValue={selected.name ?? ""}
                  onBlur={(e) => change({ name: e.target.value.trim() })}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </label>

              <div>
                <p className="text-sm font-semibold">Color</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {clothes.color.map((c) => {
                    const current = (selected.paint ?? selected.color) === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => change({ paint: c })}
                        title={CHICK_COLORS[c].name}
                        aria-label={CHICK_COLORS[c].name}
                        className={`h-9 w-9 rounded-full border-[3px] border-line transition hover:scale-110 ${current ? "ring-4 ring-beak/60" : ""}`}
                        style={{ background: CHICK_COLORS[c].body }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Outfit</p>
                {/* One tab per body part, then what you own for it */}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-full border-2 border-line px-3 py-0.5 text-sm font-semibold ${slot === s ? "bg-chick" : "bg-white"}`}
                    >
                      {WEAR_LABELS[s]}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <WearButton active={!selected.wear?.[slot] || selected.wear?.[slot] === "none"} onClick={() => change({ wear: { ...selected.wear, [slot]: "none" } })}>
                    None
                  </WearButton>
                  {clothes[slot].map((value) => (
                    <WearButton key={value} active={selected.wear?.[slot] === value} onClick={() => change({ wear: { ...selected.wear, [slot]: value } })}>
                      <Chick variant="sunny" wear={{ head: "none", [slot]: value }} size={34} />
                      <span className="sr-only">{SHOP.find((i) => i.slot === slot && i.value === value)?.name ?? value}</span>
                    </WearButton>
                  ))}
                </div>
                <Link href="/henhouse/shop" className="mt-3 inline-block text-sm font-semibold underline">
                  {clothes[slot].length ? "Get more in the Shop →" : `No ${WEAR_LABELS[slot].toLowerCase()} items yet. Get some in the Shop →`}
                </Link>
              </div>
            </div>
          </section>

        </>
      )}
    </main>
  );
}

function WearButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 min-w-12 items-center justify-center rounded-2xl border-[3px] border-line px-2 text-sm font-semibold ${
        active ? "bg-chick shadow-[0_3px_0_var(--chick-line)]" : "bg-white"
      }`}
    >
      {children}
    </button>
  );
}
