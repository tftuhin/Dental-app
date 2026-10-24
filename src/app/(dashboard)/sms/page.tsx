"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Send,
  Clock,
  CheckCheck,
  AlertCircle,
  Users,
  Sparkles,
  Cake,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

interface SmsLog {
  id: string;
  recipient: string;
  phone: string;
  event: string;
  message: string;
  status: "delivered" | "sent" | "failed";
  time: string;
  cost: string;
}

const INITIAL_LOGS: SmsLog[] = [
  {
    id: "log-1",
    recipient: "Anika Tabassum",
    phone: "+880 1711-234891",
    event: "Queue Token",
    message: "Dear Anika, your token is A-014. Dr. Sarah Smith is ready for you in Chair 1 at Dhaka Dental Care.",
    status: "delivered",
    time: "10:14 AM Today",
    cost: "৳0.35",
  },
  {
    id: "log-2",
    recipient: "Kazi Nazrul Haque",
    phone: "+880 1722-312778",
    event: "Appointment Reminder",
    message: "Dear Mr. Nazrul, your crown fitting at Dhaka Dental Care is scheduled for 10:45 AM today.",
    status: "delivered",
    time: "08:30 AM Today",
    cost: "৳0.35",
  },
  {
    id: "log-3",
    recipient: "Nusrat Parveen",
    phone: "+880 1819-872334",
    event: "Recall Notice",
    message: "Hi Nusrat, it is time for your 6-month dental hygiene recall & checkup at Dhaka Dental Care! Book online.",
    status: "sent",
    time: "Yesterday, 04:15 PM",
    cost: "৳0.35",
  },
];

export default function SmsPage() {
  const [logs, setLogs] = useState<SmsLog[]>(INITIAL_LOGS);

  // New quick SMS
  const [toPhone, setToPhone] = useState("+880 1711-234891");
  const [patientName, setPatientName] = useState("Anika Tabassum");
  const [smsText, setSmsText] = useState(
    "Dear Anika, thank you for visiting Dhaka Dental Care today. Please take your prescribed medication after meals as instructed. Call us at +880 1711-000000 for any emergency."
  );

  const handleSendQuickSms = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: SmsLog = {
      id: "log-" + Date.now(),
      recipient: patientName,
      phone: toPhone,
      event: "Direct Message",
      message: smsText,
      status: "delivered",
      time: "Just now",
      cost: "৳0.35",
    };
    setLogs([newLog, ...logs]);
    toast.success(`SMS successfully dispatched to ${patientName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            SMS Engine & Automated Patient Messaging
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated appointment reminders, chair queue tokens, post-treatment follow-ups, and recall marketing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
            SMS Gateway: Connected (SSL Wireless / Twilio)
          </Badge>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border p-3.5 shadow-sm">
          <span className="text-[11px] text-muted-foreground block font-medium">Messages Sent (30d)</span>
          <span className="text-xl font-bold text-foreground">1,420</span>
        </Card>
        <Card className="border p-3.5 shadow-sm">
          <span className="text-[11px] text-muted-foreground block font-medium">Delivery Rate</span>
          <span className="text-xl font-bold text-emerald-600">99.4%</span>
        </Card>
        <Card className="border p-3.5 shadow-sm">
          <span className="text-[11px] text-muted-foreground block font-medium">Recall Reactivations</span>
          <span className="text-xl font-bold text-primary">42 Patients</span>
        </Card>
        <Card className="border p-3.5 shadow-sm">
          <span className="text-[11px] text-muted-foreground block font-medium">SMS Spend This Month</span>
          <span className="text-xl font-bold text-foreground">৳497.00</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Quick Dispatch & Templates */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" />
                Quick Direct SMS Dispatch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={handleSendQuickSms} className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Patient Name</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-8 text-xs mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Recipient Phone Number</Label>
                  <Input
                    value={toPhone}
                    onChange={(e) => setToPhone(e.target.value)}
                    className="h-8 text-xs mt-1 font-mono"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Message Text</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {smsText.length} / 160 (1 segment)
                    </span>
                  </div>
                  <Textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    rows={4}
                    className="text-xs mt-1 leading-relaxed"
                    required
                  />
                </div>

                {/* Template Preset Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                    Insert Template Preset
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        setSmsText(
                          `Dear ${patientName}, your appointment is confirmed for tomorrow at 10:00 AM at DentAI Premier.`
                        )
                      }
                    >
                      Appointment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        setSmsText(
                          `Dear ${patientName}, your queue token is A-018. Estimated chair time is in 10 minutes.`
                        )
                      }
                    >
                      Chair Queue
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() =>
                        setSmsText(
                          `Happy Birthday ${patientName}! 🎉 Enjoy your 34% Birthday Privilege dental treatment this month at DentAI.`
                        )
                      }
                    >
                      Birthday
                    </Button>
                  </div>
                </div>

                <Button type="submit" size="sm" className="w-full gap-2 text-xs font-semibold mt-2">
                  <Send className="h-3.5 w-3.5" />
                  Dispatch SMS Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (7 cols): Live Delivery Logs */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Live SMS Delivery Audit Logs</CardTitle>
                <CardDescription className="text-xs">
                  Real-time carrier webhook delivery status
                </CardDescription>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toast.info("Refreshed carrier logs")}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y text-xs">
                {logs.map((log) => (
                  <div key={log.id} className="p-3.5 hover:bg-muted/30 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{log.recipient}</span>
                        <span className="text-muted-foreground font-mono text-[11px]">{log.phone}</span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1">
                          {log.event}
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-medium ${
                          log.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        }`}
                      >
                        {log.status === "delivered" ? (
                          <CheckCheck className="mr-1 h-3 w-3 inline" />
                        ) : null}
                        {log.status}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      "{log.message}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>{log.time}</span>
                      <span className="font-mono">Cost: {log.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
