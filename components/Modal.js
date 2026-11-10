"use client";

import { useEffect, useRef, useState } from "react";
import Chick from "@/components/Chick";

// A pop-up card in the middle of the screen, in the chicken style.
// Closes with the ✕ button, the Escape key, or a click on the dimmed background.
export default function Modal({ open, onClose, title, chick = "sunny", children, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card relative max-h-[90vh] w-full overflow-y-auto ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-4 text-xl text-muted hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="flex items-end gap-3 pr-6">
          <Chick variant={chick} size={56} className="shrink-0" />
          <span className="bubble text-sm">{title}</span>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

// A themed replacement for the browser's confirm() box.
// Usage:
//   const { confirm, dialog } = useConfirm();
//   if (!(await confirm({ title: "Delete?", message: "...", confirmLabel: "Delete", danger: true }))) return;
//   ...and put {dialog} somewhere in the page.
export function useConfirm() {
  const [request, setRequest] = useState(null); // { options, resolve } while open
  const resolveRef = useRef(null);

  function confirm(options) {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setRequest(options);
    });
  }

  function answer(value) {
    resolveRef.current?.(value);
    resolveRef.current = null;
    setRequest(null);
  }

  const dialog = (
    <Modal open={Boolean(request)} onClose={() => answer(false)} title={request?.title} chick={request?.chick ?? "peach"}>
      {request?.message && <p className="text-muted">{request.message}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => answer(false)} className="btn-secondary">
          {request?.cancelLabel ?? "Cancel"}
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          className={request?.danger ? "btn-primary bg-red-100 text-red-800" : "btn-primary"}
        >
          {request?.confirmLabel ?? "OK"}
        </button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
