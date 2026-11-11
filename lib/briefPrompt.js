// Adds the researched subject brief (see lib/research.js) to an AI prompt, so lessons, quizzes,
// exams, and the tutor match the real class or test. Older nests have no brief; then this is empty.
export function subjectBriefText(test) {
  const brief = test?.brief?.trim();
  if (!brief) return "";
  return `
About this class/test (researched facts; follow them so everything matches the real thing, including its question style and difficulty):
"""
${brief.slice(0, 2500)}
"""
`;
}
