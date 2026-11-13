"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/account";

// On every page: keeps a logged-in account's progress in step with its other devices.
export default function SyncWatcher() {
  useEffect(() => startSync(), []);
  return null;
}
