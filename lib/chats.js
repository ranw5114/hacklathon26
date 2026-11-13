// Chicken Coop chats: as many conversations as you like, sorted into folders you name and color.
// Saved under "chats": { chats: [{ id, title, folderId, messages, createdAt, updatedAt }],
//                        folders: [{ id, name, color }] }
// Messages are { id, role: "user" | "model", text, hasPhoto?, files? } (text only; photos aren't saved).

import { useEffect } from "react";
import { load, remove, update, useStored } from "@/lib/storage";

// Keep each saved conversation from growing forever.
export const MAX_SAVED_MESSAGES = 40;
const MAX_TITLE = 60;

// Folder colors (the swatches shown when making or editing a folder).
export const FOLDER_COLORS = {
  sunny: { name: "Sunny", swatch: "oklch(88% 0.14 90)", soft: "oklch(96% 0.05 90)" },
  peach: { name: "Peach", swatch: "oklch(82% 0.12 50)", soft: "oklch(95% 0.04 50)" },
  berry: { name: "Berry", swatch: "oklch(78% 0.13 350)", soft: "oklch(95% 0.04 350)" },
  lavender: { name: "Lavender", swatch: "oklch(78% 0.1 295)", soft: "oklch(95% 0.03 295)" },
  sky: { name: "Sky", swatch: "oklch(80% 0.1 235)", soft: "oklch(95% 0.03 235)" },
  mint: { name: "Mint", swatch: "oklch(82% 0.11 165)", soft: "oklch(95% 0.04 165)" },
  lime: { name: "Lime", swatch: "oklch(86% 0.15 125)", soft: "oklch(96% 0.05 125)" },
  cocoa: { name: "Cocoa", swatch: "oklch(66% 0.07 55)", soft: "oklch(93% 0.02 55)" },
};
export const DEFAULT_FOLDER_COLOR = "sky";

const EMPTY = { chats: [], folders: [] };

function newId(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function change(fn) {
  update("chats", (data) => fn({ ...EMPTY, ...(data ?? {}) }));
}

function changeChat(id, fn) {
  change((d) => ({ ...d, chats: d.chats.map((c) => (c.id === id ? fn(c) : c)) }));
}

// Everything, newest chats first. undefined while loading.
export function useChats() {
  const data = useStored("chats");
  // The old single chat (from before multiple chats) moves in as its own chat, once.
  useEffect(() => {
    const old = load("chat");
    if (!Array.isArray(old)) return;
    if (old.length) {
      const now = Date.now();
      change((d) => ({ ...d, chats: [{ id: newId("c"), title: titleFrom(old.find((m) => m.role === "user")?.text) || "Earlier chat", folderId: null, messages: old, createdAt: now, updatedAt: now }, ...d.chats] }));
    }
    remove("chat");
  }, []);
  if (data === undefined) return undefined;
  const all = { ...EMPTY, ...(data ?? {}) };
  return { ...all, chats: [...all.chats].sort((a, b) => b.updatedAt - a.updatedAt) };
}

// A chat's name comes from its first question (it can be renamed).
export function titleFrom(text) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > MAX_TITLE ? `${clean.slice(0, MAX_TITLE - 1).trimEnd()}…` : clean;
}

// Starts a chat with its first message. Returns the new chat's id.
export function createChat(firstMessage, folderId = null) {
  const id = newId("c");
  const now = Date.now();
  const title = titleFrom(firstMessage.text) || (firstMessage.files?.length ? firstMessage.files[0].name : "New chat");
  change((d) => ({ ...d, chats: [...d.chats, { id, title, folderId, messages: [firstMessage], createdAt: now, updatedAt: now }] }));
  return id;
}

export function addMessage(chatId, message) {
  changeChat(chatId, (c) => ({ ...c, messages: [...c.messages, message].slice(-MAX_SAVED_MESSAGES), updatedAt: Date.now() }));
}

export function renameChat(chatId, title) {
  const name = titleFrom(title);
  if (name) changeChat(chatId, (c) => ({ ...c, title: name }));
}

export function moveChat(chatId, folderId) {
  changeChat(chatId, (c) => ({ ...c, folderId: folderId || null }));
}

export function deleteChat(chatId) {
  change((d) => ({ ...d, chats: d.chats.filter((c) => c.id !== chatId) }));
}

// ---- Folders ----------------------------------------------------------------------------

export function createFolder(name, color = DEFAULT_FOLDER_COLOR) {
  const id = newId("f");
  const clean = name.trim().slice(0, 40) || "New folder";
  change((d) => ({ ...d, folders: [...d.folders, { id, name: clean, color: FOLDER_COLORS[color] ? color : DEFAULT_FOLDER_COLOR }] }));
  return id;
}

export function editFolder(folderId, { name, color }) {
  change((d) => ({
    ...d,
    folders: d.folders.map((f) =>
      f.id === folderId
        ? { ...f, ...(name?.trim() ? { name: name.trim().slice(0, 40) } : {}), ...(FOLDER_COLORS[color] ? { color } : {}) }
        : f
    ),
  }));
}

// Deleting a folder keeps its chats (they go back to "Not in a folder").
export function deleteFolder(folderId) {
  change((d) => ({
    ...d,
    folders: d.folders.filter((f) => f.id !== folderId),
    chats: d.chats.map((c) => (c.folderId === folderId ? { ...c, folderId: null } : c)),
  }));
}

export function folderColor(folder) {
  return FOLDER_COLORS[folder?.color] ?? FOLDER_COLORS[DEFAULT_FOLDER_COLOR];
}
