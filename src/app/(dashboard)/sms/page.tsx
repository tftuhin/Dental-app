"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { BellRing, Megaphone, History, CalendarClock, Search, Inbox } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecallApprovalList } from "@/components/messaging/recall-approvals";
import { CampaignBuilder } from "@/components/messaging/campaign-builder";
import { SmsInbox, useUnreadInbox } from "@/components/messaging/inbox";
import {
  CHANNEL_LABELS,
  MESSAGE_LOG_EVENT,
  RECALLS_EVENT,
  Recall,
  formatDisplayDate,
  getMessageLog,
  getRecalls,
  recallsAwaitingFor,
  refreshRecalls,
  updateRecall,
} from "@/lib/messaging-store";

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  sent: { text: "Sent", cls: "bg-emerald-100 text-emerald-800" },
  handed_over: { text: "Opened to send", cls: "bg-sky-100 text-sky-800" },
  failed: { text: "Failed", cls: "bg-red-100 text-red-800" },
};

function useRecalls(): Recall[] {
  const [list, setList] = useState(getRecalls);
  useEffect(() => {
    const load = () => setList(getRecalls());
    window.addEventListener(RECALLS_EVENT, load);
    return () => window.removeEventListener(RECALLS_EVENT, load);
  }, []);
  return list;
}

export default function SmsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const canApprove = !!user?.role && user.role !== "receptionist";
  const recalls = useRecalls();
  const unread = useUnreadInbox();

  // Make sure overdue plans have their reminders drafted before showing the list
  useEffect(() => {
    if (canApprove) refreshRecalls();
  }, [canApprove]);

  const awaiting = recalls.filter((r) => r.status === "awaiting_approval");
  // A link can open a tab (?tab=inbox); otherwise reminders first when some are waiting
  const [tab, setTab] = useState(() => {
    const asked = new URLSearchParams(window.location.search).get("tab");
    if (asked && ["approvals", "inbox", "campaign", "log"].includes(asked)) return asked;
    return getRecalls().some((r) => r.status === "awaiting_approval") ? "approvals" : unread > 0 ? "inbox" : "campaign";
  });
  const mine = user ? recallsAwaitingFor(user) : [];
  const others = awaiting.filter((r) => !mine.some((m) => m.id === r.id));
  const upcoming = recalls.filter((r) => r.status === "planned").sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const [log, setLog] = useState(getMessageLog);
  const [logQuery, setLogQuery] = useState("");
  useEffect(() => {
    const load = () => setLog(getMessageLog());
    window.addEventListener(MESSAGE_LOG_EVENT, load);
    return () => window.removeEventListener(MESSAGE_LOG_EVENT, load);
  }, []);
  const filteredLog = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    return (q ? log.filter((m) => `${m.patientName} ${m.phone} ${m.campaign || ""} ${m.body}`.toLowerCase().includes(q)) : log).slice(0, 300);
  }, [log, logQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS & Campaigns"
        description="Reminders for patients who missed their planned treatment, campaigns to chosen patients, and every message sent."
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="approvals" className="gap-1.5 text-xs">
            <BellRing className="h-3.5 w-3.5" />
            Reminders
            {awaiting.length > 0 && <Badge className="ml-1 h-4 bg-amber-500 px-1.5 text-[10px] text-white">{awaiting.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1.5 text-xs">
            <Inbox className="h-3.5 w-3.5" />
            Inbox
            {unread > 0 && <Badge className="ml-1 h-4 bg-primary px-1.5 text-[10px]">{unread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="campaign" className="gap-1.5 text-xs">
            <Megaphone className="h-3.5 w-3.5" />
            Campaign
          </TabsTrigger>
          <TabsTrigger value="log" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            Message log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card className="shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-xs font-bold">
                {canApprove ? "Waiting for your approval" : "Waiting for the doctor's approval"} ({canApprove ? mine.length : awaiting.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <RecallApprovalList recalls={canApprove ? mine : awaiting} canApprove={canApprove} />
            </CardContent>
          </Card>

          {canApprove && others.length > 0 && (
            <Card className="shadow-xs">
              <CardHeader className="border-b bg-muted/20 px-4 py-3">
                <CardTitle className="text-xs font-bold">Waiting for other doctors ({others.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <RecallApprovalList recalls={others} canApprove={false} />
              </CardContent>
            </Card>
          )}

          <Card className="shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-xs font-bold">
                <CalendarClock className="h-4 w-4 text-violet-600" />
                Planned next treatments ({upcoming.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto p-0">
              {upcoming.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">
                  No plans yet. Doctors add them after signing a prescription (&quot;Plan next treatment&quot;).
                </p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-1.5 text-left">Patient</th>
                      <th className="px-2 py-1.5 text-left">Next treatment</th>
                      <th className="px-2 py-1.5 text-left">By</th>
                      <th className="px-2 py-1.5 text-left">Doctor</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((r) => (
                      <tr key={r.id} className="border-t align-top">
                        <td className="px-4 py-1.5">
                          <span className="font-semibold">{r.patientName}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">{r.phone}</span>
                        </td>
                        <td className="px-2 py-1.5">
                          {r.procedure}
                          {r.note && <span className="block text-[10px] text-muted-foreground">{r.note}</span>}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5">{formatDisplayDate(r.dueDate)}</td>
                        <td className="px-2 py-1.5">{r.doctor}</td>
                        <td className="px-4 py-1.5 text-right">
                          {canApprove && (
                            <button
                              type="button"
                              className="text-[11px] text-muted-foreground hover:text-destructive"
                              onClick={() => updateRecall(r.id, { status: "dismissed", closedReason: "Cancelled" })}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <SmsInbox />
        </TabsContent>

        <TabsContent value="campaign">
          <CampaignBuilder />
        </TabsContent>

        <TabsContent value="log">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-col gap-2 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xs font-bold">Messages ({log.length})</CardTitle>
              <div className="relative sm:w-72">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={logQuery} onChange={(e) => setLogQuery(e.target.value)} placeholder="Search patient, phone or text" className="h-7 pl-7 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] overflow-y-auto p-0">
              {filteredLog.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">No messages yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background text-[10px] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-1.5 text-left">When</th>
                      <th className="px-2 py-1.5 text-left">Patient</th>
                      <th className="px-2 py-1.5 text-left">Type</th>
                      <th className="px-2 py-1.5 text-left">Message</th>
                      <th className="px-4 py-1.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLog.map((m) => (
                      <tr key={m.id} className="border-t align-top">
                        <td className="whitespace-nowrap px-4 py-1.5">
                          {new Date(m.sentAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" })}
                          {m.by && <span className="block text-[10px] text-muted-foreground">{m.by}</span>}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="font-semibold">{m.patientName}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">{m.phone}</span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5">
                          {CHANNEL_LABELS[m.channel]} · {m.kind === "recall" ? "Reminder" : m.kind === "campaign" ? m.campaign || "Campaign" : "Direct"}
                        </td>
                        <td className="max-w-md px-2 py-1.5 text-muted-foreground">{m.body}</td>
                        <td className="px-4 py-1.5">
                          <Badge className={`text-[10px] ${STATUS_LABEL[m.status]?.cls || ""}`}>{STATUS_LABEL[m.status]?.text || m.status}</Badge>
                          {m.error && <span className="block text-[10px] text-destructive">{m.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
