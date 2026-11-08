import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, gt, inArray, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { clinicRecords } from "@/db/schema";
import {
  AccessContext,
  AccessRequestData,
  accessFor,
  buildAccessContext,
  checkAccessRequestWrite,
  mergePartialWrite,
  redact,
  stripMarkers,
} from "@/lib/server/access-control";

// The clinic's working data (patients, visits, bills, charts, settings...).
// Browsers keep a copy in memory and use this endpoint to stay in step:
//   GET  ?since=<version>  → rows changed after that version, oldest first, in pages
//   POST { ops: [...] }    → save changed rows; each gets a new version
// Every row passes through the access rules (src/lib/server/access-control.ts):
// front desk and doctors receive, and may change, only what they're allowed to.
// Without a database the app keeps data in the browser ("local" mode).

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
/** Rows saved this recently are sent again on every pull, so a write that committed late is never skipped. */
const OVERLAP_SECONDS = 30;
const MAX_OPS = 500;
const MAX_RECORD_BYTES = 3_000_000;

type SessionUser = { id?: string; role?: string | null; email?: string | null; name?: string | null; clinicId?: string | null };

type Gate =
  | { kind: "local"; reason: "no-database" | "no-clinic" }
  | { kind: "denied" }
  | { kind: "ok"; clinicId: string; user: SessionUser };

async function gate(): Promise<Gate> {
  const session = await auth();
  if (!session?.user) return { kind: "denied" };
  if (!isDatabaseConfigured) return { kind: "local", reason: "no-database" };
  const clinicId = session.user.clinicId;
  if (!clinicId) return { kind: "local", reason: "no-clinic" };
  return { kind: "ok", clinicId, user: session.user as SessionUser };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = typeof clinicRecords.$inferSelect;

/** The row as this user may see it, or null when they may not see it at all. */
function visibleRow(ctx: AccessContext, r: Row) {
  if (r.deleted) return { c: r.collection, id: r.recordId, data: null, pos: r.pos, deleted: true, v: r.version };
  const data = r.data as Record<string, unknown> | null;
  const access = accessFor(ctx, r.collection, r.recordId, data);
  if (access.level === "none") return null;
  return {
    c: r.collection,
    id: r.recordId,
    data: data ? redact(r.collection, data, access) : data,
    pos: r.pos,
    deleted: false,
    v: r.version,
  };
}

export async function GET(request: Request) {
  const g = await gate();
  if (g.kind === "denied") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (g.kind === "local") return NextResponse.json({ mode: "local", reason: g.reason });

  const params = new URL(request.url).searchParams;
  const since = Math.max(0, parseInt(params.get("since") || "0", 10) || 0);
  const withOverlap = params.get("overlap") === "1" && since > 0;

  try {
    const ctx = await buildAccessContext(g.clinicId, g.user);
    const rows = await db
      .select()
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, g.clinicId), gt(clinicRecords.version, since)))
      .orderBy(asc(clinicRecords.version))
      .limit(PAGE_SIZE + 1);

    const more = rows.length > PAGE_SIZE;
    const page = more ? rows.slice(0, PAGE_SIZE) : rows;

    let late: Row[] = [];
    if (withOverlap) {
      late = await db
        .select()
        .from(clinicRecords)
        .where(
          and(
            eq(clinicRecords.clinicId, g.clinicId),
            lte(clinicRecords.version, since),
            sql`${clinicRecords.updatedAt} > now() - make_interval(secs => ${OVERLAP_SECONDS})`
          )
        );
    }

    const cursor = page.length > 0 ? page[page.length - 1].version : since;
    return NextResponse.json({
      mode: "server",
      rows: [...late, ...page].map((r) => visibleRow(ctx, r)).filter(Boolean),
      cursor,
      more,
      // The browser re-loads everything when this changes (access switched on or off)
      privacy: ctx.privacyOn,
    });
  } catch (error) {
    console.error("Failed to load clinic data:", error);
    return NextResponse.json({ error: "Could not load clinic data." }, { status: 500 });
  }
}

const opSchema = z.object({
  c: z.string().regex(/^[a-z0-9_-]{1,80}$/),
  id: z.string().min(1).max(200),
  data: z.unknown().optional(),
  pos: z.number().finite().optional(),
  deleted: z.boolean().optional(),
});

const bodySchema = z.object({ ops: z.array(opSchema).min(1).max(MAX_OPS) });

type Op = z.infer<typeof opSchema>;

export async function POST(request: Request) {
  const g = await gate();
  if (g.kind === "denied") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (g.kind === "local") return NextResponse.json({ error: "No database configured." }, { status: 409 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid changes." }, { status: 400 });
  }

  // Last change wins when the same record appears twice in one batch
  const byKey = new Map<string, Op>();
  for (const op of parsed.data.ops) byKey.set(`${op.c}\u0000${op.id}`, op);
  const ops = [...byKey.values()];

  for (const op of ops) {
    if (!op.deleted && JSON.stringify(op.data ?? null).length > MAX_RECORD_BYTES) {
      return NextResponse.json({ error: `Record ${op.c}/${op.id} is too large to save.` }, { status: 413 });
    }
  }

  const updatedBy = g.user.id && UUID_RE.test(g.user.id) ? g.user.id : null;

  try {
    const ctx = await buildAccessContext(g.clinicId, g.user);

    // The saved versions of the records being changed, to check access against
    const existing = new Map<string, Row>();
    const ids = [...new Set(ops.map((o) => o.id))];
    if (ids.length > 0) {
      const rows = await db
        .select()
        .from(clinicRecords)
        .where(and(eq(clinicRecords.clinicId, g.clinicId), inArray(clinicRecords.recordId, ids)));
      for (const r of rows) existing.set(`${r.collection}\u0000${r.recordId}`, r);
    }

    const allowed: Array<Op & { data: unknown }> = [];
    const rejected: Array<{ c: string; id: string; error: string }> = [];

    for (const op of ops) {
      const prev = existing.get(`${op.c}\u0000${op.id}`);
      const prevData = prev && !prev.deleted ? (prev.data as Record<string, unknown> | null) : null;
      const incoming = op.deleted ? null : (stripMarkers(op.data ?? null) as Record<string, unknown> | null);

      if (op.c === "settings" && op.id === "access_control" && !ctx.isOwner) {
        rejected.push({ c: op.c, id: op.id, error: "Only the clinic owner can change patient privacy." });
        continue;
      }
      if (op.c === "access_requests") {
        const res = checkAccessRequestWrite(ctx, prevData as unknown as AccessRequestData | null, incoming as unknown as AccessRequestData | null, !!op.deleted);
        if (!res.ok) rejected.push({ c: op.c, id: op.id, error: res.error });
        else allowed.push({ ...op, deleted: false, data: res.data });
        continue;
      }

      const access = accessFor(ctx, op.c, op.id, prevData ?? incoming);
      if (access.level === "none") {
        rejected.push({ c: op.c, id: op.id, error: "You don't have access to this record." });
        continue;
      }
      if (access.level === "partial") {
        if (op.deleted) {
          rejected.push({ c: op.c, id: op.id, error: "You can't delete this record." });
          continue;
        }
        allowed.push({ ...op, data: mergePartialWrite(op.c, prevData, incoming || {}, access) });
        continue;
      }
      allowed.push({ ...op, data: incoming });
    }

    let saved: Array<{ c: string; id: string; v: number }> = [];
    if (allowed.length > 0) {
      saved = await db
        .insert(clinicRecords)
        .values(
          allowed.map((op) => ({
            clinicId: g.clinicId,
            collection: op.c,
            recordId: op.id,
            data: op.deleted ? null : (op.data ?? null),
            pos: op.pos ?? 0,
            deleted: !!op.deleted,
            version: sql`nextval('clinic_records_version_seq')`,
            updatedBy,
            updatedAt: sql`now()`,
          }))
        )
        .onConflictDoUpdate({
          target: [clinicRecords.clinicId, clinicRecords.collection, clinicRecords.recordId],
          set: {
            data: sql`excluded.data`,
            pos: sql`excluded.pos`,
            deleted: sql`excluded.deleted`,
            version: sql`excluded.version`,
            updatedBy: sql`excluded.updated_by`,
            updatedAt: sql`excluded.updated_at`,
          },
        })
        .returning({ c: clinicRecords.collection, id: clinicRecords.recordId, v: clinicRecords.version });
    }

    return NextResponse.json({ saved, rejected });
  } catch (error) {
    console.error("Failed to save clinic data:", error);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }
}
