"use client";

// ============================================================
// DENTALOS1 — Clinic data storage
//
// Every store reads and writes through `clinicStorage`, which has the same
// synchronous getItem/setItem shape as localStorage. Where it keeps the data
// depends on the mode, decided once at sign-in:
//
//  • "server" (a database is configured): the clinic's records live in
//    Postgres (table clinic_records). This module holds an in-memory copy,
//    loaded before any page renders. Writes update the copy at once and are
//    sent to the server in the background, one row per record, so two people
//    editing different patients never overwrite each other. Changes made on
//    other computers are pulled every few seconds and when the window regains
//    focus. Changes not yet sent survive a reload or a lost connection.
//  • "local" (no database, e.g. the local demo): plain localStorage, as before.
//
// Lists (patients, visits, timeline, price list...) are split into one row
// per item, keyed by the item's `id`; settings and per-patient charts are one
// row each. Keys not listed below always stay in localStorage.
// ============================================================

export type StorageMode = "loading" | "local" | "server";

type Spec = { kind: "list"; c: string } | { kind: "doc"; c: string; id: string };

const LIST_KEYS: Record<string, string> = {
  dentai_appointments_patient_queue_v2: "appointments",
  "dentalos1-patients-registry-v1": "patients",
  dentai_patient_timelines_v2: "timeline",
  dentai_investigations_catalog_v2: "investigations",
  dentalos1_procedure_catalog_v1: "procedure_catalog",
  dentalos1_medicine_overrides_v1: "medicine_overrides",
  dentalos1_consent_templates_v1: "consent_templates",
  dentalos1_message_templates_v1: "message_templates",
  dentalos1_recalls_v1: "recalls",
  dentalos1_message_log_v1: "message_log",
};

const DOC_KEYS: Record<string, string> = {
  dentai_clinic_setup_v1: "clinic_setup",
  "dentalos1-services-settings": "services",
  dentalos1_clinical_modules_v1: "clinical_modules",
  dentalos1_messaging_settings_v1: "messaging",
};

/** Per-patient documents: key prefix → collection. The rest of the key is the record id. */
const PREFIX_KEYS: Array<[string, string]> = [
  ["dentai_odontogram_", "odontogram"],
  ["dentai_perio_", "perio"],
  ["dentalos1_ortho_", "ortho"],
  ["dentalos1_prostho_", "prostho"],
];

/** Event each store listens to, fired when another computer (or tab) changes its data. */
const COLLECTION_EVENTS: Record<string, string> = {
  appointments: "dentai-appointments-updated",
  patients: "dentalos1-patients-updated",
  timeline: "dentai-timeline-updated",
  investigations: "dentai-investigations-updated",
  procedure_catalog: "dentalos1-catalog-updated",
  medicine_overrides: "dentai-medications-updated",
  consent_templates: "dentalos1-consent-templates-updated",
  odontogram: "dentai-odontogram-updated",
  perio: "dentai-perio-updated",
  ortho: "dentalos1-ortho-updated",
  prostho: "dentalos1-prostho-updated",
  message_templates: "dentalos1-message-templates-updated",
  recalls: "dentalos1-recalls-updated",
  message_log: "dentalos1-message-log-updated",
};

const SETTINGS_EVENTS: Record<string, string> = {
  clinic_setup: "dentai-clinic-setup-updated",
  services: "dentalos1-services-updated",
  clinical_modules: "dentalos1-modules-updated",
  messaging: "dentalos1-messaging-settings-updated",
};

function specFor(key: string): Spec | null {
  if (LIST_KEYS[key]) return { kind: "list", c: LIST_KEYS[key] };
  if (DOC_KEYS[key]) return { kind: "doc", c: "settings", id: DOC_KEYS[key] };
  for (const [prefix, c] of PREFIX_KEYS) {
    if (key.startsWith(prefix) && key.length > prefix.length) return { kind: "doc", c, id: key.slice(prefix.length) };
  }
  return null;
}

/** localStorage key → the event its store listens to (used for cross-tab sync in local mode). */
export function storeEventForKey(key: string): string | undefined {
  const spec = specFor(key);
  if (!spec) return undefined;
  return spec.kind === "doc" && spec.c === "settings" ? SETTINGS_EVENTS[spec.id] : COLLECTION_EVENTS[spec.c];
}

/** Every localStorage key the stores used before data moved to the server. */
export function isClinicDataKey(key: string): boolean {
  return specFor(key) !== null;
}

// ─── In-memory copy ─────────────────────────────────────────

interface Entry {
  /** The record as JSON text, or null for a deleted record. */
  json: string | null;
  pos: number;
  /** Server version of this copy (0 = not saved yet). */
  v: number;
}

interface PendingOp {
  c: string;
  id: string;
  json?: string;
  pos?: number;
  deleted?: boolean;
}

let mode: StorageMode = "loading";
let clinicKey = "";
const records = new Map<string, Map<string, Entry>>();
const assembled = new Map<string, string>();
const pending = new Map<string, PendingOp>();
let cursor = 0;

const opKey = (c: string, id: string) => `${c}\u0000${id}`;

function collectionMap(c: string): Map<string, Entry> {
  let m = records.get(c);
  if (!m) {
    m = new Map();
    records.set(c, m);
  }
  return m;
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function readList(c: string): string | null {
  const cached = assembled.get(c);
  if (cached !== undefined) return cached;
  const m = records.get(c);
  if (!m || m.size === 0) return null;
  const live = [...m.values()].filter((e) => e.json !== null).sort((a, b) => a.pos - b.pos);
  const text = `[${live.map((e) => e.json).join(",")}]`;
  assembled.set(c, text);
  return text;
}

function queue(op: PendingOp) {
  pending.set(opKey(op.c, op.id), op);
}

function writeList(c: string, value: string) {
  let arr: unknown;
  try {
    arr = JSON.parse(value);
  } catch {
    console.warn(`[clinic-storage] Ignored a save to ${c}: not valid JSON.`);
    return;
  }
  if (!Array.isArray(arr)) {
    console.warn(`[clinic-storage] Ignored a save to ${c}: expected a list.`);
    return;
  }
  const m = collectionMap(c);

  // One row per item, keyed by its id
  const seen = new Set<string>();
  const items: Array<{ id: string; json: string }> = [];
  for (const item of arr) {
    const raw = item && typeof item === "object" ? (item as { id?: unknown }).id : undefined;
    let id = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
    if (!id) {
      id = `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      if (item && typeof item === "object") (item as { id?: string }).id = id;
    }
    if (seen.has(id)) {
      // Two items share an id: keep both rather than lose one
      let n = 2;
      while (seen.has(`${id}~${n}`)) n++;
      id = `${id}~${n}`;
    }
    seen.add(id);
    items.push({ id, json: JSON.stringify(item) });
  }

  const positions = placeItems(items.map((it) => m.get(it.id)));

  items.forEach((it, i) => {
    const e = m.get(it.id);
    const pos = positions[i];
    if (e && e.json === it.json && e.pos === pos) return;
    m.set(it.id, { json: it.json, pos, v: e?.v ?? 0 });
    queue({ c, id: it.id, json: it.json, pos });
  });
  for (const [id, e] of m) {
    if (e.json !== null && !seen.has(id)) {
      m.set(id, { json: null, pos: e.pos, v: e.v });
      queue({ c, id, deleted: true });
    }
  }
  assembled.delete(c);
}

/**
 * Sort positions for a list being saved. Items that already have a position
 * keep it when the order hasn't changed, so adding one patient writes one row,
 * not the whole list. If the order changed, everything is renumbered.
 */
function placeItems(existing: Array<Entry | undefined>): number[] {
  const known = existing.map((e) => (e && e.json !== null ? e.pos : undefined));
  let inOrder = true;
  let last = -Infinity;
  for (const p of known) {
    if (p === undefined) continue;
    if (p <= last) {
      inOrder = false;
      break;
    }
    last = p;
  }
  if (inOrder) {
    const next: Array<number | undefined> = new Array(known.length);
    let upcoming: number | undefined;
    for (let i = known.length - 1; i >= 0; i--) {
      next[i] = upcoming;
      if (known[i] !== undefined) upcoming = known[i];
    }
    const out: number[] = [];
    let ok = true;
    for (let i = 0; i < known.length; i++) {
      const k = known[i];
      if (k !== undefined) {
        out.push(k);
        continue;
      }
      const prev = i > 0 ? out[i - 1] : undefined;
      const after = next[i];
      const p =
        prev === undefined ? (after === undefined ? 0 : after - 1) : after === undefined ? prev + 1 : (prev + after) / 2;
      if ((prev !== undefined && p <= prev) || (after !== undefined && p >= after)) {
        ok = false; // ran out of room between two neighbours
        break;
      }
      out.push(p);
    }
    if (ok) return out;
  }
  return known.map((_, i) => i);
}

function writeDoc(c: string, id: string, value: string) {
  let json = value;
  try {
    JSON.parse(value);
  } catch {
    json = JSON.stringify(value);
  }
  const m = collectionMap(c);
  const e = m.get(id);
  if (e && e.json === json) return;
  m.set(id, { json, pos: 0, v: e?.v ?? 0 });
  queue({ c, id, json, pos: 0 });
}

function readDoc(c: string, id: string): string | null {
  const e = records.get(c)?.get(id);
  if (!e || e.json === null) return null;
  return e.json;
}

function removeKey(spec: Spec) {
  const m = collectionMap(spec.c);
  const ids = spec.kind === "doc" ? [spec.id] : [...m.keys()];
  for (const id of ids) {
    const e = m.get(id);
    if (!e || e.json === null) continue;
    m.set(id, { json: null, pos: e.pos, v: e.v });
    queue({ c: spec.c, id, deleted: true });
  }
  assembled.delete(spec.c);
}

/** Same shape as localStorage; see the top of this file. */
export const clinicStorage = {
  getItem(key: string): string | null {
    const spec = mode === "server" ? specFor(key) : null;
    if (!spec) {
      if (mode === "loading" && specFor(key)) return null;
      return hasLocalStorage() ? localStorage.getItem(key) : null;
    }
    return spec.kind === "list" ? readList(spec.c) : readDoc(spec.c, spec.id);
  },

  setItem(key: string, value: string): void {
    const spec = mode === "server" ? specFor(key) : null;
    if (!spec) {
      // Still loading: stores only write defaults at this point, and will again once loaded
      if (mode === "loading" && specFor(key)) return;
      if (hasLocalStorage()) localStorage.setItem(key, value);
      return;
    }
    if (spec.kind === "list") writeList(spec.c, value);
    else writeDoc(spec.c, spec.id, value);
    afterLocalChange();
  },

  removeItem(key: string): void {
    const spec = mode === "server" ? specFor(key) : null;
    if (!spec) {
      if (hasLocalStorage()) localStorage.removeItem(key);
      return;
    }
    removeKey(spec);
    afterLocalChange();
  },
};

/** True when the app may fill empty lists with sample patients and visits (local demo only). */
export function allowsDemoData(): boolean {
  return mode !== "server";
}

export function getStorageMode(): StorageMode {
  return mode;
}

// ─── Sync status (for the header indicator) ─────────────────

export interface SyncStatus {
  mode: StorageMode;
  state: "idle" | "saving" | "offline" | "error";
  pending: number;
  message?: string;
}

let status: SyncStatus = { mode: "loading", state: "idle", pending: 0 };
const statusListeners = new Set<() => void>();

function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, mode, pending: pending.size, ...patch };
  statusListeners.forEach((l) => l());
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getSyncStatus(): SyncStatus {
  return status;
}

// ─── Saving to the server ───────────────────────────────────

const PENDING_PREFIX = "dentalos1_pending_changes_v1:";
const MAX_BATCH_OPS = 200;
const MAX_BATCH_BYTES = 2_500_000;

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<boolean> | null = null;
let retryDelay = 0;
let channel: BroadcastChannel | null = null;
const afterSyncedCallbacks: Array<() => void> = [];

function persistPending() {
  if (!clinicKey || !hasLocalStorage()) return;
  try {
    if (pending.size === 0) localStorage.removeItem(PENDING_PREFIX + clinicKey);
    else localStorage.setItem(PENDING_PREFIX + clinicKey, JSON.stringify([...pending.values()]));
  } catch (err) {
    console.warn("[clinic-storage] Could not keep unsent changes on this computer:", err);
  }
}

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistPending();
  }, 250);
}

function afterLocalChange() {
  schedulePersist();
  setStatus({ state: status.state === "offline" ? "offline" : "saving" });
  scheduleFlush(400);
}

function scheduleFlush(delay: number) {
  if (mode !== "server") return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushClinicStorage();
  }, delay);
}

function encodeOps(ops: PendingOp[]): string {
  const parts = ops.map((o) =>
    o.deleted
      ? `{"c":${JSON.stringify(o.c)},"id":${JSON.stringify(o.id)},"deleted":true}`
      : `{"c":${JSON.stringify(o.c)},"id":${JSON.stringify(o.id)},"pos":${o.pos ?? 0},"data":${o.json ?? "null"}}`
  );
  return `{"ops":[${parts.join(",")}]}`;
}

function nextBatch(): PendingOp[] {
  const batch: PendingOp[] = [];
  let bytes = 0;
  for (const op of pending.values()) {
    const size = (op.json?.length ?? 0) + 100;
    if (batch.length > 0 && (batch.length >= MAX_BATCH_OPS || bytes + size > MAX_BATCH_BYTES)) break;
    batch.push(op);
    bytes += size;
  }
  return batch;
}

/** Send every unsaved change now. Resolves true when nothing is left to send. */
export function flushClinicStorage(): Promise<boolean> {
  if (mode !== "server") return Promise.resolve(true);
  if (flushing) return flushing.then(() => (pending.size === 0 ? true : flushClinicStorage()));
  if (pending.size === 0) return Promise.resolve(true);

  flushing = (async () => {
    setStatus({ state: "saving" });
    try {
      while (pending.size > 0) {
        const batch = nextBatch();
        const res = await fetch("/api/clinic-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: encodeOps(batch),
        });
        if (res.status === 401) {
          setStatus({ state: "error", message: "Signed out. Sign in again to save your changes." });
          return false;
        }
        if (res.status === 400 || res.status === 413) {
          // The server will never accept these: drop them so the rest can be saved
          const body = await res.json().catch(() => ({}));
          for (const op of batch) {
            if (pending.get(opKey(op.c, op.id)) === op) pending.delete(opKey(op.c, op.id));
          }
          window.dispatchEvent(
            new CustomEvent("dentalos1-sync-rejected", { detail: body?.error || "Some changes could not be saved." })
          );
          continue;
        }
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
        const body = (await res.json()) as { saved: Array<{ c: string; id: string; v: number }> };
        for (const op of batch) {
          // Only clear it if it wasn't changed again while being sent
          if (pending.get(opKey(op.c, op.id)) === op) pending.delete(opKey(op.c, op.id));
        }
        for (const s of body.saved || []) {
          const e = records.get(s.c)?.get(s.id);
          if (e && s.v > e.v) e.v = s.v;
        }
      }
      retryDelay = 0;
      persistPending();
      setStatus({ state: "idle", message: undefined });
      channel?.postMessage("changed");
      while (afterSyncedCallbacks.length > 0) afterSyncedCallbacks.shift()?.();
      return true;
    } catch (err) {
      console.warn("[clinic-storage] Changes not saved yet, will retry:", err);
      persistPending();
      retryDelay = Math.min(60_000, retryDelay ? retryDelay * 2 : 3_000);
      setStatus({ state: "offline", message: "Not connected. Changes are kept and will be saved." });
      scheduleFlush(retryDelay);
      return false;
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

// ─── Loading and pulling changes ────────────────────────────

interface ServerRow {
  c: string;
  id: string;
  data: unknown;
  pos: number;
  deleted: boolean;
  v: number;
}

type PageResponse =
  | { mode: "local"; reason?: string }
  | { mode: "server"; rows: ServerRow[]; cursor: number; more: boolean };

async function fetchPage(since: number, overlap: boolean): Promise<PageResponse> {
  const res = await fetch(`/api/clinic-data?since=${since}${overlap ? "&overlap=1" : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Load failed (${res.status})`);
  return res.json();
}

function applyRows(rows: ServerRow[], touched: Set<string>) {
  for (const r of rows) {
    if (pending.has(opKey(r.c, r.id))) continue; // our unsent edit wins; it is sent next
    const m = collectionMap(r.c);
    const e = m.get(r.id);
    if (e && e.v >= r.v) continue;
    m.set(r.id, { json: r.deleted ? null : JSON.stringify(r.data ?? null), pos: r.pos, v: r.v });
    assembled.delete(r.c);
    touched.add(opKey(r.c, r.id));
  }
}

function announce(touched: Set<string>) {
  const fired = new Set<string>();
  for (const k of touched) {
    const [c, id] = k.split("\u0000");
    if (c === "settings") {
      const ev = SETTINGS_EVENTS[id];
      if (ev && !fired.has(ev)) {
        fired.add(ev);
        window.dispatchEvent(new Event(ev));
      }
      continue;
    }
    const ev = COLLECTION_EVENTS[c];
    if (!ev) continue;
    if (PREFIX_KEYS.some(([, pc]) => pc === c)) {
      window.dispatchEvent(new CustomEvent(ev, { detail: { patientId: id } }));
    } else if (!fired.has(ev)) {
      fired.add(ev);
      window.dispatchEvent(new Event(ev));
    }
  }
}

/** Tell every store its data may have changed (used once the clinic data has loaded). */
export function announceAllStores(): void {
  if (typeof window === "undefined") return;
  for (const ev of new Set([...Object.values(COLLECTION_EVENTS), ...Object.values(SETTINGS_EVENTS)])) {
    window.dispatchEvent(new Event(ev));
  }
}

let pulling = false;

/** Fetch changes made elsewhere since the last pull. */
export async function pullClinicStorage(): Promise<void> {
  if (mode !== "server" || pulling) return;
  pulling = true;
  try {
    const touched = new Set<string>();
    let since = cursor;
    let first = true;
    for (;;) {
      const page = await fetchPage(since, first);
      if (page.mode !== "server") break;
      applyRows(page.rows, touched);
      since = Math.max(since, page.cursor);
      first = false;
      if (!page.more) break;
    }
    cursor = since;
    if (status.state === "offline" && pending.size === 0) setStatus({ state: "idle", message: undefined });
    announce(touched);
  } catch {
    // Offline: try again on the next tick
  } finally {
    pulling = false;
  }
}

const POLL_MS = 15_000;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let listenersInstalled = false;

function onVisible() {
  if (document.visibilityState === "visible") void pullClinicStorage();
}
function onOnline() {
  void flushClinicStorage();
  void pullClinicStorage();
}
function onPageHide() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  persistPending();
  // Best effort: hand the last changes to the browser to send after the page closes
  if (pending.size > 0 && typeof navigator.sendBeacon === "function") {
    const body = encodeOps(nextBatch());
    if (body.length < 60_000) navigator.sendBeacon("/api/clinic-data", new Blob([body], { type: "application/json" }));
  }
}

function startSync() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") void pullClinicStorage();
  }, POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
  window.addEventListener("online", onOnline);
  window.addEventListener("pagehide", onPageHide);
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(`dentalos1-sync:${clinicKey}`);
    channel.onmessage = () => void pullClinicStorage();
  }
}

function stopSync() {
  if (!listenersInstalled) return;
  listenersInstalled = false;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("focus", onVisible);
  window.removeEventListener("online", onOnline);
  window.removeEventListener("pagehide", onPageHide);
  channel?.close();
  channel = null;
}

let initPromise: Promise<{ mode: StorageMode; reason?: string }> | null = null;
let initKey = "";

/**
 * Load the clinic's data before any page reads it. `key` identifies the
 * clinic (and user) so unsent changes are never sent to the wrong clinic.
 */
export function initClinicStorage(key: string): Promise<{ mode: StorageMode; reason?: string }> {
  if (initPromise && initKey === key) return initPromise;
  initKey = key;
  initPromise = (async () => {
    const first = await fetchPage(0, false);
    if (first.mode !== "server") {
      mode = "local";
      setStatus({ state: "idle" });
      return { mode, reason: first.reason };
    }

    records.clear();
    assembled.clear();
    pending.clear();
    clinicKey = key;
    const touched = new Set<string>();
    applyRows(first.rows, touched);
    let since = first.cursor;
    let more = first.more;
    while (more) {
      const page = await fetchPage(since, false);
      if (page.mode !== "server") break;
      applyRows(page.rows, touched);
      since = Math.max(since, page.cursor);
      more = page.more;
    }
    cursor = since;

    // Changes made here earlier that never reached the server
    if (hasLocalStorage()) {
      try {
        const saved = JSON.parse(localStorage.getItem(PENDING_PREFIX + clinicKey) || "[]") as PendingOp[];
        for (const op of Array.isArray(saved) ? saved : []) {
          const m = collectionMap(op.c);
          const e = m.get(op.id);
          m.set(op.id, op.deleted ? { json: null, pos: e?.pos ?? 0, v: e?.v ?? 0 } : { json: op.json ?? "null", pos: op.pos ?? 0, v: e?.v ?? 0 });
          assembled.delete(op.c);
          queue(op);
        }
      } catch {
        // ignore a damaged queue
      }
    }

    mode = "server";
    setStatus({ state: pending.size > 0 ? "saving" : "idle" });
    startSync();
    if (pending.size > 0) scheduleFlush(0);
    return { mode };
  })().catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

// ─── Moving data that was kept in this browser ──────────────

const IMPORTED_PREFIX = "dentalos1_browser_data_imported_v1:";

/**
 * Copy clinic data that this browser kept in localStorage (before data moved
 * to the server) into the clinic's records, without overwriting anything
 * already there. `skip` lists sample-record ids that must not be uploaded.
 * The browser copy is deleted once everything has been saved.
 */
export function importBrowserData(skip: Record<string, Set<string>> = {}): number {
  if (mode !== "server" || !hasLocalStorage()) return 0;
  if (localStorage.getItem(IMPORTED_PREFIX + clinicKey)) return 0;

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && specFor(k)) keys.push(k);
  }

  let added = 0;
  for (const key of keys) {
    const spec = specFor(key)!;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    if (spec.kind === "list") {
      let arr: unknown;
      try {
        arr = JSON.parse(raw);
      } catch {
        continue;
      }
      if (!Array.isArray(arr)) continue;
      const m = collectionMap(spec.c);
      const skipIds = skip[spec.c];
      const extra = arr.filter((it) => {
        const id = it && typeof it === "object" ? (it as { id?: unknown }).id : undefined;
        if (typeof id !== "string" && typeof id !== "number") return false;
        return !m.has(String(id)) && !skipIds?.has(String(id));
      });
      if (extra.length === 0) continue;
      const current = JSON.parse(readList(spec.c) || "[]") as unknown[];
      writeList(spec.c, JSON.stringify([...current, ...extra]));
      added += extra.length;
    } else {
      if (records.get(spec.c)?.has(spec.id)) continue;
      writeDoc(spec.c, spec.id, raw);
      added++;
    }
  }

  const finish = () => {
    try {
      for (const k of keys) localStorage.removeItem(k);
      localStorage.setItem(IMPORTED_PREFIX + clinicKey, new Date().toISOString());
    } catch {
      // ignore
    }
  };
  if (pending.size === 0) finish();
  else {
    afterSyncedCallbacks.push(finish);
    afterLocalChange();
  }
  return added;
}

/**
 * Before signing out: send what's left, then drop the in-memory copy.
 * Returns false when some changes could not be sent (they stay queued on
 * this computer and are sent at the next sign-in to the same clinic).
 */
export async function closeClinicStorage(): Promise<boolean> {
  const allSent = await flushClinicStorage();
  stopSync();
  records.clear();
  assembled.clear();
  pending.clear();
  initPromise = null;
  initKey = "";
  mode = "loading";
  setStatus({ state: "idle" });
  return allSent;
}
