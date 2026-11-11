// The Henhouse: name your chicks, paint them, and dress them up with things bought with corn.
// Plain functions (no React), so the shop rules live in one place.

import { CHICK_COLORS } from "@/components/Chick";
import { withDefaults } from "@/lib/flock";

// The four avatar colors are free. Everything else is bought once and works on every chick.
export const FREE_COLORS = ["sunny", "peach", "mint", "berry"];

// slot: "color" repaints the chick; "head", "face", "neck" are clothes.
export const SHOP = [
  { id: "color:sky", slot: "color", value: "sky", name: "Sky paint", price: 30 },
  { id: "color:lavender", slot: "color", value: "lavender", name: "Lavender paint", price: 30 },
  { id: "color:lime", slot: "color", value: "lime", name: "Lime paint", price: 30 },
  { id: "color:cocoa", slot: "color", value: "cocoa", name: "Cocoa paint", price: 40 },
  { id: "color:midnight", slot: "color", value: "midnight", name: "Midnight paint", price: 60 },
  { id: "head:bow", slot: "head", value: "bow", name: "Bow", price: 20 },
  { id: "head:flower", slot: "head", value: "flower", name: "Flower", price: 25 },
  { id: "head:beanie", slot: "head", value: "beanie", name: "Beanie", price: 35 },
  { id: "head:cap", slot: "head", value: "cap", name: "Graduation cap", price: 45 },
  { id: "head:party", slot: "head", value: "party", name: "Party hat", price: 40 },
  { id: "head:crown", slot: "head", value: "crown", name: "Crown", price: 80 },
  { id: "face:glasses", slot: "face", value: "glasses", name: "Study glasses", price: 30 },
  { id: "face:shades", slot: "face", value: "shades", name: "Cool shades", price: 50 },
  { id: "neck:scarf", slot: "neck", value: "scarf", name: "Cozy scarf", price: 30 },
  { id: "neck:bowtie", slot: "neck", value: "bowtie", name: "Bow tie", price: 35 },
];

export const SLOT_LABELS = { color: "Color", head: "Head", face: "Face", neck: "Neck" };

export function shopItem(id) {
  return SHOP.find((item) => item.id === id);
}

// What a chick can wear in each slot right now: free colors plus everything bought.
export function wardrobe(flock) {
  const owned = new Set(withDefaults(flock).owned);
  const bought = (slot) => SHOP.filter((item) => item.slot === slot && owned.has(item.id)).map((item) => item.value);
  return {
    color: [...FREE_COLORS, ...bought("color")].filter((c) => CHICK_COLORS[c]),
    head: bought("head"),
    face: bought("face"),
    neck: bought("neck"),
  };
}

// Buys an item if there's enough corn. Returns the NEW flock, or null if it can't be bought.
export function buyItem(flock, id) {
  const f = withDefaults(flock);
  const item = shopItem(id);
  if (!item || f.owned.includes(id) || f.corn < item.price) return null;
  return { ...f, corn: f.corn - item.price, owned: [...f.owned, id] };
}

// Returns a NEW flock with one chick changed, e.g. updateChick(f, id, { name: "Nugget" }).
export function updateChick(flock, chickId, changes) {
  const f = withDefaults(flock);
  return { ...f, chicks: f.chicks.map((c) => (c.id === chickId ? { ...c, ...changes } : c)) };
}

// A name for chicks that haven't been named yet, e.g. "Chick #3".
export function chickName(chick, index) {
  return chick.name?.trim() || `Chick #${index + 1}`;
}

// The props that draw a chick exactly as it's dressed (pass them to <Chick />).
export function chickLook(chick) {
  return { variant: chick.color, color: chick.paint, wear: chick.wear };
}
