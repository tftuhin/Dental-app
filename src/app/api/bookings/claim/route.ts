import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { bookingRequests } from "@/db/schema";

// Hands the signed-in clinic its new online bookings, marking them imported in
// the same statement so two open browsers can never import the same booking.

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
    const claimed = await db
      .update(bookingRequests)
      .set({ status: "imported", importedAt: new Date() })
      .where(and(eq(bookingRequests.clinicId, clinicId), eq(bookingRequests.status, "pending")))
      .returning();

    const bookings = claimed
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((b) => ({
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
    console.error("Failed to claim booking requests:", error);
    return NextResponse.json({ error: "Could not load online bookings." }, { status: 500 });
  }
}
