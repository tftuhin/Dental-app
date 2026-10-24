import { auth } from "@/auth";
import { db } from "@/db";
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

  const clinicId = (session.user as any).clinicId as string | undefined;
  let clinicName = "My Clinic";

  if (clinicId) {
    const [clinic] = await db
      .select({ name: clinics.name })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);
    if (clinic) clinicName = clinic.name;
  }

  return (
    <DashboardShell clinicName={clinicName} clinicId={clinicId}>
      {children}
    </DashboardShell>
  );
}
