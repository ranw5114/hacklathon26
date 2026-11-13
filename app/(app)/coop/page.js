"use client";

import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import PlayfulChick from "@/components/PlayfulChick";
import ChickCamera from "@/components/ChickCamera";
import Graph from "@/components/Graph";
import { Diagram, Practice } from "@/components/RichParts";
import PageTour from "@/components/PageTour";
import { useConfirm } from "@/components/Modal";
import Icon from "@/components/Icon";
import { attachmentIcon, formatBytes } from "@/lib/attachmentTypes";
import { fileStillAvailable, prepareAttachment } from "@/lib/upload";
import { findSection, currentSectionId, goalFraction } from "@/lib/progress";
import { remove, save, useStored } from "@/lib/storage";
import { focusNest, useNests } from "@/lib/nests";
import { todayString } from "@/lib/dates";
import { parseReply } from "@/lib/tutorReply";

// Keep the saved conversation from growing forever.
const MAX_SAVED_MESSAGES = 40;

// A unique id for each message (only called when sending, never while drawing the page).
let lastId = 0;
function newMessageId() {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
}

// What the file picker offers. Anything else picked is checked and explained (see lib/attachmentTypes.js).
const PICKER_ACCEPT =
  "image/*,application/pdf,audio/*,video/*,text/*,.docx,.pptx,.xlsx,.csv,.md,.json,.py,.js,.java,.c,.cpp,.html,.css,.ts,.rtf,.heic";

// The Chicken Coop: chat with the AI tutor, including homework photos and files of any size.
export default function CoopPage() {
  const profile = useStored("profile");
  // Suggestions and the tutor focus on the nest whose test is soonest.
  const focus = focusNest(useNests(), todayString());
  const test = focus?.test ?? null;
  const plan = focus?.plan ?? null;
  const savedChat = useStored("chat");

  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null); // { mimeType, data, preview } waiting to be sent
  // Files being attached: { id, name, size, progress, label, status: "working" | "ready" | "error", result, error }
  const [attachments, setAttachments] = useState([]);
  const [previews, setPreviews] = useState({}); // message id → photo preview (this visit only)
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirm();
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const messages = savedChat ?? [];
  const currentId = plan ? currentSectionId(plan, goalFraction(test)) : null;
  const currentLevel = currentId ? findSection(plan, currentId).title : null;

  // Scroll to the newest message whenever the conversation changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, thinking]);

  function changeAttachment(id, changes) {
    setAttachments((list) => list.map((a) => (a.id === id ? { ...a, ...changes } : a)));
  }

  // Each picked file is prepared right away: photos are shrunk, everything else starts uploading.
  async function pickFiles(event) {
    const files = [...(event.target.files ?? [])];
    event.target.value = ""; // so picking the same file again still works
    setError("");
    for (const file of files) {
      const id = `${Date.now()}-${Math.random()}`;
      setAttachments((list) => [...list, { id, name: file.name, size: file.size, progress: 0, label: "Getting ready…", status: "working" }]);
      prepareAttachment(file, (progress, label) => changeAttachment(id, { progress, label }))
        .then((result) => {
          if (result.type === "photo") {
            // One photo per message, shown as a picture (a new one replaces the old one).
            setPhoto(result);
            setAttachments((list) => list.filter((a) => a.id !== id));
          } else {
            changeAttachment(id, { status: "ready", result, label: "Ready" });
          }
        })
        .catch((err) => changeAttachment(id, { status: "error", error: err.message }));
    }
  }

  const readyFiles = attachments.filter((a) => a.status === "ready").map((a) => a.result);
  const stillUploading = attachments.some((a) => a.status === "working");

  async function send(messageText = text) {
    const trimmed = messageText.trim();
    if ((!trimmed && !photo && !readyFiles.length) || thinking || stillUploading) return;

    const userMessage = {
      id: newMessageId(),
      role: "user",
      text: trimmed || (readyFiles.length ? "Please look at this file." : ""),
      hasPhoto: Boolean(photo),
      // Saved with the chat, so follow-up questions can still use the files (Google keeps them 48 hours).
      ...(readyFiles.length ? { files: readyFiles.map(({ type, ...file }) => file) } : {}),
    };
    const conversation = [...messages, userMessage];
    save("chat", conversation.slice(-MAX_SAVED_MESSAGES)); // shows the message right away
    if (photo) setPreviews({ ...previews, [userMessage.id]: photo.preview });

    // The photo is only sent with the message it was attached to. Files are sent while Google still has them.
    const forAI = conversation.map((m) => {
      const withPhoto = m.id === userMessage.id && photo ? { ...m, image: { mimeType: photo.mimeType, data: photo.data } } : m;
      if (!m.files) return withPhoto;
      const available = m.files.filter((f) => fileStillAvailable(f));
      const expired = m.files.length - available.length;
      return {
        ...withPhoto,
        files: available,
        text: expired ? `${withPhoto.text}\n(${expired} attached file${expired === 1 ? " has" : "s have"} expired)` : withPhoto.text,
      };
    });

    setText("");
    setPhoto(null);
    setAttachments((list) => list.filter((a) => a.status === "working"));
    setError("");
    setThinking(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: forAI, learner: profile, test, currentLevel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const reply = { id: newMessageId(), role: "model", text: data.reply };
      save("chat", [...conversation, reply].slice(-MAX_SAVED_MESSAGES));
    } catch (err) {
      setError(err.message || "Scholar couldn't answer. Please try again.");
    }
    setThinking(false);
  }

  async function clearChat() {
    const ok = await confirm({
      title: "Clear this chat?",
      message: "Your conversation with Scholar will be deleted.",
      confirmLabel: "Clear chat",
      danger: true,
      chick: "scholar",
    });
    if (!ok) return;
    remove("chat");
    setPreviews({});
  }

  // Quick-start ideas, personalized to what they're studying.
  const suggestions = [
    currentLevel && `Explain "${currentLevel}" in a different way`,
    test && `Quiz me on ${test.topic}`,
    "Help me with a homework problem",
  ].filter(Boolean);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      {dialog}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlayfulChick look="scholar" size={56} lines={["Ask me anything!", "Hoo... wait, I'm not an owl.", "My cap? Earned it. Mostly.", "Feed me questions, I'm hungry!"]} bubbleSide="right" label="Poke Scholar" />
          <div>
            <p className="label-small">AI study chat</p>
            <h1 className="text-2xl sm:text-3xl">The Chicken Coop</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="btn-secondary shrink-0 px-4 py-1.5 text-sm whitespace-nowrap"
            >
              Clear chat
            </button>
          )}
          <PageTour page="coop" />
        </div>
      </div>

      {/* Conversation */}
      <div className="mt-6 flex flex-1 flex-col gap-4">
        {messages.length === 0 && (
          <div className="card flex flex-col items-center gap-3 py-8 text-center">
            <span className="bubble">Ask anything. No question is too fowl!</span>
            <p className="max-w-md text-muted">
              Type a question, snap a photo of your homework, or attach a file (PDFs, slides, docs, spreadsheets,
              audio, video), and I&apos;ll walk you through it step by step.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="btn-secondary px-4 py-1.5 text-sm">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <Message key={m.id} message={m} preview={previews[m.id]} />
        ))}

        {thinking && (
          <div className="flex items-end gap-2">
            <Chick variant="scholar" size={40} className="shrink-0 animate-bounce" />
            <div className="rounded-3xl rounded-bl-md border-[3px] border-line bg-white px-4 py-2 text-muted">
              Scholar is thinking…
            </div>
          </div>
        )}
        {/* Scroll target; the margin keeps the newest message clear of the message bar */}
        <div ref={bottomRef} className="scroll-mb-48 sm:scroll-mb-28" />
      </div>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Message box (sticks to the bottom, above the phone nav bar) */}
      <div className="sticky bottom-20 mt-4 sm:bottom-4">
        {attachments.length > 0 && (
          <ul className="mb-2 flex flex-col gap-2">
            {attachments.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl border-[3px] border-line bg-white px-3 py-2 text-sm">
                <Icon name={a.status === "error" ? "close" : attachmentIcon(a.result?.mimeType)} size={22} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.name}</p>
                  {a.status === "error" ? (
                    <p className="text-red-700">{a.error}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{formatBytes(a.size)}</span>
                      <span>· {a.label}</span>
                      {a.status === "working" && (
                        <span className="h-2 flex-1 overflow-hidden rounded-full border border-line bg-chick/40">
                          <span className="block h-full bg-beak transition-all" style={{ width: `${Math.round(a.progress * 100)}%` }} />
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments((list) => list.filter((x) => x.id !== a.id))}
                  className="shrink-0 text-xs font-semibold text-muted underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {photo && (
          <div className="mb-2 inline-flex items-center gap-3 rounded-2xl border-[3px] border-line bg-white p-2 pr-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- local preview, not a hosted image */}
            <img src={photo.preview} alt="Photo to send" className="h-16 rounded-xl border-[3px] border-line" />
            <button type="button" onClick={() => setPhoto(null)} className="text-sm font-semibold text-muted underline">
              Remove
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-end gap-2 rounded-3xl border-[3px] border-line bg-white p-2 shadow-[0_4px_0_var(--chick-line)]"
        >
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 rounded-2xl p-1.5 transition hover:-translate-y-0.5 hover:bg-chick/40"
            aria-label="Add a photo or file"
            title="Add a photo or file (PDF, slides, docs, spreadsheets, audio, video)"
          >
            <ChickCamera size={34} />
          </button>
          <input ref={fileRef} type="file" multiple accept={PICKER_ACCEPT} onChange={pickFiles} className="hidden" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter makes a new line.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={photo || attachments.length ? "Ask about it…" : "Ask anything…"}
            className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 outline-none"
          />
          <button
            type="submit"
            disabled={thinking || stillUploading || (!text.trim() && !photo && !readyFiles.length)}
            className="btn-primary shrink-0 px-4 py-2"
            title={stillUploading ? "Wait for the upload to finish" : undefined}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}

function Message({ message, preview }) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview, not a hosted image
          <img src={preview} alt="Your photo" className="max-h-56 rounded-2xl border-[3px] border-line" />
        ) : (
          message.hasPhoto && (
            <span className="flex items-center gap-1 text-sm text-muted">
              <ChickCamera size={18} /> Photo
            </span>
          )
        )}
        {message.files?.map((file) => (
          <span
            key={file.uri}
            className={`flex max-w-[85%] items-center gap-2 rounded-2xl border-2 border-line bg-white px-3 py-1.5 text-sm ${fileStillAvailable(file) ? "" : "opacity-60"}`}
            title={fileStillAvailable(file) ? undefined : "This file expired after 48 hours. Attach it again to ask more about it."}
          >
            <Icon name={attachmentIcon(file.mimeType)} size={20} />
            <span className="truncate font-semibold">{file.name}</span>
            <span className="shrink-0 text-xs text-muted">{formatBytes(file.size)}</span>
          </span>
        ))}
        {message.text && (
          <div className="max-w-[85%] rounded-3xl rounded-br-md border-[3px] border-line bg-chick px-4 py-2 whitespace-pre-line">
            {message.text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <Chick variant="scholar" size={40} className="shrink-0" />
      <div className="flex max-w-[85%] flex-col gap-3 rounded-3xl rounded-bl-md border-[3px] border-line bg-white px-4 py-3 leading-relaxed">
        {parseReply(message.text).map((piece, i) => {
          if (piece.type === "graph") return <Graph key={i} spec={piece.spec} />;
          if (piece.type === "diagram") return <Diagram key={i} src={piece.src} />;
          if (piece.type === "practice") {
            return <Practice key={i} number={piece.number} problem={piece.problem} solution={piece.solution} />;
          }
          return <ReplyText key={i} text={piece.text} />;
        })}
      </div>
    </div>
  );
}

// Plain text, where a line starting with "# " is a section heading (used for lecture learners).
function ReplyText({ text }) {
  const blocks = [];
  for (const line of text.split("\n")) {
    const heading = line.match(/^\s*#+\s+(.*)/);
    if (heading) blocks.push({ heading: heading[1] });
    else if (blocks.length && !blocks.at(-1).heading) blocks.at(-1).text += "\n" + line;
    else blocks.push({ text: line });
  }
  return blocks.map((block, i) =>
    block.heading ? (
      <h3 key={i} className="text-lg leading-snug [&:not(:first-child)]:mt-2">
        {block.heading}
      </h3>
    ) : (
      block.text.trim() && (
        <p key={i} className="whitespace-pre-line">
          {block.text.trim()}
        </p>
      )
    )
  );
}
