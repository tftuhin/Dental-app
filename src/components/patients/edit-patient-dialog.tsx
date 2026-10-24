"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  HeartPulse,
  ShieldAlert,
  Save,
  X,
  Plus,
  Edit,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  PatientProfile,
  updatePatient,
  calculateAgeFromDob,
} from "@/lib/patients-store";

interface EditPatientDialogProps {
  patient: PatientProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updated: PatientProfile) => void;
}

const COMMON_ALLERGIES = [
  "Penicillin",
  "Amoxicillin",
  "Latex",
  "Sulfa Drugs",
  "Aspirin",
  "NSAIDs",
  "Local Anesthetics (Lidocaine)",
  "Codeine",
];

const COMMON_CONDITIONS = [
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Osteoporosis / Bisphosphonates",
  "Cardiac Disease / Pacemaker",
  "Bleeding Disorder / On Anticoagulants",
  "Pregnancy",
  "Hepatitis",
];

export function EditPatientDialog({
  patient,
  open,
  onOpenChange,
  onSaved,
}: EditPatientDialogProps) {
  // Form fields
  const [name, setName] = useState(patient.name);
  const [dob, setDob] = useState(patient.dob || "");
  const [age, setAge] = useState<number>(patient.age || 30);
  const [gender, setGender] = useState<string>(patient.gender || "Female");
  const [phone, setPhone] = useState(patient.phone || "");
  const [phone2, setPhone2] = useState(patient.phone2 || "");
  const [email, setEmail] = useState(patient.email || "");
  const [address, setAddress] = useState(patient.address || "");
  const [city, setCity] = useState(patient.city || "Dhaka");
  const [occupation, setOccupation] = useState(patient.occupation || "");
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || "O+");
  const [emergencyContact, setEmergencyContact] = useState(
    patient.emergencyContact || ""
  );
  const [status, setStatus] = useState<PatientProfile["status"]>(
    patient.status || "in_treatment"
  );
  const [allergies, setAllergies] = useState<string[]>(patient.allergies || []);
  const [newAllergyInput, setNewAllergyInput] = useState("");
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    patient.medicalConditions || []
  );
  const [newConditionInput, setNewConditionInput] = useState("");
  const [notes, setNotes] = useState(patient.notes || "");
  const [saving, setSaving] = useState(false);

  // Sync state whenever dialog opens with updated patient
  useEffect(() => {
    if (open) {
      setName(patient.name);
      setDob(patient.dob || "");
      setAge(patient.age || 30);
      setGender(patient.gender || "Female");
      setPhone(patient.phone || "");
      setPhone2(patient.phone2 || "");
      setEmail(patient.email || "");
      setAddress(patient.address || "");
      setCity(patient.city || "Dhaka");
      setOccupation(patient.occupation || "");
      setBloodGroup(patient.bloodGroup || "O+");
      setEmergencyContact(patient.emergencyContact || "");
      setStatus(patient.status || "in_treatment");
      setAllergies(patient.allergies || []);
      setMedicalConditions(patient.medicalConditions || []);
      setNotes(patient.notes || "");
    }
  }, [open, patient]);

  // Handle DOB change with auto-age update
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const calculated = calculateAgeFromDob(val);
      if (calculated > 0) {
        setAge(calculated);
      }
    }
  };

  const handleAddAllergy = (allergyText: string) => {
    const trimmed = allergyText.trim();
    if (!trimmed) return;
    if (!allergies.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAllergies([...allergies, trimmed]);
    }
    setNewAllergyInput("");
  };

  const handleRemoveAllergy = (toRemove: string) => {
    setAllergies(allergies.filter((a) => a !== toRemove));
  };

  const handleAddCondition = (condText: string) => {
    const trimmed = condText.trim();
    if (!trimmed) return;
    if (!medicalConditions.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setMedicalConditions([...medicalConditions, trimmed]);
    }
    setNewConditionInput("");
  };

  const handleRemoveCondition = (toRemove: string) => {
    setMedicalConditions(medicalConditions.filter((c) => c !== toRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter the patient's full name.");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter a primary contact phone number.");
      return;
    }

    setSaving(true);

    try {
      const updated = updatePatient(patient.id, {
        name: name.trim(),
        dob,
        age: Number(age) || calculateAgeFromDob(dob) || 30,
        gender,
        phone: phone.trim(),
        phone2: phone2.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        occupation: occupation.trim(),
        bloodGroup,
        emergencyContact: emergencyContact.trim(),
        status,
        allergies,
        medicalConditions,
        notes: notes.trim(),
      });

      setSaving(false);
      toast.success(`Personal details for ${updated.name} updated successfully!`);
      if (onSaved) onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      setSaving(false);
      toast.error("Failed to update patient details.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Edit className="h-4 w-4 text-primary" />
                Edit Patient Personal Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update patient EHR demographics, contact information, emergency contacts, and medical alerts.
              </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-md text-xs font-mono font-bold text-primary">
              {patient.customId}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <Tabs defaultValue="demographics" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 w-full text-xs">
                <TabsTrigger value="demographics" className="text-xs gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Personal Info
                </TabsTrigger>
                <TabsTrigger value="contact" className="text-xs gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Contact & Address
                </TabsTrigger>
                <TabsTrigger value="medical" className="text-xs gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Medical & Alerts
                </TabsTrigger>
              </TabsList>

              {/* ─── TAB 1: Demographics ─── */}
              <TabsContent value="demographics" className="space-y-4 m-0">
                <div className="space-y-1.5">
                  <Label htmlFor="patient-name" className="text-xs font-semibold">
                    Full Patient Name *
                  </Label>
                  <Input
                    id="patient-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Anika Tabassum"
                    required
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-dob" className="text-xs font-semibold flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Date of Birth
                    </Label>
                    <Input
                      id="patient-dob"
                      type="date"
                      value={dob}
                      onChange={handleDobChange}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="patient-age" className="text-xs font-semibold">
                      Age (Years)
                    </Label>
                    <Input
                      id="patient-age"
                      type="number"
                      min={1}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-9 text-xs">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Blood Group</Label>
                    <Select value={bloodGroup} onValueChange={setBloodGroup}>
                      <SelectTrigger className="h-9 text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O Positive (O+)</SelectItem>
                        <SelectItem value="O-">O Negative (O-)</SelectItem>
                        <SelectItem value="A+">A Positive (A+)</SelectItem>
                        <SelectItem value="A-">A Negative (A-)</SelectItem>
                        <SelectItem value="B+">B Positive (B+)</SelectItem>
                        <SelectItem value="B-">B Negative (B-)</SelectItem>
                        <SelectItem value="AB+">AB Positive (AB+)</SelectItem>
                        <SelectItem value="AB-">AB Negative (AB-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="patient-occ" className="text-xs font-semibold">
                      Occupation
                    </Label>
                    <Input
                      id="patient-occ"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Teacher, Engineer, Student"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Treatment & Recall Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as PatientProfile["status"])}
                  >
                    <SelectTrigger className="h-9 text-xs capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_treatment">In Treatment (Active Case)</SelectItem>
                      <SelectItem value="active">Active (Routine Care)</SelectItem>
                      <SelectItem value="recall_due">Recall Due (Follow-up Needed)</SelectItem>
                      <SelectItem value="new">New Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* ─── TAB 2: Contact & Address ─── */}
              <TabsContent value="contact" className="space-y-4 m-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="patient-phone" className="text-xs font-semibold flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Primary Mobile Phone *
                    </Label>
                    <Input
                      id="patient-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1711-000000"
                      required
                      className="h-9 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="patient-phone2" className="text-xs font-semibold flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Secondary Phone (Optional)
                    </Label>
                    <Input
                      id="patient-phone2"
                      value={phone2}
                      onChange={(e) => setPhone2(e.target.value)}
                      placeholder="+880 1911-000000"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patient-email" className="text-xs font-semibold flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="patient-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patient-address" className="text-xs font-semibold flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Residential Street Address
                  </Label>
                  <Textarea
                    id="patient-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House / Apartment number, Road name, Area..."
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="patient-emergency" className="text-xs font-semibold flex items-center gap-1">
                    <HeartPulse className="h-3.5 w-3.5 text-muted-foreground" />
                    Emergency Contact Person & Phone
                  </Label>
                  <Input
                    id="patient-emergency"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g. Tariqul Islam (Spouse) · +880 1711-234892"
                    className="h-9 text-xs"
                  />
                </div>
              </TabsContent>

              {/* ─── TAB 3: Medical & Alerts ─── */}
              <TabsContent value="medical" className="space-y-5 m-0">
                {/* Allergies */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <ShieldAlert className="h-4 w-4" />
                      Known Drug Allergies & Warnings
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      Shown prominently in Rx Studio and Clinical Encounter
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-lg bg-red-50/30 dark:bg-red-950/20">
                    {allergies.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        No known drug allergies recorded.
                      </span>
                    ) : (
                      allergies.map((allergy) => (
                        <Badge
                          key={allergy}
                          variant="destructive"
                          className="gap-1 text-xs py-0.5 px-2 font-medium"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy(allergy)}
                            className="hover:opacity-75 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Add Allergy Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAllergyInput}
                      onChange={(e) => setNewAllergyInput(e.target.value)}
                      placeholder="Add custom allergy (e.g. Erythromycin)..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAllergy(newAllergyInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleAddAllergy(newAllergyInput)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>

                  {/* Common allergy chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Quick Suggestions:</span>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_ALLERGIES.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleAddAllergy(item)}
                          className="text-[10px] px-2 py-0.5 rounded-full border bg-background hover:bg-muted text-muted-foreground transition-colors"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Medical Conditions */}
                <div className="space-y-2.5 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <HeartPulse className="h-4 w-4 text-primary" />
                      Systemic Medical Conditions
                    </Label>
                  </div>

                  <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 border rounded-lg bg-muted/20">
                    {medicalConditions.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        No chronic systemic conditions reported.
                      </span>
                    ) : (
                      medicalConditions.map((cond) => (
                        <Badge
                          key={cond}
                          variant="secondary"
                          className="gap-1 text-xs py-0.5 px-2 font-medium"
                        >
                          {cond}
                          <button
                            type="button"
                            onClick={() => handleRemoveCondition(cond)}
                            className="hover:opacity-75 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Add Condition Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      value={newConditionInput}
                      onChange={(e) => setNewConditionInput(e.target.value)}
                      placeholder="Add condition (e.g. Mitral Valve Prolapse)..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCondition(newConditionInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleAddCondition(newConditionInput)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>

                  {/* Quick condition presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground">Quick Presets:</span>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_CONDITIONS.map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => handleAddCondition(cond)}
                          className="text-[10px] px-2 py-0.5 rounded-full border bg-background hover:bg-muted text-muted-foreground transition-colors"
                        >
                          + {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                <div className="space-y-1.5 pt-2 border-t">
                  <Label htmlFor="patient-notes" className="text-xs font-semibold">
                    Doctor's Private Notes / Treatment Preferences
                  </Label>
                  <Textarea
                    id="patient-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Patient preferences, anxiety management notes, recall cycle..."
                    rows={2}
                    className="text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="gap-1.5 text-xs w-full sm:w-auto font-semibold"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving Changes..." : "Save Patient Details"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
