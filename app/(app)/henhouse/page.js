"use client";

import PageIcon from "@/components/PageIcon";
import Icon from "@/components/Icon";
import { useState } from "react";
import Link from "next/link";
import Chick, { CHICK_COLORS } from "@/components/Chick";
import { CoopRoof } from "@/components/EggArt";
import { chickCount, CORN_WAYS, withDefaults } from "@/lib/flock";
import { buyItem, chickLook, chickName, SHOP, SLOT_LABELS, SLOTS, updateChick, wardrobe } from "@/lib/henhouse";

import { useConfirm } from "@/components/Modal";
import { useAvatar } from "@/lib/avatar";
import { load, save, update, useStored } from "@/lib/storage";

// What each wardrobe row is called on the chick editor.
const WEAR_LABELS = { head: "Head", face: "Face", neck: "Neck", body: "Body", prop: "Holding" };

// Where a chick hatched from, shown under it.
const HOW_FROM = {
  timer: { icon: "egg", label: "Egg Timer" },
  quiz: { icon: "star", label: "Perfect quiz" },
  exam: { icon: "trophy", label: "Mock exam" },
  chest: { icon: "chest", label: "Chest" },
};

// The Henhouse: every chick you've hatched. Name them, paint them, and dress them up with corn.
export default function HenhousePage() {
  const stored = useStored("flock");
  const profile = useStored("profile");
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState("");
  const { confirm, dialog } = useConfirm();
  const avatar = useAvatar();

  if (stored === undefined) return null;
  const flock = withDefaults(stored);
  const chicks = flock.chicks;
  const selectedIndex = Math.max(0, chicks.findIndex((c) => c.id === selectedId));
  const selected = chicks[selectedIndex];
  const clothes = wardrobe(flock);

  function change(changes) {
    update("flock", (f) => updateChick(f, selected.id, changes));
  }

  // Buying asks first, so a misclick doesn't spend corn.
  async function buy(item) {
    if (flock.corn < item.price) return setMessage(`You need ${item.price - flock.corn} more corn for the ${item.name}.`);
    const ok = await confirm({
      title: `Buy the ${item.name}?`,
      message: `It costs ${item.price} corn. You'll have ${flock.corn - item.price} corn left.`,
      confirmLabel: `Buy for ${item.price} corn`,
      cancelLabel: "Not now",
      chick: avatar,
    });
    if (!ok) return;
    // Buy from the latest saved flock, in case it changed while the question was open.
    const next = buyItem(withDefaults(load("flock")), item.id);
    if (!next) return setMessage(`You need more corn for the ${item.name}.`);
    save("flock", next);
    setMessage(`You bought the ${item.name}! ${selected ? "Try it on your chick above." : ""}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      {dialog}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <PageIcon icon="henhouse" move="peek" size={52} lines={["Peekaboo!", "Home sweet coop.", "Dress-up time!", "Who wants a new hat?"]} label="Poke the henhouse" />
          <div>
            <p className="label-small">Your chicks</p>
            <h1 className="text-4xl">The Henhouse</h1>
          </div>
        </div>
        <div className="flex gap-2 font-display font-semibold">
          <span className="rounded-full border-2 border-line bg-white px-3 py-1"><Icon name="chick" size={18} /> {chickCount(flock)}</span>
          <span className="rounded-full border-2 border-line bg-white px-3 py-1"><Icon name="corn" size={18} /> {flock.corn} corn</span>
        </div>
      </div>

      {/* The coop: tap a chick to look after it */}
      <div className="mt-6">
        <CoopRoof />
        <div className="-mt-px rounded-b-2xl border-[3px] border-line bg-[oklch(90%_0.06_75)] p-3">
          {chicks.length ? (
            <div className="flex flex-wrap justify-center gap-2 rounded-xl bg-[oklch(94%_0.07_95)] p-3">
              {chicks.map((chick, i) => (
                <button
                  key={chick.id}
                  type="button"
                  onClick={() => setSelectedId(chick.id)}
                  className={`group flex w-20 flex-col items-center rounded-2xl border-[3px] p-1 transition ${
                    i === selectedIndex ? "border-line bg-white shadow-[0_3px_0_var(--chick-line)]" : "border-transparent"
                  }`}
                >
                  <span className="relative">
                    <span className="inline-block group-hover:anim-hop group-active:anim-jump">
                      <Chick {...chickLook(chick)} size={52} />
                    </span>
                    {chick.id === profile?.avatarChickId && (
                      <span className="absolute -top-2 -right-2 text-base" title="Your avatar">
                        <Icon name="star" size={18} />
                      </span>
                    )}
                  </span>
                  <span className="mt-1 w-full truncate text-xs font-semibold">{chickName(chick, i)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[oklch(94%_0.07_95)] p-6 text-center">
              <p className="font-display text-lg font-semibold">The henhouse is empty.</p>
              <p className="mt-1 text-muted">
                Hatch chicks by finishing a focus session in the <Link href="/timer" className="underline">Egg Timer</Link>{" "}
                or getting 100% on a <Link href="/nest" className="underline">Nest</Link> quiz.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Look after the chosen chick */}
      {selected && (
        <section className="card mt-6 grid gap-5 sm:grid-cols-[180px_1fr]">
          <div className="flex flex-col items-center gap-2 text-center">
            <Chick {...chickLook(selected)} size={150} />
            {/* Where this chick came from */}
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
            {selected.id === profile?.avatarChickId ? (
              <div className="flex flex-col items-center gap-1">
                <span className="rounded-full bg-chick px-3 py-1 text-sm font-semibold"><Icon name="star" size={14} /> Your avatar</span>
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

          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Name</span>
              {/* The key resets the box when a different chick is picked */}
              <input
                key={selected.id}
                className="input"
                maxLength={20}
                placeholder={chickName({}, selectedIndex)}
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

            {SLOTS.map((slot) => (
              <div key={slot}>
                <p className="text-sm font-semibold">{WEAR_LABELS[slot]}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <WearButton active={!selected.wear?.[slot] || selected.wear?.[slot] === "none"} onClick={() => change({ wear: { ...selected.wear, [slot]: "none" } })}>
                    None
                  </WearButton>
                  {clothes[slot].map((value) => (
                    <WearButton key={value} active={selected.wear?.[slot] === value} onClick={() => change({ wear: { ...selected.wear, [slot]: value } })}>
                      <Chick variant="sunny" wear={{ head: "none", [slot]: value }} size={34} />
                      <span className="sr-only">{value}</span>
                    </WearButton>
                  ))}
                  {clothes[slot].length === 0 && <span className="self-center text-sm text-muted">Buy some in the shop below!</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* The shop */}
      <section className="card mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl">The Shop</h2>
        </div>
        {/* How to earn corn (the same list as the corn guide in the top bar) */}
        <div className="mt-3 rounded-2xl bg-chick/40 px-4 py-3 text-sm">
          <p className="font-semibold">How to earn corn</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {CORN_WAYS.map((way) => (
              <li key={way.text} className="flex items-start gap-2">
                <Icon name={way.icon} size={18} className="mt-0.5" />
                <span className="flex-1">{way.text}</span>
                <span className="font-semibold whitespace-nowrap">
                  {way.amount} <Icon name="corn" size={14} />
                </span>
              </li>
            ))}
          </ul>
        </div>
        {message && <p className="mt-3 rounded-2xl bg-chick/60 px-4 py-2 text-sm font-semibold">{message}</p>}
        {["color", ...SLOTS].map((slot) => (
          <div key={slot} className="mt-5">
            <h3 className="text-lg">
              {SLOT_LABELS[slot]}
              {slot === "color" && <span className="ml-2 text-sm font-normal text-muted">10–20 corn each</span>}
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
              {SHOP.filter((item) => item.slot === slot).map((item) => {
                const owned = flock.owned.includes(item.id);
                const preview =
                  item.slot === "color" ? { variant: "sunny", color: item.value } : { variant: "sunny", wear: { head: "none", [item.slot]: item.value } };
                return (
                  <div key={item.id} className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-line bg-white p-2 text-center">
                    <Chick {...preview} size={50} />
                    <p className="text-sm font-semibold">{item.name}</p>
                    {owned ? (
                      <span className="text-sm font-semibold text-muted"><Icon name="check" size={12} /> Owned</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => buy(item)}
                        className={`btn-primary px-3 py-1 text-sm ${flock.corn < item.price ? "opacity-60" : ""}`}
                      >
                        <Icon name="corn" size={16} /> {item.price}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
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
