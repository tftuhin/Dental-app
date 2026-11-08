"use client";

import { ShieldCheck, Users, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getStorageMode } from "@/lib/clinic-storage";
import { doctorKey, saveAccessControl, useAccessControl, useAccessRequests, useStaffRole } from "@/lib/access-store";
import { AccessRequestRow } from "@/components/access/patient-access";

/** Settings → Patient Privacy: the clinic-wide switch, and access between doctors. */
export function PrivacySettingsTab() {
  const me = useStaffRole();
  const control = useAccessControl();
  const requests = useAccessRequests();
  const myKey = doctorKey(me.name);
  const incoming = requests.filter((r) => r.requesterEmail.toLowerCase() !== me.email && r.ownerKeys.includes(myKey));
  const outgoing = requests.filter((r) => r.requesterEmail.toLowerCase() === me.email);
  const waiting = incoming.filter((r) => r.status === "pending");
  const given = incoming.filter((r) => r.status === "approved");
  const history = incoming.filter((r) => r.status !== "pending" && r.status !== "approved");
  const local = getStorageMode() !== "server";

  return (
    <div className="space-y-4">
      <Card className="shadow-xs">
        <CardHeader className="border-b bg-muted/20 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Patient privacy between doctors
          </CardTitle>
          <CardDescription className="text-xs">
            When this is on, each doctor sees full clinical details only for patients they have treated (and patients no doctor has seen
            yet). For another doctor&apos;s patient they see name and contact details, and can ask that doctor for access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-4 text-xs">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="doctor-privacy" className="text-sm font-medium">
                Keep each doctor&apos;s patients private
              </Label>
              <p className="text-muted-foreground">Applies to everyone in the clinic. Only the clinic owner can change it.</p>
            </div>
            <Switch
              id="doctor-privacy"
              checked={control.doctorPrivacy}
              disabled={!me.isOwner}
              onCheckedChange={(on) => {
                saveAccessControl({ doctorPrivacy: on });
                toast.success(on ? "Patient privacy is on for the whole clinic." : "Patient privacy is off. All doctors can see all patients.");
              }}
            />
          </div>
          {local && (
            <p className="flex items-start gap-1.5 text-amber-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              This copy of DentalOS1 has no database, so these rules can&apos;t be enforced here. They apply on the clinic&apos;s live system.
            </p>
          )}
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="flex items-center gap-1.5 font-semibold">
              <Users className="h-3.5 w-3.5" />
              Who sees what
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <b>Front desk</b>: booking, check-in and billing only, always. Clinical notes, charts, prescriptions and consent forms are not
                sent to their screens.
              </li>
              <li>
                <b>Doctors</b>: everything for their own patients; with privacy on, contact details only for other doctors&apos; patients
                until access is given.
              </li>
              <li>
                <b>Clinic owner</b>: turns privacy on or off, and also sees billing for every visit so the collections report stays complete.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {me.isDoctor && (
        <>
          <Card className="shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-sm font-semibold">Requests for your patients ({waiting.length} waiting)</CardTitle>
              <CardDescription className="text-xs">Doctors asking to see patients you treat. Access lasts until you revoke it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {waiting.length === 0 && given.length === 0 && history.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">No requests yet.</p>
              )}
              {waiting.length > 0 && (
                <ul className="space-y-2">
                  {waiting.map((r) => (
                    <AccessRequestRow key={r.id} r={r} mode="incoming" />
                  ))}
                </ul>
              )}
              {given.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold">Access you have given</p>
                  <ul className="space-y-2">
                    {given.map((r) => (
                      <AccessRequestRow key={r.id} r={r} mode="incoming" />
                    ))}
                  </ul>
                </div>
              )}
              {history.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold">Earlier requests</p>
                  <ul className="space-y-2">
                    {history.map((r) => (
                      <AccessRequestRow key={r.id} r={r} mode="incoming" />
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-sm font-semibold">Your requests</CardTitle>
              <CardDescription className="text-xs">Access you asked other doctors for.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {outgoing.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground">You haven&apos;t asked for access to any patient.</p>
              ) : (
                <ul className="space-y-2">
                  {outgoing.map((r) => (
                    <AccessRequestRow key={r.id} r={r} mode="outgoing" />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
