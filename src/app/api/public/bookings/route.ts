import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { bookingRequests, clinics } from "@/db/schema";

// Public endpoint used by /book/[clinicSlug]. No login: anyone can request a
// visit. Requests land in booking_requests and the clinic's Appointments page
// pulls them into its queue (see /api/bookings/claim).

const bookingSchema = z.object({
  clinicSlug: z.string().min(1).max(100),
  patientName: z.string().trim().min(2).max(150),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Enter a valid mobile number"),
  email: z.union([z.literal(""), z.string().trim().email().max(150)]).optional(),
  service: z.string().trim().min(1).max(200),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().trim().min(1).max(10),
  healthNotes: z.string().trim().max(1000).optional(),
  // Honeypot: real people never see or fill this field
  website: z.string().optional(),
});

const FIELD_ERRORS: Record<string, string> = {
  patientName: "Please enter your full name.",
  phone: "Please enter a valid mobile number.",
  email: "Please enter a valid email address, or leave it empty.",
  service: "Please choose a service.",
  preferredDate: "Please choose a date.",
  preferredTime: "Please choose a time.",
  healthNotes: "Health notes are too long (1,000 characters max).",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PENDING_PER_PHONE = 3;

export async function POST(request: Request) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Online booking is not available right now. Please call the clinic." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    return NextResponse.json({ error: FIELD_ERRORS[field] || "Please check your details." }, { status: 400 });
  }
  const input = parsed.data;

  // Bots fill every field; pretend it worked so they don't retry
  if (input.website) {
    return NextResponse.json({ reference: "WEB-000000" });
  }

  // Date must be from today (allowing for time zones) up to 90 days ahead
  const requested = new Date(`${input.preferredDate}T00:00:00Z`).getTime();
  const now = Date.now();
  if (isNaN(requested) || requested < now - 2 * DAY_MS || requested > now + 90 * DAY_MS) {
    return NextResponse.json({ error: "Choose a date within the next 90 days." }, { status: 400 });
  }

  try {
    const [clinic] = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(and(eq(clinics.slug, input.clinicSlug), eq(clinics.isActive, true)))
      .limit(1);
    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
    }

    // Stop one number from flooding the clinic's inbox
    const [{ pending }] = await db
      .select({ pending: sql<number>`count(*)::int` })
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.clinicId, clinic.id),
          eq(bookingRequests.phone, input.phone),
          eq(bookingRequests.status, "pending")
        )
      );
    if (pending >= MAX_PENDING_PER_PHONE) {
      return NextResponse.json(
        { error: "You already have bookings waiting for the clinic. Please call to change them." },
        { status: 429 }
      );
    }

    const reference = `WEB-${Math.floor(100000 + Math.random() * 900000)}`;
    await db.insert(bookingRequests).values({
      clinicId: clinic.id,
      reference,
      patientName: input.patientName,
      phone: input.phone,
      email: input.email || null,
      service: input.service,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      healthNotes: input.healthNotes || null,
    });

    return NextResponse.json({ reference });
  } catch (error) {
    console.error("Failed to save booking request:", error);
    return NextResponse.json(
      { error: "Could not save your booking. Please try again or call the clinic." },
      { status: 500 }
    );
  }
}
