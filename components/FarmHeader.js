"use client";

import Link from "next/link";
import { FarmBuilding } from "@/components/EggArt";
import Icon from "@/components/Icon";
import { chickCount, withDefaults } from "@/lib/flock";
import { useStored } from "@/lib/storage";

// The top of the Henhouse and Shop pages: two buildings side by side. The one you're in is
// highlighted; tapping the other goes there. They feel like one farm, with two places in it.
export default function FarmHeader({ active }) {
  const flock = useStored("flock");
  const buildings = [
    { id: "henhouse", href: "/henhouse", name: "The Henhouse", detail: `${chickCount(flock)} chicks · name & dress them` },
    { id: "shop", href: "/henhouse/shop", name: "The Shop", detail: `${withDefaults(flock).corn} corn to spend` },
  ];

  return (
    <div>
      <p className="label-small">Your farm</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {buildings.map((b) => {
          const here = b.id === active;
          return (
            <Link
              key={b.id}
              href={b.href}
              aria-current={here ? "page" : undefined}
              className={`group flex flex-col items-center gap-1 rounded-3xl border-[3px] border-line px-2 pt-3 pb-3 text-center transition ${
                here ? "bg-chick shadow-[0_4px_0_var(--chick-line)]" : "bg-white hover:-translate-y-0.5 hover:bg-chick/30"
              }`}
            >
              <span className="transition group-hover:-rotate-2">
                <FarmBuilding kind={b.id} size={110} />
              </span>
              <span className="font-display text-lg font-semibold sm:text-xl">{b.name}</span>
              <span className="flex items-center gap-1 text-xs text-muted sm:text-sm">
                {b.id === "shop" && <Icon name="corn" size={14} />}
                {b.detail}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
