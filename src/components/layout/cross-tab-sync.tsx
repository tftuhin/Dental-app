"use client";

import { useEffect } from "react";
import { getStorageMode, storeEventForKey } from "@/lib/clinic-storage";

// Local demo only: clinic data lives in localStorage. When another tab changes
// it, the browser fires a "storage" event here; re-broadcast it as the store's
// own update event so every open page reloads its copy. Without this, a page
// holding an older copy of the queue could save over changes made in another
// tab. (With a database, clinic-storage keeps tabs and computers in step.)
export function CrossTabSync() {
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage || getStorageMode() !== "local") return;
      const name = e.key ? storeEventForKey(e.key) : undefined;
      if (name) window.dispatchEvent(new Event(name));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
