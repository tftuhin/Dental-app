import { auth } from "@/auth";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Dr. Sarah Smith";

  return <DashboardView userName={userName} />;
}
