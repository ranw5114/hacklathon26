"use client";

import Icon from "@/components/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Chick from "@/components/Chick";
import CornGuide from "@/components/CornGuide";
import { useStored } from "@/lib/storage";

// Menu icons (drawn in components/Icon.js).
export const NAV_ITEMS = [
  { href: "/barn", label: "Barn", icon: "barn" },
  { href: "/nest", label: "Nest", icon: "nest" },
  { href: "/coop", label: "Coop", icon: "hen" },
  { href: "/timer", label: "Timer", icon: "egg" },
  { href: "/roost", label: "Roost", icon: "calendar" },
  { href: "/todo", label: "To-Do", icon: "todo" },
  { href: "/profile", label: "Me", icon: "chick" },
];

// Top bar on computers, bottom bar on phones (like Duolingo).
export default function AppNav({ avatar }) {
  const pathname = usePathname();
  const flock = useStored("flock");

  return (
    <>
      {/* Computer: top bar */}
      <header className="sticky top-0 z-[35] hidden border-b-[3px] border-line bg-background/95 backdrop-blur sm:block">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2">
          <Link href="/barn" className="mr-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Chick variant={avatar} size={36} />
            Cluck In
          </Link>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
          <CornGuide flock={flock} />
        </nav>
      </header>

      {/* Phone: bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-[3px] border-line bg-background px-1 py-1.5 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} stacked />
        ))}
      </nav>
    </>
  );
}

function NavLink({ item, active, stacked }) {
  return (
    <Link
      href={item.href}
      className={`group flex items-center rounded-2xl border-2 px-3 py-1.5 font-display font-semibold transition ${
        // Phones fit 7 tabs: narrower padding and labels that never wrap.
        stacked ? "min-w-0 flex-1 flex-col gap-0 px-0.5 text-[11px] whitespace-nowrap" : "gap-1.5 text-sm"
      } ${active ? "border-line bg-chick" : "border-transparent hover:bg-chick/40"}`}
    >
      <span className="inline-flex group-hover:anim-wiggle">
        <Icon name={item.icon} size={stacked ? 24 : 20} />
      </span>
      {item.label}
    </Link>
  );
}
