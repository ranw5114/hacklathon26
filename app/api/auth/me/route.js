// Who's logged in: { user: { username, email } | null, available }. `available` is false when the
// accounts database hasn't been set up (then the app works without accounts, like before).
import { dbConfigured } from "@/lib/server/db";
import { currentUser } from "@/lib/server/auth";

export async function GET() {
  if (!dbConfigured()) return Response.json({ user: null, available: false });
  try {
    return Response.json({ user: await currentUser(), available: true });
  } catch (err) {
    console.error("Account check failed:", err);
    return Response.json({ user: null, available: true, error: "Couldn't check your account." });
  }
}
