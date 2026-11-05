import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { clinics } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const clinicId = session.user.clinicId ?? undefined;
  let clinicName = "My Clinic";
  let clinicSlug: string | undefined;

  if (clinicId && isDatabaseConfigured) {
    try {
      const [clinic] = await db
        .select({ name: clinics.name, slug: clinics.slug })
        .from(clinics)
        .where(eq(clinics.id, clinicId))
        .limit(1);
      if (clinic) {
        clinicName = clinic.name;
        clinicSlug = clinic.slug;
      }
    } catch (err) {
      // Don't take the whole dashboard down if the clinic lookup fails
      console.error("Clinic name lookup failed:", err);
    }
  }

  return (
    <DashboardShell clinicName={clinicName} clinicId={clinicId} clinicSlug={clinicSlug}>
      {children}
    </DashboardShell>
  );
}
