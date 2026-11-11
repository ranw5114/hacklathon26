// The Henhouse: name your chicks, paint them, and dress them up with things bought with corn.
// Plain functions (no React), so the shop rules live in one place.

import { CHICK_COLORS } from "@/components/Chick";
import { withDefaults } from "@/lib/flock";

// The four avatar colors are free. Everything else is bought once and works on every chick.
export const FREE_COLORS = ["sunny", "peach", "mint", "berry"];

// slot: "color" repaints the chick; "head", "face", "neck", "body", "prop" (held) are clothes.
// Colors are cheap (10-20 corn) and clothes cost more (30-100 corn).
const color = (value, name, price) => ({ id: `color:${value}`, slot: "color", value, name: `${name} paint`, price });
const item = (slot, value, name, price) => ({ id: `${slot}:${value}`, slot, value, name, price });

export const SHOP = [
  color("sky", "Sky", 10),
  color("lavender", "Lavender", 10),
  color("lime", "Lime", 10),
  color("rose", "Rose", 10),
  color("coral", "Coral", 15),
  color("teal", "Teal", 15),
  color("cloud", "Cloud", 15),
  color("cocoa", "Cocoa", 15),
  color("bubblegum", "Bubblegum", 15),
  color("gold", "Gold", 20),
  color("ruby", "Ruby", 20),
  color("forest", "Forest", 20),
  color("midnight", "Midnight", 20),

  item("head", "bow", "Bow", 30),
  item("head", "flower", "Flower", 30),
  item("head", "headband", "Sweatband", 30),
  item("head", "beanie", "Beanie", 35),
  item("head", "beret", "Beret", 35),
  item("head", "bunny", "Bunny ears", 40),
  item("head", "party", "Party hat", 40),
  item("head", "chef", "Chef hat", 45),
  item("head", "explorer", "Explorer hat", 45),
  item("head", "cap", "Graduation cap", 45),
  item("head", "cowboy", "Cowboy hat", 50),
  item("head", "headphones", "Headphones", 50),
  item("head", "witch", "Witch hat", 55),
  item("head", "tophat", "Top hat", 60),
  item("head", "halo", "Halo", 70),
  item("head", "crown", "Crown", 100),

  item("face", "glasses", "Study glasses", 30),
  item("face", "goggles", "Lab goggles", 40),
  item("face", "hearts", "Heart glasses", 45),
  item("face", "shades", "Cool shades", 50),
  item("face", "monocle", "Fancy monocle", 60),

  item("neck", "scarf", "Cozy scarf", 30),
  item("neck", "bandana", "Bandana", 30),
  item("neck", "bowtie", "Bow tie", 35),
  item("neck", "pearls", "Pearl necklace", 60),

  item("body", "sweater", "Sweater", 45),
  item("body", "labcoat", "Lab coat", 55),
  item("body", "cape", "Superhero cape", 75),

  item("prop", "pencil", "Pencil", 30),
  item("prop", "book", "Book", 30),
  item("prop", "leaf", "Leaf", 30),
  item("prop", "apple", "Apple", 30),
  item("prop", "mug", "Cocoa mug", 35),
  item("prop", "flask", "Flask", 35),
  item("prop", "scroll", "Scroll", 35),
  item("prop", "paintbrush", "Paintbrush", 35),
  item("prop", "balloon", "Balloon", 40),
  item("prop", "wand", "Magic wand", 65),
  item("prop", "trophy", "Trophy", 90),
];

export const SLOT_LABELS = { color: "Colors", head: "Hats", face: "Face", neck: "Neck", body: "Body", prop: "Hold" };
export const SLOTS = ["head", "face", "neck", "body", "prop"];

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
    body: bought("body"),
    prop: bought("prop"),
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
