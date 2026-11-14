"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/Icon";
import {
  createFolder,
  DEFAULT_FOLDER_COLOR,
  editFolder,
  FOLDER_COLORS,
  folderColor,
  archiveChat,
  moveChat,
  pinChat,
  renameChat,
} from "@/lib/chats";

// The list of Coop chats: a New chat button, folders (named and colored by the student), and
// chats that aren't in a folder. Pinned chats sit at the top, archived ones are tucked away at the bottom.
// Drag a chat onto a folder, or use its ⋯ menu to pin, rename, move, archive, or delete it.
// A folder's ⋯ menu starts a new chat inside it, renames it, changes its color, or deletes it.
// `draftFolderId`: a new, still-empty chat was started in this folder, so it shows there as "New chat".
export default function ChatSidebar({ data, activeId, draftFolderId, onOpen, onNewChat, onCancelDraft, onDeleteChat, onDeleteFolder }) {
  const [making, setMaking] = useState(false);
  const [closed, setClosed] = useState([]); // folder ids that are collapsed
  const [dropTarget, setDropTarget] = useState(null); // folder id (or "none") being dragged over
  const [showArchived, setShowArchived] = useState(false);

  const { folders } = data;
  const archived = data.chats.filter((c) => c.archived);
  const pinned = data.chats.filter((c) => c.pinned && !c.archived);
  // Everything else goes in its folder, or under "Not in a folder".
  const chats = data.chats.filter((c) => !c.pinned && !c.archived);
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
      <button type="button" onClick={() => onNewChat(null)} className="btn-primary flex items-center justify-center gap-2">
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
        <button
          type="button"
          onClick={() => setMaking(true)}
          className="group flex items-center justify-center gap-3 rounded-2xl border-[3px] border-line bg-white py-1.5 font-display text-sm font-semibold shadow-[0_3px_0_var(--chick-line)] transition hover:bg-chick/40 active:translate-y-0.5 active:shadow-none"
        >
          {/* A folder with a little + badge */}
          <span className="relative inline-flex transition group-hover:-rotate-6">
            <FolderIcon color={FOLDER_COLORS[DEFAULT_FOLDER_COLOR].swatch} size={22} />
            <span className="absolute -right-1.5 -bottom-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-line bg-chick text-[9px] leading-none font-bold">
              +
            </span>
          </span>
          New folder
        </button>
      )}

      {pinned.length > 0 && (
        <section className="rounded-2xl border-2 border-line/20 bg-chick/30 p-1.5">
          <p className="label-small flex items-center gap-1 px-2">
            <Icon name="pin" size={14} /> Pinned
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {pinned.map((chat) => (
              <ChatRow key={chat.id} chat={chat} {...rowProps} />
            ))}
          </ul>
        </section>
      )}

      {folders.map((folder) => {
        const inside = chats.filter((c) => c.folderId === folder.id);
        const hasDraft = !activeId && draftFolderId === folder.id;
        // A folder with a new chat waiting in it is always open, so you can see it.
        const open = hasDraft || !closed.includes(folder.id);
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
              onNewChat={() => onNewChat(folder.id)}
              onDelete={() => onDeleteFolder(folder)}
            />
            {open && (
              <ul className="mt-1 flex flex-col gap-1">
                {hasDraft && <DraftRow onCancel={onCancelDraft} />}
                {inside.map((chat) => (
                  <ChatRow key={chat.id} chat={chat} {...rowProps} />
                ))}
                {!inside.length && !hasDraft && (
                  <li>
                    <button type="button" onClick={() => onNewChat(folder.id)} className="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-line/30 px-2 py-1.5 text-left text-xs font-semibold text-muted hover:bg-white/70">
                      <Icon name="plus" size={14} /> Start a chat in {folder.name}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </section>
        );
      })}

      <section {...dropProps(null)} className={`rounded-2xl border-2 p-1.5 transition ${dropTarget === "none" ? "border-line bg-chick/60" : "border-transparent"}`}>
        <p className="label-small px-2">{folders.length ? "Not in a folder" : "Your chats"}</p>
        <ul className="mt-1 flex flex-col gap-1">
          {unfiled.map((chat) => (
            <ChatRow key={chat.id} chat={chat} {...rowProps} />
          ))}
          {!data.chats.length && <li className="px-2 py-1 text-sm text-muted">Your chats are saved here.</li>}
          {data.chats.length > 0 && !unfiled.length && <li className="px-2 py-1 text-xs text-muted">Drag a chat here to take it out of its folder.</li>}
        </ul>
      </section>

      {/* Archived chats: kept, but out of the way until you need them */}
      {archived.length > 0 && (
        <section className="rounded-2xl border-2 border-dashed border-line/30 p-1.5">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            aria-expanded={showArchived}
            className="flex w-full items-center gap-2 rounded-xl px-1.5 py-1 text-left text-sm font-semibold text-muted hover:bg-white/60"
          >
            <Icon name="chest" size={18} />
            <span className="flex-1">Archived</span>
            <span className="text-xs">{archived.length}</span>
            <span className={`text-xs transition ${showArchived ? "rotate-90" : ""}`}>▸</span>
          </button>
          {showArchived && (
            <ul className="mt-1 flex flex-col gap-0.5 opacity-80">
              {archived.map((chat) => (
                <ChatRow key={chat.id} chat={chat} {...rowProps} />
              ))}
            </ul>
          )}
        </section>
      )}
    </nav>
  );
}

function FolderHeader({ folder, count, open, onToggle, onNewChat, onDelete }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const dotsRef = useRef(null);
  const color = folderColor(folder);
  return (
    <div className="flex items-center gap-1">
      {renaming ? (
        // Renaming happens right in the header: Enter (or clicking away) saves, Escape cancels.
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-1.5 py-1 ring-2 ring-line">
          <FolderIcon color={color.swatch} size={22} open={open} />
          <input
            autoFocus
            aria-label="Folder name"
            className="min-w-0 flex-1 rounded-md bg-chick/30 px-1.5 py-0.5 font-display font-semibold outline-none focus:ring-2 focus:ring-beak/60"
            defaultValue={folder.name}
            maxLength={40}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              editFolder(folder.id, { name: e.target.value });
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        </span>
      ) : (
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl px-1.5 py-1 text-left hover:bg-white/60">
          <FolderIcon color={color.swatch} size={22} open={open} />
          <span className="truncate font-display font-semibold">{folder.name}</span>
          <span className="text-xs text-muted">{count}</span>
        </button>
      )}
      {!renaming && (
        <button
          ref={dotsRef}
          type="button"
          onClick={() => setMenu(!menu)}
          aria-label={`Options for folder ${folder.name}`}
          aria-expanded={menu}
          aria-haspopup="menu"
          className={`rounded-lg px-1.5 py-0.5 font-bold text-muted hover:bg-white/70 ${menu ? "bg-white/70" : ""}`}
        >
          ⋯
        </button>
      )}
      {menu && (
        <FolderMenu
          folder={folder}
          anchorRef={dotsRef}
          onClose={() => setMenu(false)}
          onNewChat={onNewChat}
          onRename={() => setRenaming(true)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

// The ⋯ menu for a folder, in the folder's own (lighter) color. "Change color" opens the swatches
// inside the same card; picking one recolors the folder right away.
function FolderMenu({ folder, anchorRef, onClose, onNewChat, onRename, onDelete }) {
  const [coloring, setColoring] = useState(false);
  const run = (action) => () => {
    action();
    onClose();
  };
  return (
    <SideMenu anchorRef={anchorRef} tint={lighter(folderColor(folder).soft)} onClose={onClose} remeasure={coloring}>
      {coloring ? (
        <>
          <MenuBack onClick={() => setColoring(false)}>Folder color</MenuBack>
          <div className="grid grid-cols-4 gap-2 px-2 pt-1 pb-2" role="radiogroup" aria-label="Folder color">
            {Object.entries(FOLDER_COLORS).map(([key, c]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={folderColor(folder) === c}
                aria-label={c.name}
                title={c.name}
                onClick={() => editFolder(folder.id, { color: key })}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-line transition hover:scale-110 ${
                  folderColor(folder) === c ? "ring-4 ring-beak/60" : ""
                }`}
                style={{ background: c.swatch }}
              >
                {folderColor(folder) === c && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <MenuItem onClick={run(onNewChat)}>
            <Icon name="plus" size={16} /> New chat in folder
          </MenuItem>
          <MenuItem onClick={run(onRename)}>
            <Icon name="pencil" size={16} /> Rename
          </MenuItem>
          <MenuItem onClick={() => setColoring(true)}>
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-line" style={{ background: folderColor(folder).swatch }} />
            <span className="flex-1">Change color</span>
            <span className="text-muted">▸</span>
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={run(onDelete)} danger>
            <Icon name="trash" size={16} /> Delete folder
          </MenuItem>
        </>
      )}
    </SideMenu>
  );
}

// Make a new folder: its name and color. (Existing folders are changed from their ⋯ menu.)
function FolderForm({ submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_FOLDER_COLOR);
  const submit = () => name.trim() && onSubmit({ name, color });
  return (
    <div className="anim-pop flex flex-col gap-2.5 rounded-2xl border-[3px] border-line bg-white p-3 shadow-[0_3px_0_var(--chick-line)]">
      <p className="flex items-center gap-2 font-display font-semibold">
        <FolderIcon color={FOLDER_COLORS[color].swatch} size={22} /> New folder
      </p>
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
      <div className="grid grid-cols-4 justify-items-center gap-2" role="radiogroup" aria-label="Folder color">
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
      <div className="flex items-center justify-end gap-2">
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

// The new chat you just started in a folder, before its first message. Sending the first message
// turns it into a real chat (with a name); the × cancels it.
function DraftRow({ onCancel }) {
  return (
    <li className="anim-pop">
      <div className="flex items-center gap-1 rounded-xl bg-white shadow-[0_2px_0_var(--chick-line)] ring-2 ring-line">
        <span className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-sm" aria-current="true">
          <Icon name="pencil" size={16} />
          <span className="shrink-0 font-semibold">New chat</span>
          <span className="min-w-0 truncate text-xs text-muted">· type your question</span>
        </span>
        <button type="button" onClick={onCancel} aria-label="Cancel the new chat" title="Cancel" className="mr-1 rounded-lg p-1 text-muted hover:bg-chick/60">
          <Icon name="close" size={12} />
        </button>
      </div>
    </li>
  );
}

function ChatRow({ chat, activeId, onOpen, onDeleteChat, folders }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const dotsRef = useRef(null);
  const active = chat.id === activeId;
  // The chat's own color: its folder's, or sunny yellow when it isn't in one. The menu uses a lighter shade.
  const tint = lighter(folderColor(folders.find((f) => f.id === chat.folderId) ?? { color: "sunny" }).soft);
  return (
    <li className="relative">
      <div
        draggable={!renaming}
        onDragStart={(e) => {
          e.dataTransfer.setData("text/chat-id", chat.id);
          e.dataTransfer.effectAllowed = "move";
        }}
        className={`group flex items-center gap-1 rounded-xl ${active || renaming ? "bg-white shadow-[0_2px_0_var(--chick-line)] ring-2 ring-line" : menu ? "ring-2 ring-line/40" : "bg-white/75 hover:bg-white"}`}
        style={menu && !active ? { background: tint } : undefined}
      >
        {renaming ? (
          // Renaming happens right in the row: Enter (or clicking away) saves, Escape cancels.
          <span className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1">
            <Icon name="pencil" size={16} />
            <input
              autoFocus
              aria-label="Chat name"
              className="min-w-0 flex-1 rounded-md bg-chick/30 px-1.5 py-0.5 text-sm outline-none focus:ring-2 focus:ring-beak/60"
              defaultValue={chat.title}
              maxLength={60}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => {
                renameChat(chat.id, e.target.value);
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setRenaming(false);
              }}
            />
          </span>
        ) : (
          <button type="button" onClick={() => onOpen(chat.id)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm" aria-current={active ? "true" : undefined}>
            <Icon name={chat.pinned ? "pin" : "chat"} size={16} />
            <span className={`truncate ${active ? "font-semibold" : ""}`}>{chat.title}</span>
          </button>
        )}
        {!renaming && (
          <button
            ref={dotsRef}
            type="button"
            onClick={() => setMenu(!menu)}
            aria-label={`Options for ${chat.title}`}
            aria-expanded={menu}
            aria-haspopup="menu"
            className={`rounded-lg px-1.5 font-bold text-muted hover:bg-chick/60 ${menu ? "bg-chick/60 opacity-100" : "opacity-60 group-hover:opacity-100"}`}
          >
            ⋯
          </button>
        )}
      </div>
      {menu && (
        <ChatMenu
          chat={chat}
          folders={folders}
          anchorRef={dotsRef}
          tint={tint}
          onClose={() => setMenu(false)}
          onRename={() => setRenaming(true)}
          onDelete={() => onDeleteChat(chat)}
        />
      )}
    </li>
  );
}

// The ⋯ menu for a chat. "Move to folder" opens the list of folders inside the same card.
function ChatMenu({ chat, folders, anchorRef, tint, onClose, onRename, onDelete }) {
  const [moving, setMoving] = useState(false);

  // Every action closes the menu after it's done.
  const run = (action) => () => {
    action();
    onClose();
  };

  return (
    <SideMenu anchorRef={anchorRef} tint={tint} onClose={onClose} remeasure={moving}>
      {moving ? (
        <>
          <MenuBack onClick={() => setMoving(false)}>Move to…</MenuBack>
          {folders.map((f) => (
            <MenuItem key={f.id} onClick={run(() => moveChat(chat.id, f.id))} current={chat.folderId === f.id}>
              <FolderIcon color={folderColor(f).swatch} size={18} />
              <span className="truncate">{f.name}</span>
            </MenuItem>
          ))}
          <MenuItem onClick={run(() => moveChat(chat.id, null))} current={!chat.folderId || !folders.some((f) => f.id === chat.folderId)}>
            <Icon name="chat" size={16} /> Not in a folder
          </MenuItem>
        </>
      ) : chat.archived ? (
        <>
          <MenuItem onClick={run(() => archiveChat(chat.id, false))}>
            <Icon name="chest" size={16} /> Unarchive
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={run(onDelete)} danger>
            <Icon name="trash" size={16} /> Delete
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={run(() => pinChat(chat.id, !chat.pinned))}>
            <Icon name="pin" size={16} /> {chat.pinned ? "Unpin" : "Pin to top"}
          </MenuItem>
          <MenuItem onClick={run(onRename)}>
            <Icon name="pencil" size={16} /> Rename
          </MenuItem>
          {folders.length > 0 && (
            <MenuItem onClick={() => setMoving(true)}>
              <FolderIcon color={FOLDER_COLORS[DEFAULT_FOLDER_COLOR].swatch} size={16} />
              <span className="flex-1">Move to folder</span>
              <span className="text-muted">▸</span>
            </MenuItem>
          )}
          <MenuItem onClick={run(() => archiveChat(chat.id, true))}>
            <Icon name="chest" size={16} /> Archive
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={run(onDelete)} danger>
            <Icon name="trash" size={16} /> Delete
          </MenuItem>
        </>
      )}
    </SideMenu>
  );
}

// A small card that opens beside a ⋯ button, outside the chat list, so the list's scrolling never
// cuts it off. It sits to the right of the button (on a phone, underneath it), always inside the window.
// `remeasure` changes when the card's contents change size (like opening a sub-list).
function SideMenu({ anchorRef, tint, onClose, remeasure, children }) {
  const boxRef = useRef(null);
  const [place, setPlace] = useState(null); // { left, top, side, arrowTop } once measured

  useLayoutEffect(() => {
    const button = anchorRef.current?.getBoundingClientRect();
    const box = boxRef.current?.getBoundingClientRect();
    if (!button || !box) return;
    const roomOnRight = button.right + GAP + box.width <= window.innerWidth - GAP;
    const left = roomOnRight ? button.right + GAP : Math.max(GAP, button.right - box.width);
    const top = roomOnRight ? button.top - 10 : button.bottom + GAP;
    setPlace({ left, top: Math.max(GAP, Math.min(top, window.innerHeight - box.height - GAP)), side: roomOnRight, arrowTop: button.top + button.height / 2 });
  }, [anchorRef, remeasure]);

  // Close when clicking anywhere else, pressing Escape, or scrolling the page (it would float away from its button).
  useEffect(() => {
    const outside = (e) => !boxRef.current?.contains(e.target) && !anchorRef.current?.contains(e.target);
    const onClick = (e) => outside(e) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    const onScroll = (e) => outside(e) && onClose();
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={boxRef}
      role="menu"
      className="fixed z-50 flex w-56 flex-col rounded-2xl border-[3px] border-line p-1.5 text-sm shadow-[0_4px_0_var(--chick-line)]"
      style={{ background: tint, left: place?.left ?? 0, top: place?.top ?? 0, visibility: place ? "visible" : "hidden" }}
    >
      {/* A little point on the left edge, aiming at the button it belongs to */}
      {place?.side && (
        <span
          aria-hidden="true"
          className="absolute -left-[9px] h-4 w-4 rotate-45 border-b-[3px] border-l-[3px] border-line"
          style={{ background: tint, top: place.arrowTop - place.top - 8 }}
        />
      )}
      {children}
    </div>,
    document.body
  );
}

// Space between the menu and the ⋯ button (and the window's edges).
const GAP = 8;

// A paler version of a folder's soft color, for the chat menu.
function lighter(color) {
  return `color-mix(in oklch, ${color} 55%, white)`;
}

function MenuItem({ onClick, danger, current, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left font-semibold transition ${
        danger ? "text-red-700 hover:bg-red-50" : current ? "bg-white ring-2 ring-line/40" : "hover:bg-white/80"
      }`}
    >
      {children}
      {current && <Icon name="check" size={14} className="ml-auto" />}
    </button>
  );
}

// The "← back" row at the top of a sub-list (Move to…, Folder color).
function MenuBack({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="mb-1 flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-semibold text-muted hover:bg-white/80">
      ← {children}
    </button>
  );
}

function MenuDivider() {
  return <hr className="mx-2 my-1 border-t-2 border-dashed border-line/20" />;
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
