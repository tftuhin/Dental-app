"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Sparkles, AlertTriangle, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createPatient, calculateAgeFromDob } from "@/lib/patients-store";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("1996-05-18");
  const [gender, setGender] = useState("Female");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [medicalAlerts, setMedicalAlerts] = useState("Penicillin Allergy");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const newPat = createPatient({
      name: fullName,
      dob,
      age: calculateAgeFromDob(dob) || 30,
      gender,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      bloodGroup,
      allergies: medicalAlerts
        ? medicalAlerts.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      medicalConditions: [],
      emergencyContact: emergencyName
        ? `${emergencyName.trim()} · ${emergencyPhone.trim()}`
        : "",
      status: "new",
      lastVisit: "First Visit",
      outstandingBalance: "৳0.00",
      tags: ["New Registration"],
    });

    setTimeout(() => {
      setLoading(false);
      toast.success(`Patient registered with Atomic ID ${newPat.customId}!`);
      router.push(`/patients/${newPat.id}`);
    }, 600);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
          <Link href="/patients">
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>

      <Card className="border shadow-md">
        <CardHeader className="border-b bg-gradient-to-r from-teal-500/10 via-background to-emerald-500/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Register New Dental Patient
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Creates patient EHR profile and reserves atomic sequence ID
              </CardDescription>
            </div>

            {/* Atomic Sequence Preview */}
            <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-lg shadow-sm">
              <span className="text-[11px] text-muted-foreground font-medium">Assigned ID:</span>
              <span className="font-mono text-xs font-bold text-primary">
                DENT-2026-00043
              </span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1">
                Atomic UPSERT
              </Badge>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-6 text-xs">
            {/* Demographics */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-primary">
                1. Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name *</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name *</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-primary">
                2. Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Mobile Phone Number *</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    required
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Residential Address</Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Road, Area (e.g. Dhanmondi, Dhaka)"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Medical Alerts & Allergies */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  3. Medical Alerts & Contraindications
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Triggers clinical warnings in Copilot & Prescriptions
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Blood Group</Label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-red-600 font-semibold">
                    Drug Allergies & Alerts (Comma separated)
                  </Label>
                  <Input
                    value={medicalAlerts}
                    onChange={(e) => setMedicalAlerts(e.target.value)}
                    placeholder="e.g. Penicillin Allergy, Latex, Aspirin"
                    className="h-8 text-xs border-red-300 focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider text-primary">
                4. Emergency Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Contact Name & Relationship</Label>
                  <Input
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Tariqul Islam (Spouse)"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Emergency Phone</Label>
                  <Input
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+880 1700-000000"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t p-6 flex justify-end gap-3 bg-muted/20">
            <Button variant="outline" type="button" asChild size="sm">
              <Link href="/patients">Cancel</Link>
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-2 font-semibold">
              {loading ? "Generating ID & Saving..." : "Complete Registration"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
