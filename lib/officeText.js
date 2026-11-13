// Pulls the text out of Word (.docx), PowerPoint (.pptx), and Excel (.xlsx) files in the browser,
// so the AI can read them (it can't open Office files directly). These files are zip folders of
// XML, so we unzip them and read the text parts. Formatting and pictures are left out.

import JSZip from "jszip";

function parseXml(text) {
  return new DOMParser().parseFromString(text, "application/xml");
}

// All elements with a given local name (ignores the w:, a:, x: prefixes).
function byName(node, name) {
  return [...node.getElementsByTagName("*")].filter((el) => el.localName === name);
}

// Word: one line per paragraph, with tabs and line breaks kept.
async function wordText(zip) {
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("That Word file looks empty or damaged.");
  return byName(parseXml(xml), "p")
    .map((p) =>
      [...p.getElementsByTagName("*")]
        .map((el) => (el.localName === "t" ? el.textContent : el.localName === "tab" ? "\t" : el.localName === "br" ? "\n" : ""))
        .join("")
    )
    .join("\n");
}

// PowerPoint: each slide's text, in order, plus the speaker notes.
async function slidesText(zip) {
  const number = (path) => Number(path.match(/(\d+)\.xml$/)?.[1] ?? 0);
  const slides = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a, b) => number(a) - number(b));
  if (!slides.length) throw new Error("That PowerPoint file has no slides.");
  const parts = [];
  for (const path of slides) {
    const n = number(path);
    const paragraphs = byName(parseXml(await zip.file(path).async("string")), "p")
      .map((p) => byName(p, "t").map((t) => t.textContent).join(""))
      .filter((line) => line.trim());
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${n}.xml`);
    const notes = notesFile
      ? byName(parseXml(await notesFile.async("string")), "t")
          .map((t) => t.textContent)
          .join(" ")
          .trim()
      : "";
    parts.push(`Slide ${n}:\n${paragraphs.join("\n")}${notes ? `\nSpeaker notes: ${notes}` : ""}`);
  }
  return parts.join("\n\n");
}

// Excel: each sheet as comma-separated rows.
async function sheetsText(zip) {
  const shared = [];
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  if (sharedXml) {
    for (const si of byName(parseXml(sharedXml), "si")) shared.push(byName(si, "t").map((t) => t.textContent).join(""));
  }
  const workbook = parseXml((await zip.file("xl/workbook.xml")?.async("string")) ?? "<workbook/>");
  const names = byName(workbook, "sheet").map((s) => s.getAttribute("name"));
  const number = (path) => Number(path.match(/sheet(\d+)\.xml$/)?.[1] ?? 0);
  const sheets = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort((a, b) => number(a) - number(b));
  if (!sheets.length) throw new Error("That Excel file has no sheets.");

  const csvCell = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const parts = [];
  for (const [i, path] of sheets.entries()) {
    const rows = byName(parseXml(await zip.file(path).async("string")), "row").map((row) =>
      byName(row, "c")
        .map((c) => {
          const type = c.getAttribute("t");
          if (type === "s") return shared[Number(byName(c, "v")[0]?.textContent)] ?? "";
          if (type === "inlineStr") return byName(c, "t").map((t) => t.textContent).join("");
          return byName(c, "v")[0]?.textContent ?? "";
        })
        .map(csvCell)
        .join(",")
    );
    parts.push(`Sheet: ${names[i] ?? `Sheet ${i + 1}`}\n${rows.join("\n")}`);
  }
  return parts.join("\n\n");
}

// Returns the file's text. `ext` is "docx", "pptx", or "xlsx".
export async function officeText(file, ext) {
  let zip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("Couldn't open that file. It may be damaged, or password-protected.");
  }
  const text = ext === "docx" ? await wordText(zip) : ext === "pptx" ? await slidesText(zip) : await sheetsText(zip);
  if (!text.trim()) throw new Error("There's no text in that file for the AI to read.");
  return text;
}
