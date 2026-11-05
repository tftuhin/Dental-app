import { NextResponse } from "next/server";
import { and, eq, gte, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { bookingRequests } from "@/db/schema";

// Online bookings for the signed-in clinic, from yesterday onwards. Every
// staff browser receives all of them and adds the ones it doesn't have yet
// (the clinic queue is kept per browser, so each computer needs its own copy).
// The database stays the record: nothing is lost if a browser's data is.

const CLINIC_TIME_ZONE = "Asia/Dhaka";

function clinicDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIME_ZONE }).format(d);
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clinicId = session.user.clinicId;
  if (!isDatabaseConfigured || !clinicId) {
    return NextResponse.json({ bookings: [] });
  }

  try {
    const rows = await db
      .select()
      .from(bookingRequests)
      .where(and(eq(bookingRequests.clinicId, clinicId), gte(bookingRequests.preferredDate, clinicDate(-1))))
      .orderBy(bookingRequests.createdAt)
      .limit(500);

    // Note when the clinic first saw each booking
    const unseen = rows.filter((r) => r.status === "pending").map((r) => r.id);
    if (unseen.length > 0) {
      await db
        .update(bookingRequests)
        .set({ status: "imported", importedAt: new Date() })
        .where(and(eq(bookingRequests.clinicId, clinicId), inArray(bookingRequests.id, unseen)));
    }

    const bookings = rows.map((b) => ({
      id: b.id,
      reference: b.reference,
      patientName: b.patientName,
      phone: b.phone,
      email: b.email,
      service: b.service,
      preferredDate: b.preferredDate,
      preferredTime: b.preferredTime,
      healthNotes: b.healthNotes,
      createdAt: b.createdAt.toISOString(),
    }));
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Failed to load online bookings:", error);
    return NextResponse.json({ error: "Could not load online bookings." }, { status: 500 });
  }
}
