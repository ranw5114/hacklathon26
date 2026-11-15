"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Text from the AI tutor, drawn nicely: Markdown (bold, lists, headings) and math written in
// LaTeX ($\frac{-b}{2a}$ becomes a real fraction, $x^2$ a real exponent), like the Gemini app does.
// Markdown here never runs HTML, so a strange reply can't change the page.
// `inline` is for short bits inside a line (a heading, a quiz choice, a key point): no paragraphs
// or centered equation boxes, just the text with its math.
export default function RichText({ text, className = "", inline = false }) {
  const markdown = (
    <Markdown
      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: true }]]}
      rehypePlugins={[[rehypeKatex, KATEX_OPTIONS]]}
      components={inline ? INLINE_PARTS : undefined}
    >
      {inline ? normalizeMath(text).replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (_, math) => `$${math}$`) : normalizeMath(text)}
    </Markdown>
  );
  if (inline) return <span className={`rich-text ${className}`}>{markdown}</span>;
  return <div className={`rich-text ${className}`}>{markdown}</div>;
}

// In inline mode a paragraph is just its words (so it can sit inside a heading or button).
const INLINE_PARTS = { p: ({ children }) => children };

// Fractions inside a sentence are drawn full size (not shrunk to fit the line), so they're easy to read.
// A typo in the AI's math shows that bit in red instead of breaking the whole reply.
const KATEX_OPTIONS = { macros: { "\\frac": "\\dfrac" }, throwOnError: false, errorColor: "#b91c1c" };

// The AI sometimes writes math as \( … \) or \[ … \] instead of $ … $ and $$ … $$. Both work here.
// A big equation ($$ … $$) at the end of a line becomes a centered block underneath (inside a numbered
// step too, by indenting it to match). One in the middle of a sentence stays in the sentence, so the
// words after it don't end up stranded on a new line.
// In JSON, a LaTeX command can turn into a hidden character (\frac → form feed + "rac"), so those are
// put back first.
function normalizeMath(text) {
  return String(text ?? "")
    .replace(/\f/g, "\\f")
    .replace(/\x08/g, "\\b")
    .replace(/\t(?=[a-z]{2})/g, "\\t")
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, math) => `$$${math}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, math) => `$${math.trim()}$`)
    .replace(/^([ \t]*)((?:\d+\.|[-*])[ \t]+)?(.*?)\$\$([^$]+?)\$\$[ \t]*$/gm, (_, space, marker = "", before, math) => {
      const indent = " ".repeat(space.length + marker.length);
      const block = `${indent}$$\n${indent}${math.trim().replace(/\n\s*/g, " ")}\n${indent}$$`;
      return before.trim() || marker ? `${space}${marker}${before.trim()}\n\n${block}\n` : `\n${block}\n`;
    })
    .replace(/\$\$([^\n$]+?)\$\$/g, (_, math) => `$${math.trim()}$`);
}
