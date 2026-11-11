// The tutor's replies can contain more than plain text, depending on the learning style:
//   <graph>{…}</graph>                            a graph the app draws to scale (visual learners)
//   <svg>…</svg>                                  a diagram (visual learners)
//   <problem>…</problem><solution>…</solution>    a practice problem with a hidden answer (examples learners)
//   "# Title" at the start of a line              a section heading (lecture learners)
// parseReply splits a reply into pieces the chat page can draw one by one.

const PIECE = /<graph>([\s\S]*?)<\/graph>|<svg[\s\S]*?<\/svg>|<problem>([\s\S]*?)<\/problem>\s*<solution>([\s\S]*?)<\/solution>/gi;

// Returns a list like [{ type: "text", text }, { type: "graph", spec }, { type: "diagram", src },
// { type: "practice", number, problem, solution }].
export function parseReply(reply) {
  const pieces = [];
  let last = 0;
  let practiceCount = 0;
  for (const match of reply.matchAll(PIECE)) {
    addText(pieces, reply.slice(last, match.index));
    if (match[0].toLowerCase().startsWith("<graph")) {
      const spec = readGraph(match[1]);
      if (spec) pieces.push({ type: "graph", spec });
    } else if (match[0].toLowerCase().startsWith("<svg")) {
      pieces.push({ type: "diagram", src: svgToImageSrc(match[0]) });
    } else {
      practiceCount += 1;
      pieces.push({ type: "practice", number: practiceCount, problem: match[2].trim(), solution: match[3].trim() });
    }
    last = match.index + match[0].length;
  }
  addText(pieces, reply.slice(last));
  return pieces;
}

// The graph description is JSON. Small slips (stray characters, a missing closing bracket)
// are repaired; if it still can't be read, the graph is skipped.
function readGraph(json) {
  const start = json.indexOf("{");
  if (start === -1) return null;
  const body = json.slice(start).trim();
  const attempts = [body.slice(0, body.lastIndexOf("}") + 1), closeBrackets(body)];
  for (const attempt of attempts) {
    try {
      const spec = JSON.parse(attempt);
      if (spec && typeof spec === "object") return spec;
    } catch {
      // try the next repair
    }
  }
  return null;
}

// Adds any } or ] the AI forgot at the end (brackets inside "strings" don't count).
function closeBrackets(text) {
  const open = [];
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") open.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") open.pop();
  }
  const trimmed = text.replace(/[^\]}"\d\w]+$/, "");
  return trimmed + open.reverse().join("");
}

// Leftover wrapper tags (like <practice>) and blank space between pieces are dropped.
function addText(pieces, text) {
  const cleaned = text.replace(/<\/?(practice|diagram)[^>]*>/gi, "").trim();
  if (cleaned) pieces.push({ type: "text", text: cleaned });
}

// Diagrams are shown as images, not inserted into the page. An SVG inside an <img> can't run
// scripts or load anything from the internet, so a strange AI drawing can never harm the page.
export function svgToImageSrc(svg) {
  // The AI sometimes writes "a < 0" or "Q&A" as plain text, which breaks the SVG. Escape those.
  let fixed = svg.replace(/&(?!#?\w+;)/g, "&amp;").replace(/<(?![a-zA-Z/!?])/g, "&lt;");
  // Images need this attribute, or the browser refuses to draw the SVG.
  if (!/xmlns=/.test(fixed)) fixed = fixed.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  // Make the drawing scale to the chat bubble's width instead of a fixed size.
  const opening = fixed.match(/<svg[^>]*>/i)[0];
  const width = opening.match(/\swidth="(\d+(?:\.\d+)?)/)?.[1];
  const height = opening.match(/\sheight="(\d+(?:\.\d+)?)/)?.[1];
  let newOpening = opening;
  if (!/viewBox=/i.test(opening) && width && height) {
    newOpening = newOpening.replace(/<svg/i, `<svg viewBox="0 0 ${width} ${height}"`);
  }
  if (/viewBox=/i.test(newOpening)) newOpening = newOpening.replace(/\s(width|height)="[^"]*"/g, "");
  fixed = fixed.replace(opening, newOpening);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fixed)}`;
}

// Diagrams make replies long. When old messages are sent back to the AI as chat history,
// a short placeholder is enough for it to remember what it drew.
export function shortenForHistory(reply) {
  return reply.replace(/<svg[\s\S]*?<\/svg>/gi, "[diagram]");
}
