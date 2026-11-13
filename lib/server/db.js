// The accounts database: a small key-value store. On Vercel it's "Upstash for Redis" (added from
// the project's Storage tab, which sets KV_REST_API_URL and KV_REST_API_TOKEN). While developing
// without it, a JSON file in .data/ stands in, so accounts can be tried locally.
// See docs/accounts-setup.md.

import { promises as fs } from "fs";
import path from "path";

const URL_ENV = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ENV = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const DEV_FILE = path.join(process.cwd(), ".data", "dev-db.json");

export class NotConfiguredError extends Error {}

export function dbConfigured() {
  return Boolean(URL_ENV && TOKEN_ENV) || process.env.NODE_ENV !== "production";
}

// Runs Redis commands, e.g. run([["GET", "k"], ["SET", "k", "v"]]) → [result, result].
async function run(commands) {
  if (URL_ENV && TOKEN_ENV) {
    const res = await fetch(`${URL_ENV}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN_ENV}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Database error ${res.status}`);
    const out = await res.json();
    return out.map((r) => {
      if (r.error) throw new Error(r.error);
      return r.result;
    });
  }
  if (process.env.NODE_ENV === "production") throw new NotConfiguredError("Accounts aren't set up yet.");
  return runOnFile(commands);
}

// The local stand-in: just enough of Redis for this app.
let fileLock = Promise.resolve();
function runOnFile(commands) {
  const job = fileLock.then(async () => {
    let data = {};
    try {
      data = JSON.parse(await fs.readFile(DEV_FILE, "utf8"));
    } catch {}
    const now = Date.now();
    const alive = (k) => data[k] && (!data[k].exp || data[k].exp > now) ? data[k].v : null;
    const results = commands.map(([cmd, key, ...args]) => {
      switch (cmd) {
        case "GET":
          return alive(key);
        case "MGET":
          return [key, ...args].map(alive);
        case "SET":
          if (args.includes("NX") && alive(key) !== null) return null;
          data[key] = { v: args[0] };
          return "OK";
        case "DEL":
          [key, ...args].forEach((k) => delete data[k]);
          return 1;
        case "INCR": {
          const v = Number(alive(key) ?? 0) + 1;
          data[key] = { v: String(v), exp: data[key]?.exp };
          return v;
        }
        case "EXPIRE":
          if (data[key]) data[key].exp = now + Number(args[0]) * 1000;
          return 1;
        default:
          throw new Error(`Unsupported command ${cmd}`);
      }
    });
    await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
    await fs.writeFile(DEV_FILE, JSON.stringify(data));
    return results;
  });
  fileLock = job.catch(() => {});
  return job;
}

export const db = {
  get: async (key) => (await run([["GET", key]]))[0],
  mget: async (keys) => (keys.length ? (await run([["MGET", ...keys]]))[0] : []),
  set: async (key, value) => (await run([["SET", key, value]]))[0],
  // Sets only if the key doesn't exist yet. Returns true if it was set.
  setNew: async (key, value) => (await run([["SET", key, value, "NX"]]))[0] === "OK",
  del: async (...keys) => run([["DEL", ...keys]]),
  // Counts something for a while (e.g. wrong passwords for 15 minutes). Returns the new count.
  bump: async (key, seconds) => {
    const [count] = await run([["INCR", key]]);
    if (count === 1) await run([["EXPIRE", key, String(seconds)]]);
    return count;
  },
  run,
};
