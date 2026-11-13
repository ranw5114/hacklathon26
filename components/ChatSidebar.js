"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import {
  createFolder,
  DEFAULT_FOLDER_COLOR,
  deleteFolder,
  editFolder,
  FOLDER_COLORS,
  folderColor,
  moveChat,
  renameChat,
} from "@/lib/chats";

// The list of Coop chats: a New chat button, folders (named and colored by the student), and
// chats that aren't in a folder. Drag a chat onto a folder, or use its ⋯ menu to move it.
export default function ChatSidebar({ data, activeId, onOpen, onNewChat, onDeleteChat }) {
  const [making, setMaking] = useState(false);
  const [closed, setClosed] = useState([]); // folder ids that are collapsed
  const [dropTarget, setDropTarget] = useState(null); // folder id (or "none") being dragged over

  const { chats, folders } = data;
  const unfiled = chats.filter((c) => !c.folderId || !folders.some((f) => f.id === c.folderId));

  function dropProps(folderId) {
    return {
      onDragOver: (e) => {
        e.preventDefault();
        setDropTarget(folderId ?? "none");
      },
      onDragLeave: () => setDropTarget(null),
      onDrop: (e) => {
        e.preventDefault();
        const chatId = e.dataTransfer.getData("text/chat-id");
        if (chatId) moveChat(chatId, folderId);
        setDropTarget(null);
      },
    };
  }

  const rowProps = { activeId, onOpen, onDeleteChat, folders };

  return (
    <nav aria-label="Your chats" className="flex flex-col gap-3">
      <button type="button" onClick={onNewChat} className="btn-primary flex items-center justify-center gap-2">
        <Icon name="plus" size={18} /> New chat
      </button>

      {making ? (
        <FolderForm
          submitLabel="Make folder"
          onCancel={() => setMaking(false)}
          onSubmit={({ name, color }) => {
            createFolder(name, color);
            setMaking(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setMaking(true)} className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line/50 py-1.5 text-sm font-semibold hover:bg-chick/40">
          <FolderIcon color={FOLDER_COLORS[DEFAULT_FOLDER_COLOR].swatch} size={18} /> New folder
        </button>
      )}

      {folders.map((folder) => {
        const inside = chats.filter((c) => c.folderId === folder.id);
        const open = !closed.includes(folder.id);
        return (
          <section
            key={folder.id}
            {...dropProps(folder.id)}
            className={`rounded-2xl border-2 p-1.5 transition ${dropTarget === folder.id ? "border-line bg-chick/60" : "border-transparent"}`}
            style={{ background: dropTarget === folder.id ? undefined : folderColor(folder).soft }}
          >
            <FolderHeader
              folder={folder}
              count={inside.length}
              open={open}
              onToggle={() => setClosed((list) => (open ? [...list, folder.id] : list.filter((id) => id !== folder.id)))}
            />
            {open && (
              <ul className="mt-1 flex flex-col gap-0.5">
                {inside.map((chat) => (
                  <ChatRow key={chat.id} chat={chat} {...rowProps} />
                ))}
                {!inside.length && <li className="px-2 py-1 text-xs text-muted">Drag a chat here, or use a chat&apos;s ⋯ menu.</li>}
              </ul>
            )}
          </section>
        );
      })}

      <section {...dropProps(null)} className={`rounded-2xl border-2 p-1.5 transition ${dropTarget === "none" ? "border-line bg-chick/60" : "border-transparent"}`}>
        <p className="label-small px-2">{folders.length ? "Not in a folder" : "Your chats"}</p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {unfiled.map((chat) => (
            <ChatRow key={chat.id} chat={chat} {...rowProps} />
          ))}
          {!chats.length && <li className="px-2 py-1 text-sm text-muted">Your chats are saved here.</li>}
        </ul>
      </section>
    </nav>
  );
}

function FolderHeader({ folder, count, open, onToggle }) {
  const [editing, setEditing] = useState(false);
  const color = folderColor(folder);
  if (editing) {
    return (
      <FolderForm
        folder={folder}
        submitLabel="Save"
        onCancel={() => setEditing(false)}
        onSubmit={(changes) => {
          editFolder(folder.id, changes);
          setEditing(false);
        }}
        onDelete={() => deleteFolder(folder.id)}
      />
    );
  }
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 py-1 text-left hover:bg-white/60">
        <FolderIcon color={color.swatch} size={22} open={open} />
        <span className="truncate font-display font-semibold">{folder.name}</span>
        <span className="text-xs text-muted">{count}</span>
      </button>
      <button type="button" onClick={() => setEditing(true)} aria-label={`Edit folder ${folder.name}`} className="rounded-lg px-1.5 py-0.5 font-bold text-muted hover:bg-white/70">
        ⋯
      </button>
    </div>
  );
}

// Make or edit a folder: its name and color (and delete, when editing).
function FolderForm({ folder, submitLabel, onSubmit, onCancel, onDelete }) {
  const [name, setName] = useState(folder?.name ?? "");
  const [color, setColor] = useState(folder?.color ?? DEFAULT_FOLDER_COLOR);
  const submit = () => name.trim() && onSubmit({ name, color });
  return (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-white p-2">
      <input
        className="input py-1.5 text-sm"
        autoFocus
        maxLength={40}
        placeholder="Folder name (e.g. Chemistry)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onCancel();
        }}
      />
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Folder color">
        {Object.entries(FOLDER_COLORS).map(([key, c]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={color === key}
            aria-label={c.name}
            title={c.name}
            onClick={() => setColor(key)}
            className={`h-7 w-7 rounded-full border-[3px] border-line transition hover:scale-110 ${color === key ? "ring-4 ring-beak/60" : ""}`}
            style={{ background: c.swatch }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-xs font-semibold text-red-700 underline" title="Its chats stay, outside the folder">
            Delete folder
          </button>
        ) : (
          <span />
        )}
        <span className="flex gap-1.5">
          <button type="button" onClick={onCancel} className="btn-secondary px-2.5 py-1 text-xs">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!name.trim()} className="btn-primary px-2.5 py-1 text-xs disabled:opacity-50">
            {submitLabel}
          </button>
        </span>
      </div>
    </div>
  );
}

function ChatRow({ chat, activeId, onOpen, onDeleteChat, folders }) {
  const [menu, setMenu] = useState(false);
  const active = chat.id === activeId;
  return (
    <li>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/chat-id", chat.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={`group flex items-center gap-1 rounded-xl ${active ? "bg-white shadow-[0_2px_0_var(--chick-line)] ring-2 ring-line" : "hover:bg-white/70"}`}
      >
        <button type="button" onClick={() => onOpen(chat.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm" aria-current={active ? "true" : undefined}>
          <Icon name="chat" size={16} />
          <span className={`truncate ${active ? "font-semibold" : ""}`}>{chat.title}</span>
        </button>
        <button
          type="button"
          onClick={() => setMenu(!menu)}
          aria-label={`Options for ${chat.title}`}
          aria-expanded={menu}
          className="rounded-lg px-1.5 font-bold text-muted opacity-60 group-hover:opacity-100 hover:bg-chick/60"
        >
          ⋯
        </button>
      </div>
      {menu && (
        <div className="mx-1 mt-1 mb-2 flex flex-col gap-2 rounded-xl border-2 border-line bg-white p-2 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold">Name</span>
            <input
              className="input py-1 text-sm"
              defaultValue={chat.title}
              maxLength={60}
              onBlur={(e) => renameChat(chat.id, e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold">Folder</span>
            <select className="input py-1 text-sm" value={chat.folderId ?? ""} onChange={(e) => moveChat(chat.id, e.target.value)}>
              <option value="">Not in a folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => onDeleteChat(chat)} className="flex items-center gap-1 text-xs font-semibold text-red-700">
              <Icon name="trash" size={14} /> Delete chat
            </button>
            <button type="button" onClick={() => setMenu(false)} className="text-xs font-semibold text-muted underline">
              Done
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

// A folder in the chick style, filled with the folder's color.
export function FolderIcon({ color, size = 20, open = false }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path d="M4 9 Q4 7 6 7 H12 L15 10 H26 Q28 10 28 12 V24 Q28 26 26 26 H6 Q4 26 4 24 Z" fill={color} stroke="var(--chick-line)" strokeWidth="2.5" strokeLinejoin="round" />
      {open ? (
        <path d="M4 25 L8 15 Q8.5 14 10 14 H29 Q30.5 14 30 15.5 L27 24.5 Q26.5 26 25 26 H6" fill={color} stroke="var(--chick-line)" strokeWidth="2.5" strokeLinejoin="round" />
      ) : (
        <path d="M4 14 H28" stroke="var(--chick-line)" strokeWidth="2.5" />
      )}
    </svg>
  );
}
