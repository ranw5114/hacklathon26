"use client";

import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";
import ChickCamera from "@/components/ChickCamera";
import Graph from "@/components/Graph";
import { Diagram, Practice } from "@/components/RichParts";
import PageTour from "@/components/PageTour";
import { useConfirm } from "@/components/Modal";
import { resizeImage } from "@/lib/images";
import { findSection, currentSectionId } from "@/lib/progress";
import { remove, save, useStored } from "@/lib/storage";
import { parseReply } from "@/lib/tutorReply";

// Keep the saved conversation from growing forever.
const MAX_SAVED_MESSAGES = 40;

// A unique id for each message (only called when sending, never while drawing the page).
let lastId = 0;
function newMessageId() {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
}

// The Chicken Coop: chat with the AI tutor, including homework photos.
export default function CoopPage() {
  const profile = useStored("profile");
  const test = useStored("test");
  const plan = useStored("plan");
  const savedChat = useStored("chat");

  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null); // { mimeType, data, preview } waiting to be sent
  const [previews, setPreviews] = useState({}); // message id → photo preview (this visit only)
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const { confirm, dialog } = useConfirm();
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const messages = savedChat ?? [];
  const currentId = plan ? currentSectionId(plan) : null;
  const currentLevel = currentId ? findSection(plan, currentId).title : null;

  // Scroll to the newest message whenever the conversation changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, thinking]);

  async function pickPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same file again still works
    if (!file) return;
    try {
      setPhoto(await resizeImage(file));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function send(messageText = text) {
    const trimmed = messageText.trim();
    if ((!trimmed && !photo) || thinking) return;

    const userMessage = { id: newMessageId(), role: "user", text: trimmed, hasPhoto: Boolean(photo) };
    const conversation = [...messages, userMessage];
    save("chat", conversation.slice(-MAX_SAVED_MESSAGES)); // shows the message right away
    if (photo) setPreviews({ ...previews, [userMessage.id]: photo.preview });

    // The photo is only sent with the message it was attached to.
    const forAI = conversation.map((m) =>
      m.id === userMessage.id && photo ? { ...m, image: { mimeType: photo.mimeType, data: photo.data } } : m
    );

    setText("");
    setPhoto(null);
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
          <Chick variant="scholar" size={56} />
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
              Type a question or snap a photo of your homework, and I&apos;ll walk you through it step by step.
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
            aria-label="Snap a photo of your homework"
            title="Snap a photo of your homework"
          >
            <ChickCamera size={34} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />
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
            placeholder={photo ? "Add a note…" : "Ask anything…"}
            className="max-h-32 min-w-0 flex-1 resize-none bg-transparent px-1 py-2 outline-none"
          />
          <button type="submit" disabled={thinking || (!text.trim() && !photo)} className="btn-primary shrink-0 px-4 py-2">
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
