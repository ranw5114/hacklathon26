// Which saved data is copied to your account (see lib/account.js and app/api/sync).
// Left out: the old pre-nests keys (moved into "nests" on load), the demo backup, nests still being
// built on this device, and the account/sync bookkeeping itself.
export const SYNC_KEYS = ["profile", "nests", "todos", "flock", "chats", "timer", "sessions", "calendar", "prefs", "flags"];

// Accounts' saved data must fit in the database: about 1 MB per key.
export const MAX_KEY_BYTES = 950_000;
