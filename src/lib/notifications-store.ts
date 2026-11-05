"use client";

// ============================================================
// DENTALOS1 — Notification centre
// Every pop-up notification (success, info, warning, error) is also
// kept here so staff can read it later from the bell in the header.
// Kept per browser in localStorage, newest first, up to 100.
// ============================================================

import { toast } from "sonner";

export type NotificationKind = "success" | "info" | "warning" | "error";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description?: string;
  /** Page to open when the notification is clicked. */
  href?: string;
  createdAt: number;
  read: boolean;
}

export const NOTIFICATIONS_KEY = "dentalos1_notifications_v1";
export const NOTIFICATIONS_EVENT = "dentalos1-notifications-updated";
const MAX = 100;
const EMPTY: AppNotification[] = [];

// Parsed list cached by its raw JSON, so React gets the same array until it changes
let cacheRaw: string | null = null;
let cacheList: AppNotification[] = EMPTY;

export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  if (raw === cacheRaw) return cacheList;
  cacheRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cacheList = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cacheList = EMPTY;
  }
  return cacheList;
}

function save(list: AppNotification[]) {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, MAX)));
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
}

export function addNotification(n: Omit<AppNotification, "id" | "createdAt" | "read">): void {
  if (typeof window === "undefined" || !n.title.trim()) return;
  const list = getNotifications();
  const now = Date.now();
  // The same message twice within a couple of seconds is one notification
  const dup = list.find(
    (x) => x.title === n.title && x.description === n.description && now - x.createdAt < 2_000
  );
  if (dup) return;
  save([{ ...n, id: `ntf-${now}-${Math.random().toString(36).slice(2, 7)}`, createdAt: now, read: false }, ...list]);
}

export function markAllNotificationsRead(): void {
  const list = getNotifications();
  if (list.some((n) => !n.read)) save(list.map((n) => (n.read ? n : { ...n, read: true })));
}

export function removeNotification(id: string): void {
  save(getNotifications().filter((n) => n.id !== id));
}

export function clearNotifications(): void {
  save([]);
}

/** Subscribe to changes in this tab and in other tabs. */
export function subscribeNotifications(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === NOTIFICATIONS_KEY || e.key === null) onChange();
  };
  window.addEventListener(NOTIFICATIONS_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// ─── Record every toast ──────────────────────────────────────

const KINDS: NotificationKind[] = ["success", "info", "warning", "error"];
let installed = false;
let nextHref: string | undefined;

function asText(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return undefined;
}

/**
 * Make every toast.success / info / warning / error call also save the
 * message to the notification centre. Safe to call more than once.
 */
export function installToastRecorder(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const t = toast as unknown as Record<NotificationKind, (message: unknown, data?: { description?: unknown }) => unknown>;
  for (const kind of KINDS) {
    const original = t[kind];
    t[kind] = (message, data) => {
      const title = asText(message);
      if (title) {
        addNotification({ kind, title, description: asText(data?.description), href: nextHref });
      }
      nextHref = undefined;
      return original(message, data);
    };
  }
}

/** Show a toast whose saved notification opens `href` when clicked. */
export function toastWithLink<T>(href: string, show: () => T): T {
  nextHref = href;
  try {
    return show();
  } finally {
    nextHref = undefined;
  }
}
