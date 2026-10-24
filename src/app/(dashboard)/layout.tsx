import { auth } from "@/auth";
import { db } from "@/db";
import { clinics, clinicSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
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
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar clinicName={clinicName} clinicId={clinicId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar clinicName={clinicName} />
        <main className="flex-1 overflow-auto">
          <div className="h-full px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
