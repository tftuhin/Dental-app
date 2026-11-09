"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Smartphone, Laptop, Server, CheckCircle2, AlertTriangle, Loader2, Unplug, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SMS_MODE_LABELS, SmsMode } from "@/lib/messaging-store";
import { GatewayStatus, getSmsGatewayStatus } from "@/lib/message-sender";

const MODE_ICONS: Record<SmsMode, React.ComponentType<{ className?: string }>> = {
  device: Laptop,
  android: Smartphone,
  provider: Server,
};

const MODE_HINTS: Record<SmsMode, string> = {
  device: "Opens each SMS on this computer (Windows Phone Link, or the phone's own app) with the text filled in. Staff press Send.",
  android: "Sent automatically from the clinic's Android phone and SIM. Patients' replies come into the Inbox.",
  provider: "Sent automatically through a bulk SMS company (e.g. BulkSMSBD), showing your clinic name as sender.",
};

/** Settings → Messages: choose how SMS are sent, and connect the Android phone. */
export function SmsSendingCard({ mode, onModeChange }: { mode: SmsMode; onModeChange: (m: SmsMode) => void }) {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "clinic_owner" || session?.user?.role === "super_admin";
  const [status, setStatus] = useState<GatewayStatus | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [receivingNote, setReceivingNote] = useState<string | null>(null);

  useEffect(() => {
    getSmsGatewayStatus(true).then(setStatus);
  }, []);

  const connect = async () => {
    setBusy(true);
    setReceivingNote(null);
    try {
      const res = await fetch("/api/messages/android-gateway", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Could not connect the phone.");
        return;
      }
      setPassword("");
      setStatus(await getSmsGatewayStatus(true));
      onModeChange("android");
      if (data.receiving) toast.success("Phone connected. SMS will be sent from it, and replies will come into the Inbox. Remember to Save.");
      else {
        setReceivingNote(data.receivingError || "Replies could not be set up.");
        toast.success("Phone connected for sending. Remember to Save.");
      }
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect the Android phone? SMS will go back to opening on this computer.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/messages/android-gateway", { method: "DELETE" });
      if (!res.ok) {
        toast.error((await res.json().catch(() => ({}))).error || "Could not disconnect.");
        return;
      }
      setStatus(await getSmsGatewayStatus(true));
      if (mode === "android") onModeChange("device");
      toast.success("Phone disconnected.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="border-b bg-muted/20 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4 text-primary" />
          Send SMS using
        </CardTitle>
        <CardDescription className="text-xs">Switch at any time; reminders and campaigns use the choice saved here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 text-xs">
        <div className="space-y-1.5" role="radiogroup" aria-label="Send SMS using">
          {(Object.keys(SMS_MODE_LABELS) as SmsMode[]).map((m) => {
            const Icon = MODE_ICONS[m];
            const ready = m === "android" ? status?.android.connected : m === "provider" ? status?.configured : true;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => onModeChange(m)}
                className={`flex w-full items-start gap-2 rounded-lg border p-2.5 text-left ${
                  mode === m ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"
                }`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold">
                    {SMS_MODE_LABELS[m]}
                    {status && m !== "device" && (
                      <span className={`text-[10px] font-medium ${ready ? "text-emerald-700" : "text-muted-foreground"}`}>
                        {ready ? (m === "android" ? `Connected${status.android.phone ? ` · ${status.android.phone}` : ""}` : `Connected · ${status.provider}`) : "Not set up"}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">{MODE_HINTS[m]}</span>
                </span>
              </button>
            );
          })}
        </div>

        {mode === "device" && (
          <ol className="list-decimal space-y-1 rounded-lg border bg-muted/30 p-3 pl-6 text-[11px]">
            <li>On the clinic computer, open the Windows <b>Phone Link</b> app and pair the clinic&apos;s phone (Android works best).</li>
            <li>Allow Phone Link to send messages when asked.</li>
            <li>DentalOSbd will then open each SMS in Phone Link, ready to send from your phone&apos;s SIM.</li>
          </ol>
        )}

        {mode === "android" && !status?.android.connected && (
          <div className="space-y-3 rounded-lg border p-3">
            <ol className="list-decimal space-y-1 pl-5 text-[11px]">
              <li>
                On a spare Android phone with the clinic&apos;s SIM, install{" "}
                <a href="https://sms-gate.app" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
                  SMS Gateway for Android <ExternalLink className="inline h-3 w-3" />
                </a>
                .
              </li>
              <li>In the app, turn on <b>Cloud server</b> and allow SMS permissions. It shows a username and password.</li>
              <li>Enter them below. Keep the phone charged and online. Use a SIM only for the clinic: every SMS it receives comes into DentalOSbd.</li>
            </ol>
            {isOwner ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-8 font-mono text-xs" autoComplete="off" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-8 font-mono text-xs" autoComplete="new-password" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold">The phone&apos;s number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 17…" className="h-8 font-mono text-xs" />
                </div>
                <Button size="sm" className="gap-1.5 text-xs sm:col-span-3 sm:w-fit" onClick={connect} disabled={busy || !username.trim() || !password}>
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />}
                  Connect phone
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">Ask the clinic owner to connect the phone.</p>
            )}
          </div>
        )}

        {status?.android.connected && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50/60 p-2.5 dark:bg-emerald-950/30">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Android phone connected{status.android.phone ? ` (${status.android.phone})` : ""}
            </span>
            {isOwner && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={disconnect} disabled={busy}>
                <Unplug className="h-3 w-3" />
                Disconnect
              </Button>
            )}
          </div>
        )}
        {receivingNote && (
          <p className="flex items-start gap-1.5 text-[11px] text-amber-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {receivingNote}
          </p>
        )}

        {mode === "provider" && !status?.configured && (
          <p className="text-[11px] text-muted-foreground">
            Add your gateway to the server settings: <code className="font-mono">SMS_PROVIDER=bulksmsbd</code>, <code className="font-mono">SMS_API_KEY</code> and{" "}
            <code className="font-mono">SMS_SENDER_ID</code>.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
