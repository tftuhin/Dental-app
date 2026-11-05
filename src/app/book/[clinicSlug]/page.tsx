import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { clinics } from "@/db/schema";
import { BookingPortal, type BookingPortalClinic } from "@/components/booking/booking-portal";

// Public booking page: /book/<clinic slug>. The clinic's details come from the
// database; submitted bookings go to /api/public/bookings.

export const dynamic = "force-dynamic";

const CLINIC_TIME_ZONE = "Asia/Dhaka";

/** YYYY-MM-DD in the clinic's time zone, `offsetDays` from today. */
function clinicDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: CLINIC_TIME_ZONE }).format(d);
}

async function loadClinic(slug: string): Promise<BookingPortalClinic | null> {
  if (!isDatabaseConfigured) {
    // Local demo without a database
    return { slug, name: "Dhaka Dental Care", address: "Dhanmondi, Dhaka", phone: "" };
  }
  const [clinic] = await db
    .select({ slug: clinics.slug, name: clinics.name, address: clinics.address, phone: clinics.phone })
    .from(clinics)
    .where(and(eq(clinics.slug, slug), eq(clinics.isActive, true)))
    .limit(1);
  if (!clinic) return null;
  return { slug: clinic.slug, name: clinic.name, address: clinic.address || "", phone: clinic.phone || "" };
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const clinic = await loadClinic(clinicSlug);
  if (!clinic) notFound();

  return (
    <BookingPortal clinic={clinic} minDate={clinicDate(0)} defaultDate={clinicDate(1)} maxDate={clinicDate(89)} />
  );
}
