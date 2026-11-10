// Checks a current grade and goal grade (as typed, so they may be strings).
// Returns { error: "" } if they're fine, or { error, canSwap } if not.
// canSwap means the goal is lower than the current grade, which is usually a mix-up.
export function checkGrades(currentRaw, goalRaw) {
  const current = Number(currentRaw);
  const goal = Number(goalRaw);
  if (currentRaw === "" || Number.isNaN(current) || current < 0 || current > 100) {
    return { error: "Enter your current grade (0-100)." };
  }
  if (goalRaw === "" || Number.isNaN(goal) || goal < 0 || goal > 100) {
    return { error: "Enter your goal grade (0-100)." };
  }
  if (goal < current) {
    return {
      error: `Your goal (${goal}%) is lower than your current grade (${current}%). Did you mix them up?`,
      canSwap: true,
    };
  }
  return { error: "" };
}
