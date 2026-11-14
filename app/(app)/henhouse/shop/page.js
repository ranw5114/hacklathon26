"use client";

import Icon from "@/components/Icon";
import { useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import FarmHeader from "@/components/FarmHeader";
import { useConfirm } from "@/components/Modal";
import { CORN_WAYS, withDefaults } from "@/lib/flock";
import { buyItem, SHOP, SLOT_LABELS, SLOTS } from "@/lib/henhouse";
import { useAvatar } from "@/lib/avatar";
import { load, save, useStored } from "@/lib/storage";

const CATEGORIES = ["color", ...SLOTS];

// The Shop: spend corn on colors and clothes. Every item is shown on your own avatar,
// so you can see how it looks before buying (and buying asks first).
export default function ShopPage() {
  const stored = useStored("flock");
  const avatar = useAvatar();
  const { confirm, dialog } = useConfirm();
  const [category, setCategory] = useState("color");
  const [message, setMessage] = useState("");

  if (stored === undefined) return null;
  const flock = withDefaults(stored);
  const items = SHOP.filter((item) => item.slot === category);

  async function buy(item) {
    if (flock.corn < item.price) return setMessage(`You need ${item.price - flock.corn} more corn for the ${item.name}.`);
    const ok = await confirm({
      title: `Buy the ${item.name}?`,
      picture: <Chick variant={tryOn(avatar, item)} size={120} />,
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
    setMessage(`You bought the ${item.name}! Put it on a chick in the Henhouse.`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      {dialog}
      <FarmHeader active="shop" />

      <section className="card mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">The Shop</h2>
          <span className="rounded-full border-2 border-line bg-chick px-3 py-1 font-display font-semibold">
            <Icon name="corn" size={18} /> {flock.corn} corn
          </span>
        </div>

        {/* How to earn corn (the same list as the corn guide in the top bar) */}
        <details className="mt-3 rounded-2xl bg-chick/40 px-4 py-2 text-sm">
          <summary className="cursor-pointer font-semibold">How do I earn corn?</summary>
          <ul className="mt-2 mb-1 flex flex-col gap-1">
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
        </details>

        {/* One tab per kind of item */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border-2 border-line px-3 py-1 text-sm font-semibold ${category === c ? "bg-chick" : "bg-white"}`}
            >
              {SLOT_LABELS[c]}
            </button>
          ))}
        </div>

        {message && <p className="mt-3 rounded-2xl bg-chick/60 px-4 py-2 text-sm font-semibold">{message}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => {
            const owned = flock.owned.includes(item.id);
            const affordable = flock.corn >= item.price;
            return (
              <div key={item.id} className="flex flex-col items-center gap-1 rounded-2xl border-[3px] border-line bg-white p-3 text-center">
                <Chick variant={tryOn(avatar, item)} size={64} />
                <p className="text-sm font-semibold">{item.name}</p>
                {owned ? (
                  <Link href="/henhouse" className="text-sm font-semibold text-muted underline">
                    <Icon name="check" size={12} /> Owned: wear it
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => buy(item)}
                    className={`btn-primary px-3 py-1 text-sm ${affordable ? "" : "opacity-60"}`}
                    title={affordable ? undefined : `You need ${item.price - flock.corn} more corn`}
                  >
                    <Icon name="corn" size={16} /> {item.price}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

// Your avatar wearing (or painted with) a shop item, for the preview.
function tryOn(look, item) {
  const base = typeof look === "object" ? look : { variant: look };
  if (item.slot === "color") return { ...base, color: item.value };
  return { ...base, wear: { ...base.wear, [item.slot]: item.value } };
}
