import { NotConfiguredError } from "@/lib/server/db";

// The response for an unexpected account/database problem.
export function serverError(err) {
  if (err instanceof NotConfiguredError) return Response.json({ error: err.message, notConfigured: true }, { status: 503 });
  console.error("Account error:", err);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
