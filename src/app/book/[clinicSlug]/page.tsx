"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ToothIcon } from "@/components/icons/dental-icons";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  {
    id: "checkup",
    title: "Comprehensive Dental Exam & Cleaning",
    duration: "45 mins",
    fee: "৳1,200",
    description: "Full mouth examination, periodontal probing, ultrasonic scaling, and digital X-rays.",
  },
  {
    id: "emergency",
    title: "Emergency Toothache & RCT Consultation",
    duration: "30 mins",
    fee: "৳1,500",
    description: "Immediate relief for severe pain, broken teeth, or abscess.",
  },
  {
    id: "cosmetic",
    title: "Teeth Whitening & Smile Makeover",
    duration: "60 mins",
    fee: "৳8,500",
    description: "Professional in-chair laser whitening or veneer consultation.",
  },
  {
    id: "invisalign",
    title: "Clear Aligner & Orthodontic Assessment",
    duration: "30 mins",
    fee: "Free Consult",
    description: "3D digital intraoral scan and customized orthodontic alignment plan.",
  },
];

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:15 AM",
  "01:30 PM",
  "02:45 PM",
  "04:00 PM",
];

export default function PublicBookingPortal() {
  const params = useParams();
  const clinicSlug = (params?.clinicSlug as string) || "dentai-dhaka";

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState("2026-10-27");
  const [selectedTime, setSelectedTime] = useState("10:00 AM");

  // Patient Info
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const code = "APT-" + Math.floor(100000 + Math.random() * 900000);
    setConfirmationCode(code);
    setStep(4);
    toast.success("Appointment successfully confirmed! SMS confirmation sent.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-teal-950/10 dark:to-slate-900 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Clinic Public Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ToothIcon className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dhaka Dental Care & Maxillofacial Implant Center
          </h1>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            House 42, Road 9/A, Dhanmondi R/A, Dhaka-1209 · Direct: +880 1711-000000
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium">
          <span className={`px-2.5 py-1 rounded-full ${step >= 1 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"}`}>
            1. Service
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`px-2.5 py-1 rounded-full ${step >= 2 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"}`}>
            2. Date & Time
          </span>
          <span className="text-muted-foreground">→</span>
          <span className={`px-2.5 py-1 rounded-full ${step >= 3 ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"}`}>
            3. Your Details
          </span>
        </div>

        {/* ─── STEP 1: Select Service ─── */}
        {step === 1 && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Select Dental Service</CardTitle>
              <CardDescription className="text-xs">
                Choose the primary reason for your visit today
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {SERVICES.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    selectedService.id === srv.id
                      ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{srv.title}</span>
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {srv.duration}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{srv.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-primary">{srv.fee}</span>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-end">
              <Button onClick={() => setStep(2)} className="text-xs gap-1.5 font-semibold">
                Continue to Date & Time
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ─── STEP 2: Date & Time ─── */}
        {step === 2 && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Select Appointment Time</CardTitle>
                  <CardDescription className="text-xs">
                    Service: <strong>{selectedService.title}</strong>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold">Choose Preferred Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="mt-1 h-9 text-xs font-mono max-w-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold block mb-2">Available Time Slots</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant={selectedTime === slot ? "default" : "outline"}
                      onClick={() => setSelectedTime(slot)}
                      className={`h-10 text-xs font-medium ${
                        selectedTime === slot ? "shadow-sm" : ""
                      }`}
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t p-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="text-xs gap-1.5 font-semibold">
                Continue to Patient Info
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ─── STEP 3: Patient Information ─── */}
        {step === 3 && (
          <Card className="border shadow-lg">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Your Contact & Medical Details</CardTitle>
                  <CardDescription className="text-xs">
                    {selectedService.title} · {selectedDate} at {selectedTime}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs gap-1">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <form onSubmit={handleConfirmBooking}>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div>
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Anika Tabassum"
                    required
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Mobile Phone (for SMS confirmation) *</Label>
                    <Input
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="+880 1711-234891"
                      required
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Email Address</Label>
                    <Input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="anika@gmail.com"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Known Drug Allergies or Health Conditions
                  </Label>
                  <Input
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin Allergy, Asthma, Diabetes"
                    className="h-8 text-xs mt-1 border-red-200"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4 flex justify-between">
                <Button variant="outline" size="sm" type="button" onClick={() => setStep(2)} className="text-xs">
                  Back
                </Button>
                <Button type="submit" className="text-xs font-semibold gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm Dental Appointment
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ─── STEP 4: Instant Confirmation ─── */}
        {step === 4 && (
          <Card className="border shadow-xl text-center p-8 space-y-4 bg-card">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Your Appointment is Confirmed!
              </h2>
              <p className="text-xs text-muted-foreground">
                An SMS confirmation token has been dispatched to <strong>{patientPhone}</strong>
              </p>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border max-w-sm mx-auto space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmation Code:</span>
                <span className="font-mono font-bold text-primary">{confirmationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-semibold text-foreground">{selectedService.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-semibold text-foreground">{selectedDate} at {selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="font-semibold text-foreground">{patientName}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
                Book Another Visit
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
