// Adds the researched subject brief (see lib/research.js) to an AI prompt, so lessons, quizzes,
// exams, and the tutor match the real class or test. Older nests have no brief; then this is empty.
// It also adds notes from the student's own study-guide PDFs (`test.guide`), unless `withGuide` is false.
const GUIDE_CHARS = 8000;

export function subjectBriefText(test, { withGuide = true } = {}) {
  const guide = withGuide ? studyGuideText(test?.guide, GUIDE_CHARS) : "";
  const brief = test?.brief?.trim();
  if (!brief) return guide;
  return `
About this class/test (researched facts; follow them so everything matches the real thing, including its question style and difficulty):
"""
${brief.slice(0, 2500)}
"""
${guide}`;
}

// The student's study-guide notes, for a prompt. Their class's version of things comes first.
export function studyGuideText(guide, maxChars) {
  const text = guide?.trim();
  if (!text) return "";
  return `
Notes from the student's own study guides (match their class: its topics, wording, and examples):
"""
${text.slice(0, maxChars)}
"""
`;
}
