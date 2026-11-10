// The pop-out timer uses Chrome's "Document Picture-in-Picture": a small window that floats
// above every tab and app (like a YouTube mini-player). Chrome and Edge on computers only.

const OPEN_EVENT = "chick-open-popout";

export function popOutSupported() {
  return typeof window !== "undefined" && "documentPictureInPicture" in window;
}

// Buttons call this; TimerWatcher (always on the page) listens and opens the window.
// It must be called from a click, because browsers only allow pop-ups the user asked for.
export function requestPopOut() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onPopOutRequest(callback) {
  window.addEventListener(OPEN_EVENT, callback);
  return () => window.removeEventListener(OPEN_EVENT, callback);
}

// Opens the floating window and gives it the app's styles and fonts.
export async function openPopOutWindow() {
  const popout = await window.documentPictureInPicture.requestWindow({ width: 280, height: 190 });

  for (const sheet of document.styleSheets) {
    if (sheet.href) {
      // Linked stylesheets: link the same file, so fonts and images inside it still load.
      const link = popout.document.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      popout.document.head.appendChild(link);
    } else {
      // Inline <style> blocks: copy the rules over.
      try {
        const style = popout.document.createElement("style");
        style.textContent = [...sheet.cssRules].map((rule) => rule.cssText).join("\n");
        popout.document.head.appendChild(style);
      } catch {}
    }
  }
  popout.document.documentElement.className = document.documentElement.className; // font variables
  popout.document.title = "Egg Timer";
  return popout;
}
