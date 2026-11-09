"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Chick from "@/components/Chick";

// Placeholder icons (emoji) until the custom graphics are ready.
export const NAV_ITEMS = [
  { href: "/barn", label: "Barn", icon: "🏠" },
  { href: "/nest", label: "Nest", icon: "🪺" },
  { href: "/coop", label: "Coop", icon: "🐔" },
  { href: "/timer", label: "Timer", icon: "🥚" },
  { href: "/roost", label: "Roost", icon: "📅" },
  { href: "/profile", label: "Me", icon: "🐣" },
];

// Top bar on computers, bottom bar on phones (like Duolingo).
export default function AppNav({ avatar }) {
  const pathname = usePathname();

  return (
    <>
      {/* Computer: top bar */}
      <header className="sticky top-0 z-20 hidden border-b-[3px] border-line bg-background/95 backdrop-blur sm:block">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2">
          <Link href="/barn" className="mr-4 flex items-center gap-2 font-display text-lg font-semibold">
            <Chick variant={avatar} size={36} />
            Chick Study Buddy
          </Link>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
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
      className={`flex items-center rounded-2xl border-2 px-3 py-1.5 font-display font-semibold transition ${
        stacked ? "flex-col gap-0 px-2 text-xs" : "gap-1.5 text-sm"
      } ${active ? "border-line bg-chick" : "border-transparent hover:bg-chick/40"}`}
    >
      <span className={stacked ? "text-xl" : ""}>{item.icon}</span>
      {item.label}
    </Link>
  );
}
