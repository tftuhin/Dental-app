"use client";

// ============================================================
// DENTALOSBD — Online bookings → appointment queue
// Bookings from the public /book page are saved in the database.
// Every signed-in staff browser fetches them and adds the ones the
// clinic's queue doesn't have yet, like a phone booking: linked to
// the existing patient with that phone number, or registered as new.
// ============================================================

import {
  ClinicalQueuePatient,
  findEarliestSlot,
  getStoredAppointments,
  nextSerialForDate,
  parseTimeToMinutes,
  saveStoredAppointments,
} from "@/lib/clinical-flow-store";
import { createPatient, findPatientByPhone } from "@/lib/patients-store";
import { getClinicSetup } from "@/lib/clinic-setup-store";
import { pullClinicStorage } from "@/lib/clinic-storage";

export interface OnlineBookingRequest {
  id: string;
  reference: string;
  patientName: string;
  phone: string;
  email: string | null;
  service: string;
  preferredDate: string;
  preferredTime: string;
  healthNotes: string | null;
  createdAt: string;
}

export interface ImportedBooking {
  appointment: ClinicalQueuePatient;
  request: OnlineBookingRequest;
  isNewPatient: boolean;
  movedFromRequested: boolean;
}

let inflight: Promise<ImportedBooking[]> | null = null;

/** Add online bookings this browser doesn't have yet to the queue. Safe to call often; returns what was added. */
export function importOnlineBookings(): Promise<ImportedBooking[]> {
  if (!inflight) {
    inflight = syncAndImport().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function syncAndImport(): Promise<ImportedBooking[]> {
  let requests: OnlineBookingRequest[] = [];
  try {
    const res = await fetch("/api/bookings/sync", { method: "POST" });
    if (!res.ok) return [];
    const data = await res.json();
    requests = Array.isArray(data.bookings) ? data.bookings : [];
  } catch {
    return [];
  }
  // See bookings another computer already added, so they aren't added twice
  await pullClinicStorage();
  // Already in the queue (in any state, so a no-show isn't re-added)
  const existing = new Set(getStoredAppointments().map((a) => a.onlineBookingId).filter(Boolean));
  requests = requests.filter((r) => !existing.has(r.id));
  if (requests.length === 0) return [];

  const setup = getClinicSetup();
  const doctor =
    setup.doctors?.find((d) => d.status === "active")?.name || setup.doctors?.[0]?.name || "Duty Doctor";

  const list = getStoredAppointments();
  const imported: ImportedBooking[] = [];

  for (const req of requests) {
    if (list.some((a) => a.onlineBookingId === req.id)) continue;

    const notes = (req.healthNotes || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // 1. Link to the existing patient with this phone, or register a new one
    let record = findPatientByPhone(req.phone);
    const isNewPatient = !record;
    if (!record) {
      record = createPatient({
        // Same id on every computer, so two computers importing at once make one record
        id: `pat-web-${req.id}`,
        name: req.patientName,
        phone: req.phone,
        age: 0,
        dob: "",
        gender: "",
        email: req.email || "",
        address: "",
        emergencyContact: "",
        bloodGroup: "",
        allergies: notes,
        medicalConditions: [],
        status: "new",
        lastVisit: "First Visit",
        outstandingBalance: "৳0.00",
        tags: ["New Patient", "Online Booking"],
      });
    }

    // 2. Keep the requested time if that doctor is free then, else the earliest free slot
    let date = req.preferredDate;
    let time = req.preferredTime;
    let movedFromRequested = false;
    const wanted = parseTimeToMinutes(time);
    const taken = list.some(
      (a) =>
        a.date === date &&
        a.doctor === doctor &&
        a.status !== "no_show" &&
        parseTimeToMinutes(a.time) === wanted
    );
    if (isNaN(wanted) || taken) {
      const slot = findEarliestSlot(date, doctor, list);
      if (slot) {
        movedFromRequested = slot.date !== date || slot.time !== time;
        date = slot.date;
        time = slot.time;
      }
    }

    const serial = nextSerialForDate(date, list);
    const appointment: ClinicalQueuePatient = {
      id: `apt-web-${req.id}`,
      onlineBookingId: req.id,
      token: `W-${String(serial).padStart(3, "0")}`,
      fifoSerial: serial,
      serialNumber: serial,
      bookingChannel: "online",
      patient: record.name,
      patientId: record.customId,
      patientRecordId: record.id,
      phone: record.phone,
      age: record.age,
      gender: record.gender,
      address: record.address,
      chair: "Chair 1",
      doctor,
      date,
      time,
      duration: "30m",
      service: req.service,
      status: "scheduled",
      stage: "waiting",
      alerts: Array.from(new Set([...(record.allergies || []), ...notes])),
      chiefComplaint: req.healthNotes ? `${req.service}. Patient notes: ${req.healthNotes}` : req.service,
    };
    list.push(appointment);
    imported.push({ appointment, request: req, isNewPatient, movedFromRequested });
  }

  if (imported.length > 0) saveStoredAppointments(list);
  return imported;
}
