"use client";

import Icon from "@/components/Icon";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Chick from "@/components/Chick";
import CornGuide from "@/components/CornGuide";
import { useStored } from "@/lib/storage";

// Menu icons (drawn in components/Icon.js). The Barn isn't a tab: the "Cluck In" logo takes you there.
export const NAV_ITEMS = [
  { href: "/henhouse", label: "Farm", icon: "henhouse" }, // the Henhouse and the Shop
  { href: "/nest", label: "Nest", icon: "nest" },
  { href: "/coop", label: "Coop", icon: "hen" },
  { href: "/timer", label: "Timer", icon: "egg" },
  { href: "/roost", label: "Roost", icon: "calendar" },
  { href: "/todo", label: "To-Do", icon: "todo" },
  { href: "/profile", label: "Me", icon: "chick" },
];

// Top bar on computers, bottom bar on phones (like Duolingo).
// Every page but the Barn also gets a back arrow next to the logo.
export default function AppNav({ avatar }) {
  const pathname = usePathname();
  const flock = useStored("flock");
  const atBarn = pathname.startsWith("/barn");
  const back = useBackButton(pathname);
  const logo = <Logo avatar={avatar} here={atBarn} />;

  return (
    <>
      {/* Computer: top bar */}
      <header className="sticky top-0 z-[35] hidden border-b-[3px] border-line bg-background/95 backdrop-blur sm:block">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-2">
          {!atBarn && <BackButton onClick={back} />}
          {logo}
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item, pathname)} />
          ))}
          <CornGuide flock={flock} />
        </nav>
      </header>

      {/* Phone: a slim top bar (back arrow, logo, chicks and corn) and the tabs at the bottom */}
      <header className="sticky top-0 z-[35] flex items-center gap-1 border-b-[3px] border-line bg-background/95 px-3 py-1.5 backdrop-blur sm:hidden">
        {!atBarn && <BackButton onClick={back} />}
        {logo}
        <CornGuide flock={flock} />
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t-[3px] border-line bg-background px-1 py-1.5 sm:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item, pathname)} stacked />
        ))}
      </nav>
    </>
  );
}

// "Cluck In" with your avatar: the way home to the Barn. It's highlighted while you're there.
function Logo({ avatar, here }) {
  return (
    <Link
      href="/barn"
      aria-current={here ? "page" : undefined}
      title="Go to the Barn"
      className={`mr-3 flex items-center gap-2 rounded-2xl border-2 py-0.5 pr-3 pl-1 font-display text-lg font-semibold whitespace-nowrap transition ${
        here ? "border-line bg-chick" : "border-transparent hover:bg-chick/40"
      }`}
    >
      <Chick variant={avatar} size={32} />
      Cluck In
    </Link>
  );
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      title="Go back"
      className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-line bg-white font-display text-lg font-bold transition hover:-translate-x-0.5 hover:bg-chick/40"
    >
      ←
    </button>
  );
}

// Going back returns to the previous page in Cluck In. If this is the first page opened
// (e.g. a link from somewhere else, or after a reload), there's nothing to go back to, so it goes to the Barn.
function useBackButton(pathname) {
  const router = useRouter();
  const pagesSeen = useRef(0);
  useEffect(() => {
    pagesSeen.current += 1;
  }, [pathname]);
  return () => (pagesSeen.current > 1 ? router.back() : router.push("/barn"));
}

function isActive(item, pathname) {
  return pathname.startsWith(item.href);
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
