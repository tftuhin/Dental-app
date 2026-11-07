import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// clinic-storage keeps module-level state, so each test loads a fresh copy.
async function load() {
  vi.resetModules();
  return import("./clinic-storage");
}

type Row = { c: string; id: string; data: unknown; pos: number; deleted: boolean; v: number };

/** A fake /api/clinic-data: GET serves `rows`, POST records what was sent and assigns versions. */
function fakeServer(initial: Row[] = []) {
  let version = initial.reduce((m, r) => Math.max(m, r.v), 0);
  const rows = new Map(initial.map((r) => [`${r.c}/${r.id}`, r]));
  const posts: Array<{ ops: Array<{ c: string; id: string; data?: unknown; pos?: number; deleted?: boolean }> }> = [];
  let offline = false;

  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (offline) throw new TypeError("Failed to fetch");
    if (!init || !init.method || init.method === "GET") {
      const since = Number(new URL(url, "http://x").searchParams.get("since") || 0);
      const page = [...rows.values()].filter((r) => r.v > since).sort((a, b) => a.v - b.v);
      return new Response(JSON.stringify({ mode: "server", rows: page, cursor: page.at(-1)?.v ?? since, more: false }));
    }
    const body = JSON.parse(String(init.body));
    posts.push(body);
    const saved = body.ops.map((op: Row) => {
      version += 1;
      rows.set(`${op.c}/${op.id}`, { c: op.c, id: op.id, data: op.deleted ? null : op.data, pos: op.pos ?? 0, deleted: !!op.deleted, v: version });
      return { c: op.c, id: op.id, v: version };
    });
    return new Response(JSON.stringify({ saved }));
  });

  return {
    fetchMock,
    posts,
    rows,
    setOffline: (v: boolean) => (offline = v),
    /** A change made on another computer. */
    remoteWrite(c: string, id: string, data: unknown, pos = 0) {
      version += 1;
      rows.set(`${c}/${id}`, { c, id, data, pos, deleted: false, v: version });
    },
  };
}

const PATIENTS = "dentalos1-patients-registry-v1";
const SETUP = "dentai_clinic_setup_v1";

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("clinic-storage (server mode)", () => {
  it("loads the clinic's records and rebuilds lists in order", async () => {
    const server = fakeServer([
      { c: "patients", id: "p2", data: { id: "p2", name: "B" }, pos: 1, deleted: false, v: 2 },
      { c: "patients", id: "p1", data: { id: "p1", name: "A" }, pos: 0, deleted: false, v: 1 },
      { c: "patients", id: "p3", data: null, pos: 2, deleted: true, v: 3 },
    ]);
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    expect(s.getStorageMode()).toBe("server");
    expect(JSON.parse(s.clinicStorage.getItem(PATIENTS)!)).toEqual([
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
    ]);
    expect(s.allowsDemoData()).toBe(false);
  });

  it("sends only the record that changed", async () => {
    const server = fakeServer([
      { c: "patients", id: "p1", data: { id: "p1", name: "A" }, pos: 0, deleted: false, v: 1 },
      { c: "patients", id: "p2", data: { id: "p2", name: "B" }, pos: 1, deleted: false, v: 2 },
    ]);
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    const list = JSON.parse(s.clinicStorage.getItem(PATIENTS)!);
    list[1].name = "B (edited)";
    list.unshift({ id: "p0", name: "New" });
    s.clinicStorage.setItem(PATIENTS, JSON.stringify(list));
    await s.flushClinicStorage();

    const ops = server.posts.flatMap((p) => p.ops);
    expect(ops.map((o) => o.id).sort()).toEqual(["p0", "p2"]);
    // The new first patient sorts before p1 without renumbering everyone
    expect(ops.find((o) => o.id === "p0")!.pos).toBeLessThan(0);
    expect(JSON.parse(s.clinicStorage.getItem(PATIENTS)!).map((p: { id: string }) => p.id)).toEqual(["p0", "p1", "p2"]);
  });

  it("records a removed item as a deletion", async () => {
    const server = fakeServer([
      { c: "patients", id: "p1", data: { id: "p1" }, pos: 0, deleted: false, v: 1 },
      { c: "patients", id: "p2", data: { id: "p2" }, pos: 1, deleted: false, v: 2 },
    ]);
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    s.clinicStorage.setItem(PATIENTS, JSON.stringify([{ id: "p2" }]));
    await s.flushClinicStorage();

    expect(server.posts.flatMap((p) => p.ops)).toEqual([{ c: "patients", id: "p1", deleted: true }]);
    expect(server.rows.get("patients/p1")!.deleted).toBe(true);
  });

  it("stores settings as one record each", async () => {
    const server = fakeServer();
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    s.clinicStorage.setItem(SETUP, JSON.stringify({ name: "Smile Care" }));
    await s.flushClinicStorage();

    expect(server.posts[0].ops).toEqual([{ c: "settings", id: "clinic_setup", pos: 0, data: { name: "Smile Care" } }]);
    // Clinic data never lands in this browser's localStorage
    expect(localStorage.getItem(SETUP)).toBeNull();
  });

  it("pulls changes made on another computer and tells the store", async () => {
    const server = fakeServer([{ c: "patients", id: "p1", data: { id: "p1", name: "A" }, pos: 0, deleted: false, v: 1 }]);
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    const heard = vi.fn();
    window.addEventListener("dentalos1-patients-updated", heard);
    server.remoteWrite("patients", "p1", { id: "p1", name: "A (from reception)" });
    await s.pullClinicStorage();
    window.removeEventListener("dentalos1-patients-updated", heard);

    expect(heard).toHaveBeenCalledTimes(1);
    expect(JSON.parse(s.clinicStorage.getItem(PATIENTS)!)[0].name).toBe("A (from reception)");
  });

  it("keeps unsent changes when offline and sends them later", async () => {
    const server = fakeServer();
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    server.setOffline(true);
    s.clinicStorage.setItem(PATIENTS, JSON.stringify([{ id: "p1", name: "Offline" }]));
    expect(await s.flushClinicStorage()).toBe(false);
    expect(s.getSyncStatus().state).toBe("offline");
    // Survives a reload: the queue is kept on this computer
    await new Promise((r) => setTimeout(r, 300));
    expect(localStorage.getItem("dentalos1_pending_changes_v1:clinic-1")).toContain("Offline");

    server.setOffline(false);
    expect(await s.flushClinicStorage()).toBe(true);
    expect(server.rows.get("patients/p1")!.data).toEqual({ id: "p1", name: "Offline" });
  });

  it("copies data kept in this browser into the clinic without overwriting, skipping sample records", async () => {
    localStorage.setItem(
      PATIENTS,
      JSON.stringify([
        { id: "pat-1", name: "Sample" },
        { id: "p9", name: "Real local patient" },
        { id: "p1", name: "Older copy" },
      ])
    );
    const server = fakeServer([{ c: "patients", id: "p1", data: { id: "p1", name: "Server copy" }, pos: 0, deleted: false, v: 1 }]);
    vi.stubGlobal("fetch", server.fetchMock);
    const s = await load();
    await s.initClinicStorage("clinic-1");

    const moved = s.importBrowserData({ patients: new Set(["pat-1"]) });
    await s.flushClinicStorage();

    expect(moved).toBe(1);
    expect(server.rows.get("patients/p1")!.data).toEqual({ id: "p1", name: "Server copy" });
    expect(server.rows.get("patients/p9")!.data).toEqual({ id: "p9", name: "Real local patient" });
    expect(server.rows.has("patients/pat-1")).toBe(false);
    expect(localStorage.getItem(PATIENTS)).toBeNull();
  });
});

describe("clinic-storage (local mode)", () => {
  it("uses localStorage when there is no database", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ mode: "local", reason: "no-database" }))));
    const s = await load();
    const res = await s.initClinicStorage("no-clinic");

    expect(res).toEqual({ mode: "local", reason: "no-database" });
    s.clinicStorage.setItem(SETUP, JSON.stringify({ name: "Demo" }));
    expect(localStorage.getItem(SETUP)).toBe(JSON.stringify({ name: "Demo" }));
    expect(s.allowsDemoData()).toBe(true);
  });
});
