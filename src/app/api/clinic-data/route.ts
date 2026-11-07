import { NextResponse } from "next/server";
import { z } from "zod";
import { and, asc, eq, gt, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { clinicRecords } from "@/db/schema";

// The clinic's working data (patients, visits, bills, charts, settings...).
// Browsers keep a copy in memory and use this endpoint to stay in step:
//   GET  ?since=<version>  → rows changed after that version, oldest first, in pages
//   POST { ops: [...] }    → save changed rows; each gets a new version
// Without a database the app keeps data in the browser ("local" mode).

export const dynamic = "force-dynamic";

const PAGE_SIZE = 1000;
/** Rows saved this recently are sent again on every pull, so a write that committed late is never skipped. */
const OVERLAP_SECONDS = 30;
const MAX_OPS = 500;
const MAX_RECORD_BYTES = 3_000_000;

type Gate =
  | { kind: "local"; reason: "no-database" | "no-clinic" }
  | { kind: "denied" }
  | { kind: "ok"; clinicId: string; userId?: string };

async function gate(): Promise<Gate> {
  const session = await auth();
  if (!session?.user) return { kind: "denied" };
  if (!isDatabaseConfigured) return { kind: "local", reason: "no-database" };
  const clinicId = session.user.clinicId;
  if (!clinicId) return { kind: "local", reason: "no-clinic" };
  return { kind: "ok", clinicId, userId: session.user.id };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toRow(r: typeof clinicRecords.$inferSelect) {
  return { c: r.collection, id: r.recordId, data: r.data, pos: r.pos, deleted: r.deleted, v: r.version };
}

export async function GET(request: Request) {
  const g = await gate();
  if (g.kind === "denied") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (g.kind === "local") return NextResponse.json({ mode: "local", reason: g.reason });

  const params = new URL(request.url).searchParams;
  const since = Math.max(0, parseInt(params.get("since") || "0", 10) || 0);
  const withOverlap = params.get("overlap") === "1" && since > 0;

  try {
    const rows = await db
      .select()
      .from(clinicRecords)
      .where(and(eq(clinicRecords.clinicId, g.clinicId), gt(clinicRecords.version, since)))
      .orderBy(asc(clinicRecords.version))
      .limit(PAGE_SIZE + 1);

    const more = rows.length > PAGE_SIZE;
    const page = more ? rows.slice(0, PAGE_SIZE) : rows;

    let late: typeof rows = [];
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
      rows: [...late, ...page].map(toRow),
      cursor,
      more,
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
  const byKey = new Map<string, z.infer<typeof opSchema>>();
  for (const op of parsed.data.ops) byKey.set(`${op.c}\u0000${op.id}`, op);
  const ops = [...byKey.values()];

  for (const op of ops) {
    if (!op.deleted && JSON.stringify(op.data ?? null).length > MAX_RECORD_BYTES) {
      return NextResponse.json({ error: `Record ${op.c}/${op.id} is too large to save.` }, { status: 413 });
    }
  }

  const updatedBy = g.userId && UUID_RE.test(g.userId) ? g.userId : null;

  try {
    const saved = await db
      .insert(clinicRecords)
      .values(
        ops.map((op) => ({
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

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Failed to save clinic data:", error);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }
}
