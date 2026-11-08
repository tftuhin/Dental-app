import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db, isDatabaseConfigured } from "@/db";
import { demoRequests } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";

// Demo, quote and question requests sent from the public website's contact
// form. Only for the DentalOS1 team (super_admin), not for clinics.

export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "closed"] as const;
const INTEREST: Record<string, string> = { demo: "Demo", quote: "Quote", question: "Question" };

async function isTeam() {
  const session = await auth();
  return session?.user?.role === "super_admin";
}

async function setStatus(formData: FormData) {
  "use server";
  if (!(await isTeam())) return;
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.includes(status as (typeof STATUSES)[number])) return;
  await db.update(demoRequests).set({ status }).where(eq(demoRequests.id, id));
  revalidatePath("/enquiries");
}

export default async function EnquiriesPage() {
  if (!(await isTeam())) notFound();
  const rows = isDatabaseConfigured ? await db.select().from(demoRequests).orderBy(desc(demoRequests.createdAt)).limit(500) : [];
  const open = rows.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Website enquiries" description={`${rows.length} received from the website's contact form · ${open} new`} />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No enquiries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Received</th>
                <th className="px-3 py-2">Who</th>
                <th className="px-3 py-2">Clinic</th>
                <th className="px-3 py-2">Wants</th>
                <th className="px-3 py-2">Message</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t align-top ${r.status === "new" ? "bg-amber-50/40" : ""}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {r.createdAt.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-semibold">{r.name}</span>
                    <a href={`tel:${r.phone}`} className="block font-mono text-xs text-primary">
                      {r.phone}
                    </a>
                    {r.email && (
                      <a href={`mailto:${r.email}`} className="block text-xs text-primary">
                        {r.email}
                      </a>
                    )}
                    <span className="text-[11px] text-muted-foreground">Prefers {r.preferredContact || "phone"}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {r.clinicName || "—"}
                    <span className="block text-muted-foreground">{[r.city, r.chairs && `${r.chairs} chairs`].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">{INTEREST[r.interest || "demo"] || r.interest}</td>
                  <td className="max-w-sm px-3 py-3 text-xs text-muted-foreground">{r.message || "—"}</td>
                  <td className="px-4 py-3">
                    <form action={setStatus} className="flex gap-1">
                      <input type="hidden" name="id" value={r.id} />
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          name="status"
                          value={s}
                          className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                            r.status === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
